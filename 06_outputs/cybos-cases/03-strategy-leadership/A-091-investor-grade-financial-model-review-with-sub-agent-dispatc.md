---
id: A-091
tier: A
category: "Strategy & leadership"
kind: workflow
title: "Investor-grade financial-model review with sub-agent dispatch"
subtitle: "Problem solved: Founders pitch with models that fail investor scrutiny; a 46-criteria automated review replaces a paid CFO-advisor pass and emits a stage-appropriate diagnostic report plus an interactive HTML explorer."
source: https://www.cybos.ai/cases/A-091
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "XL · Half-year+"
for: "founder preparing a fundraise · CFO/finance lead building an investor deck · VC running diligence"
type: case
version: v0.1
---
# Investor-grade financial-model review with sub-agent dispatch

> Problem solved: Founders pitch with models that fail investor scrutiny; a 46-criteria automated review replaces a paid CFO-advisor pass and emits a stage-appropriate diagnostic report plus an interactive HTML explorer.

## What

The most engineered skill in source-16: a production-grade finance review pipeline that ingests a founder's model (Excel / CSV / Sheets / PDF), extracts it into a canonical `inputs.json`, validates it with anti-hallucination cross-checks, scores **46 criteria across 7 categories** with profile-based auto-gating by stage and geography, computes **11 unit-economics metrics** against benchmarks, runs multi-scenario runway stress-tests, and composes a `report.md` plus an interactive HTML report and explorer. It uses a two-context sub-agent dispatch model — **Context A** for analytical work (extraction review, checklist, unit economics, runway scenarios) and **Context B** for coaching commentary — and runs in both a CLI agent and a restricted-tool sandbox. It imports from sibling skills (market-sizing, deck-review) and exports structured results to downstream skills (IC-simulation, fundraise-readiness, diligence-readiness, metrics-benchmarker), all referenced by function.

## Why it matters

The reusable IP here is not the finance content — it is the **anti-hallucination architecture** for any multi-step agent pipeline that must not invent numbers:

- A hard **STOP GATE**: after extraction, `validate_inputs.py --fix` then `validate_extraction.py` cross-reference the raw model against the parsed inputs; the pipeline does not proceed until `valid == true && has_critical_warnings == false`.
- **STALE_ARTIFACT run_id matching**: every producer artifact is stamped with a `RUN_ID`; `compose_report.py --strict` refuses to assemble a report if run_ids don't match across artifacts — this catches the classic "report built from a mix of old and new partial runs" bug.
- **Context-pressure mitigations**: the coaching sub-agent reads a slim `coaching_payload` extracted from `report.json`, *not* the full `report.md`, to avoid 80–130K of context accumulation.
- **Tolerant JSON extraction**: sub-agent replies are parsed by stripping code fences then brace-aware `raw_decode`, with a re-prompt fallback — robust to LLMs wrapping JSON in prose.

The business outcome: it replaces a paid CFO-advisor pass with a stage-appropriate readiness review, and the 46-item checklist gives the founder a concrete "fix this before pitching" list with evidence citing specific values from their own model.

## End-to-end

1. **Path setup (Step 0).** Resolve the plugin root and an artifacts root (mounted workspace or `./artifacts`); set `REVIEW_DIR` and `RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)`; clean prior artifacts. Every Bash call runs in a fresh shell — prefix every call with the path block (variables do not persist).
2. **Founder context (Step 1).** Read or create company context (name, stage [pre-seed / seed / series-a / series-b / later], sector, geography); batch-ask for current cash balance + date and monthly burn — the #1 cause of incomplete runway analysis.
3. **Extract model (Step 2).** Run `extract_model.py` on the model in the main thread to produce `model_data.json` (40–60 KB). Check `periodicity_summary`; divide flow metrics by 3 (quarterly) or 12 (annual). Do **not** convert stock metrics (cash balance, headcount, ARR).
4. **Inputs-review dispatch (Step 3, Context A).** Task-dispatch a sub-agent to read `model_data.json` plus the input-schema / extraction-pitfalls / data-sufficiency references and return a corrected `inputs.json` with a `changes[]` list. Apply the ARPU sanity check (if `arpu_monthly` > total MRR it is aggregate revenue, not per-customer — divide by customer count), scale-denomination, payroll-aggregation, and collections-vs-revenue checks.
5. **Validate — STOP GATE (Step 3.5).** `validate_inputs.py --fix`, then `validate_extraction.py` to cross-reference. Do not proceed until `valid == true && has_critical_warnings == false`. Generate `review.html` for the founder to inspect and submit corrections; apply via `apply_corrections.py`.
6. **Parallel analysis dispatch (Steps 4–6).** In a *single* assistant message, Task-dispatch the CHECKLIST + UNIT_ECONOMICS + RUNWAY_SCENARIOS sub-agents (parallel dispatch is mandatory — all Task calls in one response). CHECKLIST scores the 46 items (STRUCT_01–09, UNIT_10–19, CASH_20–32, METRIC_33–35, SCENARIO_36–38, BRIDGE_37–38, SECTOR_39–44, OVERALL_45–46) with mandatory evidence; UNIT_ECONOMICS computes 11 metrics; RUNWAY_SCENARIOS runs the stress-test. Each returns JSON piped through its producer script (`checklist.py`, `unit_economics.py`, `runway.py`).
7. **Compose + verify (Step 7).** `compose_report.py --strict` writes deterministic `report.json` and `report.md`; the STALE_ARTIFACT high-severity warning blocks under `--strict` if run_ids don't match. Verification Gate 1: `verify_review.py --gate 1` must exit 0. Optionally produce `report.html` and `explore.html`.
8. **Coaching + final gate (Step 8c–8d, Context B).** Task-dispatch the coaching sub-agent with the inlined `coaching_payload` from `report.json` (not the full report.md); it does a Grep idempotency check, composes commentary from failed/warned items, makes a single Edit via a per-run UUID insertion marker, Grep-verifies all four producer artifacts' run_ids match, and returns a success payload. Clean `.staging`. Verification Gate 2: `verify_review.py --pretty` — if exit 0, present the `report.md` / `report.html` / `explore.html` *file paths* (do not inline markdown). Scoring: `score_pct = (pass + 0.5*warn) / (total - not_applicable) * 100`; bands strong ≥ 85%, solid ≥ 70%, needs_work ≥ 50%, major_revision < 50%.

