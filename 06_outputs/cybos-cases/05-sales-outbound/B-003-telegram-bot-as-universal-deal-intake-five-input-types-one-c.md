---
id: B-003
tier: B
category: "Sales & outbound"
kind: workflow
title: "Telegram bot as universal deal intake (five input types, one conversation)"
subtitle: "\"Forward this to me, I'll look next week\" loses deals. Forward to bot; researched task lands in the tracker in 90 seconds."
source: https://www.cybos.ai/cases/B-003
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "Investor / fund partner · BD lead at any team pitched 20+ ways"
type: case
version: v0.1
---
# Telegram bot as universal deal intake (five input types, one conversation)

> "Forward this to me, I'll look next week" loses deals. Forward to bot; researched task lands in the tracker in 90 seconds.

## What

One Telegram DM bot accepts an X URL, raw text pitch, meeting transcript URL, deck PDF attachment, signature-envelope link, or deck-share URL (DocSend, Pitch, Notion, Gamma, Figma, Canva). It detects type, runs the matching ingestor, classifies content availability, runs deep research, pushes a fully-populated task into the team's tracker, and DMs the task link back. Forwarded decks record the scout's handle so attribution is preserved.

## Why it matters

Replaces "forward this to me, I'll look at it next week" with "forward to bot, get a researched task link in ~90 seconds". Deals stop getting lost to inbox triage.

## End-to-end

1. Create a bot via BotFather; set `TELEGRAM_BOT_TOKEN`. Only one process should long-poll.
2. URL detection by host substring (`x.com`, `granola.ai`, `docusign`, deck-share hosts).
3. PDF detection by mime + filename suffix.
4. Each type routes to `ingestors/<type>.py:ingest()` returning a `DealContext` (founder, company, signal_text, attachments).
5. L1 content-availability gate: if `signal_text < 200 chars` and no attachment, ask the user for more info and set status `awaiting_user_input`. On the next message, merge old + new context.
6. L3 research (Opus + WebSearch + Bash) emits a structured memo.
7. Create the tracker task (two-step if your tracker has templates — see #10).
8. DM the task URL back to the sender; record scout attribution on forwarded inputs.

## Gotchas

- Privacy-hidden Telegram forwards strip the original sender — fall back to a "who forwarded this?" follow-up question instead of silently losing attribution.

## Variations

- **Family-office variant.** Same architecture, applied to a family office's CRM intake. Operator drops in: voice memos from meetings, screenshots of chat pitches, forwarded emails, scanned business cards, photographs of slides. Bot normalises into one deal record per surface. The variant ships with a daily 12-agent news scan attached (see [new-N13-07]) so each new deal-card is enriched with same-day news hooks for the relationship manager.

## Tools

- Python `httpx`, Telegram Bot API token, Claude CLI, tracker API token
- Optional: Browserbase for headless deck-share unwrapping, founder-enrichment API (e.g., Harmonic)
