---
id: B-178
tier: B
category: "Marketing & content"
kind: workflow
title: "Mobile-app paid user-acquisition planner"
subtitle: "Problem solved: Mobile founders spread paid budget across every channel and lose money; a budget-tiered allocation with per-channel campaign structure prevents the waste."
source: https://www.cybos.ai/cases/B-178
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "mobile founder · growth manager"
type: case
version: v0.1
---
# Mobile-app paid user-acquisition planner

> Problem solved: Mobile founders spread paid budget across every channel and lose money; a budget-tiered allocation with per-channel campaign structure prevents the waste.

## What

A skill that plans paid user-acquisition campaigns across Apple Search Ads, Google UAC, Meta, TikTok, Snapchat, Twitter/X, and Reddit. It recommends a channel mix by monthly budget tier (<$1K through $100K+), gives a CPI/intent/best-for/complexity matrix, prescribes an ASA campaign structure (Brand / Category / Competitor / Discovery), a Meta lookalike/interest/broad structure, and Google UAC asset requirements — then outputs a UA plan with channel allocation %, weekly cadence, and per-channel KPI targets.

## Why it matters

The single most common mobile-UA mistake is running all channels at sub-scale budgets, which underfeeds every algorithm and burns money everywhere. The budget-tier table ("<$1K → ASA Basic only", scaling up to "$100K+ → all channels + programmatic + influencer") gives founders a defensible answer to "where should the next dollar go" and ties the CPI cap to unit economics (CPI < LTV/3).

## End-to-end

1. Read `app-marketing-context.md` if present.
2. Ask: monthly UA budget, target CPI/ROAS, current LTV, target audience, target countries, app category.
3. Select channels by budget tier (see the verbatim table).
4. Build the ASA structure: Brand (exact match, <$0.50 CPA) + Category (broad+exact, $1–3) + Competitor (exact, $2–5) + Discovery (Search Match); add negatives from Discovery, promote winners to exact, pause keywords >2× target CPA.
5. Build the Meta structure: 1%-lookalike of paying users + interest + broad; seed then expand 1%→3%→5%, layer interests, broaden at scale.
6. Build Google UAC: 4 text ideas, 20 images, 5 videos; set target CPI/CPA and let the algorithm optimize.
7. Apply creative best practices (video hook in first 3s, works without sound, captions) and funnel KPIs (CTR >5% ASA / >1% social; CVR >30% ASA / >10% social; CPI < LTV/3; ROAS >1 break-even, >2 good; D7 ROAS as the predictor).
8. Output the UA plan with budget allocation, weekly tasks, and per-channel briefs; apply the optimization cadence (daily pacing, weekly CPI/CPA, bi-weekly creative refresh, monthly channel mix).

## Prompts

```
`| Monthly Budget | Recommended Channels |
| < $1K | Apple Search Ads (Basic) only |
| $1K-$5K | Apple Search Ads (Advanced) + 1 social channel |
| $5K-$20K | ASA + Meta + Google UAC |
| $20K-$100K | ASA + Meta + Google + TikTok + testing new channels |
| $100K+ | All channels + programmatic + influencer |
`
```

## Gotchas

## The cited channel CPIs ($0.5–5) are implicitly US/English-market and will not transfer to other geos — recalibrate against your own install data before trusting the allocation. The ASA Basic vs Advanced split is iOS-only. Google UAC underperforms with a small creative pool; the 4/20/5 asset minimum is a floor, not a target.

## Tools

- Any Agent-Skills-standard runtime (Cursor `.cursor/skills/`, Claude Code `.claude/skills/`)
- Install: `npx skills add eronred/aso-skills --skill ua-campaign`
- Cross-references sibling skills `app-launch`, `monetization-strategy`, `app-analytics`
