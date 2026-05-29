---
id: B-140
tier: B
category: "Knowledge management"
kind: workflow
title: "Self-improving research pipeline — methodologist-spawn-evaluate loop with A/B-tested prompts"
subtitle: "Problem solved: Manual prompt tuning for deep-research tasks is slow and the prompts go stale. A methodologist sub-agent proposes new prompts, fans out 5 parallel research teams, two methodologist agents A/B-test the outputs, and the winning template propagates."
source: https://www.cybos.ai/cases/B-140
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · engineer running deep-research at scale"
type: case
version: v0.1
---
# Self-improving research pipeline — methodologist-spawn-evaluate loop with A/B-tested prompts

> Problem solved: Manual prompt tuning for deep-research tasks is slow and the prompts go stale. A methodologist sub-agent proposes new prompts, fans out 5 parallel research teams, two methodologist agents A/B-test the outputs, and the winning template propagates.

## What

Instead of running a single "deep research" prompt, the operator runs a self-improving harness: per task, a methodologist agent writes 5 candidate research prompts, 5 research teams (Claude Code instances in Docker, routed through OpenClaw) execute in parallel, two methodologist agents independently grade the outputs against an evaluation rubric stored in `/doc/ai-management/`, the winner becomes the new template, and an "improvement" agent proposes the next iteration (e.g. "add mandatory sources X and Y").

## Why it matters

Replaces per-vendor deep-research subscriptions ($X/mo each) with a compounding asset: the harness itself improves week over week, source hierarchies become explicit, A/B test results are versioned. The operator's leverage is in pipeline control and trusted-source curation, not in a single prompt. Stated philosophy: *harness is primary, the task is secondary*.

## End-to-end

1. Create `/doc/ai-management/` in the project repo. Drop in evaluation criteria as `.md` (what makes a research output good for *this* domain — completeness, source quality, insight density).
2. For each new research task, spawn a methodologist agent to write 5 candidate prompts.
3. Run 5 teams in parallel (Claude Code in Docker, routed via OpenClaw or equivalent multi-CLI orchestrator).
4. Have two methodologist agents independently score the outputs and write the comparison methodology to `.csv`. The "second methodologist watches what the first methodologist missed" pattern catches single-evaluator blind spots.
5. Keep the winning team as the baseline. Run an "improver" agent that proposes deltas (mandatory sources, new evaluation dimensions like compression quality, etc.).
6. Re-run the A/B test with delta vs. baseline. Promote the winner.
7. Migrate the prompt store from flat `.md` → DAG → dynamic DAG as the methodology stabilizes. Eventually the improver agent suggests its own architecture changes.

## Gotchas

## The temptation is to skip the methodology-as-code step and just "ask Claude for a better prompt". That stays stuck — every iteration re-explores the same local minimum. The harness only compounds when (a) evaluation criteria live in version control as artifacts, (b) two independent methodologist passes catch each other's misses, and (c) every iteration writes a learning back to the methodology doc. Skip (a) and you have a slot machine.

## Tools

- OpenClaw or another multi-CLI orchestrator running Claude Code instances in Docker.
- A project repo with a dedicated `/doc/ai-management/` for evaluation criteria, results CSVs, and methodology revisions.
- Reference reads: Mitchell Hashimoto's "my AI adoption journey" essay and OpenAI's "harness engineering" post — both cited by the originating operator as the philosophical basis.
