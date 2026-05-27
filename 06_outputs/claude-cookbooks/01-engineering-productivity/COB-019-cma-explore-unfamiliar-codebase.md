---
id: COB-019
tier: A
category: "Engineering productivity"
kind: workflow
title: "Explore: grounding in an unfamiliar codebase"
subtitle: "This notebook drops the agent into a repository it's never seen before and asks it to figure out the real architecture."
source: https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_explore_unfamiliar_codebase.ipynb
upstream_name: "managed_agents/CMA_explore_unfamiliar_codebase.ipynb"
upstream_folder: "managed_agents"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Explore: grounding in an unfamiliar codebase

> This notebook drops the agent into a repository it's never seen before and asks it to figure out the real architecture.

This notebook drops the agent into a repository it's never seen before and asks it to figure out the real architecture. The filesystem is the agent's only workspace, and only the files it chooses to read end up in its context window, so exploration with `ls`, `grep`, and `read` is how it builds up a mental model.

The interesting part is a trap we've planted in the fixture. `ARCHITECTURE.md` describes a layout that the code no longer follows, so an agent that trusts the docs without checking the code will confidently give the wrong answer. Grounding, in this context, means verifying what you read against what's actually there rather than treating documentation as authoritative.

What this teaches beyond the iterate notebook:

- **Exploration before action.** A good agent reads enough of the tree to understand it, then answers, not the other way around.
- **Adding resources mid-session.** The sidebar at the end shows how to push more files into a running session via `sessions.resources.add` rather than re-creating the session. Useful when exploration uncovers something the agent should look at next.

```python
import io
import os

from anthropic import Anthropic
from utilities import (
    make_unfamiliar_repo_zip,
    stream_until_end_turn,
    wait_for_idle_status,
)

MODEL = os.environ.get("COOKBOOK_MODEL", "claude-sonnet-4-6")

client = Anthropic()
```

## 1. Generate the repo fixture

The repo is small enough that we build it in memory with a helper rather than keeping a disk fixture alongside the notebook. The helper plants a `services/` microservices layout and a stale `ARCHITECTURE.md` that still describes the old monolithic layout.

```python
buf = make_unfamiliar_repo_zip()
fixture_zip = client.beta.files.upload(file=("repo.zip", buf, "application/zip"))
print(f"fixture: {fixture_zip.id}")
```

## 2. Agent + environment + session

```python
agent = client.beta.agents.create(
    name="cookbook-explore",
    model=MODEL,
    system=(
        "You are onboarding to an unfamiliar codebase. Explore before "
        "answering, docs can be stale. Verify what you read against "
        "actual code structure. Write notes to /tmp/NOTES.md as you go."
    ),
    tools=[
        {
            "type": "agent_toolset_20260401",
            "default_config": {
                "enabled": True,
                "permission_policy": {"type": "always_allow"},
            },
        }
    ],
)

env = client.beta.environments.create(
    name="cookbook-explore-env",
    config={"type": "cloud", "networking": {"type": "limited"}},
)

session = client.beta.sessions.create(
    environment_id=env.id,
    agent={"type": "agent", "id": agent.id, "version": agent.version},
    resources=[{"type": "file", "file_id": fixture_zip.id, "mount_path": "repo.zip"}],
    title="Onboard to repo",
)
print(f"session: {session.id}")
```

## 3. Explore and watch for the stale-doc trap

A grounded answer mentions the real `services/` layout and flags `ARCHITECTURE.md` as out of date. An ungrounded answer parrots the monolith layout the stale doc describes.

```python
client.beta.sessions.events.send(
    session_id=session.id,
    events=[
        {
            "type": "user.message",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "Unzip /mnt/session/uploads/repo.zip to /tmp/repo/. "
                        "Then: what is the actual architecture of this "
                        "codebase? Be specific about directory structure. "
                        "Check if the docs are accurate."
                    ),
                }
            ],
        }
    ],
)

print("=== exploration ===")
stream_until_end_turn(client, session.id)
```

## 4. Read back the agent's notes

The agent was told to keep notes in `/tmp/NOTES.md` as it worked. Printing that file is a useful way to see how its understanding of the codebase developed during exploration.

```python
client.beta.sessions.events.send(
    session_id=session.id,
    events=[
        {
            "type": "user.message",
            "content": [{"type": "text", "text": "cat /tmp/NOTES.md"}],
        }
    ],
)
stream_until_end_turn(client, session.id)
```

## Sidebar: adding more context to a running session

The `resources=` argument on `sessions.create` is the most common way to mount files, but the API also exposes a `/v1/sessions/<id>/resources` sub-resource for managing mounts on an existing session. This is useful here: if exploration uncovers a question that needs additional context (a config file, a changelog, an external schema), you can drop it in without tearing down the session.

The pattern is the same upload-then-attach loop you already know, just split across two calls instead of one:

```python
hints = b"# DEPLOY HISTORY\n2026-03-01: monolith -> microservices migration complete\n"
hints_file = client.beta.files.upload(
    file=("DEPLOY_HISTORY.md", io.BytesIO(hints), "text/markdown")
)

added = client.beta.sessions.resources.add(
    session_id=session.id,
    type="file",
    file_id=hints_file.id,
    mount_path="DEPLOY_HISTORY.md",
)
print(f"added resource {added.id} to session {session.id}")

attached = client.beta.sessions.resources.list(session_id=session.id)
print(f"{len(attached.data)} resources attached now")

client.beta.sessions.events.send(
    session_id=session.id,
    events=[
        {
            "type": "user.message",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "There's a DEPLOY_HISTORY.md in your workspace now. "
                        "Read it and tell me whether it changes anything in "
                        "your earlier answer."
                    ),
                }
            ],
        }
    ],
)
print("\n--- follow-up with deploy history ---")
stream_until_end_turn(client, session.id)

# Detach the file now that the agent is done with it. `delete` here
# is the resource-detach verb, not the cookbook-wide archive.
client.beta.sessions.resources.delete(session_id=session.id, resource_id=added.id)
print("detached follow-up resource")
```

## Cleanup

```python
wait_for_idle_status(client, session.id)
client.beta.sessions.archive(session.id)
client.beta.environments.archive(env.id)
client.beta.agents.archive(agent.id)
print("archived")
```
