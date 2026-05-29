---
id: B-181
tier: B
category: "Marketing & content"
kind: framework
title: "Marketing campaign manager with a 140-tactic menu"
subtitle: "Problem solved: \"What marketing tactic should we try next?\" defaults to ad-hoc research; a 140-tactic menu by funnel stage plus a buyer-bias playbook and strategic-frame selector collapses the decision to one skill invocation."
source: https://www.cybos.ai/cases/B-181
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · marketing manager · growth lead"
type: case
version: v0.1
---
# Marketing campaign manager with a 140-tactic menu

> Problem solved: "What marketing tactic should we try next?" defaults to ad-hoc research; a 140-tactic menu by funnel stage plus a buyer-bias playbook and strategic-frame selector collapses the decision to one skill invocation.

## What

A merged campaign-management skill that gives an agent end-to-end marketing competence: a 5-step campaign workflow (Strategy → Planning → Creation → Execution → Measurement), a content-calendar field schema, a buyer-bias playbook (confirmation, mere-exposure, social proof, scarcity, anchoring, loss aversion, endowment), pricing psychology, a 140-tactic menu across 8 categories, strategic frameworks (SOSTAC, AIDA, RACE), per-channel sub-playbooks, a pre-launch checklist, and stage-based recommendations from pre-launch through scale.

## Why it matters

It collapses the typical "what should we try?" decision from hours of research to a single invocation and gives an early-stage operator a senior-PMM-level checklist. The tone rules are themselves valuable: explicit ban on buzzwords (revolutionary, game-changing, seamless) and filler (basically, essentially, simply), max one emoji per piece — a built-in anti-slop filter.

## End-to-end

1. Install the GTM plugin and bootstrap brand context so subsequent invocations are grounded.
2. Invoke with a campaign brief — the agent runs the 5-step workflow, defines goals/audience/positioning, and builds a content calendar (Title · Target keyword · Funnel stage TOFU/MOFU/BOFU · Format · Owner · Publish date · Distribution channels) with UTM conventions (lowercase, hyphens, no spaces).
3. Apply behavioral science: pick 2–3 biases from the table that match the goal (Anchoring for pricing pages, Loss Aversion for trial endings).
4. Choose tactics from the 140-tactic menu filtered by stage (pre-launch → waitlist + Product Hunt prep; growth → paid + partnerships + events).
5. Pick a strategic frame: SOSTAC for quarterly plans, AIDA for individual ads, RACE for funnel reviews.
6. Apply the channel sub-playbook (email sequence Welcome → Value → Engagement → Offer at days 0/2–3/5–7/10).
7. Run the pre-launch checklist (audience defined, baseline metrics, KPIs, UTM validation, conversion tracking tested, brand-voice compliance, links verified) before any send.
8. Track metrics by channel (Email = open/CTR/conversion; Paid = ROAS/CPA/CTR; Content = traffic/time-on-page; SEO = rankings/organic).

## Prompts

```
`Campaign Workflow (verbatim):
1. Strategy — Define goals, audience, positioning
2. Planning — Content calendar, channels, timeline
3. Creation — Assets, copy, creative
4. Execution — Launch, distribute, promote
5. Measurement — Track, analyze, optimize
`
```

## Gotchas

## The skill cites a "43% average open rate" benchmark — treat that as suspect and verify against your own ESP data before quoting it externally; it is well above typical SaaS open rates and is not source-attributed. The Common Mistakes list independently flags "chasing every channel" and conflating leading vs lagging indicators as the dominant failure modes — heed those over the rosy benchmark.

## Tools

- Claude Code (or any Agent-Skills-compatible runtime)
- Optional project context at `.agents/product-marketing-context.md`
- Install: `claude plugin marketplace add manojbajaj95/claude-gtm-plugin`
