---
id: B-213
tier: B
category: "Engineering productivity"
kind: workflow
title: "Codex Goals — persistent multi-turn objectives with evidence-based completion"
subtitle: "Problem solved: Long-horizon coding tasks make you restate the objective after every turn; a persistent goal lets the agent work to a verified finish line on its own."
source: https://www.cybos.ai/cases/B-213
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · founder · eng lead"
type: case
version: v0.1
---
# Codex Goals — persistent multi-turn objectives with evidence-based completion

> Problem solved: Long-horizon coding tasks make you restate the objective after every turn; a persistent goal lets the agent work to a verified finish line on its own.

## What

Codex Goals (`/goal`) are persistent objectives that let Codex work toward a defined outcome across many turns in a thread under a completion contract — it keeps going until the objective is verified complete against evidence (tests, benchmarks, artifacts) rather than stopping after each turn. Built for multi-turn tasks where the next step depends on the last result: performance optimization, flaky-test investigation, dependency migrations, research reproduction.

## Why it matters

Without a goal, you re-state the objective after every result and the agent stops at each turn. A goal makes the agent continue autonomously toward a measurable finish line while idle and within budget — "you define the outcome, Codex works against the evidence in the thread." The Claude Code counterpart is the Stop-hook outer-loop pattern (see B-130); Goals is the Codex-native, first-class version with its own command surface.

## End-to-end

1. **Install / update Codex:** `npm install -g @openai/codex@latest` (requires Codex ≥ 0.128.0).
2. **Create a goal:** `/goal <outcome>`. Inspect with `/goal`; control with `/goal pause`, `/goal resume`, `/goal clear`.
3. **Write the goal to the structure template:** `<desired end state> verified by <specific evidence> while preserving <constraints>. Use <allowed inputs>. Between iterations, <iteration policy>. If blocked, <stop condition>.`
4. **Let it run.** Codex continues only while threads are idle and budget remains; completion requires evidence-based verification; hitting the budget triggers a progress-and-blockers summary, not a false success.

## Prompts

Weak vs strong goal — the strong one names the outcome, the verification surface, and the constraint:

```
`# weak
/goal Improve performance

# strong
/goal Reduce p95 latency below 120 ms on checkout benchmark while keeping correctness suite green
`
```

## Gotchas

- **Goals scope to a single thread, not global project state.**
- **Skip goals for single edits, vague objectives, or tasks with no auditable finish line** — a normal prompt is better there.
- **See also B-130** (Outer-loop autonomy / Ralph) — the Claude Code equivalent of the same "work autonomously until done" idea.

<hr/>

## Tools

- Codex CLI ≥ 0.128.0 (`npm install -g @openai/codex@latest`)
