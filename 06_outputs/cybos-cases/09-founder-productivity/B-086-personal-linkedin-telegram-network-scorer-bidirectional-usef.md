---
id: B-086
tier: B
category: "Founder productivity"
kind: workflow
title: "Personal LinkedIn + Telegram network scorer (bidirectional usefulness)"
subtitle: "2-10K contacts; \"who can help me\" is the only direction you think in. Score both ways; warm \"who can I help\" intros convert better than cold."
source: https://www.cybos.ai/cases/B-086
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "Founder · BD lead · anyone whose network IS the product"
type: case
version: v0.1
---
# Personal LinkedIn + Telegram network scorer (bidirectional usefulness)

> 2-10K contacts; "who can help me" is the only direction you think in. Score both ways; warm "who can I help" intros convert better than cold.

## What

Export full LinkedIn (connections + profile + recent activity) and Telegram (contacts + last N months of DMs). Run every contact through an LLM that scores **bidirectionally**: (a) who is useful to me right now, and why; (b) who could I be useful to right now, and how. Output: a scored, segmented network map; re-prioritises follow-ups.

## Why it matters

Founders accumulate 2–10K contacts across LinkedIn + Telegram; the value of that network is gated by recall. The bidirectional scoring fights the natural bias to think only about "who can help me" — explicit "who can I help" prompts produce warm reach-outs that convert better than cold ones.

## End-to-end

1. Export: LinkedIn data export (~24 hr lag), Telegram contacts + chat history JSON dump.
2. Normalize into one contact record per person: name, last contact, recent topics, your relationship signals.
3. Define your current goals (3–6 named threads: "fundraising round 2", "AI hires", "BD partners in EU").
4. Score each contact in two directions: (a) value-to-me on each goal; (b) value-I-can-offer (intros, expertise, intros to my network).
5. Output: a ranked list per direction, plus a 2x2 (high to me × high from me) for the warm reach-out tier.
6. Schedule weekly: pick 5 from the top-right quadrant, draft an opening message anchored on what you can offer first.
7. Track outcomes (replies, meetings, intros) to retrain the scorer.

## Gotchas

- Don't ship scores to anyone but yourself. A leaked "value score" of your network is reputational poison. Keep the artifact in a private repo, encrypt at rest.

## Tools

- LinkedIn data export
- Telegram chat export (Desktop client → Export chat history → JSON)
- LLM with long-context (1M is convenient but 200K works batched)
- A goals file in markdown
