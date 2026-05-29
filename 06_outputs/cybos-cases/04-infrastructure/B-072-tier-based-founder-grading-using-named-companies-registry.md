---
id: B-072
tier: B
category: "Infrastructure"
kind: workflow
title: "Tier-based founder grading using named-companies registry"
subtitle: "Same candidate scores GO Monday and PASS Tuesday — fuzzy criteria roulette. A named registry turns the judgement into a deterministic lookup."
source: https://www.cybos.ai/cases/B-072
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "sourcing lead · recruiter · sales-ops · founder"
type: case
version: v0.1
---
# Tier-based founder grading using named-companies registry

> Same candidate scores GO Monday and PASS Tuesday — fuzzy criteria roulette. A named registry turns the judgement into a deterministic lookup.

## What

Instead of asking the LLM to assess "founder quality" or "candidate quality" or "lead quality" abstractly, inject a named registry of ~120 companies grouped by vertical into the prompt. The model is told: "Early employees from these companies are Tier 2 (auto-GO)." The model then matches employer strings in the candidate's bio against the named list. Converts a vague judgement into a deterministic lookup.

## Why it matters

"LLM-roulette" — where the same kind of candidate gets GO on Monday and PASS on Tuesday — comes from asking the model to apply fuzzy criteria. A named registry of "fast-growing companies" makes grading consistent across runs and across teammates. The same pattern works for recruiting ("ex-FAANG + ≥1 year"), sales scoring ("current employee at one of our top 20 prospect accounts"), or content curation ("authored at <accepted-publication>").

## End-to-end

1. **Build a JSON file** with `{tier_n: {criteria: [...]}, named_companies: {vertical: [Co1, Co2,...]}}`. Group by vertical (fintech, AI, robotics, etc.).
2. **Inject the relevant vertical slice into the LLM prompt** every call. Don't dump the whole registry; pick by signal.
3. **The LLM matches employer strings** in the candidate's bio / LinkedIn / signal text against the registry.
4. **Refresh the registry quarterly** — ~30 min of curation. Add companies that became hot; demote ones that flatlined.
5. **Layer with an enrichment step** (LinkedIn / Crunchbase / Harmonic) to fill bios that don't name the employer — registry matches only what's in text.
6. **Audit consistency**: run the same 50 candidates through twice; mismatch rate should drop below 5%.

## Gotchas

- Registry drift is the failure mode — companies that were hot two years ago aren't anymore. Set a calendar reminder; assign an owner.

## Tools

- A JSON / YAML registry file
- An enrichment data source for candidate bios
- A weekly or monthly review cadence
