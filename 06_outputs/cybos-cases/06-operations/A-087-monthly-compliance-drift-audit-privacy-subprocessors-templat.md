---
id: A-087
tier: A
category: "Operations"
kind: workflow
title: "Monthly compliance-drift audit — privacy, subprocessors, template freshness"
subtitle: "Problem solved: Privacy-policy drift, undisclosed subprocessors, and stale contract templates create silent regulatory exposure that surfaces only under a customer security review or a regulator inquiry — usually at the worst possible moment."
source: https://www.cybos.ai/cases/A-087
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "founder · ops/legal lead · compliance officer"
type: case
version: v0.1
---
# Monthly compliance-drift audit — privacy, subprocessors, template freshness

> Problem solved: Privacy-policy drift, undisclosed subprocessors, and stale contract templates create silent regulatory exposure that surfaces only under a customer security review or a regulator inquiry — usually at the worst possible moment.

## What

One skill with three scopes selected in plain English. `privacy-posture`: scrape your landing page and product surfaces, diff observed reality against the deployed privacy policy, flag drift (undisclosed analytics tool, new subprocessor, new cookie, purpose drift) with severity and an authority citation. `subprocessors`: walk connected integrations plus vendors inferred from the page scrape, capture role / data categories / transfer mechanism / DPA status, maintain a `subprocessor-inventory.json` baseline, and emit a delta (added/removed/changed/unchanged). `template-library`: read your template inventory, flag anything over 12 months old, check each against current law, and recommend a refresh plan. It surfaces diffs only — it never auto-fixes.

## Why it matters

The class of failure this catches is invisible by definition: you add an analytics vendor or ship a new landing page, your privacy policy quietly falls out of sync, and nobody notices until a customer's security questionnaire or a regulator asks. Running this on a monthly cadence converts that latent exposure into a dated, severity-ranked, citation-backed diff you can act on before it costs you a deal or a fine. Every `critical` finding is forced to cite a specific authority (GDPR Art. 13/14, CCPA §1798.100, 16 CFR Part 314), so the output is defensible rather than hand-wavy.

## End-to-end

1. **Install and bootstrap context.** `git clone https://github.com/gethouston/houston.git && cd houston && pnpm install && cd app && pnpm tauri dev`. Load the company context ledger (entity, risk posture, template stack) and legal-context file. Per scope, required fields are gated: privacy-posture and subprocessors need the company website; privacy-posture also needs the deployed privacy-policy URL; template-library needs the template inventory. A missing required field triggers exactly one targeted question with a modality hint, then continues.
2. **Discover tools at runtime.** Search for a web-scrape integration (privacy-posture, subprocessors) or a document-storage integration (template-library). If none is connected, name the category to link and stop — tool names are never hardcoded.
3. **Branch on `scope` — privacy-posture:** scrape the landing URL plus key product routes; capture analytics tags, cookies, forms and fields, third-party embeds, subprocessor-revealing scripts (Stripe, Intercom, Segment, HotJar, etc.). Fetch the deployed privacy policy and diff: tools observed on site but not in policy, data categories collected but not disclosed, new cookie categories, purpose drift. Tag each finding `critical` / `high` / `medium` / `low`. Cite authority for every `critical`. Write a dated `privacy-audits/{YYYY-MM-DD}.md` (executive summary → diffs by severity → recommended next step per finding).
4. **Branch — subprocessors:** read the current `subprocessor-inventory.json`, walk connected integrations (each tool touching customer data is a candidate subprocessor), capture role / dataCategories / transferMechanism / dpaStatus / publicDpaUrl per candidate, read-merge-write the inventory (never overwrite), compute the delta vs prior, and write a dated one-page review with "new vendors needing policy update" at the top.
5. **Branch — template-library:** flag every template older than 12 months, enumerate current-law changes to consider per stale template (AI-training disclosure, SCC version check, 2026 DPA standards, CCPA cure-period language, EU AI Act disclosures), rank by exposure (customer paper > vendor paper > internal), and write a refresh plan. Never auto-rewrites — recommends a follow-up drafting pass.
6. **Append to the output ledger** atomically with `attorneyReviewRequired: true` whenever a critical finding implicates regulatory exposure.
7. **Summarize to the user** in one short paragraph: the top two findings plus the single most useful next move.

## Prompts

Hard guardrails the skill enforces on itself (verbatim):

```
`What I never do:
- Auto-fix anything. Skill surfaces diffs + recommends follow-ups; founder decides.
- Invent subprocessor, data flow, or cookie not observed in scrape or connected integration. Missing data → UNKNOWN.
- Claim policy GDPR-compliant. Can say "policy discloses X, does not disclose Y" — never "you're covered."
- Hardcode tool names — Composio discovery at runtime only.
- Overwrite `subprocessor-inventory.json` — read-merge-write.
- Skip authority citation on any `critical` privacy-posture finding.
`
```

Per-candidate subprocessor capture schema (verbatim):

```
`role (payment / email / analytics / support / hosting / AI / CRM / other)
dataCategories (identifiers / usage / content / payment / sensitive)
transferMechanism (SCCs / UK IDTA / DPF / intra-EU / intra-US-only / unknown)
dpaStatus (signed standard / signed negotiated / public-posted / missing / unknown)
publicDpaUrl
`
```

## Gotchas

- **Never claims "GDPR-compliant."** The only honest output is "policy discloses X, does not disclose Y." Telling a founder they're "covered" is the exact failure mode this skill is built to avoid.
- **Missing data is UNKNOWN, never inferred.** The skill will not invent a subprocessor, data flow, or cookie it didn't observe in a scrape or connected integration.
- **Read-merge-write the subprocessor inventory.** Overwriting `subprocessor-inventory.json` destroys the baseline that makes the monthly delta meaningful.
- **Diffs not fixes.** The skill never auto-rewrites a policy or template; it surfaces the gap and recommends the follow-up. A founder must own the actual change.
- **Authority citation is mandatory on every `critical`.** An uncited critical finding is treated as incomplete output.

<hr/>

## Tools

- A SKILL.md-capable desktop agent (Tauri-based) — runs the three-scope skill
- A web-scrape integration (e.g. Firecrawl) — privacy-posture and subprocessor discovery
- A document-storage integration (e.g. Google Drive) — template-library scope
- Composio MCP — runtime tool discovery and integration walking
- Install: `git clone https://github.com/gethouston/houston.git && cd houston && pnpm install && cd app && pnpm tauri dev`
