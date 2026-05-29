---
id: A-064
tier: A
category: "Engineering productivity"
kind: skill
title: "Concilium — 3-model debate triggered after a 3-PR strike"
subtitle: "Problem solved: After 3 failed PRs on a single problem, operator and agent are locked in shared assumptions; running the same problem through 3 model families blind to each other, then a Meta-Analyst pass, breaks the lock."
source: https://www.cybos.ai/cases/A-064
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · senior engineer · strategy lead"
type: case
version: v0.1
---
# Concilium — 3-model debate triggered after a 3-PR strike

> Problem solved: After 3 failed PRs on a single problem, operator and agent are locked in shared assumptions; running the same problem through 3 model families blind to each other, then a Meta-Analyst pass, breaks the lock.

## What

[Concilium](https://concilium.dev/) is a Claude skill that triggers automatically after **3 consecutive failed PRs on the same problem**. On trigger, it packages the same context for three different model endpoints — Claude (as in-session subagent), Codex / GPT-5.5, Gemini 3.1 Pro Preview (heavy thinking mode via Vertex AI) — and runs each blind to the others' output. The orchestrator collects the three reports; a final **Meta-Analyst pass** scans them for shared assumptions, missing perspectives, overconfident agreements, and the single unasked question. Value is not 2-of-3 majority — value is surfacing the assumption nobody questioned alone.

## Why it matters

Real reported win: a stubborn skill-marketplace bug that survived three prior PR attempts (the kind of bug where each fix exposes a new failure underneath) collapsed from **850+ lines of shell + systemd + kernel-mount complexity to ~10 lines of config write — net 200+ lines removed**. The framework also applies to strategic decisions; one operator uses it to pick the next product to build in his factory. The same primitive (multi-model questioning) is now productized as Cursor's two-model UX, validating the pattern at scale.

## End-to-end

1. **Define the strike rule.** Skill triggers when an agent has produced 3 failed PRs against the same problem (an upstream "complex issue" skill marks the problem complex on strike 3 and hands off to Concilium).
2. **Snapshot the shared context.** Same problem statement, same code state, same prior-attempts log — packaged once and replayed to each model. Models must be blind to each other's reports.
3. **Run three models in parallel from different training distributions.** One source's working setup: Claude as in-session subagent, Codex / GPT-5.5, Gemini 3.1 Pro Preview heavy thinking via Vertex AI. The point is different training distributions — same-ecosystem council loses the cross-distribution edge.
4. **Collect the three independent reports.** Don't synthesize yet. Don't pick a winner by majority. Don't let any model see the others.
5. **Run the Meta-Analyst pass.** A separate prompt (verbatim below) reads all three reports and surfaces (a) shared assumptions, (b) missing perspectives, (c) overconfident agreements, (d) the single unasked question. This is where the actual value lives — not in the panel outputs.
6. **Act on the unasked question first.** In the reference case, all three models agreed on what to do; the Meta-Analyst's value was identifying that all three had quietly assumed the simple alternative required upstream code changes when in fact a config flag already existed.
7. **Optional: extend to strategic decisions.** Same harness, different question type — product selection, hire/no-hire, architecture choice. One operator reports adopting it for any decision they're locked on.

## Prompts

Meta-Analyst prompt, run after the three model outputs are collected — **verbatim**:

```
`You are a Meta-Analyst reviewing a panel of [N] expert evaluations
on this question: "[QUESTION]"

You have read all evaluations. Your job is NOT to add another opinion.
Your job is to find what the panel collectively missed.

1. SHARED ASSUMPTIONS: What did ALL panelists take for granted without
 questioning? List 2-3 implicit assumptions that were never challenged.
2. MISSING PERSPECTIVE: Who should have been at the table but was not?
 What viewpoint is entirely absent from the panel?
3. OVERCONFIDENT CLAIMS: Where did the panel agree too easily? Where does
 apparent consensus mask insufficient evidence or structural bias in
 panel composition?
4. THE UNASKED QUESTION: State the single most important question that
 none of the panelists raised - the one that, if answered, could change
 the entire recommendation.

Keep it concise. Do not rehash the panelists' arguments.
Only surface what they all missed.
`
```

## Gotchas

- **Don't run three instances of the same model family** — same-ecosystem councils lose the cross-distribution edge. One source's counter-argument: long-term, models recognize their own training traces better, so single-ecosystem may win. The community's working answer is *different distributions for blind panels, same ecosystem when one model is clearly best at the domain*.
- **Don't synthesize before the Meta-Analyst pass.** The point of the Meta-Analyst is surfacing what the panel missed; if you've already summarized the panel into a recommendation, you've lost the signal.
- **3-PR rule alone is not enough.** An earlier version of this skill triggered at strike 3 but had the *same model* re-attempt the problem — same training, same blind spots, same failure. The change that worked was switching to different model families on strike 3.
- **"Concilium is good for depth=1"** — one operator's caveat: it solves the locked-in-assumption problem at the current decision; it does not recursively decompose a multi-layer problem. For deeper problems, re-trigger at each layer.

<hr/>

## Tools

- Claude Code with skill system — host the trigger and the orchestrator
- Codex (CLI or API) — second model family
- Gemini 3 Pro Preview via Vertex AI — third model family, used in heavy thinking mode
- An orchestration host (Paperclip or any agent harness with multi-CLI support) to run the three models in parallel and capture outputs
