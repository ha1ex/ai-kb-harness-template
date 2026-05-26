---
id: B-116
tier: B
category: "Engineering productivity"
kind: skill
title: "Auto-extract recurring corrections from Claude Code history into CLAUDE.md (claude-reflect / `/insights`)"
subtitle: "Problem solved: Operators correct the agent on the same things every week; a session-mining plugin proposes claude.md edits so the corrections stop recurring."
source: https://www.cybos.ai/cases/B-116
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "any daily Claude Code user"
type: case
version: v0.1
---
# Auto-extract recurring corrections from Claude Code history into CLAUDE.md (claude-reflect / `/insights`)

> Problem solved: Operators correct the agent on the same things every week; a session-mining plugin proposes claude.md edits so the corrections stop recurring.

## What

Parses your local Claude Code conversation history, identifies passages where you repeatedly course-corrected the agent (e.g. "stop using `npm run X`, use `make X`"), and proposes diff-ready additions to your `claude.md` file. The community plugin is `claude-reflect` (open-source, search GitHub by that name); the native form is the `/insights` slash command shipped in a recent Claude Code update — type `/insights` and it surfaces recurring patterns from recent sessions.

## Why it matters

Compounding effect over weeks: each rule that lands in `claude.md` removes one recurring correction from your future sessions. One operator's experience after running `/insights`: "Claude itself told me I was doing too much extra work — here, take this rule." Cheaper than manual curation, and catches patterns you'd never notice yourself.

## End-to-end

1. For the native path: ensure Claude Code is on a recent version, then run `/insights` from any project session. Review the proposed rules and decide which land in project-level vs. user-level `claude.md`.
2. For the plugin path: install the `claude-reflect` plugin (open-source on GitHub) against your CC install. It scans logs and surfaces correction patterns.
3. Skim the proposals. Promote the ones that match your actual policies; discard noise.
4. Commit the resulting `claude.md` diff so the team picks it up.
5. Re-run weekly or after any large new project. The set of corrections drifts as your stack changes.

## Gotchas

## The proposals are only as useful as your sample. If you've been short with the agent ("no", "stop", "fix"), the plugin will infer brittle rules. Run it after a week of well-articulated corrections, and pair it with positive-framing — write rules as "do X, that works" rather than "don't do Y" (negative-framing skills perform worse in practice).

## Tools

- Claude Code with accessible chat logs (`~/.claude/projects/`)
- `/insights` (native) or claude-reflect (plugin)
