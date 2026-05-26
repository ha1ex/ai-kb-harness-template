---
id: C-057
tier: C
category: "Infrastructure"
kind: pattern
title: "SQLite as shared bus (single DB for all state)"
subtitle: "Small teams default to Postgres + Redis + Kafka before they have 100 users. One SQLite file in WAL mode handles cron + web app + bots concurrently."
source: https://www.cybos.ai/cases/C-057
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "any vibe-coder building a multi-process app"
type: case
version: v0.1
---
# SQLite as shared bus (single DB for all state)

> Small teams default to Postgres + Redis + Kafka before they have 100 users. One SQLite file in WAL mode handles cron + web app + bots concurrently.

## What

A single SQLite file holds all state, history, attempts, action items, CRM rows. No Postgres, no Redis, no queue. WAL mode handles concurrency between cron jobs, a web app, and Telegram bots reading/writing simultaneously. Implication: a 30-person startup should not start with Kafka.
