---
id: B-182
tier: B
category: "Marketing & content"
kind: framework
title: "Programmatic SEO page factory with thin-content guardrails"
subtitle: "Problem solved: Programmatic SEO defaults to thin city-swap pages and gets penalized; a 12-playbook selector plus data-source mapping and CMS provisioning enforces quality over quantity."
source: https://www.cybos.ai/cases/B-182
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "marketing operator · growth engineer · SEO lead"
type: case
version: v0.1
---
# Programmatic SEO page factory with thin-content guardrails

> Problem solved: Programmatic SEO defaults to thin city-swap pages and gets penalized; a 12-playbook selector plus data-source mapping and CMS provisioning enforces quality over quantity.

## What

A skill that designs and provisions programmatic-SEO page systems at scale: it chooses one of 12 page playbooks (Templates / Curation / Conversions / Comparisons / Examples / Locations / Personas / Integrations / Glossary / Translations / Directory / Profiles), creates the matching CMS collection in Webflow via MCP, populates sample or imported data, and produces a binding guide for the Webflow Designer template page — with a pre-launch quality checklist and post-launch monitoring built in.

## Why it matters

Programmatic SEO is usually a vibes-based exercise that generates thousands of thin city-swap pages and earns a manual penalty. The 12-playbook taxonomy plus a data-source → playbook selector turns it into a structured decision keyed on the explicit principle "Better 100 great pages than 10,000 thin ones" — codifying the difference between a defensible page system and one that gets de-indexed.

## End-to-end

1. **Discovery.** Check for `.claude/product-marketing-context.md`; confirm business context, opportunity assessment (search patterns, page-count potential), and competitive landscape (can you realistically compete).
2. **Strategy & playbook selection.** Apply the core principles (unique value per page; proprietary data > UGC > licensed > public; subfolders not subdomains; search-intent match; quality over quantity) and map data assets to a playbook via the selector table (proprietary data → Directory/Profiles; integrations → Integrations; local presence → Locations; competitor landscape → Comparisons).
3. **Webflow CMS setup.** Use Webflow MCP tools (`data_sites_tool > list_sites`, `data_cms_tool`) to create the playbook-specific collection with its recommended schema (Locations needs City/State/Hero Image/Local Description/Meta Title+Desc; Comparisons needs Product A/B Names/Winner/Feature Comparison/Meta).
4. **Data population.** Offer three options: generate 3–5 realistic sample entries, bulk import (CSV/JSON/structured), or user-adds-manually-later.
5. **Template page guidance.** CMS template pages can't be created via API — provide step-by-step Webflow Designer instructions: bind Hero H1 to Name/Title, Rich Text to main content, SEO Title to Meta Title, OG Image to Hero Image; add a filtered Collection List at the bottom for internal linking (same category, limit 3–6, exclude current item).
6. **Pre-launch checklist.** Unique value per page, intent answered, unique titles/meta, proper H1, schema markup, page speed, connected to site architecture, no orphans, in XML sitemap, no conflicting noindex.
7. **Post-launch monitoring.** Indexation rate, rankings, traffic, engagement, conversion; watch for thin-content warnings, ranking drops, manual actions, crawl errors.

## Prompts

```
`Core Principles
1. Unique Value Per Page - Every page must provide value specific to that page
2. Proprietary Data Wins - First-party data > User-generated > Licensed > Public
3. Clean URL Structure - Always use subfolders, not subdomains
4. Search Intent Match - Pages must answer what people are searching for
5. Quality Over Quantity - Better 100 great pages than 10,000 thin ones
`
```

## Gotchas

## CMS template pages cannot be created via the Webflow API — that step is unavoidably manual in the Designer, so the workflow is not fully headless and budget time for it. The named anti-patterns are concrete: thin content (city-swap only), keyword cannibalization, over-generation without demand, poor data quality. Generating before you have a real proprietary data source is the fast path to a penalty.

## Tools

- Claude Code with the skill installed; Webflow MCP server connected (`data_sites_tool`, `data_cms_tool`); a Webflow account + site
- Install: `/plugin marketplace add naveedharri/benai-skills && /plugin install marketing@benai-skills`
- Note: repo default branch is `develop`, not `main` — matters if cloning manually
