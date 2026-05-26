---
id: B-015
tier: B
category: "Marketing & content"
kind: workflow
title: "Voice of Customer (VoC) — unified sentiment"
subtitle: "Tickets, calls, reviews, NPS, social — five sources, no single signal. One classifier feeds CS retention + marketing + product simultaneously."
source: https://www.cybos.ai/cases/B-015
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "CS lead · retention PM · customer-marketing lead"
type: case
version: v0.1
---
# Voice of Customer (VoC) — unified sentiment

> Tickets, calls, reviews, NPS, social — five sources, no single signal. One classifier feeds CS retention + marketing + product simultaneously.

## What

Unified sentiment + intent analysis across support tickets, sales-call transcripts, G2 / app-store reviews, NPS open text, and social mentions. The same classifier produces (a) a CS-side churn-risk feed (cases routed to the relationship manager inside the CRM), (b) a marketing-side topic-trend dashboard (what clients are asking for that we don't talk about), and (c) a product-side intent tag stream feeding the roadmap.

## Why it matters

At a large wealth-management firm, the VoC pipeline retained billions in AUM (rising further in a single quarter), routing churn-signal cases as embedded CRM cases for advisors to work — not as a standalone dashboard nobody opens.

## End-to-end

1. Build the transcription foundation first (100K+ calls/month is realistic at a mid-size firm). Cheap region-specific ASR or Whisper as the baseline.
2. Centralise the text stream: tickets, call transcripts, NPS open text, G2 reviews, social mentions all flow into one store with consistent metadata (`source`, `customer_id`, `ts`, `raw_text`).
3. Classifier pass: LLM tags each item with intent + sentiment + topic. Surface low-confidence items for human review.
4. For churn signals on accounts above a value threshold (e.g., a high-balance AUM cutoff), auto-create a CRM case tied to the client card — assigned to the advisor, not a generic queue.
5. For marketing: weekly topic-trend report into the content calendar (#28) as candidate post topics.
6. For product: tag every item with one or more roadmap intents; the PM gets a weekly "what customers are asking for, ranked by AUM" view.

## Gotchas

- The biggest failure mode is shipping VoC as a separate dashboard. Advisors don't open separate dashboards — embed the output as a case inside the CRM where the work already happens.

<hr/>

## Tools

- ASR pipeline (Whisper / Deepgram / a region-specific local ASR)
- LLM for classification (Sonnet-class is fine; Opus for ambiguous cases)
- CRM that supports case creation via API
- Unified text store (Postgres or warehouse)
