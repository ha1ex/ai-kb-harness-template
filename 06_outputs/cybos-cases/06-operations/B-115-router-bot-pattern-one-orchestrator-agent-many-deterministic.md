---
id: B-115
tier: B
category: "Operations"
kind: pattern
title: "Router-bot pattern — one orchestrator agent, many deterministic worker bots"
subtitle: "Problem solved: Exposing multiple independent LLM agents directly to clients is risky and expensive; concentrate all decisioning in one owner-only orchestrator, and use plain deterministic bots as execution surfaces inside client chats."
source: https://www.cybos.ai/cases/B-115
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · agency lead · anyone running multi-client ops"
type: case
version: v0.1
---
# Router-bot pattern — one orchestrator agent, many deterministic worker bots

> Problem solved: Exposing multiple independent LLM agents directly to clients is risky and expensive; concentrate all decisioning in one owner-only orchestrator, and use plain deterministic bots as execution surfaces inside client chats.

## What

A single Claude Code / OpenClaw "router" agent that only the owner talks to. The router creates and supervises a fleet of plain deterministic bots (no LLM at the surface) that sit in client Telegram chats, scrape data, send messages, set reactions, transcribe calls, generate documents. All reasoning and decisioning happens in the router; the bots are dumb executors.

## Why it matters

Cuts blast radius: clients cannot prompt-inject your agents, because the agents they see have no model. Cuts cost: only one LLM-powered agent runs continuously, not N. Preserves auditability: every decision is logged in one place. Pairs naturally with a three-layer memory pattern (rolling summaries of recent discussions, project facts, nightly recombination).

## End-to-end

1. Stand up one OpenClaw / Claude Code instance as the router. Only you talk to it.
2. For each client surface (Telegram group, Slack channel, ticket queue), create a deterministic bot — Python script or off-the-shelf bot framework, no LLM call at the chat surface. Its job: take inbound, push to the router; take router instructions, post to the surface.
3. Give the router read access to project context: chat archives, call transcripts, documentation, code. The router builds a three-layer memory:

- **Recent-summary layer** — rolling summaries of last N discussions, used when creating tasks in context.
- **Project-facts layer** — durable facts the router can query.
- **Nightly recombination layer** — overnight pass where the router re-chews everything it knows and asks itself questions, surfacing connections.

1. Wire the bots so they can do: collect data on the server, send a templated message, react to messages, schedule calls, transcribe audio, generate documents. Each bot has zero discretion.
2. When a bot encounters anything ambiguous (a non-templated message, an off-script question), it hands off to the router for a decision.
3. Iterate the memory layers — nightly recombination is the most experimental piece; start with a simple "summarize today's project events, ask 3 questions, store answers" loop.

## Gotchas

## The opposite pattern — one LLM-powered agent per client, talking directly to the client — works at toy scale (one operator reported running it in 3-way chats: client + agent + owner-as-supervisor) but breaks at the first real client load. Putting Claude in front of a stranger's questions exposes you to prompt injection, runaway token spend, and reputation risk from hallucinated commitments. Keep the LLM owner-side; keep the surface deterministic.

## Tools

- OpenClaw or Claude Code as the router runtime.
- Telegram Bot API / Slack API / whatever surface bots you need; a small Python or Node service per surface.
- Project context: meeting transcripts, docs, code, chat history accessible to the router.
