---
id: B-084
tier: A
category: "Engineering productivity"
kind: workflow
title: "Multi-model council voting for architectural decisions"
subtitle: "Problem solved: Whichever model the operator happened to use that hour decides the architecture. Run the same input through Claude + Codex + Gemini; consensus matters — and a Meta-Analyst pass finds the assumption all three missed."
source: https://www.cybos.ai/cases/B-084
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Founder · staff engineer · eng lead at decision time"
type: case
version: v0.1
---
# Multi-model council voting for architectural decisions

> Problem solved: Whichever model the operator happened to use that hour decides the architecture. Run the same input through Claude + Codex + Gemini; consensus matters — and a Meta-Analyst pass finds the assumption all three missed.

## What

For high-stakes architecture / strategy decisions, frame the proposal once, then feed the **same** input — transcripts, screenshots, presentation deck, prior decision log — to each available frontier model (Claude Code, Codex, Gemini, others as available). Each produces an independent proposal. Aggregate, look for consensus, treat disagreement as a flag for human reasoning. A Meta-Analyst pass on top hunts the shared assumptions and unasked questions all three models took for granted. Used as a gate for irreversible decisions only, not as everyday code review.

Three operational modes are now in public use:

- **Council** — N models answer the same question; consensus + disagreement surfaced; useful for irreversible architecture choices.
- **Debate** — one model critiques another's answer; surfaces failure modes the answering model can't see in itself.
- **Deliberation** — structured back-and-forth across multiple rounds with a final synthesis; useful when a single-shot answer is too lossy.

A community plugin wires Claude Code, Codex, and Gemini CLI into a single Claude Code session and exposes the three modes as commands. The productized two-model variant ships inside Cursor as a UX primitive: a tab toggles between Claude and Codex on the same context, so "show me the other model's take" is a single click instead of a context handoff.

For the everyday loop, two lighter primitives compose with the council:

- **Planner ↔ Executor 1-2 cycle**. The operating formula `choose → do → verify` maps to `Codex → Claude → Codex`. Codex picks the path; Claude implements; Codex reviews. One agent per phase; two agents in the same phase is noise. Artefacts (plan, patch, test) are the inter-agent language — not chat.
- **Codex 5.3 always-on code review**. Every Claude-authored PR runs Codex 5.3 as a separate code-review pass before merge. "Codex catches what Claude missed and vice versa" — recommended pattern is `Opus 4.6 + Codex 5.3` critique each other, save MD, compare disagreements, then act on the larger common denominator.

## Why it matters

Frontier models disagree on architecture choices in ways that map to real tradeoffs (Claude tends to over-modularise, Codex tends to under-abstract, Gemini long-context tends to recommend monoliths). Voting surfaces those tradeoffs deliberately, instead of inheriting whichever model the operator happened to be using that hour. Cohort participants used this to make decisions about KM architecture, agent topology, and hiring-pipeline structure.

