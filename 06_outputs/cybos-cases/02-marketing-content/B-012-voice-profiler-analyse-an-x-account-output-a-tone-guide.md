---
id: B-012
tier: B
category: "Marketing & content"
kind: skill
title: "Voice profiler — analyse an X account, output a tone guide"
subtitle: "Six months of A/B posting to find your voice. One hour parsing 1,000 of your own tweets gets you a content calendar."
source: https://www.cybos.ai/cases/B-012
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "Founder onboarding to writing publicly · marketing team studying competitor voice · content lead"
type: case
version: v0.1
---
# Voice profiler — analyse an X account, output a tone guide

> Six months of A/B posting to find your voice. One hour parsing 1,000 of your own tweets gets you a content calendar.

## What

Pages through ~1,000 tweets from a target X account via the GraphQL `UserTweets` endpoint (rate-limited, resumable), runs a keyword-based topic detector across ~10 verticals (stablecoins, payments, AI, fintech, regulation, etc.), measures engagement per topic, and detects tone markers (questions, exclamations, thread starters, hot takes, CTAs, personal updates). Output: a markdown report with a phase-by-phase tone guide and a weekly content calendar template (Mon: research thread, Tue: building-in-public, Wed: quick take, Thu: question, Fri: link, weekend: RT + commentary).

## Why it matters

A founder learns their best-performing topic in roughly one hour of wall time, vs six months of trial-and-error posting. Marketing studying a competitor's voice gets a structured artifact instead of a scroll.

## End-to-end

1. Acquire X cookies (`auth_token`, `ct0`) from a real, warmed-up account.
2. Run `fetch_my_tweets.py` (or equivalent): 70-second sleep between GraphQL requests, ~1 hour wall time for 1,000 tweets. Resumable via progress file.
3. Run `analyze_my_tweets.py`: keyword topic detection + engagement aggregation + tone-marker counts.
4. Output a markdown report titled per the account, with the top-10 tweets quoted verbatim per topic.
5. Feed the report into the content-calendar (#28) as the seed for an editorial plan.

## Gotchas

- Keyword-based topic detection is naive; for a non-English account or a niche vertical, swap the keyword list for an LLM categorisation pass before drawing conclusions.

<hr/>

## Tools

- A real X account with cookies
- Python 3, no paid API
- ~1 hour wall time
