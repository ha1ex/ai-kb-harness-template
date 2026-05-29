---
id: C-099
tier: C
category: "Engineering productivity"
kind: framework
title: "agentfile — resumable multi-step pipelines with L0–L3 data layers"
subtitle: "Problem solved: Ad-hoc multi-step LLM pipelines aren't resumable or debuggable; when step 7 fails you re-run from zero and lose the L0 raw data plus all intermediate state."
source: https://www.cybos.ai/cases/C-099
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "M · Weeks"
for: "engineer building production multi-agent pipelines"
type: case
version: v0.1
---
# agentfile — resumable multi-step pipelines with L0–L3 data layers

> Problem solved: Ad-hoc multi-step LLM pipelines aren't resumable or debuggable; when step 7 fails you re-run from zero and lose the L0 raw data plus all intermediate state.

## What

Generic pipeline framework that structures state across four data layers (L0 raw → L1 cleaned → L2 enriched → L3 synthesis), declares which agents read/write each layer, and persists timestamped workspaces so any step can be re-run independently. Includes an agent-selection matrix and a quality-loop primitive for iterative refinement. Overkill for one-shot single-agent jobs; pays back when the pipeline has 4+ steps or needs to survive crashes.
