---
id: C-023
tier: C
category: "Data & BI"
kind: pattern
title: "Custom MCP for any SaaS via agentic integration writing"
subtitle: "\"We don't have a connector for that SaaS\" used to be a roadmap item. Now it's a 30-minute generation problem against the SaaS API."
source: https://www.cybos.ai/cases/C-023
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "M · Weeks"
for: "data engineer"
type: case
version: v0.1
---
# Custom MCP for any SaaS via agentic integration writing

> "We don't have a connector for that SaaS" used to be a roadmap item. Now it's a 30-minute generation problem against the SaaS API.

## What

If a SaaS isn't already in the connector vault, the agent writes a new MCP connector against the SaaS's API on demand. Treats "missing integration" as a 30-minute generation problem, not a roadmap item.
