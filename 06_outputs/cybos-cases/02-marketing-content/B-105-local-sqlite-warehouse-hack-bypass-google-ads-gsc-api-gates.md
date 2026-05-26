---
id: B-105
tier: B
category: "Marketing & content"
kind: tactic
title: "Local SQLite warehouse hack — bypass Google Ads / GSC API gates"
subtitle: "Problem solved: Founders shut out of the Google Ads API (multi-week approval) or unwilling to pay $5k/yr for SemRush can edit campaigns directly via the local SQLite DB that Google Ads Editor keeps on disk."
source: https://www.cybos.ai/cases/B-105
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · marketing lead"
type: case
version: v0.1
---
# Local SQLite warehouse hack — bypass Google Ads / GSC API gates

> Problem solved: Founders shut out of the Google Ads API (multi-week approval) or unwilling to pay $5k/yr for SemRush can edit campaigns directly via the local SQLite DB that Google Ads Editor keeps on disk.

## What

Google Ads Editor (the desktop client) stores all campaign state in a local SQLite file. Skip the API entirely: have Claude write SQL JOINs against that DB to bulk-edit campaigns, ads, and keywords, preview the diff in Editor's UI, then push to prod through the official client. Version the SQLite file in git for rollback. Pair with Ahrefs Lite ($129/mo) via MCP for keyword data instead of SemRush ($5k/yr). The same pattern works for GSC where the official API is similarly painful.

## Why it matters

API approval for Google Ads can take weeks; SemRush at $5k/yr blocks early-stage operators. Editing the local DB directly sidesteps both. One marketing operator built and shipped 7 Google Ads campaigns in a single Claude session this way. The SemRush → Ahrefs swap alone is ~40× cheaper on the data-source line.

## End-to-end

1. Locate Google Ads Editor's SQLite DB on your machine (path differs per OS; let Claude find it).
2. Commit the SQLite file to a private git repo so every edit is reversible.
3. Have Claude inspect the schema, then write the SQL to bulk-edit campaigns / ad groups / keywords / negatives.
4. Open Google Ads Editor's UI; it picks up the local changes and shows a diff. Review every change.
5. Push from Editor to production Google Ads once the diff is clean.
6. For keyword research, install the Ahrefs Lite MCP and route research prompts through it; SemRush API not required.
7. Apply the same recipe to Google Search Console if you need bulk URL submissions or property edits and the API is gating you.

## Gotchas

## The Editor's SQLite schema evolves between versions; a Claude-written JOIN that worked yesterday can silently miss columns after an Editor update. Re-inspect the schema before each session and pin a known-good Editor version while you stabilise the workflow.

## Tools

- Google Ads Editor desktop client
- A SQLite CLI (`sqlite3`) and a private git repo for versioning the DB
- Claude Code (writes the JOINs)
- Ahrefs Lite subscription ($129/mo) with MCP for keyword data
