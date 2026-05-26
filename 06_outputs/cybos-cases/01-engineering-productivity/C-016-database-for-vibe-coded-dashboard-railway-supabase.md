---
id: C-016
tier: C
category: "Engineering productivity"
kind: pattern
title: "Database for vibe-coded dashboard (Railway / Supabase)"
subtitle: "Persistent data for a weekend dashboard turns into self-hosted Postgres. Two defaults (Railway paid, Supabase free) skip the infra rabbit hole."
source: https://www.cybos.ai/cases/C-016
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "vibe-coder · PM"
type: case
version: v0.1
---
# Database for vibe-coded dashboard (Railway / Supabase)

> Persistent data for a weekend dashboard turns into self-hosted Postgres. Two defaults (Railway paid, Supabase free) skip the infra rabbit hole.

## What

When a vibe-coded dashboard needs persistent data, default to one of two: Railway-hosted Postgres (paid, polished, cron + scheduler bundled) or Supabase (free tier, Google OAuth out of the box). Skip self-hosting.
