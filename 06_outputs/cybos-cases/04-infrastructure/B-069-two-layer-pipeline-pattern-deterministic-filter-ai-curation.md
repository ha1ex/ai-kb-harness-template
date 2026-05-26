---
id: B-069
tier: B
category: "Infrastructure"
kind: pattern
title: "Two-layer pipeline pattern (deterministic filter → AI curation)"
subtitle: "Pure-LLM curation over 2,000 items burns budget and produces noise. Deterministic filter first; LLM judgement only on a qualified small pool."
source: https://www.cybos.ai/cases/B-069
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "engineer · sourcing lead · anyone running curation at scale"
type: case
version: v0.1
---
# Two-layer pipeline pattern (deterministic filter → AI curation)

> Pure-LLM curation over 2,000 items burns budget and produces noise. Deterministic filter first; LLM judgement only on a qualified small pool.

## What

A general pattern for any list-curation problem: first layer is deterministic and cheap (rules, regex, threshold checks); second layer is LLM-driven and expensive (per-item judgement). Run Layer 1 over the full input to slash the candidate pool by 40–80%; Layer 2 spends its judgement budget only on items that already passed a hard signal test. Used in a founder-discovery CLI for network-outreach curation: 2,064 raw dialogs → 409 active → 253 passed Layer 1 → ~70 in the final outreach list.

## Why it matters

Pure-LLM curation over 2,000 items burns budget and produces inconsistent results because the model sees too much noise. Pure-deterministic filtering misses signal that only judgement can catch. Two layers compose: the deterministic stage operates on cheap, measurable inputs (message counts, freshness, basic field presence); the LLM stage operates on a small qualified pool where the marginal cost of careful judgement is justified.

## End-to-end

1. **Identify your Layer-1 signals**: things that are cheap to compute and have non-zero correlation with "this is worth Layer 2." Examples: minimum activity threshold, recency window, presence of required fields, non-spam keyword check.
2. **Use OR logic when shape matters more than volume.** A single intense day (10+ messages in one day) is real signal; sparse multi-day exchanges (≥2 days with ≥1 message) are also real signal. Both pass; one-shot cold pitches fail.
3. **Make thresholds CLI-tunable** (`--min-msgs 10 --min-days 2`) so you can calibrate without changing code.
4. **Layer 2 reads the qualified-only artifact** (a compact, human-and-LLM-readable text file with one entry per item, structured headers).
5. **Layer 2 batches with check-ins.** For >100 qualified items, work in batches of ~40; summarize counts and surprises between batches to the user.
6. **Write outputs to two CSVs** — `include.csv` and `exclude.csv` (with `Reason` column). Asymmetric error cost: false positives in include are worse than false negatives, so when in doubt, exclude with a reason — humans promote back faster than they un-send.

## Gotchas

- Switching from OR to AND in Layer 1 silently drops most real signals. The OR logic is load-bearing; document why.

## Tools

- Cheap deterministic-filter code (Python, bash)
- An LLM with sufficient context to read the qualified pool
- A compact text format for Layer 2 input
