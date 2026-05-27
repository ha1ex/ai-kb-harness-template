---
id: COB-020
tier: A
category: "Engineering productivity"
kind: workflow
title: "Gate: human-in-the-loop with custom tools"
subtitle: "Many workflows sit in the gap between \"fully automate\" and \"always ask a human.\" Expense approval is a classic example: the agent can handle the clear cases on its own, but it should know when to e..."
source: https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_gate_human_in_the_loop.ipynb
upstream_name: "managed_agents/CMA_gate_human_in_the_loop.ipynb"
upstream_folder: "managed_agents"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Gate: human-in-the-loop with custom tools

> Many workflows sit in the gap between "fully automate" and "always ask a human." Expense approval is a classic example: the agent can handle the clear cases on its own, but it should know when to e...

Many workflows sit in the gap between "fully automate" and "always ask a human." Expense approval is a classic example: the agent can handle the clear cases on its own, but it should know when to escalate ambiguous ones for human review. Calibration matters here, an agent that escalates everything is exhausting to work with, and an agent that escalates nothing is dangerous.

This notebook builds an expense approver around two **custom tools**: `decide()` for clear-cut cases and `escalate()` for ambiguous ones. Both round-trip through your application, which is where you either log the outcome (decide) or put it in front of a reviewer (escalate).

## What custom tools are

Up until now the cookbook has used the built-in `agent_toolset` (bash, read, write, etc.), all of which run inside the sandbox container. **Custom tools** are different: when the agent calls one, the session pauses and emits an `agent.custom_tool_use` event, your application sees the call, runs whatever code you want, and POSTs back a `user.custom_tool_result` event. The session resumes with that result in the agent's context.

This is the right shape for two situations:

1. **The data lives somewhere the sandbox can't reach.** Anything behind your own network boundary. The agent calls back into your application via the round-trip.
2. **You want a human in the loop, or your own audit and approval layer in front of every call.** That's what this notebook does: `decide` and `escalate` aren't just "tools" in the abstract, they're the seam where your business logic and human reviewers take over from the agent.

(The other extension patterns, MCP toolsets and `resources=` repo mounts, are covered in the operate notebook and the orchestrate notebook respectively.)

The notebook has two parts. Part A drives the session by streaming events locally and responding to each custom tool call as it arrives, convenient during development because everything happens in one process and you can see the behavior live. Part B is a short pointer to the production webhook pattern, which is walked through end-to-end in the operate notebook.

The fixture lives in `example_data/gate/` and contains a `policy.yaml` plus twelve receipts that exercise every branch of the policy.

```python
import json
import os
from collections import Counter
from pathlib import Path

from anthropic import Anthropic
from utilities import wait_for_idle_status

MODEL = os.environ.get("COOKBOOK_MODEL", "claude-sonnet-4-6")

client = Anthropic()
FIXTURE = Path("example_data") / "gate"
```

## 1. Upload policy and receipts

```python
policy = client.beta.files.upload(
    file=("policy.yaml", (FIXTURE / "policy.yaml").read_bytes(), "text/yaml")
)
receipts = client.beta.files.upload(
    file=(
        "receipts.jsonl",
        (FIXTURE / "inbox" / "receipts.jsonl").read_bytes(),
        "application/jsonl",
    )
)
```

## 2. Define the agent with two custom tools

Custom tools are declared in the same `tools=` array as the built-in toolset, with `"type": "custom"` and a JSON schema for the input. Each declaration tells the model what the tool is for (`description`), what to call it with (`input_schema`), and what its name is. The agent decides when to call them; your code decides what they do when called.

Here we keep the built-in `agent_toolset_20260401` enabled too, so the agent can read the policy file and the receipts inline. `decide` and `escalate` are the two custom tools that make every decision a round-trip.

```python
agent = client.beta.agents.create(
    name="cookbook-gate",
    model=MODEL,
    system=(
        "You are an expense approver. Read each receipt in "
        "receipts.jsonl against the policy in policy.yaml and make "
        "exactly ONE tool call per receipt. Call decide(receipt_id, "
        "action, reason) for clear cases, or escalate(receipt_id, "
        "question) for ambiguous ones (near thresholds, unclear "
        "categories, suspicious notes). Once you've called decide "
        "or escalate for a given receipt, that receipt is finalized "
        "— do not call either tool for it again. After processing "
        "all receipts exactly once, stop."
    ),
    tools=[
        {
            "type": "agent_toolset_20260401",
            "default_config": {
                "enabled": True,
                "permission_policy": {"type": "always_allow"},
            },
        },
        {
            "type": "custom",
            "name": "decide",
            "description": "Record a final approve/reject for a clear-cut receipt.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "receipt_id": {"type": "string"},
                    "action": {"type": "string", "enum": ["approve", "reject"]},
                    "reason": {"type": "string"},
                },
                "required": ["receipt_id", "action", "reason"],
            },
        },
        {
            "type": "custom",
            "name": "escalate",
            "description": "Surface an ambiguous receipt for human review.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "receipt_id": {"type": "string"},
                    "question": {"type": "string"},
                },
                "required": ["receipt_id", "question"],
            },
        },
    ],
)

env = client.beta.environments.create(
    name="cookbook-gate-env",
    config={"type": "cloud", "networking": {"type": "limited"}},
)

session = client.beta.sessions.create(
    environment_id=env.id,
    agent={"type": "agent", "id": agent.id, "version": agent.version},
    resources=[
        {"type": "file", "file_id": policy.id, "mount_path": "policy.yaml"},
        {"type": "file", "file_id": receipts.id, "mount_path": "receipts.jsonl"},
    ],
    title="Expense gate",
)
print(f"session: {session.id}")
```

