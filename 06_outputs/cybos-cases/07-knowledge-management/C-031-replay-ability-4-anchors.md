---
id: C-031
tier: C
category: "Knowledge management"
kind: pattern
title: "Replay-ability — 4 anchors"
subtitle: "\"Why did the agent do X last month?\" Four anchors (source hash, prompt version, tool contract, evidence) make any decision replayable."
source: https://www.cybos.ai/cases/C-031
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "governance lead · agent author"
type: case
version: v0.1
---
# Replay-ability — 4 anchors

> "Why did the agent do X last month?" Four anchors (source hash, prompt version, tool contract, evidence) make any decision replayable.

## What

Every agent action is replayable from four anchors with concrete substrates:

- **source_hash** — SHA of input materials, written by a pre-invocation hook into `replay/anchors.yaml` keyed by run-id.
- **prompt_version** — git tag on the prompts repo; the runtime asserts the working tree is clean and records the tag at every invocation.
- **tool_contract_version** — semver string included in each tool's response envelope; mismatch against the recorded version aborts a replay.
- **evidence_envelope** — JSONL of (tool_call, args, response, timestamp) at `replay/evidence/<run-id>.jsonl`, appended by the agent loop.
Replay command: `replay run <run-id>` — reads the four anchors, checks out the matching prompt tag, refuses to proceed on tool-contract mismatch, and re-executes against the recorded evidence. Discipline for any team that wants to debug an agent decision a month later.
