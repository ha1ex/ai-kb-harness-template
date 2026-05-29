---
id: B-053
tier: B
category: "Data & BI"
kind: pattern
title: "Data Warehouse + lineage graph (foundation)"
subtitle: "Every downstream AI initiative breaks because the agent can't resolve \"is this the same customer?\" across billing + CRM + support."
source: https://www.cybos.ai/cases/B-053
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "data engineer · ops lead · founder"
type: case
version: v0.1
---
# Data Warehouse + lineage graph (foundation)

> Every downstream AI initiative breaks because the agent can't resolve "is this the same customer?" across billing + CRM + support.

## What

A warehouse that lands raw events from billing, CRM, support, helpdesk, telephony, and 1C-style accounting plus a lineage graph that lets agents join entities across those sources. A separate "golden record" mapping reconciles merchant/customer IDs across systems so an agent asked "is account X churning?" can stitch transactions + tickets + login telemetry without manual joining.

## Why it matters

A large payments processor sized this as the single foundation that unlocks churn prediction, support copilots, and merchant self-service — none of which can be built reliably without it. Cost: low-six-figure USD equivalent. Without it, every downstream AI initiative reduces to a demo that breaks in production because the agent can't resolve identities.

## End-to-end

1. **Inventory every source.** Billing, CRM, HelpDesk, telephony, 1C, product DB, ad platforms.
2. **CDC each source into the warehouse** with no transformation (Fivetran / Airbyte / custom).
3. **Build a `golden_record` table** that maps source IDs → canonical entity (merchant_id, customer_id, deal_id).
4. **Author a lineage graph** as a YAML or markdown file: which downstream table depends on which source, with column-level mapping for the load-bearing fields.
5. **Stand up the semantic / metric layer on top** (see #142).
6. **Define a "source freshness" SLA** per table; surface in a dashboard the agent reads before answering.
7. **Ship Q1 MVP for one critical question** (e.g., churn). Q2 add SSoT. Q3-Q4 extend coverage.

## Gotchas

- Vendor estimates run 3–4× inflated; one team challenged a vendor quote that was inflated ~4× over the independently-rebuilt cost. Always re-cost AI infra independently before signing.

## Tools

- ClickHouse / Snowflake / BigQuery
- Fivetran / Airbyte / custom CDC
- dbt for tests + column-level lineage
- A `golden_record` table or MDM-lite
