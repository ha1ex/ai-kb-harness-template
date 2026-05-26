---
id: B-153
tier: B
category: "Infrastructure"
kind: pattern
title: "Use API keys, not consumer setup-token, for any agent automation"
subtitle: "Problem solved: Operators discover the subscription-token loophole, run agents on it, and lose the underlying account when Anthropic enforces ToS."
source: https://www.cybos.ai/cases/B-153
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · engineer"
type: case
version: v0.1
---
# Use API keys, not consumer setup-token, for any agent automation

> Problem solved: Operators discover the subscription-token loophole, run agents on it, and lose the underlying account when Anthropic enforces ToS.

## What

`claude setup-token` produces an OAuth token tied to a Pro/Max consumer subscription. Pasting it into an agent harness flips a per-call API bill (often $50-$100/day) into a flat $200/month. Anthropic's Consumer Terms ban automated use of consumer access; enforcement bans started Jan 9, 2026. The disciplined pattern: keep the subscription for manual UI work; bill all automation to an API key.

## Why it matters

A founder reported $90 of API spend in a single day before discovering the loophole. The cost savings are real, but the downside is account loss — including loss of any Claude Code skills/data tied to that account, plus the cited "hire filter" emerging among ops-heavy teams that won't hire a dev whose primary account is banned.

## End-to-end

1. For any production agent (cron, webhook, multi-tenant deploy, anything not driven by a human keystroke), issue a real API key from console.anthropic.com and bill it.
2. Reserve the subscription token strictly for the interactive Claude Code terminal you use yourself.
3. If you cannot move off subscription today, harden ban-risk: add request jitter, cap rate per minute, keep an OpenRouter key as failover, hold a spare account on a clean IP/email.
4. Watch Codex separately — OpenAI has not enforced its equivalent ToS yet, so it currently absorbs more automation, but plan as if that changes.
5. After June 2026 -p CLI cost changes, re-validate that the headless flag still bills the way your harness assumes.

## Gotchas

- Hetzner and similar datacenter IP ranges raise ban probability ~20-30%/year on subscription tokens even with mitigations — don't combine datacenter IP, cron heartbeat, and consumer auth.

<hr/>

## Tools

- Anthropic API key + billing on file
- OpenRouter account for failover
- Egress filter (UFW) and rate limiter on any always-on host
