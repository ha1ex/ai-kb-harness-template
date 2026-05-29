---
id: B-120
tier: B
category: "Engineering productivity"
kind: workflow
title: "Debug-loop circuit breaker — after 3 failed PRs, zoom out and brainstorm hypotheses"
subtitle: "Problem solved: Coding agents thrash on stuck bugs by repeatedly applying the same wrong-layer fix; an explicit 3-PR strike rule forces an architecture-level re-think before another fix attempt."
source: https://www.cybos.ai/cases/B-120
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · eng lead"
type: case
version: v0.1
---
# Debug-loop circuit breaker — after 3 failed PRs, zoom out and brainstorm hypotheses

> Problem solved: Coding agents thrash on stuck bugs by repeatedly applying the same wrong-layer fix; an explicit 3-PR strike rule forces an architecture-level re-think before another fix attempt.

## What

Add a skill or claude.md rule: if the agent has produced 3 PRs against the same bug without resolving it, it must stop patching, zoom out, enumerate every plausible root-cause hypothesis, run deep research on each in parallel, and build a probability-weighted table before touching code again. One operator reports this rule surfacing a root cause that 6 prior PRs missed — the bug wasn't in the code, it was an undersized VM.

## Why it matters

Most agent debug loops fail at the layer where the agent first looked. Forcing a structural mode-switch breaks the loop. Cheap to implement (a few lines of skill instructions) and pays back the first time it saves you from a 7th wrong PR.

## End-to-end

1. Add a "complex-issue" skill or a rule in `CLAUDE.md`: trigger after 3 failed PRs on a single tracking ID.
2. Skill instructions: (a) describe the whole system around the bug, not just the failing component; (b) list every plausible hypothesis for the root cause across layers (app, runtime, infra, data, config); (c) deep-research each hypothesis in parallel — use a research subagent or web search; (d) build a probability-weighted table.
3. Pick the highest-probability hypothesis and write the fix; do NOT continue down the layer the previous 3 PRs were targeting.
4. After resolution, write a post-mortem and append the new failure mode to the skill so it gets considered earlier next time.
5. Pair this with a multi-model deliberation step ([Concilium](https://concilium.dev/) or similar) when even the zoomed-out analysis stays stuck — different models surface assumptions a single model trained itself on.

## Gotchas

- GPT-family agents may try to use their own built-in research tool and skip your skill path. Make the skill explicit in the user prompt or system prompt, and verify it ran by checking the artefacts (hypothesis table) before approving the next fix.

<hr/>

## Tools

- Claude Code or equivalent with skills support
- A deep-research subagent or routine the skill can invoke
- A way to count strikes (PR labels, a tracker, or a sentinel in commit messages)
