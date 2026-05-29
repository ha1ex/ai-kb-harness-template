---
id: B-176
tier: B
category: "Marketing & content"
kind: workflow
title: "Competitive-intent SEO page generator"
subtitle: "Problem solved: Bottom-of-funnel \"X vs Y\" and \"alternatives to X\" pages are either fabricated or unfair; a 4-format generator produces 1,500+ word pages with structured data, a conversion layout, and a verifiable-claims discipline."
source: https://www.cybos.ai/cases/B-176
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "marketer · SEO lead · founder · growth engineer"
type: case
version: v0.1
---
# Competitive-intent SEO page generator

> Problem solved: Bottom-of-funnel "X vs Y" and "alternatives to X" pages are either fabricated or unfair; a 4-format generator produces 1,500+ word pages with structured data, a conversion layout, and a verifiable-claims discipline.

## What

A Claude Code skill that generates the four canonical competitive-intent SEO page formats: head-to-head "X vs Y" comparisons, "alternatives to X" pages, "best [category] tools" roundups, and multi-product comparison tables. For each it produces a ≥1,500-word page outline, a feature-matrix table, JSON-LD schema (Product/SoftwareApplication/ItemList), a keyword-targeting plan, CTA placement, trust signals, and a fairness checklist. It absorbs a centralized competitor-data-file pattern (one source-of-truth file feeding all comparison pages, with Python QA scripts validating claims) from a related skill.

## Why it matters

Competitive-intent pages are 5–15% of B2B SaaS organic conversions but are usually written from memory and are either inaccurate or hostile to the competitor (which costs trust and triggers defamation risk). This skill enforces verifiable-only claims from public sources, "as of [date]" pricing disclaimers, balanced presentation, and own-product affiliation disclosure — saving the ~4–8 hours of manual research/writing per page while keeping it defensible.

## End-to-end

1. Request a comparison/alternatives page; the skill autoloads via description triggers.
2. Pick one of the four page types based on intent.
3. Build the feature-matrix table from verifiable public-source claims; mark pricing "as of [date]"; unreachable competitor URLs are flagged as gaps and missing data becomes "Not publicly available" rather than a guess.
4. Generate JSON-LD: `Product+AggregateRating` for single-product comparisons, `SoftwareApplication` for software, `ItemList` for roundups.
5. Apply the title-tag formula by type and write an H1 mirroring intent under 70 chars.
6. Place CTAs — summary + primary CTA above fold, "Try [Your Product] free" after the comparison table, recommendation at bottom; avoid CTAs inside competitor-description sections (trust hit).
7. Add social proof (G2/Capterra/Trustpilot with source links, "switched from" case studies) and trust signals (last-updated timestamp, author expertise, methodology disclosure).
8. Output `COMPARISON-PAGE.md`, `comparison-schema.json`, and a keyword-strategy doc; schedule a quarterly review.

## Prompts

```
`Title Tag Formulas
- X vs Y: `[A] vs [B]: [Key Differentiator] ([Year])`
- Alternatives: `[N] Best [A] Alternatives in [Year] (Free & Paid)`
- Roundup: `[N] Best [Category] Tools in [Year], Compared & Ranked`
`
```

## Gotchas

## Every competitor claim must trace to a public source — the fairness rules are load-bearing, not decorative. Putting a CTA inside a competitor-description section measurably reduces trust; keep CTAs in your own sections only. Pricing without an "as of [date]" disclaimer goes stale within a quarter and becomes a credibility liability — the quarterly review cadence is not optional.

## Tools

- Claude Code 1.0.33+
- Install: `/plugin marketplace add AgriciDaniel/claude-seo` then `/plugin install claude-seo@agricidaniel-seo`
- Ships with shared helpers `scripts/fetch_page.py`, `scripts/parse_html.py`
