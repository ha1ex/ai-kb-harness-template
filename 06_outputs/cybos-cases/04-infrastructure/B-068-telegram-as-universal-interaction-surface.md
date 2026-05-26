---
id: B-068
tier: B
category: "Infrastructure"
kind: pattern
title: "Telegram as universal interaction surface"
subtitle: "Notifications in Slack, approvals in email, feedback in Intercom — small teams context-switch all day. One Telegram bot routes everything."
source: https://www.cybos.ai/cases/B-068
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · engineer · any team-of-5-to-30"
type: case
version: v0.1
---
# Telegram as universal interaction surface

> Notifications in Slack, approvals in email, feedback in Intercom — small teams context-switch all day. One Telegram bot routes everything.

## What

Use one Telegram bot as the single point of contact between your internal automation and your team: notifications (deal alerts, build failures), inbound (forward me a deck, I'll process it), daily reminders (you have 3 unswiped founders today), owner approvals (thumb up to ship this code change), feedback collection (DM the bot about the swipe UI). One bot ID, multiple message kinds routed by content. Telegram replaces Slack, email, intercom, and ad-hoc dashboards for a small team.

## Why it matters

A founder-discovery CLI and a deal-intake bot share a single bot (`@yourbot`), with the intake bot polling `getUpdates` and the source bot using `sendMessage` only (no polling contention). Practical experience: small teams use Telegram constantly anyway; building automation surfaces inside it removes context-switching. The notification → action → followup loop runs in one app.

## End-to-end

1. **BotFather → new bot → token in `TELEGRAM_BOT_TOKEN`.**
2. **One process polls `getUpdates`** (only one process can do this; pick the one that needs to receive messages).
3. **Other processes use the Bot API's `sendMessage`** only — no contention.
4. **Route inbound by content**: URL → ingestor; PDF → deck handler; plain text → freeform processor.
5. **Owner approval flows**: send message + inline keyboard (thumb up / thumb down); persist the approval state in your DB; on thumb-up, run the next step.
6. **Daily reminder cron**: send templated nudges with progress numbers ("you swiped 3 of 10 today").
7. **Per-user state via `user_email` (or `tg_user_id`) columns** — multi-tenancy without auth gymnastics.

## Gotchas

- Two processes polling `getUpdates` cause silent message loss. Pick one polling owner; everything else uses `sendMessage` or a separate bot.

## Variations

- **Region-specific multi-channel variant.** When operating in regions where Telegram alone doesn't reach all customers (e.g. multiple regional messengers + WhatsApp + Telegram), wrap the universal surface in a per-channel adapter layer. Customer-facing: a CRM + Telegram + the regional messenger(s) routed into one queue (see B-028 merge). Internal-facing: keep Telegram as the operator's primary surface but accept that customer-side coverage requires multi-channel adapters.

## Tools

- Telegram Bot API token
- A web server with one polling process
- SQLite or any DB for state
