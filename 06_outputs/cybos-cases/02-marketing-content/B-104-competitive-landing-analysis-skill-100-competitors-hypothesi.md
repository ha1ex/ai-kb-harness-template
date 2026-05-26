---
id: B-104
tier: B
category: "Marketing & content"
kind: workflow
title: "Competitive-landing-analysis skill — 100 competitors → hypothesis-ranked recommendations"
subtitle: "Problem solved: Marketing leads need defensible landing-page hypotheses backed by competitor evidence; a skill that auto-analyzes ~100 competitors and ranks recommendations produces 3–4 adopted changes per cycle."
source: https://www.cybos.ai/cases/B-104
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "marketing lead · founder"
type: case
version: v0.1
---
# Competitive-landing-analysis skill — 100 competitors → hypothesis-ranked recommendations

> Problem solved: Marketing leads need defensible landing-page hypotheses backed by competitor evidence; a skill that auto-analyzes ~100 competitors and ranks recommendations produces 3–4 adopted changes per cycle.

## What

A Claude Code skill takes a competitor list (~100 in your vertical), auto-assembles the required sub-skills (scraper, content extractor, comparison engine), and runs a multi-role prompt chain — CRO, UX designer, marketer, CMO — to produce a ranked HTML report of landing-page hypotheses. Optional weekly cron alerts you to changes on competitor pages.

## Why it matters

Manual competitive landing analysis takes a week; agent-driven analysis runs in an afternoon and surfaces patterns a human reviewer misses across 100 pages. One marketing lead reports 3–4 quality recommendations adopted per analysis cycle. Re-runnable weekly, the workflow becomes a passive competitive-intelligence stream rather than a one-off project.

## End-to-end

1. Define a competitor list of ~100 companies in your vertical (URLs of their primary landing or product page).
2. Ask Claude to assemble the required sub-skills (scrape page, extract structured content, summarise hero+CTA, compare).
3. Run the multi-role prompt chain — CRO analyzes conversion mechanics, UX designer analyzes layout/hierarchy, marketer analyzes positioning, CMO synthesises strategy.
4. Output a ranked HTML report with hypotheses scored by importance × implementation complexity.
5. Pick the top 3–4 hypotheses for the next landing iteration.
6. Optional: schedule a weekly cron run that diffs current state vs last week's snapshot and alerts on material changes (new hero copy, new pricing tier, new CTA).

## Gotchas

## A 100-URL run with naive scraping hits rate limits and gets blocked. Stagger requests; cache aggressively; rotate user agents. The skill is also only as good as the competitor list — adding 30 irrelevant competitors dilutes the synthesis. Curate the list before each cycle.

## Tools

- Claude Code with skills enabled
- Scraping capability (Apify or Playwright skill)
- Role-based prompt files (CRO / UX / marketer / CMO)
- Weekly cron host (any always-on machine or scheduled CI run)
