---
id: B-032
tier: B
category: "Customer success"
kind: tactic
title: "Unified Knowledge Base"
subtitle: "Three parallel KBs (site FAQ + internal + helpdesk) contradict each other. AI chatbots hallucinate until they're one source."
source: https://www.cybos.ai/cases/B-032
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "CS lead · ops lead"
type: case
version: v0.1
---
# Unified Knowledge Base

> Three parallel KBs (site FAQ + internal + helpdesk) contradict each other. AI chatbots hallucinate until they're one source.

## What

Merges multiple parallel knowledge bases (site FAQ, internal HDE, ticketing-system articles, Timely / Notion-based how-tos) into a single source of truth that downstream AI products query. Without this consolidation, AI chatbots and voice agents hallucinate because each KB has stale and contradictory entries.

## Why it matters

Every AI-CS deployment that skipped KB unification failed in production — the bot cites contradictory answers from three sources within a week. Unification is the unglamorous foundation that makes #74, #75, #77, #81, #82 all possible. Effort is 1–5 days of structured consolidation; payoff is unblocking low-millions/year of downstream AI deflection.

## End-to-end

1. Inventory every KB the support team uses: site FAQ, internal docs, ticketing-system articles, Slack pins, Notion handbooks.
2. Identify duplicates and contradictions — produce a "conflict log" (this is usually the biggest finding).
3. Pick **one** canonical store (markdown in git, Notion, or a wiki).
4. Migrate content: deduplicate; resolve every contradiction with the responsible function lead (you can't automate this step).
5. Tag each article with: last reviewed date, owner, source link.
6. Set up monthly review cadence — owners must touch their articles or they're flagged stale.
7. Point all AI products (chatbot, voice agent, claims intake) at the canonical store.
8. Sunset the other KBs — redirect URLs, archive the originals read-only.

## Gotchas

- Don't run unification as an automated batch job — contradictions need humans. Conflict resolution is where the value lives; if you skip it, you've moved the mess, not cleaned it.

<hr/>

## Tools

- A canonical store (git + markdown is best for AI; Notion works)
- Named owners per article (single-throat-to-choke per content area)
