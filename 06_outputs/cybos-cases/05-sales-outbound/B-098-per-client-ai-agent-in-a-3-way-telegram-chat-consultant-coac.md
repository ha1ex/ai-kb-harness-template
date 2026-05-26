---
id: B-098
tier: B
category: "Sales & outbound"
kind: workflow
title: "Per-client AI agent in a 3-way Telegram chat — consultant / coach delivery"
subtitle: "Problem solved: Solo consultants, coaches, and trackers scale poorly past 5 clients; a dedicated agent per client inside a 3-party Telegram group runs the recurring touchpoints while the founder stays in the loop."
source: https://www.cybos.ai/cases/B-098
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · consultant · coach · solo CS"
type: case
version: v0.1
---
# Per-client AI agent in a 3-way Telegram chat — consultant / coach delivery

> Problem solved: Solo consultants, coaches, and trackers scale poorly past 5 clients; a dedicated agent per client inside a 3-party Telegram group runs the recurring touchpoints while the founder stays in the loop.

## What

Each client gets their own agent — own workspace, own system prompt — inside a Telegram group containing **client + founder + bot**. The bot leads the conversation. When it starts hallucinating, the founder jumps in to correct. The recurring cadence: one monthly strategic call sets the month's plan; the bot then runs weekly sprint planning with the client through the same chat.

## Why it matters

Consultants and coaches usually plateau at 5-7 clients because every relationship demands recurring 1:1 time. The 3-way config keeps the founder in the loop just enough to catch drift while letting the bot absorb the weekly cadence. The founder can push the agent further toward autonomy precisely because they're watching the chat — corrections happen in seconds, not at the next session.

## End-to-end

1. Pick an agent harness that supports isolated per-client workspaces (OpenClaw is the reference deployment).
2. For each client: provision one agent instance with its own system prompt encoding their business, goals, and prior month's decisions.
3. Create a 3-party Telegram group per client (client + founder + bot).
4. Run the monthly cadence on Zoom or call; have the agent write the month's plan into its own workspace.
5. The bot runs weekly sprint check-ins in the group chat; founder watches passively.
6. When the bot hallucinates or drifts, founder posts a correction in the group — the correction becomes context for the next interaction.

## Gotchas

- **Don't expose multiple agents to the same client.** One trusted agent per client keeps decision-making auditable; a panel of agents in a client chat dilutes responsibility and confuses the client. The 3-way config (one bot, one founder, one client) is the load-bearing pattern.

<hr/>

## Tools

- Agent harness with per-instance workspace isolation (OpenClaw or equivalent)
- Telegram bot API
- A per-client system prompt template
