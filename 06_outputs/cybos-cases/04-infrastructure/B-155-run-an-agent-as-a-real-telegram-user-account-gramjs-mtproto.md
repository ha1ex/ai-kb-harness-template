---
id: B-155
tier: B
category: "Infrastructure"
kind: pattern
title: "Run an agent as a real Telegram user account (gramjs / MTProto)"
subtitle: "Problem solved: Telegram bots can't sit invisibly in arbitrary group chats and can't see message history — limiting any agent that should \"live\" in work chats."
source: https://www.cybos.ai/cases/B-155
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · engineer"
type: case
version: v0.1
---
# Run an agent as a real Telegram user account (gramjs / MTProto)

> Problem solved: Telegram bots can't sit invisibly in arbitrary group chats and can't see message history — limiting any agent that should "live" in work chats.

## What

Connect an agent to Telegram as a regular user account (not a bot) using `gramjs` over MTProto. The agent gets a real phone number, joins groups as a member, sees full history, and answers in-line. For outbound messages to people the operator hasn't pre-authorized, the agent drafts and a separate bot posts the draft for human approval before sending.

## Why it matters

Bots are second-class citizens on Telegram: they can't read group history before being added, can't be silent observers, and are visibly tagged. A user-account bridge makes the agent indistinguishable from a human team member in a work chat. The reported use case: an agent answers in shared work chats directly; for any new outbound conversation, drafts go through a side bot so the founder reviews before send.

## End-to-end

1. Register a new app at my.telegram.org as a regular user app — get `API_ID` and `API_HASH`.
2. Provision a fresh phone number (a service like telnyx.com works) for the agent's account.
3. Auth the account once with `gramjs` and persist the resulting `StringSession` in a `TG_SESSION` env var.
4. Wire the bridge: gramjs listens via `client.addEventHandler` for `NewMessage`, pipes the message into your agent harness (chat-completions API), and posts the reply back via the same gramjs session.
5. For outbound to people not yet in the trusted whitelist: route through a separate Telegram bot that posts the draft + an inline approval button.
6. Buy Telegram Premium for the account — it raises rate limits and reduces flag risk in the first weeks.
7. In the first day or two, keep volume low and vary message phrasing to avoid spam-pattern detection.

## Gotchas

- User-account access exposes the agent to a much larger prompt-injection surface: any message in any group it joins becomes potential input. Pair with a researcher/executor split (see B-058 / defense-in-depth pattern) — the gramjs listener should not have shell or write access; route output through a sanitizing gateway.

<hr/>

## Tools

- Node.js / TypeScript with `gramjs`
- Telegram `API_ID` + `API_HASH`
- A phone number for the account (e.g. telnyx.com)
- Your agent harness or chat-completions endpoint behind the bridge
