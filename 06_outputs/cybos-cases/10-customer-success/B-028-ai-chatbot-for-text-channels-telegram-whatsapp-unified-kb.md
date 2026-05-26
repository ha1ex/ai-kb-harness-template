---
id: B-028
tier: B
category: "Customer success"
kind: workflow
title: "AI Chatbot for text channels (Telegram + WhatsApp + unified KB)"
subtitle: "Earlier button-based bots handled 20-25%; that's the cap. LLM + unified KB lifts text-channel deflection to 40-60%."
source: https://www.cybos.ai/cases/B-028
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "CS lead · ops lead"
type: case
version: v0.1
---
# AI Chatbot for text channels (Telegram + WhatsApp + unified KB)

> Earlier button-based bots handled 20-25%; that's the cap. LLM + unified KB lifts text-channel deflection to 40-60%.

## What

A text-channel chatbot that handles customer inquiries on Telegram and WhatsApp, grounded in a unified knowledge base. Replaces an earlier failed button-based bot (which auto-handled 20–25%) with an LLM-driven version on modern models that handles 40–60% of L1 text inquiries. Extends seamlessly across channels because both speak to the same KB and the same intent router.

## Why it matters

At 80K-merchant scale a 40% text-channel deflection saves low-six-figures USD-equivalent annually. Earlier OpenAI-based attempts failed because the underlying KBs were fragmented and outdated. Modern LLM + unified KB makes this a 1–5 day deploy rather than a 6-month project. For a 30–100-person startup with 1K–5K customers, the ROI is freeing 1–2 CS FTE.

## End-to-end

1. Pre-req: unified knowledge base (see #76). Don't deploy until at least one KB pass is done.
2. Connect to text channels via the company's existing bot frameworks (Telegram Bot API, WhatsApp Business API / Twilio).
3. Stand up the chatbot — LLM + RAG over unified KB + intent classifier.
4. Start narrow: 5–10 highest-frequency intent categories (account access, product status, billing-FAQ, returns).
5. Add escalation path — agent recognizes uncertainty and routes to human with full conversation context.
6. Measure CSAT continuously to catch regressions; expand intent coverage iteratively.
7. Add WhatsApp as a second channel only after Telegram is stable.

## Gotchas

- Don't deploy before the KB is unified — earlier attempts failed precisely because the bot pulled from 3 stale KBs and contradicted itself. Fix the KB first.

## Variations

- **Region-specific channel routing.** A franchise operator routes inbound support through a CRM + Telegram + a regional messenger into one normalized queue. Bot answers from the same unified KB regardless of source channel; outbound goes back to the original channel. The pattern: source-agnostic core + channel-specific adapters. Generalises to any region where the channel mix matters (WeChat for China, KakaoTalk for Korea, etc.).

## Tools

- Unified knowledge base (#76)
- Telegram Bot API + WhatsApp Business API or Twilio
- LLM (Claude / GPT) + RAG store (ChromaDB or pgvector)
- Escalation routing to CS team
