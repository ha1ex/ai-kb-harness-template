---
id: B-130
tier: B
category: "Engineering productivity"
kind: pattern
title: "Outer-loop autonomy — Stop hook + promise tag (Ralph) until the task is done"
subtitle: "Problem solved: Multi-criteria coding tasks stall when the agent decides \"good enough\"; a Stop hook re-prompts until a completion sentinel appears, so well-specified work finishes overnight without supervision."
source: https://www.cybos.ai/cases/B-130
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · senior engineer"
type: case
version: v0.1
---
# Outer-loop autonomy — Stop hook + promise tag (Ralph) until the task is done

> Problem solved: Multi-criteria coding tasks stall when the agent decides "good enough"; a Stop hook re-prompts until a completion sentinel appears, so well-specified work finishes overnight without supervision.

## What

Hand Claude Code (or Codex / amp) a task with explicit acceptance criteria, and tell it to emit `<promise>COMPLETE</promise>` only when the criteria are met. A Stop hook inspects each turn's output; if the sentinel is absent, it re-prompts "continue." The agent loops on its own until done — minutes or hours later, you come back to a finished branch.

## Why it matters

Six-month adoption arc in the operator community: hand-rolled bash one-liners (Ghuntley's `while:; do …; done`) → small wrappers like repomirror and oh-my-claudecode → native `/loop` in Claude Code. Current real uses: deploy monitoring (watch PRs, rebase, reply to CI bug-bot), and execution of methodical task-file workflows. The wins are biggest on well-scoped work; the failure mode is real and named below.

## End-to-end

1. Write the task in a file (e.g. `PROMPT.md`) with explicit acceptance criteria — endpoints, test coverage thresholds, lint clean, etc.
2. Add the closing line: `Output: <promise>COMPLETE</promise> when criteria are satisfied.`
3. Configure a Stop hook in `~/.claude/settings.json` that greps the last turn for the sentinel; if missing, re-injects "continue."
4. Run Claude Code (or use the native `/loop` command on the task file). Walk away.
5. For overnight runs, pair with a desktop-notification hook so you get pinged on actual completion or on tool-error stalls.
6. Keep a kill switch (rate-limit cap, timeout, or budget alert) — divergence is the dominant failure.

## Prompts

```
`Build a REST API for todos.

When complete:
- All CRUD endpoints working
- Input validation in place
- Tests passing (coverage > 80%)
- README with API docs
- Output: <promise>COMPLETE</promise>
`
```

```
`# Naive Ralph (Ghuntley's form) — for greenfield bootstraps only
while:; do cat PROMPT.md | npx --yes @sourcegraph/amp; done
`
```

## Gotchas

## The naive loop "quite often diverges — like a YouTube free-throw from the other side of the court." It works for greenfield bootstraps and methodical task-file runs; on open-ended product work it burns tokens and wanders. Use it only where acceptance criteria are concrete and checkable, and cap with a budget/timeout. One operator's blunt summary: "the results I got weren't very wow" — most attempts diverge unless the task is mechanical.

## Tools

- Claude Code (or Codex / amp) with a coding-agent CLI that has no aggressive tool-call cap
- Stop hook configured in `~/.claude/settings.json`, or the native `/loop` command
- Optional: oh-my-claudecode skill bundle which installs a $ralph workflow out of the box
