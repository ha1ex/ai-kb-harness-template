---
id: B-092
tier: B
category: "Sales & outbound"
kind: workflow
title: "Franchise sales qualifier + financial model bot (80 % pre-qualification)"
subtitle: "\"Can I afford this in city X?\" eats 3-6 senior hours per prospect. A bot answers P&L questions deeper than a 3-month-tenure manager."
source: https://www.cybos.ai/cases/B-092
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "Franchise sales lead · deep-B2B sales lead · complex-services AE"
type: case
version: v0.1
---
# Franchise sales qualifier + financial model bot (80 % pre-qualification)

> "Can I afford this in city X?" eats 3-6 senior hours per prospect. A bot answers P&L questions deeper than a 3-month-tenure manager.

## What

A bot that answers arbitrarily deep financial-model questions from prospective franchisees / customers: "can I afford this in city X?", "what does my P&L look like month-3?", "what if I open with half the staff?". Uses a long-context LLM (200K minimum; 1M is dramatically easier) to keep the full P&L model + the prospect's local inputs + the unit-economics deck in one conversation. 80 % of pre-qualification is bot-driven; humans handle closing.

## Why it matters

Franchise / deep-B2B sales typically require a senior manager 3–6 hours per prospect to walk a P&L. The bot replaces those hours, scales to nighttime / weekend prospects, and gives a prospect a consultation **deeper** than a junior manager could give in their first 3 months. One franchise founder tested this against their own bench: bot's answers were measurably better than 80 % of his junior salespeople's.

## End-to-end

1. Encode the financial model as structured data (Excel + JSON). Every assumption is named.
2. Encode unit economics, regional adjusters, regulatory variants.
3. Encode 30–50 real prospect transcripts from past sales — these become the few-shot exemplars.
4. System prompt: bot's role (consultative, never closes), knowledge boundaries, when to escalate to human.
5. Conversation logging: every prospect chat saved with timestamps. Used both for follow-up and for model fine-tuning.
6. Hot-handoff to human when prospect signals readiness (named phrases: "I'm in", "send me the contract", "what's next?"). Bot doesn't close.
7. Weekly review: which question types did the bot get wrong? Patch the model + the prompt.

## Gotchas

- Don't let the bot close. Closing requires reading social signals the bot can't reliably do. Closing-by-bot causes mismatched-expectation churn 2 months later. Hard-cap the bot at qualification.

## Tools

- Long-context LLM (Claude with 200K+; ideally 1M)
- Structured financial model
- Prior sales transcripts (≥ 30) for the few-shot pattern
- A handoff path to a human closer
