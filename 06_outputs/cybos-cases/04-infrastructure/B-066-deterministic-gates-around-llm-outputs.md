---
id: B-066
tier: B
category: "Infrastructure"
kind: pattern
title: "Deterministic gates around LLM outputs"
subtitle: "\"Stood out\", \"resonated\", em-dashes — LLMs ship them despite prompt instructions. A regex gate auto-rejects and retries with errors appended."
source: https://www.cybos.ai/cases/B-066
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · content lead · any team shipping LLM-generated text to customers"
type: case
version: v0.1
---
# Deterministic gates around LLM outputs

> "Stood out", "resonated", em-dashes — LLMs ship them despite prompt instructions. A regex gate auto-rejects and retries with errors appended.

## What

Treat the LLM as fast/cheap but unreliable; wrap every customer-facing output in deterministic checks that the LLM cannot bypass. Examples from a founder-discovery CLI:

- **Banned-word regex** on outreach drafts: `stood out, caught my eye, would love to, resonated, journey, thesis, at the intersection, game-changing, paradigm shift, fascinating, compelling, aligns with` — auto-reject and retry once with errors appended to prompt.
- **Punctuation rules**: no em-dashes, no semicolons, no placeholder `[name]/{role}/<x>`.
- **Length bounds**: 80–800 chars; outside range → reject.
- **Hook specificity score** ≥ 6/10 on extraction; below threshold → reject the hook and re-pick.
- **JSON-parse retry on L3 fail**: explicit one-shot "produce JSON only, no tools" prompt.

## Why it matters

LLM outputs drift, hallucinate, and exhibit "AI-tells" the moment scale increases. Deterministic gates catch the failure modes the LLM itself can't see. A founder-discovery CLI ships zero "stood out" emails because the regex blocks them; the model gets a second try with the violation pasted into context and usually fixes it.

## End-to-end

1. **Audit a week's worth of LLM output** for recurring failure patterns. Banned phrases? Missing required fields? Wrong format? Out-of-range numbers?
2. **For each pattern, write the cheapest deterministic check.** Regex, length, type-check, range-check, JSON-parse.
3. **Wire gates as a function** that takes the LLM output and returns `(ok, errors)`.
4. **On fail, do one retry** with the errors appended to the prompt ("you returned X, but rule Y forbids it; rewrite").
5. **After 2 fails, surface to a human** — never ship an unchecked output.
6. **Keep a `gates.log`** of every fail/retry; review weekly to add new gates as new failure modes appear.

## Gotchas

- LLM-based validation ("ask another LLM if this is good") is tempting but unreliable for the same reasons the first LLM was. Use deterministic checks for the hard parts; reserve LLM judgement for fuzzy fact-checking (advisory only, never blocking).

## Tools

- Whatever language your wrapper is in (Python is the norm)
- A regex library, a JSON parser, basic type checks
