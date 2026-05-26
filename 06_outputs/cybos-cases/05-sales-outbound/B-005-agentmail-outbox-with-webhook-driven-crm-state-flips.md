---
id: B-005
tier: B
category: "Sales & outbound"
kind: pattern
title: "AgentMail outbox with webhook-driven CRM state flips"
subtitle: "Sendgrid + IMAP polling + reply parser takes two weeks to wire. Replace with one email service built for agents; done in hours."
source: https://www.cybos.ai/cases/B-005
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "Engineer wiring up AI outbound · SDR ops lead"
type: case
version: v0.1
---
# AgentMail outbox with webhook-driven CRM state flips

> Sendgrid + IMAP polling + reply parser takes two weeks to wire. Replace with one email service built for agents; done in hours.

## What

Replaces the Sendgrid + IMAP polling + custom reply-parser stack with a single email service purpose-built for AI agents. Outbound goes through `client.inboxes.messages.send/reply` (returns `thread_id`). Inbound `message.received` and `message.bounced` events fire webhooks that flip CRM rows to `replied` or `bounced` in real time, save an excerpt, and post a Telegram notification.

## Why it matters

Replaces a couple of weeks of integration work with a few hours. State changes are real-time instead of "next IMAP poll", so dashboards and operator inboxes are always current.

## End-to-end

1. Sign up at agentmail.to, get `AGENTMAIL_API_KEY` and a default inbox.
2. `pip install agentmail`; instantiate the client.
3. Set `AGENTMAIL_WEBHOOK_SECRET` and register webhook URL `https://<host>/api/webhooks/agentmail?token=<secret>` for events `message.received`, `message.bounced`.
4. Outbound: capture returned `message_id` and `thread_id` per send. For replies use `messages.reply()` so `In-Reply-To` headers stay correct.
5. Webhook handler: verify `?token=`, look up deal by recipient + `thread_id`, flip status, save excerpt, fire Telegram notification.
6. Treat `event_id` as the idempotency key — replays are common.

## Gotchas

- Never put the webhook secret in the payload — keep it in the query string and verify on the server. Webhook replays are routine; build the handler idempotent on `event_id` from day one.

<hr/>
<hr/>

## Tools

- AgentMail account
- Public webhook endpoint (Cloudflare tunnel works for dev)
- CRM table keyed by `(recipient, thread_id)`
