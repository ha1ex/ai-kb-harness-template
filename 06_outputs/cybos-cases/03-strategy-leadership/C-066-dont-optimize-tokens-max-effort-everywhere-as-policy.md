---
id: C-066
tier: C
category: "Strategy & leadership"
kind: strategy
title: "Don't optimize tokens — max-effort everywhere as policy"
subtitle: "Default-to-medium-reasoning misses the abundance window. Run every session on the strongest model; cap subscription cost at team level only."
source: https://www.cybos.ai/cases/C-066
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "founder · engineering lead"
type: case
version: v0.1
---
# Don't optimize tokens — max-effort everywhere as policy

> Default-to-medium-reasoning misses the abundance window. Run every session on the strongest model; cap subscription cost at team level only.

## What

Deliberate counter-stance to A-025 ("medium reasoning by default") and B-073 (tiered model strategy): every agent session runs on the highest-effort tier of the strongest available model. Cap subscription cost only at the team level (if any one IC outgrows the base plan, the founder gets paged); do not cap per-task reasoning effort. Thesis: token cost today is small money relative to value and to the cost of a wrong answer; vendors will tighten limits later; spend the abundance window now.

**Valid when all three hold:**

- (a) founder-scale capital (LLM bill is a rounding line, not a budget line),
- (b) team size < 10 (every seat is a high-leverage operator, not a cost-center IC),
- (c) workload is non-customer-facing (no per-request unit-economics pressure from a paying customer).
**Tripwire — downgrade to a tiered strategy (B-073) when any of these fire:**
- monthly LLM spend per seat exceeds ~1 day of that seat's loaded cost,
- a customer-facing workload starts dominating volume (unit economics now matter),
- vendor tightens limits and max-effort sessions start getting throttled in production.
