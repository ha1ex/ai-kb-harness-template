---
id: B-074
tier: B
category: "Infrastructure"
kind: pattern
title: "Agent passport + blast-radius guardrail"
subtitle: "\"Who runs this agent?\" devolves into a Slack guess when something breaks. A passport + per-action blast-radius classification makes policy concrete."
source: https://www.cybos.ai/cases/B-074
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · ops lead · anyone giving an agent write access"
type: case
version: v0.1
---
# Agent passport + blast-radius guardrail

> "Who runs this agent?" devolves into a Slack guess when something breaks. A passport + per-action blast-radius classification makes policy concrete.

## What

Every agent that takes real-world actions has an "agent passport" — a small markdown file declaring: owner (named human), scope (which resources, narrower than owner's own scope), tools (allow-list), expiry (date the passport revokes), revoke command (one shell line). Pair this with a blast-radius classification on each tool call: `allow / ask / deny / log / escalate / learn`. Compensation grows with blast radius — low-blast actions auto-run; medium-blast actions log; high-blast actions require human approval; destructive actions need a separate dual-control.

## Why it matters

Agents that can email customers, write to shared sheets, push code, or move money need explicit accountability. Without a passport, "who runs this agent" devolves into a Slack guessing game when something breaks. The blast-radius taxonomy makes the policy debate concrete: deny on writes to production DB, ask on customer emails, log on internal Slack posts, allow on read-only queries.

## End-to-end

1. **For each agent, create `passports/{agent}.md`** with: name, owner email, scope (resource list), tools (allow-list), expiry date, revoke command.
2. **Classify each tool call** at design time into one of the 6 blast-radius categories. Document in the passport.
3. **In the agent runner, enforce the classification**: ask blocks for human reply; deny rejects; log writes to the audit trail; escalate notifies a secondary owner.
4. **Set expiry to ≤90 days** for any agent with write access. Force re-approval.
5. **Implement revoke as one command** the owner can run from their terminal — pull the env var, rotate the key, terminate the process.
6. **Audit passports quarterly**: are owners still around? Do scopes still match what the agent actually does?

## Gotchas

- "We'll add the passport later" is how shadow agents accumulate. New agent first → passport before any production access; no exceptions.

## Tools

- Versioned passport directory in your vault
- Agent runner that respects classification metadata
- A secrets manager that supports per-agent keys with revocation
