---
id: C-136
tier: C
category: "HR & hiring"
kind: pattern
title: "Slash-command router with sub-agent delegation"
subtitle: "Problem solved: Multi-step candidate-side workflows (tailored CV / application tracker / interview prep / follow-up) fan out across tools; one slash-command router with sub-agent delegation runs the long-running modes headlessly."
source: https://www.cybos.ai/cases/C-136
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "M · Weeks"
type: case
version: v0.1
---
# Slash-command router with sub-agent delegation

> Problem solved: Multi-step candidate-side workflows (tailored CV / application tracker / interview prep / follow-up) fan out across tools; one slash-command router with sub-agent delegation runs the long-running modes headlessly.

## What

A job-search OS exposes each workflow as a slash command, with a router that delegates long-running modes (bulk-tailoring, multi-listing scrape) to sub-agents instead of blocking the main session. The transferable pattern: a single command router + sub-agent fan-out for any multi-mode personal workflow. Packaged with cross-harness symlinks (`.agents` / `.claude` / `.qwen` pointing at one skill tree) — a portable infra mini-pattern for shipping one skill set to multiple agent runtimes.