## Part A: streaming locally during development

The simplest way to drive a custom-tool agent is to stream the session's events and react to each tool call as it arrives. `decide` calls get logged and `escalate` calls get a simulated human decision inline. In production you would queue the escalation and have a real reviewer come back to it later, which is what the operate notebook covers.

```python
def simulate_human_review(receipt_id: str, question: str) -> str:
    # Real implementation would show this in a UI and await input.
    # Here: reject anything the agent flags as suspicious.
    return "reject" if "suspicious" in question.lower() else "approve"


# The iterate notebook factored its streaming loop out into
# `stream_until_end_turn`, and most other notebooks just import it.
# This one doesn't, because every decision the agent makes is a
# custom tool call, which means the session keeps going idle with
# `stop_reason.type == "requires_action"` and
# `stop_reason.event_ids` pointing at the `agent.custom_tool_use`
# events waiting for a response. We POST a `user.custom_tool_result`
# for each, let the session resume, and eventually break on a
# `session.status_idle` that arrives with `end_turn`. The helper
# only knows how to exit on `end_turn`, so we need the full loop
# here.
decisions = {}  # receipt_id -> final decision record
tool_use_events = {}
responded_to = set()  # event_ids we've already replied to
print("=== Part A: streaming ===")
with client.beta.sessions.events.stream(session.id) as stream:
    client.beta.sessions.events.send(
        session_id=session.id,
        events=[
            {
                "type": "user.message",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Read /mnt/session/uploads/policy.yaml and "
                            "/mnt/session/uploads/receipts.jsonl. Process "
                            "all 12 receipts. For each receipt, make "
                            "exactly one decide() or escalate() call and "
                            "then move on to the next. When every receipt "
                            "has been processed once, stop."
                        ),
                    }
                ],
            }
        ],
    )
    # Note on the responded_to set: when an agent emits more than 5
    # parallel custom tool calls, the server returns
    # `stop_reason.event_ids` as a sliding window of the next 5
    # pending. Each status_idle we observe in the stream has that
    # window pinned at the moment the event was emitted, but by the
    # time we iterate to the next status_idle event, the server has
    # already advanced past the events we just responded to. So we
    # need to dedupe across status_idle events to avoid double-
    # responding to the same custom tool call (which 400s).
    for ev in stream:
        if ev.type == "agent.custom_tool_use":
            tool_use_events[ev.id] = ev
        elif ev.type == "session.status_idle" and ev.stop_reason:
            if ev.stop_reason.type == "requires_action":
                for event_id in ev.stop_reason.event_ids:
                    if event_id in responded_to:
                        continue
                    tool_ev = tool_use_events[event_id]
                    name, args = tool_ev.name, tool_ev.input
                    receipt_id = args["receipt_id"]
                    if name == "decide":
                        decisions[receipt_id] = {"lane": args["action"], **args}
                        result = {"recorded": True}
                    elif name == "escalate":
                        human = simulate_human_review(receipt_id, args["question"])
                        decisions[receipt_id] = {
                            "lane": "escalated",
                            "human_decision": human,
                            **args,
                        }
                        result = {"human_decision": human}
                    else:
                        result = {"error": f"unknown tool {name}"}
                    client.beta.sessions.events.send(
                        session_id=session.id,
                        events=[
                            {
                                "type": "user.custom_tool_result",
                                "custom_tool_use_id": event_id,
                                "content": [{"type": "text", "text": json.dumps(result)}],
                            }
                        ],
                    )
                    responded_to.add(event_id)
            elif ev.stop_reason.type == "end_turn":
                break
        elif ev.type == "session.status_terminated":
            break

wait_for_idle_status(client, session.id)

lanes = Counter(d["lane"] for d in decisions.values())
print(f"\n{len(decisions)} decisions: {dict(lanes)}")

client.beta.sessions.archive(session.id)
client.beta.environments.archive(env.id)
client.beta.agents.archive(agent.id)
print("archived")
```

## Part B: webhooks for production

The local streaming pattern works fine during development, but it holds an HTTP connection open while humans think, which doesn't scale well. The production pattern instead registers a webhook in the Console that fires on `session.status_idled`, which is the signal that the agent is either done or waiting on a tool result. Your server inspects the events, puts any pending escalation in front of a reviewer, and POSTs the `user.custom_tool_result` back whenever the human finishes, no long-lived connection on your side.

The operate notebook walks through the full webhook setup end-to-end: Console registration, HMAC signature verification, the FastAPI handler, and the round-trip back to `events.send`. The code that responds to the agent is identical to Part A above; only the trigger changes (webhook push instead of streaming pull).