## Prompts

Context A inputs-review dispatch prompt, verbatim:

```
`CONTEXT: INPUTS_REVIEW
REVIEW_DIR: <absolute path to REVIEW_DIR>
RUN_ID: <RUN_ID>

You are the financial-model-review agent dispatched in Context A (INPUTS_REVIEW).
Read model_data.json at <REVIEW_DIR>/model_data.json (the full extraction output).
Also read:
 - ${CLAUDE_PLUGIN_ROOT}/skills/financial-model-review/references/schema-inputs.md
 - ${CLAUDE_PLUGIN_ROOT}/skills/financial-model-review/references/extraction-pitfalls.md
 - ${CLAUDE_PLUGIN_ROOT}/skills/financial-model-review/references/data-sufficiency.md

Construct a complete, valid inputs.json from the extracted data. Apply all
extraction pitfall checks (scale denomination, ARPU sanity, periodicity
conversion, company name sourcing, payroll aggregation, collections vs revenue).
`
```

Tolerant JSON extraction protocol, verbatim:

```
`Tolerant JSON extraction protocol:
1. If the message is wrapped in a ```json... ``` (or plain ```... ```) fence, strip the fence first.
2. Try to parse the stripped text directly as JSON.
3. If that fails, walk through the text looking for the first `{` character and try
 `json.JSONDecoder().raw_decode(text[i:])` — brace-aware, handles nested objects
 correctly (unlike regex, which truncates on the first `}`).
4. If extraction fails entirely, re-prompt: "Your previous reply could not be parsed
 as JSON. Return ONLY the JSON object — no markdown fences, no prose preamble."
`
```

Scoring formula, verbatim:

```
`score_pct = (pass + 0.5 * warn) / (total - not_applicable) * 100
Overall: "strong" (>=85%), "solid" (>=70%), "needs_work" (>=50%), "major_revision" (<50%)
`
```

## Gotchas

- **Fresh shell per Bash call.** Variables don't persist between calls — every Bash invocation must re-emit the path block or the pipeline silently writes to the wrong directory.
- **Never run sub-agents in a worktree isolation mode.** Files written in a worktree won't appear in `$REVIEW_DIR`, so downstream steps see nothing and the report composes empty.
- **Parallel dispatch is mandatory for the analysis step.** The three analysis sub-agents must be Task-dispatched in one assistant response; sequential dispatch breaks the pipeline's expectations and inflates context.
- **The coaching sub-agent must read the slim payload, not the full report.** Reading the full `report.md` into Context B accumulates 80–130K of context and degrades the coaching output.
- **STALE_ARTIFACT is a feature, not noise.** If run_ids don't match across artifacts under `--strict`, stop and re-run from extraction — do not override; it means the report would mix runs.

<hr/>

## Tools

- A CLI agent or a restricted-tool sandbox; Python 3.10+ with `uv`; `openpyxl` for Excel parsing; `reportlab` for PDF output
- Install: `claude plugin marketplace add lool-ventures/founder-skills && claude plugin install founder-skills@lool-founder-skills`
- Scripts shipped: `extract_model.py`, `validate_extraction.py`, `validate_inputs.py`, `checklist.py`, `unit_economics.py`, `runway.py`, `compose_report.py`, `apply_corrections.py`, `verify_review.py`, `visualize.py`, `explore.py`, `review_inputs.py`
- References shipped: 46-criteria checklist, input schema, artifact schemas, data-sufficiency, extraction-pitfalls, plus shared stage-expectations / benchmarks / revenue-model-types / common-mistakes; a stage/geography profile gates which criteria apply
- Uses the agent's `Task` tool for sub-agent dispatch and a batched-question tool for founder context