Concrete win documented at the skill-level: one operator built a [Concilium](https://concilium.dev/) skill that triggers after 3 failed PR strikes on a single problem. It runs Claude, Codex 5.5, and Gemini 3.1 Pro Preview heavy-thinking via Vertex AI, each blind to the others. One stubborn skill-marketplace bug went from "850+ lines of shell + systemd + kernel-mount complexity, four failed attempts" to "~10 lines of config write, 200+ lines net removed" once the council surfaced the shared (wrong) assumption everyone was building under. A second operator adopted the same skill the day it was posted for a different stuck decision.

Generalised: the council's value isn't 2-of-3 majority. The value is the **Meta-Analyst pass that finds the assumption all three models took for granted**. Models trained on overlapping distributions reproduce the same shared blind spots; the Meta-Analyst's job is to surface them.

## End-to-end

1. **Decide the triggers.** Two kinds:

- **Manual / pre-meditated** — irreversible decisions: KM architecture, agent topology, schema migrations, vendor lock-in calls. Open a `council/input/` folder, drop transcripts/screenshots/slides/prior-decision log, define the trigger as "I'm about to commit to X and it'll cost a month to undo."
- **Auto / triggered-skill** — the 3-strike rule. After three failed PR attempts at the same problem in a single session, the orchestrator fires the council automatically. This is the [Concilium](https://concilium.dev/) skill's operational form.

1. **One canonical prompt file.** The question, the constraints, the success criteria. The exact same prompt for every model — variation in prompts contaminates the comparison.
2. **Run each model with the same input** — Claude Code, Codex CLI, Gemini CLI (or Gemini 3.1 Pro heavy thinking via Vertex AI), nine-model Delphi variants if appetite permits. Capture full output to `council/output/<model>-<date>.md`. Critically: **each model runs blind to the others' output**.
3. **Add the Meta-Analyst pass.** Hand all N outputs (and the original prompt) to a single model. Its job is **not to add a fourth opinion**; its job is to find shared assumptions, missing perspectives, overconfident agreements, and the unasked question that none of the panellists raised. The verbatim Meta-Analyst prompt — battle-tested in [Concilium](https://concilium.dev/) — is below.
4. **Use the three operational modes deliberately.**

- Use **council** when the decision is irreversible and N independent priors matter.
- Use **debate** when you suspect the obvious answer is wrong but can't articulate why.
- Use **deliberation** when the single-shot answer feels lossy and you have time for a real round of back-and-forth.

1. **For everyday engineering, use the planner-executor 1-2 cycle**, not the full council. Codex picks the path; Claude implements; Codex reviews. One agent per phase. Artefacts (plan, patch, test) carry state between agents.
2. **Always-on Codex 5.3 code review.** On any meaningful Claude PR, a separate Codex 5.3 pass on the diff is cheap insurance.
3. **Log council outputs into the decision graph.** See A-027's decision-graph variant. The audit trail matters six weeks later when you want to answer "why did we choose X and what did the models see at the time?"

## Prompts

`agent-tower-plugin` installation:

```
`# Add the marketplace
claude plugin marketplace add <plugin-author>/agent-tower-plugin

# Install the plugin
claude plugin install agent-tower-plugin@agent-tower-plugin-marketplace

# Restart Claude Code to activate the plugin
`
```

Meta-Analyst prompt skill):

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

Planner-executor 1-2 cycle:

```
`# Phase 1: Codex chooses
codex exec "Given <problem>, propose the path. Output:
 - chosen path (≤5 bullets)
 - 2 plausible alternatives + why rejected
 - acceptance criteria for the chosen path"
# → plan.md

# Phase 2: Claude executes against plan.md
claude -p "Implement plan.md. Edit code; run tests; do not deviate."
# → patch + test results

# Phase 3: Codex reviews
codex exec "Review the diff against plan.md and acceptance criteria.
 Flag deviations. Flag confabulations. Pass / fail."
# → review.md
`
```

## Gotchas

- **Don't vote everything.** Council voting is expensive in attention; if you use it for daily PRs you stop reading the outputs and the exercise becomes theatre. Reserve for "if we're wrong here, we eat a month of cleanup".
- **The value isn't majority vote; it's the Meta-Analyst pass.** 2-of-3 agreement is *not* signal — models trained on overlapping distributions agree on the same wrong things. The shared-assumption hunt is what earns the council its compute cost.
- **Models recognize their own training traces**. One operator's caution: long-term, single-ecosystem may win because models learn to evaluate themselves better than they evaluate strangers. Counter-stance from the Concilium author: different training distributions are *exactly* the value — the council's strength is in disagreement, not agreement. Both stances documented; pick by use case.
- **For everyday work, the council is overkill.** The planner-executor 1-2 cycle covers 80% of routine engineering. Reserve the full N-model council for the 20% where the cost of being wrong is high.
- **Artefacts > chat between agents**. When two models talk to each other in chat, you get noise. When they hand off plan / patch / test, you get progress. Wire your council to write to files, not to a shared conversation.
- **One round only; don't loop the council.** A live multi-agent dialog between frontier models converges to the noisiest model's frame. The 9-model Delphi reference uses one round of independent answers, one round of ranking-with-argumentation, then a judge — no live cross-talk.

<hr/>

## Tools

- Subscriptions to ≥ 3 frontier models (Claude Code, Codex, Gemini at minimum)
- A canonical input folder + one prompt file
- The `agent-tower-plugin` or an equivalent local orchestrator (one operator built [Concilium](https://concilium.dev/) on top of Claude Code's skill system)
- A diff tool that handles long markdown well
- Optional: Vertex AI for Gemini heavy thinking; OpenRouter as a budget access layer
- For 3-strike auto-trigger: hook into your session orchestrator to count failed PR attempts on the same problem
