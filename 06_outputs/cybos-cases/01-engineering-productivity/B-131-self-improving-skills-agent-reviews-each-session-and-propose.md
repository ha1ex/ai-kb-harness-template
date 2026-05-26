---
id: B-131
tier: B
category: "Engineering productivity"
kind: pattern
title: "Self-improving skills — agent reviews each session and proposes skill/rule updates"
subtitle: "Problem solved: Lessons learned in a session evaporate unless captured; three cadences (post-task, weekly, nightly \"dream\") turn session history into compounding skill updates without manual curation."
source: https://www.cybos.ai/cases/B-131
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "any operator maintaining skill files"
type: case
version: v0.1
---
# Self-improving skills — agent reviews each session and proposes skill/rule updates

> Problem solved: Lessons learned in a session evaporate unless captured; three cadences (post-task, weekly, nightly "dream") turn session history into compounding skill updates without manual curation.

## What

Three operational cadences for keeping skill files (`~/.claude/skills/`, CLAUDE.md) up to date from your own session history:

1. **In-session self-update** — a CLAUDE.md rule that says "when you hit a problem and find a solution, immediately update the relevant skill with the lesson." Lowest latency, highest noise.
2. **Weekly batch review** — open a fresh session at end of week; tell it to analyze the last week of session history + PRs, extract errors and conclusions, and propose skill diffs. Robust, easy to gate.
3. **Nightly "dream" pass** — scheduled cron that re-reads the day's sessions and distills wins into skill updates. Pairs well with the SessionStart hook (see ) so each morning starts with yesterday's lessons baked in.

## Why it matters

Compounding library effect: every solved problem becomes a permanent reduction in future error rates. The cost is small (one extra agent pass per cadence). Together with `/insights` ( ) and CLAUDE.md grep recipes ( ), this completes a closed loop where the agent gets sharper every week without operator intervention.

## End-to-end

1. Pick a cadence to start: weekly is the most reliable; in-session has the worst signal-to-noise.
2. For weekly: schedule a recurring calendar block. Open a fresh CC session, prompt: "analyze this week's session history at `~/.claude/projects/<project>/` and all PRs from this week. Extract errors and lessons. Propose diffs to `.claude/skills/*` and `CLAUDE.md`."
3. For nightly dream: write a cron (or use `/loop` on a task file) that runs after work hours. Same prompt, narrower window (today's sessions only).
4. Always enforce positive framing: phrase skill rules as "do X, that works well" — negative-framing skills ("don't do Y") perform worse in practice.
5. For in-session: add the directive below to CLAUDE.md, and spawn a separate sub-agent for the skill-update step so it doesn't pollute the main agent's context.
6. Review proposed diffs before merging — the agent will sometimes propose rules that solve a one-off, not a pattern.

## Prompts

```
`# Append to root CLAUDE.md for self-improving agents
When you hit a problem and find a solution, immediately update the relevant
skill or rule file with the lesson learned. Spawn a dedicated sub-agent for
the skill-update so it does not pollute the main agent's context. Phrase
the rule as "do X, that works" rather than "don't do Y."
`
```

## Gotchas

## The in-session self-update cadence is the weakest of the three: one operator reports the agent "either ignores it until I ask, or when I ask it tries to patch holes instead of stepping back and seeing the system problem." Weekly batch review is the cadence that actually works. Save in-session updates for genuinely simple "I learned a new flag" moments; everything structural belongs in the weekly pass.

## Tools

- Claude Code with skill files in `.claude/skills/`
- Session history retention (default in `~/.claude/projects/`)
- A scheduler (cron, launchd, or native `/loop`) for nightly cadence
