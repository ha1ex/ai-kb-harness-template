---
id: C-120
tier: C
category: "Infrastructure"
kind: tactic
title: "Cheap dedicated phone numbers for army-of-Telegram-accounts agents"
subtitle: "Problem solved: running multiple agent personas on Telegram requires distinct phone numbers; Google Voice is US-only and one-per-real-number; commercial SIM management is overkill."
source: https://www.cybos.ai/cases/C-120
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
type: case
version: v0.1
---
# Cheap dedicated phone numbers for army-of-Telegram-accounts agents

> Problem solved: running multiple agent personas on Telegram requires distinct phone numbers; Google Voice is US-only and one-per-real-number; commercial SIM management is overkill.

## What

Sonetel sells $2/mo US numbers (3-year prepay ≈ $70) with SMS forwarding to email and call forwarding — cheapest path to "one phone per agent persona" when Google Voice isn't an option (Google Voice requires an existing real US number to register against and gives one virtual number per real number). Risk: provider revoking a number breaks everything downstream tied to that Telegram account.
