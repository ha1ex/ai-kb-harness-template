---
id: B-002
tier: B
category: "Sales & outbound"
kind: strategy
title: "In-app / in-product AI assistant (start narrow, grow autonomy)"
subtitle: "Mass-segment users wait for business hours or leave for ChatGPT. An in-app advisor handles 33.6% of inquiries at CSAT 4.66."
source: https://www.cybos.ai/cases/B-002
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "Product lead at a B2C app · founder of any product with a mass user base"
type: case
version: v0.1
---
# In-app / in-product AI assistant (start narrow, grow autonomy)

> Mass-segment users wait for business hours or leave for ChatGPT. An in-app advisor handles 33.6% of inquiries at CSAT 4.66.

## What

Two examples of the same pattern at a large wealth-management firm. (a) A mass-segment in-app advisor in the mobile banking app that answers portfolio, product, and tax questions for clients who don't have a personal advisor — 16 dialogue scenarios, with a proactive product-offer pattern wired in. (b) A retail chatbot inside the mobile app that started handling 5% of inquiries and grew to 33.6% in roughly a year, with CSAT 4.66/5. Both ship narrow, measure CSAT continuously, and expand intent coverage iteratively.

## Why it matters

The mass-segment advisor unblocks 20K MAU who otherwise wait for business hours or go to ChatGPT directly. The retail bot has handled 27,467 inquiries since launch; 2026 target 50%+ automation. Both replace pure cost-line operators with an asset that compounds with each new intent.

## End-to-end

1. Choose ONE narrow surface (e.g., portfolio questions for mass-segment). Resist the "general assistant" framing.
2. Embed the assistant inside the existing product UI, not as a separate dashboard (principle: embedded > standalone).
3. Wire a knowledge base of the 10–20 most common intents; baseline automation will be 5–10%.
4. Instrument CSAT and "escalation to human" rate per intent. These are the only two metrics that matter at launch.
5. Add a proactive layer: when client context matches an offer (e.g., portfolio rebalance opportunity), surface it inline with a one-click purchase path.
6. Iterate: each month, add the next-most-common intent. Watch CSAT — drop = revert.
7. Once trust is established, expand from "helper that suggests" to "agent that acts" (auto-tasks from calls, auto-tags, etc.).

## Gotchas

- 2026-04 lesson from a wealth firm's playbook: "Without a business owner, it dies." A pure tech sponsor cannot keep an in-product assistant alive — the business-unit owner has to defend it through the first CSAT dip.

## Variations

- **Mobile-CRM 6-function example** — at a large wealth-management firm, the in-app assistant exposes six functions inside the relationship manager's mobile CRM: natural-language client search ("qualified clients >10M assets"), voice/chat entity creation, auto-task creation from calls, auto-tags (hobbies, risk profile) inferred from history, client+call summaries, and general Q&A — designed AI-first into the platform itself.

## Tools

- The product's mobile / web surface (this is not a standalone app)
- LLM with retrieval over an intent / KB store
- Per-intent CSAT instrumentation, escalation path to humans
- Product owner from the business unit (no business owner = project dies — see anti-pattern below)
