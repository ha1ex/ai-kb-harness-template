---
id: A-081
tier: A
category: "Marketing & content"
kind: workflow
title: "GEO content optimizer — rewriting for AI-engine citations"
subtitle: "Problem solved: AI answer engines (ChatGPT, Perplexity, AI Overviews, Gemini) cannibalize clicks; a rewrite playbook makes the page the source those engines cite, with before/after scoring and a 4-phase recovery plan for queries already losing traffic."
source: https://www.cybos.ai/cases/A-081
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "content marketer · growth lead · SEO lead · founder losing traffic to AI answers"
type: case
version: v0.1
---
# GEO content optimizer — rewriting for AI-engine citations

> Problem solved: AI answer engines (ChatGPT, Perplexity, AI Overviews, Gemini) cannibalize clicks; a rewrite playbook makes the page the source those engines cite, with before/after scoring and a 4-phase recovery plan for queries already losing traffic.

## What

A Claude Code skill triggered by phrases like *"optimize for AI"*, *"get cited by ChatGPT"*, *"GEO optimization"*, or *"AI Overview is eating clicks"*. Takes existing content (URL or pasted text) and rewrites it for citation by AI answer engines. The rewrite adds **standalone 25–50-word definitions**, **sourced quotable statements**, expert / source signals, **Q&A blocks + tables + lists**, specific data points with dates and sources, and **visible-content-matching FAQ schema** (so the schema is grounded in what's actually on the page, not hallucinated boilerplate). Output is a rewritten page plus a before/after GEO score, AI Query Coverage list, and a Pass/Warn/Fail self-check on 14 quality items. A separate **4-phase AI Overview Recovery playbook** — measure → diagnose → rewrite → monitor — handles the scenario where AI Overviews are already cannibalizing clicks on specific head queries.

## Why it matters

Generative Engine Optimization is a different discipline from classical SEO and requires explicit work the search-rank playbook doesn't cover. A page that ranks #1 on Google can still be ignored by ChatGPT and Perplexity because it lacks the citation signals AI engines look for — standalone definitions, dated facts, structured Q&A, source attribution per claim. The skill encodes those signals into a 5-step rewrite + a 14-item self-check, so the operator can convert an existing top-of-funnel page from "decent SEO" to "the source AI cites" in one pass. For pages already losing clicks to AI Overviews, the recovery playbook is the operationally useful half — it identifies which queries lost clicks, diagnoses why AI Overview can answer without the page, and rewrites the page to make AI need to cite it.

## End-to-end

1. **Trigger and scope the rewrite.** Phrasing: *"Optimize this content for GEO/AI citations: [URL or text]"* or *"AI Overview is eating clicks on 12 head queries — build a recovery plan"*. Argument hint: `<content URL or text> [target AI engine]`.
2. **Step 1 — Load GEO-first targets.** Prioritize the 6 highest-impact quality items: clarity of standalone definitions (**C02**), factual density with sources (**C09**), structured Q&A / tables / lists (**O03**), visible-content-matching FAQ schema (**O05**), explicit expert / author signals (**E01**), and information organization for AI extraction (**O02**). Add engine-specific preferences for the target AI engine.
3. **Step 2 — Score the current content.** Score the input on clear definitions, quotable statements, factual density, source citations, Q&A format, authority signals, freshness, and structure clarity. This produces the "before" GEO score.
4. **Step 3 — Apply GEO techniques.** Insert standalone 25–50-word definitions for every key term. Add sourced quotable statements (a short claim + a citation). Add expert / source signals. Restructure into Q&A blocks + tables + lists where appropriate. Add specific data points with dates. Add FAQ schema that mirrors visible content (not boilerplate).
5. **Step 4 — Emit the GEO output.** Report Changes Made (specific edits, not summaries), before/after GEO score, and **AI Query Coverage** (which queries the rewritten page can now plausibly be cited on).
6. **Step 5 — Run the 14-item self-check.** Pass/Warn/Fail on C02, C04, C09, O02, O03, O05, O06, R01, R02, R04, R07, E01, Exp10, Ept08. Any Fail → loop back to Step 3 for that item before publish.
7. **Entity check for branded content.** Before optimizing branded pages, consult `memory/entities/<slug>.md` (the canonical entity profile). If missing or >90 days stale → declare `DONE_WITH_CONCERNS` and recommend running the upstream `entity-optimizer` skill first.
8. **AI Overview Recovery playbook (separate mode).** When invoked for click-recovery: Phase 1 — **Measure** which queries lost clicks (Search Console + AI mention monitoring); Phase 2 — **Diagnose** why AI Overview answers without needing the page (missing definition? missing data? missing source attribution?); Phase 3 — **Rewrite** to be the source AI cites; Phase 4 — **Monitor** citation appearance and click recovery over 30–60 days.

## Prompts

Trigger phrasings (verbatim from skill):

```
`Optimize this content for GEO/AI citations: [content or URL]
Make this article more likely to be cited by AI systems
Write content about [topic] optimized for both SEO and GEO
Audit this content for GEO readiness and suggest improvements
AI Overview is eating clicks on 12 head queries — build a recovery plan
`
```

5-step workflow (verbatim):

```
`1. Load CORE-EEAT GEO-First Targets — prioritize C02, C09, O03, O05, E01, O02
 plus engine-specific preferences.
2. Analyze Current Content — score clear definitions, quotable statements, factual
 density, source citations, Q&A format, authority signals, freshness, structure clarity.
3. Apply GEO Techniques — add standalone 25-50 word definitions, sourced quotable
 statements, expert/source signals, Q&A/tables/lists, specific data,
 visible-content-matching FAQ schema.
4. Generate GEO Output — report Changes Made, before/after GEO score, AI Query Coverage.
5. CORE-EEAT GEO Self-Check — verify C02, C04, C09, O02, O03, O05, O06, R01, R02,
 R04, R07, E01, Exp10, Ept08 with Pass/Warn/Fail.
`
```

Worked example (verbatim from skill):

```
`User: "Optimize this paragraph for GEO: 'Email marketing is a good way to reach
customers. It's been around for a while and many businesses use it.'"

Output adds: a clear standalone definition, dated/source-backed facts, structured list,
quotable statements, and a before/after GEO score.
`
```

Install (verbatim — keep author path runnable):

```
`/plugin marketplace add aaron-he-zhu/seo-geo-claude-skills
`
```

## Gotchas

- **Treating GEO as a sub-task of SEO.** It isn't. SEO optimizes for rank in a result list; GEO optimizes for being the source an AI engine cites. The signals differ (standalone definitions, FAQ schema matching visible content, dated facts with sources). Run both, don't conflate.
- **Hallucinated FAQ schema.** A common failure mode is generating FAQ schema that doesn't appear on the rendered page. AI engines and Google both penalize this. Schema must mirror visible content — that's why the skill puts visible-content-matching as a separate quality item.
- **Stale entity profile.** For branded content, the skill correctly refuses to optimize confidently when `memory/entities/<slug>.md` is missing or >90 days stale. Don't override the `DONE_WITH_CONCERNS` flag — re-run the entity-optimizer first.
- **Measure-without-monitor.** The Recovery playbook's monitor phase (30–60 days of citation tracking) is the half operators skip. Without it, you can't tell whether the rewrite worked or the AI engine's ranking just shifted.

<hr/>

## Tools

- Claude Code with the plugin marketplace enabled (skill license: Apache-2.0).
- Optional connectors: an AI-citation monitor (tracks citation appearance over time), an SEO tool for rank / traffic data feeding the Recovery playbook's Measure phase.
- Bundled reference files: `references/ai-overview-recovery.md` (4-phase playbook), `references/ai-citation-patterns.md` (how Google AI Overviews / ChatGPT / Perplexity / Claude select sources), `references/quotable-content-examples.md` (before/after examples).
- Upstream dependency for branded content: an entity-profile skill that populates `memory/entities/<slug>.md`. Without it, the GEO optimizer self-declares `DONE_WITH_CONCERNS`.
