---
id: A-088
tier: A
category: "Operations"
kind: pattern
title: "Five-parallel-subagent review with a weighted safety score"
subtitle: "Problem solved: Operators want a single 0–100 decision score on inbound documents that aggregates several independent expert reviews into one ranked, actionable artifact — instead of one shallow pass or an unaffordable expert."
source: https://www.cybos.ai/cases/A-088
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "founder · ops lead · anyone running diligence/review at volume"
type: case
version: v0.1
---
# Five-parallel-subagent review with a weighted safety score

> Problem solved: Operators want a single 0–100 decision score on inbound documents that aggregates several independent expert reviews into one ranked, actionable artifact — instead of one shallow pass or an unaffordable expert.

## What

This is a **reusable orchestration pattern**: fan out N parallel domain-expert sub-agents over the same input, have each return a 0–100 score in a fixed format, then aggregate into one weighted score on a graded rubric and emit a single decision artifact. The worked example here is contract review — five sub-agents (Clause Analysis 20%, Risk Assessment 25%, Compliance Check 20%, Terms & Obligations 15%, Recommendations 20%) reviewing a contract in parallel, aggregated into a 0–100 Contract Safety Score on a 6-tier A+/A/B/C/D/F rubric. The same shape generalizes directly to vendor due diligence, security review, hiring scorecards, and investment screening — any decision where multiple specialist lenses should collapse into one number plus ranked actions. Cross-link: this pattern productized as a domain-specific skill is **B-084** (multi-model council); see also.

## Why it matters

A single agent reviewing a contract end-to-end blends concerns and produces a vague "looks mostly fine." Five specialists scoring in parallel against fixed weights produce a defensible number, a clause-by-clause traffic-light breakdown, and a ranked negotiation list — turning a $1,500–3,000 expert review into a sub-60-second pass that a non-expert can act on. The reusable value is the pattern: any team that today routes a document through a content → specialist → reviewer chain can replace it with one weighted fan-out.

## End-to-end

1. **Phase 1 — sequential ingestion.** Read the file / paste / fetch the URL → store the full text. Do not proceed without it (handle unreadable input explicitly).
2. **Classify the input type** against a fixed classifier table so downstream agents focus on the right risk areas. For contracts the 9-row table is Service / Employment / NDA / SaaS / Freelancer / Partnership / Lease / Sales / Investment-SAFE, each with detection signals and key-risk areas (e.g. "services / deliverables / scope of work" → Service Agreement → scope creep, payment terms, termination, IP ownership).
3. **Extract metadata** (for contracts: parties, effective date, term, governing law, total value, length).
4. **Phase 2 — launch all N sub-agents simultaneously** via the Agent/Task tool. Each receives the full input + the type classification + metadata + the standard prompt header, and must return a 0–100 score in its agent-specific output format. Consistent 0–100 scoring across agents is what makes the aggregate meaningful.
5. **Phase 3 — aggregate.** Compute the weighted score from the N agents (here 20/25/20/15/20) and map to the grade band (90–100 A+ Safe, 80–89 A Good, 70–79 B Fair, 60–69 C Caution, 40–59 D Risky, 0–39 F Dangerous).
6. **Build the single decision artifact:** score + grade headline, executive summary, details table, risk dashboard, clause-by-clause analysis grouped HIGH → MEDIUM → LOW (each: what it says / why risky / what you could lose / recommended change), missing protections, obligations timeline, compliance flags, numbered priorities, checkbox next steps.
7. **Phase 4 — present.** Surface the score prominently, summarize the top 3 risks in plain English, then offer the chained follow-ups (counter-proposal generator, polished PDF report).

## Prompts

Sub-agent launch prompt structure (verbatim — substitute role per agent):

```
`Launch each agent with this prompt structure:

"You are the [Agent Role] subagent for the AI Legal Assistant.
Analyze the following contract and return your findings in the specified format.

CONTRACT TYPE: [detected type]
CONTRACT METADATA: [extracted metadata]

FULL CONTRACT TEXT:
[paste full contract text]

Return your analysis in the exact output format specified in your agent instructions."
`
```

Aggregation rubric (verbatim) — the reusable grading band any fan-out can adopt:

```
`| Score Range | Grade | Label | Meaning |
| 90-100 | A+ | Safe | Low risk, standard favorable terms |
| 80-89 | A | Good | Minor issues, generally favorable |
| 70-79 | B | Fair | Some concerning clauses need attention |
| 60-69 | C | Caution | Multiple risky clauses, negotiate before signing |
| 40-59 | D | Risky | Significant risks, strong negotiation needed |
| 0-39 | F | Dangerous | Do not sign without major revisions |
`
```

Install (for the contract-review worked example):

```
`curl -fsSL https://raw.githubusercontent.com/zubair-trabzada/ai-legal-claude/main/install.sh | bash
`
```

## Gotchas

- **Inconsistent 0–100 scoring across agents makes the aggregate meaningless.** Fix the output contract per agent and require a numeric score in a known range — the weighting only works if every agent returns the same scale.
- **Wrong type classification skews the entire review.** The classifier calibrates each downstream agent's risk focus; misclassify a SaaS agreement as a generic service contract and every lens looks at the wrong clauses.
- **Don't fan out for trivially decomposable work.** Five agents is right when the lenses are genuinely independent and expensive to combine in one pass — not for a two-paragraph document one agent can read in seconds.
- **Keep the legal disclaimer (for the legal worked example).** The output is a starting point, not legal advice; the disclaimer block stays on every artifact.

<hr/>

## Tools

- Claude Code with the Agent/Task tool — provides the parallel sub-agent fan-out primitive
- Read / WebFetch — input ingestion
- N agent definition files, one per expert lens (the worked example ships 5: clauses, risks, compliance, terms, recommendations)
- Install (worked example): `curl -fsSL https://raw.githubusercontent.com/zubair-trabzada/ai-legal-claude/main/install.sh | bash`
