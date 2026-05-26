---
id: A-024
tier: A
category: "Engineering productivity"
kind: workflow
title: "Closed-loop user feedback → code change automation"
subtitle: "\"The buttons are too small\" sits in a backlog for three weeks. Now it's a deployed PR in 30 minutes with a human approval."
source: https://www.cybos.ai/cases/A-024
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "Founder of an internal tool · IC product owner"
type: case
version: v0.1
---
# Closed-loop user feedback → code change automation

> "The buttons are too small" sits in a backlog for three weeks. Now it's a deployed PR in 30 minutes with a human approval.

## What

Daily a Telegram bot DMs the tool's users a short prompt: "anything that bugged you about the tool yesterday? anything missing?" Free-text replies land in a `reminder_replies` table. At a fixed time, a cron triggers a high-reasoning agent run that reads (a) all unprocessed user feedback from the last 24h, (b) the project's `AGENTS.md`, and (c) the recent git log; the agent emits a JSON array of actionable single-PR code changes, each with title, description, target files, a complexity estimate, and a precompiled agent prompt that another agent would run to implement it. Each action item is saved as `pending_approval` and DM'd to the tool's owner. Thumb-up triggers a two-phase execution: phase one runs the agent with read-only tools to produce a plan; phase two runs the agent with write access to edit the files. The outer runner detects the diff, commits, pushes to a branch, opens a PR. Within 30 minutes a user's "make the buttons bigger" DM is a deployed change behind a feature flag.

## Why it matters

Kills the "feedback → ticket → triage → sprint" loop for internal tools and small surfaces. Maintainers don't touch code for trivial UX fixes. The cycle from "a user noticed something" to "the user sees the change" drops from 1–3 weeks to 30 minutes for in-scope changes. Engineers spend their time on the changes that the loop correctly identifies as out-of-scope (architecture, new features, anything that touches money). Beyond the time saving, the morale effect is real — users notice that their feedback ships, which raises the rate of high-quality feedback by an order of magnitude.

## End-to-end

1. **Wire the feedback collector.** Telegram bot, daily DM at a fixed time. Replies land in a `reminder_replies(user_id, text, timestamp, processed)` table.
2. **Author the action-extractor.** A high-reasoning agent run (Opus / GPT-5-class) with `prompts/action_extractor.txt` as system prompt; inputs are the unprocessed replies + `AGENTS.md` + the recent git log. Output is a JSON array of `{title, description, agent_prompt, complexity, target_files, rationale, user_id}` items. Save each as `action_items(id, status='pending_approval',...)`.
3. **DM the owner.** For each new action item, send a Telegram card to the tool's owner with the title, description, complexity, and "👍 approve / 👎 reject" buttons.
4. **Author the two-phase executor.** Phase 1: the agent runs with read-only tools (`Read`, `Grep`, `Glob`) and produces a plan as text + diff sketch; commit the plan to the action-item record. Owner can re-approve or amend. Phase 2: the agent runs with write access (`Read`, `Edit`, `Write`, `Bash` for tests) and edits the listed `target_files`. Hard-coded exclusion list — never modify `.env`, `.github/workflows/`, any file under `secrets/`, and any file the action item didn't explicitly name.
5. **Detect diff, commit, push, open PR.** The outer runner reads `git diff`; if non-empty, commits with a generated message referencing the user feedback and action-item ID, pushes to a feature branch, opens a PR using the `gh` CLI. Posts the PR link back to the owner.
6. **Owner reviews the PR.** CI runs the test suite; owner merges. Vercel (or equivalent) auto-deploys.
7. **Notify the user.** Once the deploy completes, the bot DMs the originating user: "the thing you asked about yesterday is live."
8. **Run a weekly retro on rejected actions.** Why did the owner reject? Most rejects → tighten the extractor's prompt; a steady-state ~20% reject rate is healthy and signals the extractor isn't being timid.

## Prompts

System prompt for the action extractor (`prompts/action_extractor.txt`):

```
`You extract actionable single-PR code changes from user feedback.

You receive:
- Up to N free-text user-feedback messages from the last 24 hours.
- The project's AGENTS.md (current contracts and structure).
- The git log for the last 7 days (so you can see what just shipped).

For each piece of feedback, decide whether it implies a code change that
fits in a single PR (complexity ≤ M) and that does NOT touch any of:.env,.github/workflows/, secrets/, billing/, auth/. If yes, emit an item.

Output: JSON array. No prose. Each item:

{
 "title": "short imperative title, ≤8 words",
 "description": "what changes and why — 1–3 sentences",
 "agent_prompt": "the exact prompt another agent will run to implement this",
 "complexity": "S" | "M",
 "target_files": ["relative", "paths"],
 "rationale": "verbatim quote from user feedback that drives this",
 "user_id": "<id from input>"
}

Rules:
- If the feedback is vague ("it's slow"), emit a "diagnose" action that
 proposes the smallest possible measurement, not a fix.
- If two pieces of feedback imply the same change, emit ONE item with both
 user_ids and quotes.
- Never emit items that touch the excluded paths. Better to drop than ship.
- If no actionable items, emit [].
`
```

Phase 2 executor invocation (called by the outer runner, after approval):

```
`claude -p "$ACTION_AGENT_PROMPT" \
 --model opus \
 --system-prompt-file prompts/executor.txt \
 --allowedTools Read Edit Write Bash \
 --max-turns 40 \
 --dangerously-skip-permissions
`
```

Exclusion check (in the executor wrapper, before commit):

```
``
```

## Gotchas

- **`--dangerously-skip-permissions` is real risk.** Pair every execution with the hard-coded path-exclusion list, the action-item-named-files allowlist, and a one-action-at-a-time concurrency lock.
- **Don't let the extractor get timid.** A steady-state 100% approval rate means the extractor isn't proposing enough. Aim for ~70–80% approval; reject rate is signal, not noise.
- **Don't skip the user notify-back.** "The thing you asked about is live" closes the feedback loop in the user's mind and is the difference between "I send feedback once" and "I send feedback every day."

## Tools

- Telegram bot for collection + owner-approval flow
- SQLite or Postgres for `reminder_replies`, `action_items`, `action_runs`
- Agent CLI (Claude Code / equivalent)
- GitHub repo + `gh` CLI + CI pipeline that runs tests
- Vercel or equivalent for auto-deploy on PR merge
- A clearly-bounded internal tool (don't run this on a customer-facing surface in week 1)
