---
id: C-140
tier: C
category: "Engineering productivity"
kind: tactic
title: "Project-metrics dashboard generator"
subtitle: "Problem solved: New teams hand-build \"from-scratch\" dashboards for build / velocity / quality / perf / deps; a one-shot command emits a starter JSON config with opinionated panel-layout rules."
source: https://www.cybos.ai/cases/C-140
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
type: case
version: v0.1
---
# Project-metrics dashboard generator

> Problem solved: New teams hand-build "from-scratch" dashboards for build / velocity / quality / perf / deps; a one-shot command emits a starter JSON config with opinionated panel-layout rules.

## What

A `/dashboard` command generates a Grafana / Datadog / HTML dashboard JSON for a chosen domain (build health, velocity, quality, performance, dependencies), enforcing an 8-12 panel cap and a standard panel-ordering convention so the first dashboard is usable rather than a 40-panel wall.
