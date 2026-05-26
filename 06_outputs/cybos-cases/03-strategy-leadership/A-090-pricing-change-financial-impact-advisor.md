---
id: A-090
tier: A
category: "Strategy & leadership"
kind: skill
title: "Pricing-change financial impact advisor"
subtitle: "Problem solved: Founders compute \"30% price hike = 30% more revenue\" and ignore accelerating churn; a structured 4-question advisor produces a defensible go/no-go memo with sensitivity scenarios."
source: https://www.cybos.ai/cases/A-090
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · head of growth · head of finance · PM/PMM running a pricing decision"
type: case
version: v0.1
---
# Pricing-change financial impact advisor

> Problem solved: Founders compute "30% price hike = 30% more revenue" and ignore accelerating churn; a structured 4-question advisor produces a defensible go/no-go memo with sensitivity scenarios.

## What

An interactive Claude Code skill (from a public product-manager skills pack) that evaluates a proposed pricing change — price increase, new tier, paid add-on, usage-based pricing, discount, or packaging change — by walking the founder through up to four adaptive questions, then modeling four effects together: ARPU lift × customer base, churn-driven revenue loss, conversion impact on new ARR, and CAC payback impact. It returns one of four numbered recommendation patterns (Implement broadly / Test first with A/B / Modify approach / Don't change) with a month-1 / month-3 / month-6 / year-1 MRR projection and explicit success criteria. It is deliberately *not* value-based pricing design, willingness-to-pay research, or competitive positioning — it is the financial-impact gate before any of those.

## Why it matters

The default founder mental model — "raise prices X%, make X% more" — ignores the offsetting churn loss and conversion drag. The skill forces the net computation. Its worked example: a 30% blanket hike lifts ARPU by +$75K MRR, but churn moving 5%→8% costs −$9.75K MRR, netting +$65K — and the skill flags it as risky *because churn is accelerating*, not just lower. That reframing (positive net, still a bad idea) is the whole value. Output is a memo a founder can defend to a board, not a back-of-envelope number.

## End-to-end

1. **Gather baseline (Step 0).** The skill asks for current ARPU/ARPA, monthly churn, trial-to-paid conversion, total customers / MRR / ARR, CAC, and NRR, plus the proposed change (type, new pricing, affected segment). If no baseline metrics exist, the skill declines — it will not model on guesses alone.
2. **Identify change type (Step 1).** Pick one of six: price increase / new premium tier / paid add-on / usage-based / discount strategy / packaging change. Each branches its own sub-questions (for a price increase: who is affected — new only, all, a segment; when — immediate, next cycle, gradual).
3. **Assess expected impact (Step 2).** Quantify ARPU lift %, conversion change %, churn risk (low/medium/high with the new monthly churn %), and NRR delta. The skill models conservative / base / optimistic scenarios from these.
4. **Evaluate against baseline (Step 3).** Pull MRR/ARR, customer count, churn, NRR, CAC, LTV, growth rate, and competitive position (below / at / above market) so the recommendation is anchored, not abstract.
5. **Deliver one of four recommendation patterns (Step 4).** The skill synthesizes revenue impact (ARPU lift × base), churn-driven loss, conversion impact, and CAC payback impact, then picks exactly one pattern with full numbers, success criteria (conversion stays > X%, churn < Y%, NRR > Z%), and a 1/3/6/12-month MRR projection.
6. **Run sensitivity analysis (Step 5, optional).** Optimistic / pessimistic / breakeven scenarios plus what-if tables, e.g. "what churn rate makes this change net-neutral?"

## Prompts

The opening question, verbatim from the skill body:

```
`"What type of pricing change are you considering?

1. **Price increase** — Raise prices for new customers, existing customers, or both
2. **New premium tier** — Add higher-priced tier with additional features
3. **Paid add-on** — Monetize a new or existing feature separately
4. **Usage-based pricing** — Charge for consumption (seats, API calls, storage, etc.)
5. **Discount strategy** — Annual prepay discount, volume pricing, or promotional pricing
6. **Packaging change** — Rebundle features, change pricing metric, or tier restructure

Choose a number, or describe your specific pricing change."
`
```

Recommendation Pattern 1 output shape, verbatim:

```
`Recommendation Pattern 1: Implement Broadly
 When: Net revenue impact clearly positive (>10% ARPU lift, <5% churn risk),
 minimal conversion impact, strong value justification.
 Output: Current MRR, ARPU lift %, expected MRR increase, churn-driven MRR loss,
 net MRR impact, CAC payback delta, month 1/3/6/year-1 projections,
 success criteria (conversion >X%, churn <Y%, NRR >Z%).
`
```

## Gotchas

- **Don't use it below threshold.** The skill refuses < 5% price changes, changes affecting < 10% of customers, or cases with no baseline metrics — too little signal to model.
- **The ten named pitfalls it guards against:** ignoring churn impact; not grandfathering existing customers; testing without statistical power (< 100 customers per cohort); price changes with no value justification; ignoring CAC payback impact; annual discounts that destroy LTV; copying a competitor's price; premature A/B optimization; forgetting expansion revenue; shipping with no customer-communication plan.
- **Positive net is not "ship it."** The canonical failure the skill is built to catch: a change that is net-positive on revenue but accelerates churn. The recommendation pattern explicitly separates "net positive" from "safe to do broadly."

<hr/>

## Tools

- Claude Code v2.1+ (or Claude Desktop)
- Install: `/plugin marketplace add deanpeters/Product-Manager-Skills` then `/plugin install pm-skills@product-manager-skills`
- Baseline metrics on hand: ARPU, monthly churn, trial-to-paid conversion, MRR/ARR, CAC, NRR
- Pairs with the same pack's SaaS finance-metrics quick-reference skill as the "look up the formula" companion to this "decide whether to ship" advisor
