---
id: C-038
tier: C
category: "Strategy & leadership"
kind: framework
title: "AI risk-management framework"
subtitle: "Board wants the AI-risk slide. Six universal risks + 1-line mitigations, ready to drop in; operational scaffold lives in B-061."
source: https://www.cybos.ai/cases/C-038
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "M · Weeks"
for: "CISO · Head of AI · legal"
type: case
version: v0.1
---
# AI risk-management framework

> Board wants the AI-risk slide. Six universal risks + 1-line mitigations, ready to drop in; operational scaffold lives in B-061.

## What

Universal AI risks for a board-ready slide, each paired with a one-line mitigation. Risks are framed provider- and jurisdiction-agnostic; the operational scaffold (owner, review cadence, escalation triggers) is B-061 (AI Governance Framework).

- **Model-provider failure** (HIGH) — primary vendor outage, account suspension, or model deprecation. Mitigation: provider-agnostic prompts + a tested secondary model behind the same API surface.
- **Regulatory drift** (jurisdiction-dependent) — new rules constrain data flow, training, or autonomous action. Mitigation: a quarterly regulatory review with a written go/no-go for each deployed agent.
- **Cost overrun** (MEDIUM) — usage scales faster than budget on cloud LLMs. Mitigation: per-team / per-service token-spend caps wired to alerts; monthly review.
- **PII leakage to external models** (HIGH) — sensitive fields cross the API boundary. Mitigation: outbound-content preventive controls + DLP scan on agent egress.
- **Vendor lock-in** (MEDIUM) — proprietary tool-calling or non-standard memory makes cutover costly. Mitigation: avoid vendor-only primitives in core workflows; keep prompts and tool contracts portable.
- **Capability regression** (MEDIUM) — silent model update degrades a production workflow. Mitigation: pinned model versions for production; eval suite re-run on every pin change.
