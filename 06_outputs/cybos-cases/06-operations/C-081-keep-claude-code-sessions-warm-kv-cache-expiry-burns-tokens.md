---
id: C-081
tier: C
category: "Operations"
kind: tactic
title: "Keep Claude Code sessions warm — KV-cache expiry burns tokens"
subtitle: "Problem solved: constantly opening fresh CC sessions makes you re-prefill 100-300k tokens of context, each at full uncached price."
source: https://www.cybos.ai/cases/C-081
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
type: case
version: v0.1
---
# Keep Claude Code sessions warm — KV-cache expiry burns tokens

> Problem solved: constantly opening fresh CC sessions makes you re-prefill 100-300k tokens of context, each at full uncached price.

## What

Production tip: KV-cache lifetime on Claude is short (~5 min idle). If the cache expires the entire prefill must re-run, burning compute. Practical rule: keep one long-running session per project; resume rather than restart; cache hits are dramatically cheaper than re-prefill. Related research pointer (TurboQuant) for the underlying compression dynamics.
