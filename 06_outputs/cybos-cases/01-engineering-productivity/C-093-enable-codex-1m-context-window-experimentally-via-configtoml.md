---
id: C-093
tier: C
category: "Engineering productivity"
kind: tactic
title: "Enable Codex 1M context window experimentally via `config.toml`"
subtitle: "Problem solved: Codex defaults to a 270k context window even on GPT-5.4, which forces splitting large codebases into microservice-shaped chunks; the 1M window is available but opt-in."
source: https://www.cybos.ai/cases/C-093
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "engineer with large codebases on Codex / GPT-5.4"
type: case
version: v0.1
---
# Enable Codex 1M context window experimentally via `config.toml`

> Problem solved: Codex defaults to a 270k context window even on GPT-5.4, which forces splitting large codebases into microservice-shaped chunks; the 1M window is available but opt-in.

## What

GPT-5.4 supports 1M context experimentally; activation is via `model_context_window` and `model_auto_compact_token_limit` in Codex's `config.toml` (both CLI and GUI app inherit the same config). One reliable path: paste a request to the Codex agent itself asking it to enable the extended context via settings, citing the official 1M-context announcement. Billed at 2× normal rate. Only newly-opened chats inherit the larger window; existing sessions stay at 270k.
