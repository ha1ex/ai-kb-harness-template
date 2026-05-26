---
id: A-076
tier: A
category: "Sales & outbound"
kind: workflow
title: "Recursive 10-expert-panel cold-email optimizer"
subtitle: "Problem solved: AI-written cold-email sequences pass surface review but stall on reply rate; a 10-persona scoring loop with explicit weakness lists forces drafts past the LLM-flattery failure mode before any send."
source: https://www.cybos.ai/cases/A-076
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · sales lead · RevOps · growth marketer"
type: case
version: v0.1
---
# Recursive 10-expert-panel cold-email optimizer

> Problem solved: AI-written cold-email sequences pass surface review but stall on reply rate; a 10-persona scoring loop with explicit weakness lists forces drafts past the LLM-flattery failure mode before any send.

## What

A two-mode Claude Code skill — *audit existing campaign* or *start from scratch* — that designs and tunes cold-outbound sequences for the Instantly sending platform. The signature move is **recursive expert-panel scoring**: a configurable panel of 10 expert personas scores each sequence draft 0–100 across explicit lenses (subject curiosity, first-sentence pattern interrupt, body brevity, CTA softness, deliverability risk, personalization believability, sequence flow). Each round produces a 10-row scorecard, an aggregate score, a ranked top-3 weaknesses list, specific copy edits, and an updated draft. Rounds iterate until the panel aggregate hits **90/100**. Paired with a Python audit script that pulls live Instantly state — campaign health, warmup scores per sending account, domain inventory, capacity math.

## Why it matters

The default failure mode of LLM copy review is unearned 9/10 — models flatter their own drafts and converge on "looks fine." This skill encodes an explicit guardrail against that pattern (*"Scores must be brutally honest. No padding to 90 without earning it"*) and forces a multi-round score-edit-rescore loop. Output is a strategy doc with capacity math wired to real warmup data: accounts with score <80 or <14 days warmup are excluded from "ready" count, dramatically deflating projected pipeline for under-warmed setups — which is the right number, not the encouraging one. Concrete weekly targets ship with the skill (open 40–60%, reply 3–7%, positive reply 1–3%, meeting 0.5–1.5%).

## End-to-end

1. **Triage mode.** Ask: (a) existing Instantly account, or start from scratch? (b) is the Instantly v2 API key available? If yes → audit mode; if no → copy work proceeds but infrastructure section is skipped.
2. **Infrastructure audit (audit mode).** Run `python3 scripts/instantly-audit.py --api-key <KEY>`. Report active campaigns (name / status / reply rate / open rate), sending accounts (count / warmup score / daily limit), domain inventory, and warmup gaps. Flag any account with warmup <80 or <14 days warmup as **NOT ready**.
3. **Define ICP and business context.** Fill the ICP template (titles, industries, company size, revenue floor, anti-ICP) and a one-sentence what-you-sell, primary offer, real URLs, proof points.
4. **Configure the expert panel.** Default roster is 10 personas defined in `references/expert-panel.md`; confirm or edit before scoring starts.
5. **Run the recursive scoring loop.** Each round emits a score table (10 panelists × 0–100 + rationale), aggregate score, ranked top-3 weaknesses, specific copy edits, updated copy. If aggregate <90 → next round addresses the top 3 weaknesses. If ≥90 → finalize. Hard rule: panelists score brutally; no aggregate may pad above weaknesses.
6. **Compute send capacity.** Use the verbatim chain: accounts-ready × 30 (conservative) or × 50 (aggressive) emails/day × 22 working days × reply rate × qualification rate = pipeline opportunities.
7. **Deliver the strategy doc.** 10 sections — Brutal Truth, ICP Summary, Infrastructure Status, Scoring Rounds, Final Email Copy, Implementation Plan, Capacity Math, Weekly Metrics Targets, STOP List, START List.
8. **Human review gate before sending.** The skill's hard rule is *"Do NOT push anything to Instantly automatically"* — the strategy doc is for review; explicit human approval is required before any API write to Instantly.

## Prompts

Infrastructure audit command (verbatim):

```
`python3 scripts/instantly-audit.py --api-key <KEY>
`
```

Capacity math chain (verbatim from skill):

```
`Accounts ready (score ≥80, ≥14 days warmup) × 30 emails/day = conservative daily volume
Accounts ready × 50 emails/day = aggressive daily volume
Daily volume × 22 working days = monthly send capacity
Monthly sends × expected reply rate = expected replies
Expected replies × qualification rate = pipeline opportunities
`
```

Weekly targets (verbatim):

```
`Open rate: 40%+ good / 60%+ great
Reply rate: 3%+ good / 7%+ great
Positive reply rate: 1%+ good / 3%+ great
Meeting rate: 0.5%+ good / 1.5%+ great
`
```

Panel scoring lenses (verbatim):

```
`- Subject line curiosity / open rate potential
- First sentence pattern interrupt
- Body clarity and brevity
- CTA softness and specificity
- Sequence flow and follow-up logic
- Deliverability risk signals (spam words, link density)
- Personalization believability
`
```

Install (verbatim — keep author path runnable):

```
`git clone https://github.com/ericosiu/ai-marketing-skills.git \
 && cd ai-marketing-skills/outbound-engine \
 && pip install -r requirements.txt \
 && cp SKILL.md <your-project>/.claude/skills/cold-outbound-optimizer.md
`
```

## Gotchas

- **Unearned 90s.** Without the "brutally honest, no padding" guardrail, panels converge on flattery. Keep that line in the skill prompt verbatim.
- **Auto-push to the sender.** Never wire scoring output directly into Instantly campaign creation. Human approval gate is load-bearing — a panel-approved sequence is still a draft until a human reads it.
- **Under-warmed accounts inflating capacity.** Operators routinely include accounts with warmup <80 in capacity math; the skill correctly excludes them. If your projected pipeline halves after audit, that's the math, not a bug.
- **No API key, no infrastructure picture.** Audit mode is the demo-able half; copy mode alone still ships a strategy doc but you lose the capacity grounding.

<hr/>

## Tools

- Claude Code — host for the skill.
- Python 3.9+ — bundled audit / lead / monitor scripts.
- Instantly v2 API key — required for audit mode; copy work proceeds without it.
- Reference files travel with the skill: `references/instantly-rules.md`, `references/expert-panel.md`, `references/copy-rules.md`, `references/icp-template.md`.
- Optional add-ons (referenced, not bundled): HeyReach for LinkedIn, Clay or Apollo for enrichment.
