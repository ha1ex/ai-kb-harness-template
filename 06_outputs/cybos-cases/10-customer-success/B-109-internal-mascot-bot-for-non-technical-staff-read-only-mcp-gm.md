---
id: B-109
tier: B
category: "Customer success"
kind: workflow
title: "Internal mascot bot for non-technical staff — read-only MCP + Gmail-draft-only write"
subtitle: "Problem solved: Production-floor and non-technical staff at small / mid orgs flood the founder / CTO with how-to questions. A branded mascot bot in Telegram and WhatsApp, running on the founder's own Claude subscription, with strictly read-only MCP tooling (cannot write to CRM / inventory; can only create Gmail drafts), absorbs the question flow."
source: https://www.cybos.ai/cases/B-109
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · CTO · ops lead at a 30-100 person company"
type: case
version: v0.1
---
# Internal mascot bot for non-technical staff — read-only MCP + Gmail-draft-only write

> Problem solved: Production-floor and non-technical staff at small / mid orgs flood the founder / CTO with how-to questions. A branded mascot bot in Telegram and WhatsApp, running on the founder's own Claude subscription, with strictly read-only MCP tooling (cannot write to CRM / inventory; can only create Gmail drafts), absorbs the question flow.

## What

A named, branded bot sits in Telegram and WhatsApp for internal staff. Internally it is a Claude Code agent with a strict business-context prompt, exposed via MCP for custom tools (because Codex needs MCP to receive custom tools), with two hard rules: every MCP tool is read-only, except Gmail — and even there the only allowed write is creating a draft, never sending. The bot has an analyzed feedback loop where the operator reviews chat transcripts and refines instructions, skills, and tools.

## Why it matters

Two underrated wins: (1) the bot runs on the founder's existing Claude subscription rather than per-seat enterprise tooling, so cost stays predictable; (2) by being branded as a "mascot" rather than "AI assistant", non-technical staff actually use it — and importantly stop pinging the founder. The feedback loop on transcripts is the multiplier: instructions improve weekly.

## End-to-end

1. Pick a name, mascot image, and personality consistent with the company brand. Non-technical adoption hinges on this more than on capability.
2. Stand up a Claude Code agent with a tight business-context system prompt (what the company does, who works there, what they're allowed to ask about).
3. Expose custom tools via MCP — Codex specifically requires MCP for tool access, so the indirection is forced anyway.
4. **Hard rule:** every MCP tool is read-only against the CRM, inventory, internal docs. No write tools that affect business state.
5. The one exception: Gmail draft creation. The bot can compose a draft email but cannot send. The human reviews and sends.
6. Wire the bot into Telegram and WhatsApp. Telegram bot framework is straightforward; WhatsApp needs an unofficial-API bridge or a Business API account.
7. Set up a semi-automated feedback loop: weekly, an operator (or another agent) reads transcripts, identifies where the bot missed, and updates instructions, skills, or MCP tool descriptions accordingly.

## Gotchas

## Tokens come out of the founder's personal subscription budget. One operator reported the Opus-quality bar is non-negotiable for production use; cheaper models (Gemini via Vertex at half the price was tested) "made things multiple times worse and still expensive". Budget for one $200/mo seat per ~10-20 active staff, and expect to keep upgrading subscription tier as usage grows. Second gotcha: Telegram does not have native threading (unlike Slack), so multi-turn session management for many simultaneous staff users is harder than Slack equivalents.

## Tools

- Claude Code on a personal / company Max subscription.
- Telegram bot account; WhatsApp Business API or bridge.
- MCP servers wrapping internal data sources, each strictly read-only.
- Gmail OAuth scoped to draft-creation only.
