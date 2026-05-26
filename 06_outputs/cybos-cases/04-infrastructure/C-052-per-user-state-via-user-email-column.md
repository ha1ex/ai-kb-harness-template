---
id: C-052
tier: C
category: "Infrastructure"
kind: pattern
title: "Per-user state via `user_email` column"
subtitle: "Multi-user vibe-coded tools spawn per-tenant DBs and auth gymnastics. One user_email column on every table; works fine at sub-1000-user scale."
source: https://www.cybos.ai/cases/C-052
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "any vibe-coder building a multi-user tool"
type: case
version: v0.1
---
# Per-user state via `user_email` column

> Multi-user vibe-coded tools spawn per-tenant DBs and auth gymnastics. One user_email column on every table; works fine at sub-1000-user scale.

## What

Per-user CRM rows, per-user API keys, per-user sender identity, per-user swipe state — all via a `user_email` column on every relevant table. No per-tenant database carve-out, no auth gymnastics. Works at sub-1000-user scale.
