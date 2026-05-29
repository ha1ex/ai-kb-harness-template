---
id: B-141
tier: B
category: "Knowledge management"
kind: workflow
title: "Session-open / session-close skills — accumulate institutional gotchas across Claude Code sessions"
subtitle: "Problem solved: Fresh Claude Code sessions start cold and re-learn the same operational lessons; a paired open + close skill loads relevant context at start and appends session learnings + a handoff doc at end — producing a compounding gotcha index over time."
source: https://www.cybos.ai/cases/B-141
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "engineer · founder running multiple Claude Code sessions per week"
type: case
version: v0.1
---
# Session-open / session-close skills — accumulate institutional gotchas across Claude Code sessions

> Problem solved: Fresh Claude Code sessions start cold and re-learn the same operational lessons; a paired open + close skill loads relevant context at start and appends session learnings + a handoff doc at end — producing a compounding gotcha index over time.

## What

Two skills bound to every Claude Code project: `/session-open` (loads global context, project-specific context, runs a plan review, runs tests) and `/session-close` (reviews the session, updates docs, updates skills, writes a handoff for the next session, commits and pushes). Over months, the session-close output accrues into a personal "gotcha index" — one operator reported 201 captured insights covering infra, Docker, file permissions, agent config, multi-server fleet pitfalls, Codex onboarding traps.

## Why it matters

New sessions stop wasting context tokens re-discovering OOM on small droplets, OAuth-vs-API-key confusion, or that a config file caches at process start. The gotcha index pasted into a session's context is concretely more useful than vendor documentation — it is *your* failure history, not theory. Doubles as the source material for skill upgrades.

## End-to-end

1. Create two skills in your Claude Code config: `/session-open` and `/session-close` (a parallel naming used in the wild is `/session-learnings` + `/summarize-session`; same idea).
2. **session-open** runs: load global ops/context doc, load project-specific README, review the user's plan, run `pytest` / smoke tests, surface anything stale.
3. **session-close** runs: review what happened this session, extract any new gotchas to a per-project `gotcha-index.md`, update affected skills/rules/docs, write a one-paragraph handoff for the next session, commit + push.
4. Add a session-init hook (a few lines of shell) that injects a unique session ID into every document the session creates or edits — makes it trivial to find the originating session of any artifact months later.
5. Run both skills religiously for the first month. The output will feel verbose; that is correct. Lessons aggregate.
6. After a few weeks, fold the gotcha index back into the session-open context load. Now every new session starts pre-warmed with the institutional knowledge.

## Prompts

Verbatim session-close routine (operator A, paraphrased to bullets in source — kept lossless):

```
`- Load general context at start of session
- Load project-specific context
- Plan review
- Run tests
- Session review — improve regulations, docs, skills
- Close project session: update docs and write handoff for next
- Close session entirely: push to GitHub
`
```

## Gotchas

## "Self-learning during the work itself" does not happen reliably — even with explicit rules in the prompt, the model treats it as a secondary task and skips it under load. The fix is to make the learning extraction an *explicit, separate* end-of-session task (or an even-cheaper review-the-PR-history weekly pass). If you rely on the agent to capture its own mistakes mid-flight, you will end up with no gotcha index three months later.

## Tools

- Claude Code with skills configured per project.
- A git repo per project for the handoff trail.
- Optional: a hook that stamps a session ID into every artifact (one operator: a 10-line shell script).
