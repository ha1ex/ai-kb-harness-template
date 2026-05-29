---
id: B-177
tier: B
category: "Marketing & content"
kind: workflow
title: "Page-type mismatch diagnosis via reverse-engineered SERPs"
subtitle: "Problem solved: A technically perfect page (95/100 SEO) still won't rank because it is the wrong page type for the SERP; a SERP-backwards analysis classifies the top 10's dominant type and flags mismatches with severity."
source: https://www.cybos.ai/cases/B-177
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "SEO lead · content strategist · growth PM"
type: case
version: v0.1
---
# Page-type mismatch diagnosis via reverse-engineered SERPs

> Problem solved: A technically perfect page (95/100 SEO) still won't rank because it is the wrong page type for the SERP; a SERP-backwards analysis classifies the top 10's dominant type and flags mismatches with severity.

## What

A skill that "reads SERPs backwards" — it analyzes the top 10 Google results for a target keyword, classifies their dominant page type, then compares your page to detect the core failure mode: clean technical SEO on the wrong page type. It derives 3–5 user stories from SERP signals (People Also Ask, ad copy, related searches, Featured Snippet format, AI Overview), scores the page on a 7-dimension Gap Score (0–100), scores it against 4–7 personas (Relevance/Clarity/Trust/Action, 25 pts each), and optionally generates current-vs-target wireframes with ultra-concrete annotations. The SXO score is reported separately from the SEO Health Score.

## Why it matters

"This page scores 95 on technical SEO and still won't rank because it's the wrong type for what Google rewards" is a failure mode most teams cannot self-diagnose — they keep optimizing the wrong axis. Catching one CRITICAL page-type mismatch (e.g. a blog post competing in a SERP that rewards product or comparison pages) can rescue a previously-buried high-value page without writing more content.

## End-to-end

1. Fetch the target URL via `scripts/fetch_page.py` (SSRF-safe); parse with `scripts/parse_html.py` for title, H1, meta, headings, schema, CTAs.
2. Auto-detect the primary keyword from title+H1 overlap if not supplied.
3. Run the SERP Backwards Analysis: search Google (WebSearch or DataForSEO `google_organic_serp`); for the top 10 record URL, authority tier, page type, format, word count, schema, plus SERP features.
4. Calculate SERP consensus: dominant page type (>60% strong, 40–60% mixed, <40% fragmented), expected depth, schema, media.
5. Detect page-type mismatch with a severity ladder — e.g. `Blog Post vs Product Pages = CRITICAL → create dedicated product page`; `Blog Post vs Comparison = HIGH → restructure as comparison with matrix`.
6. Derive 3–5 user stories from SERP signals using the verbatim template.
7. Run the 7-dimension Gap Analysis and persona scoring (sort weakest persona first).
8. Output the SERP landscape table, page-type verdict (ALIGNED or MISMATCH+severity), user stories, gap table, persona cards, and priority actions — fix mismatch first.

## Prompts

```
`User story template:
As a [persona derived from signal],
I want to [goal derived from query intent],
because [emotional driver from ad copy / PAA tone],
but I'm blocked by [barrier derived from PAA questions / related searches].
`
```

## Gotchas

## DataForSEO calls require cost confirmation before every call — do not let the agent fan out SERP queries unchecked. Wireframe placeholders must be ultra-concrete (named CTAs, named selectors), never "add a CTA here"; vague annotations defeat the purpose. JS-rendered pages can only be analyzed on their available static HTML — note the limitation rather than trusting an incomplete parse.

## Tools

- Claude Code with the SEO plugin installed: `/plugin marketplace add AgriciDaniel/claude-seo`
- WebSearch (fallback) or DataForSEO MCP (`google_organic_serp`, `keyword_data`)
- Internal helpers `scripts/fetch_page.py`, `scripts/parse_html.py`
