---
id: B-061
tier: B
category: "Strategy & leadership"
kind: framework
title: "AI Governance Framework"
subtitle: "A CEO showed API tokens via DM in front of 40 people. Four artifacts (policy + registry + approval + review) prevent the embarrassing class of incidents."
source: https://www.cybos.ai/cases/B-061
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "founder · head of security/legal · head of transformation"
type: case
version: v0.1
---
# AI Governance Framework

> A CEO showed API tokens via DM in front of 40 people. Four artifacts (policy + registry + approval + review) prevent the embarrassing class of incidents.

## What

A minimal governance pack covering the four things that actually matter at 30–100 person scale: (1) an AI policy document everyone reads on Day 1, (2) a current registry of AI tools the company uses (with owner + data scope per tool), (3) an approval process for new AI tools with sensitive data, (4) a quarterly AI review cadence. Skip the 200-page enterprise framework; ship the four artifacts.

## Why it matters

A large fintech and an AI-marketing firm both flagged this as the gap that lets shadow AI usage outpace policy. Concrete failure modes: an exec showing API tokens via Telegram DM in front of 40 people; PII pouring into a free-tier chatbot; AI-generated code shipping without IP review. The pack costs <2 weeks to write and prevents a quarter's worth of cleanup work later.

## End-to-end

1. **Write the AI Policy** (1–2 pages): allowed data classes per tool tier, banned tools, escalation contact, incident-report path.
2. **Build the AI Tools Registry** as a single markdown table: tool, owner, data classes processed, contract type (per-seat, API, free), expiry/renewal. Update on every new tool.
3. **Define the approval process**: who reviews new tool requests (typically: head of security + head of the requesting function), SLA (3 business days), criteria (PII handling, data residency, audit logs).
4. **Set up a quarterly AI review**: 90 minutes. Review registry, incidents, adoption metrics, policy updates.
5. **Add InfoSec from the design phase** of every new AI project — review before coding, not after deployment.
6. **For regulated industries**, add: a PII control report (quarterly), preventive PII-outbound control (gateway / DLP), AI review of CI/CD vulnerabilities, IP strategy for AI-generated code.

## Gotchas

- A 200-page framework no one reads is worse than a 2-page policy everyone reads. Lead with the four artifacts; expand only when a real incident demands it.

## Tools

- A single markdown file for the policy
- A registry (markdown table or a row per tool in a sheet)
- A named owner per AI tool
- A quarterly calendar entry
