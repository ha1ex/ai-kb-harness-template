---
id: COB-023
tier: A
category: "Engineering productivity"
kind: workflow
title: "Orchestrate: from issue to merged PR"
subtitle: "This notebook walks the agent through a realistic end-to-end loop: read a vague bug report, find the bug, fix it, open a PR, survive CI, address review feedback, and merge."
source: https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_orchestrate_issue_to_pr.ipynb
upstream_name: "managed_agents/CMA_orchestrate_issue_to_pr.ipynb"
upstream_folder: "managed_agents"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Orchestrate: from issue to merged PR

> This notebook walks the agent through a realistic end-to-end loop: read a vague bug report, find the bug, fix it, open a PR, survive CI, address review feedback, and merge.

This notebook walks the agent through a realistic end-to-end loop: read a vague bug report, find the bug, fix it, open a PR, survive CI, address review feedback, and merge. A real maintainer workflow is never linear, and that's the point of the exercise, the agent has to carry state across many different tool types (reading JSON, grepping code, editing files, running a mock CLI, parsing CI output) while recovering from two mid-chain surprises: a CI failure and a review bot that demands a docstring.

State flows through the chain as issue body → file paths → fix diff → PR number → CI output → review comment → final merge. The `gh-mock` CLI in the fixture persists everything in `.gh-state/` so each step can see what the previous ones did, mimicking a real GitHub workflow without any network access.

What this teaches beyond the iterate notebook:

- **Multi-turn steering across a long chain.** The session filesystem and conversation history persist across turns, so each user message picks up where the last one left off. We use that to verify the final state at the end.
- **Mid-chain recovery.** The agent has to read a CI failure or a review comment and adapt, not just retry blindly.

The fixture lives in `example_data/orchestrate/` and contains a mock `gh` CLI, an issue JSON file, and a `src/` + `tests/` layout with a planted bug.

```python
import io
import os
import zipfile
from pathlib import Path

from anthropic import Anthropic
from utilities import stream_until_end_turn, wait_for_idle_status

MODEL = os.environ.get("COOKBOOK_MODEL", "claude-sonnet-4-6")
GH_TOKEN = os.environ.get("GITHUB_TOKEN")  # only needed for the github_repository sidebar

client = Anthropic()
FIXTURE = Path("example_data") / "orchestrate"
```

## 1. Pack the fixture

The mock repository bundles a handful of files: `src/url_utils.py` contains the actual bug, `src/blog.py` is a caller that makes the bug easier to observe, `tests/test_urls.py` fails until the bug is fixed, and the `gh-mock` CLI plus `issue_42.json` provide the GitHub-like workflow the agent will drive. We zip the directory in memory and upload it as a single file resource, see the sidebar at the end for how to mount a real GitHub repository instead.

```python
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w") as zf:
    for f in FIXTURE.rglob("*"):
        if f.is_file() and f.name != "README.md":
            zf.write(f, f.relative_to(FIXTURE))
buf.seek(0)
fixture_zip = client.beta.files.upload(file=("repo.zip", buf, "application/zip"))
print(f"fixture: {fixture_zip.id}")
```

## 2. Agent + environment + session

The environment declares `pytest` as a pip dependency so the agent can actually run the test suite as part of its CI loop. This is the first notebook in the cookbook that needs network access for package installation, hence the `allow_package_managers: True` alongside the otherwise-`limited` networking config.

```python
agent = client.beta.agents.create(
    name="cookbook-orchestrate",
    model=MODEL,
    system=(
        "You are a maintainer bot. You read issues via `./gh-mock`, explore "
        "the codebase, write fixes, and shepherd PRs through CI and review. "
        "When CI fails or a reviewer requests changes, read what they said "
        "and address it, don't just retry blindly.\n\n"
        "Work in /mnt/user. All gh-mock commands run from there."
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
    name="cookbook-orchestrate-env",
    config={
        "type": "cloud",
        "networking": {"type": "limited", "allow_package_managers": True},
        "packages": {"pip": ["pytest"]},
    },
)

session = client.beta.sessions.create(
    environment_id=env.id,
    agent={"type": "agent", "id": agent.id, "version": agent.version},
    resources=[{"type": "file", "file_id": fixture_zip.id, "mount_path": "repo.zip"}],
    title="Issue #42 → PR",
)
print(f"session: {session.id}")
```

## 3. Run the full chain

A single instruction kicks off the whole loop. The two recovery points to watch for are a CI failure and a review comment. If the agent's first fix is incomplete, for example if it only handles `é` and misses `ü`, `gh-mock pr checks` will exit non-zero with pytest output that the agent needs to read and iterate on. Then, once CI is green, the reviewer bot will block the merge if `slugify()` is missing a docstring, giving the agent one more chance to adapt before the final merge step.

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
                        "Unpack /mnt/session/uploads/repo.zip into /mnt/user "
                        "and ship a fix for issue #42 end-to-end. Read the "
                        "./gh-mock script first to see what subcommands it "
                        "supports; use those to view the issue, open a PR, "
                        "run CI, handle review feedback, and merge. Show me "
                        "the final PR state when you're done."
                    ),
                }
            ],
        }
    ],
)

print("=== full orchestrate chain ===")
stream_until_end_turn(client, session.id)
```

## 4. Multi-turn verification

Sessions are stateful: the container filesystem and the conversation history persist across turns, so a follow-up just sends another `user.message`. We use that here to independently verify the final state, the mock CLI persists the PR state in `.gh-state/pr_101.json`, so printing that file is the simplest way to confirm the PR ended up merged with CI green and at least one review approved before the merge.

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
                        "Print the contents of /mnt/user/.gh-state/pr_101.json so "
                        "I can see the final state, CI status, and reviews."
                    ),
                }
            ],
        }
    ],
)
stream_until_end_turn(client, session.id)

wait_for_idle_status(client, session.id)
client.beta.sessions.archive(session.id)
client.beta.environments.archive(env.id)
client.beta.agents.archive(agent.id)
print("archived")
```

## Sidebar: mounting a real GitHub repository

The fixture above is a mock so the notebook can run offline and you don't need any GitHub credentials to try it. For real work against a real repository, swap the `{"type": "file", ...}` mount above for a `{"type": "github_repository", ...}` resource and the API will clone the repo into the container at session start.

This is the same `resources=` field as the file mount in the iterate notebook, the list takes a mix of types, so you could also clone the repo AND mount a separate config file in the same call. The agent's bash/read/grep tools see the working tree as a normal directory; the only difference is that the API handles the clone instead of you.

```python
session = client.beta.sessions.create(
    environment_id=env.id,
    agent={"type": "agent", "id": agent.id, "version": agent.version},
    resources=[
        {
            "type": "github_repository",
            "url": "https://github.com/anthropics/claude-cookbooks",
            "mount_path": "/workspace/cookbook",
            "authorization_token": GH_TOKEN,
            "checkout": {"type": "branch", "name": "main"},
        }
    ],
    title="Repo explorer",
)
```

A `GITHUB_TOKEN` is required for both private repos and to authenticate the clone. The clone happens once at session creation; subsequent turns work against the same working tree without re-cloning.
