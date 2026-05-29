---
id: B-082
tier: B
category: "Sales & outbound"
kind: workflow
title: "Daily 12-agent news scan → per-product client-hook summaries"
subtitle: "AEs have nothing to call clients about today. Twice a day, 12 agents find a news hook per client tied to your products."
source: https://www.cybos.ai/cases/B-082
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "Relationship-sales operator · family-office sales lead · B2B AE in a niche"
type: case
version: v0.1
---
# Daily 12-agent news scan → per-product client-hook summaries

> AEs have nothing to call clients about today. Twice a day, 12 agents find a news hook per client tied to your products.

## What

Twice a day (morning + evening cron), 12 agents scan named news topics. Each story is scored on (a) interestingness and (b) actuality / freshness. Output per story: title, summary, longer local-language summary, source link, and — the load-bearing field — a **"client hook"**: analysis of which of the firm's products this news could be a hook for, in client-friendly language. Output lands in Telegram and Obsidian.

## Why it matters

For relationship-sales businesses (family offices, wealth management, complex B2B), the gap between "I read the news" and "I had a reason to call my client today" is what AEs ship value through. Automating the hook-finding step gives every AE an opening line per major client every day, drawn from real news the client already cares about.

## End-to-end

1. Define the news-topic surface: 5–15 named topics (e.g. "real estate market X", "interest rates", "AI regulation"). Each topic gets its own agent.
2. Each agent: scrape an RSS / SerpAPI feed for its topic → dedupe against yesterday → score on (interestingness × actuality).
3. Map each scored story to the product catalog. Prompt: "for which of these N products is this story a plausible client-call hook?" — 0 to 3 products per story.
4. For each (story, product) hit, generate a 2-sentence client-friendly hook: "what changed; why client X cares; suggested phrasing."
5. Aggregate into one daily digest. Top 10 by combined score → Telegram. All hits → Obsidian for later search.
6. Twice-daily cron (morning before the workday, evening for next-day prep).
7. Weekly review: which hooks actually got used? Re-weight the interestingness model.

## Gotchas

- Don't let the digest become a wall of 50 items. If the AE doesn't read it by 9 AM, the system is dead. Cap at 10. Aggressive interestingness threshold is the only thing that saves it.

## Tools

- A cron / scheduled-agent runner (cron, Vercel cron, Telegram bot scheduler)
- SerpAPI / RSS aggregator / Bright Data
- LLM with structured output (Claude / GPT)
- Product catalog as a structured JSON file
- Obsidian or equivalent KM substrate
