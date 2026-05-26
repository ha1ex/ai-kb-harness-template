---
id: B-089
tier: B
category: "Infrastructure"
kind: pattern
title: "Legacy ERP as cash register — wrap, never modify the ERP"
subtitle: "ERP specialists charge hourly rates and ship in weeks. Build everything outside the ERP at LLM cost; the ERP becomes a thin data sink."
source: https://www.cybos.ai/cases/B-089
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "Founder / CTO of any mid-size company with a legacy ERP"
type: case
version: v0.1
---
# Legacy ERP as cash register — wrap, never modify the ERP

> ERP specialists charge hourly rates and ship in weeks. Build everything outside the ERP at LLM cost; the ERP becomes a thin data sink.

## What

Architectural principle: the ERP (SAP / Oracle / NetSuite / Salesforce or any legacy CRM/ERP stack) is a thin data layer. **Never modify standard modules** (accounting, tax, banking integration). Anything that COULD be done outside goes into a microservice. Data flows: pull from ERP via API → process in microservice → write results back via API. Pay specialists for in-ERP work at their rates; build everything else outside at LLM cost.

## Why it matters

Two independent operators at the same cohort (a mid-size cosmetics retailer; a small franchise) reached this principle independently. Modifying a legacy ERP module costs an hourly-rate specialist plus weeks of regression risk; replicating the same logic in a microservice with Claude Code costs hours and is owned by the operator. The principle generalises across legacy ERP/CRM stacks.

## End-to-end

1. Catalog what the ERP MUST do: ledger, regulatory reporting, e-invoicing, payroll calc, bank integration. That's the cash-register slice.
2. Catalog what gets done IN the ERP today that COULD live outside: dashboards, custom workflows, cross-system joins, reports, approvals, notifications. That's the wrap.
3. For each "could live outside" item, build a microservice (see [new-N14-04]). The microservice reads from ERP via API, writes back results to a normal ERP field.
4. Lock the ERP team's scope: cash-register slice only. Anything else gets escalated to the microservices team.
5. Bidirectional API contract per microservice: documented `data_in` from ERP, documented `data_out` to ERP.
6. Test: when the microservice goes down, the ERP remains correct. ERP is the source of truth for the cash-register slice; microservice is the source of truth for everything else.
7. Don't rewrite the cash register. Even if the LLM offers — say no.

## Gotchas

- **The seductive rewrite trap.** When Claude can produce a 200-line "ERP module replacement" in 20 minutes, the temptation is to escape the ERP entirely. Don't. Tax / accounting / regulatory drift is what specialists handle; eat the specialist cost and own the outside. Distributed from anti-pattern catalog: "what NOT to rewrite with Claude".
- Explicit "don't rewrite" list from a transformation operator: (1) accounting modules in the legacy ERP — pay the specialist instead; (2) tax integration / official reporting — regulatory cost of bugs dwarfs build savings; (3) bank-integration plumbing that already works — wrap, don't replace; (4) any module the ERP vendor patches monthly — your fork rots. Build microservices around these; never inside them.

## Tools

- Whatever ERP you have, with its API documented
- Claude Code / Codex for microservice authoring
- One person who genuinely knows the ERP's data model
