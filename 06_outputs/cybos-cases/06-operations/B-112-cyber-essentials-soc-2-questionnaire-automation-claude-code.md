---
id: B-112
tier: B
category: "Operations"
kind: workflow
title: "Cyber Essentials / SOC 2 questionnaire automation — Claude Code + Playwright + Vanta"
subtitle: "Problem solved: Annual SOC 2 / Cyber Essentials renewals burn ops-lead weeks reconciling Vanta evidence against customer portal forms; Claude Code with browser MCPs fills the questionnaire from Vanta autonomously, gated by human review."
source: https://www.cybos.ai/cases/B-112
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "CTO · ops lead · founder owning compliance"
type: case
version: v0.1
---
# Cyber Essentials / SOC 2 questionnaire automation — Claude Code + Playwright + Vanta

> Problem solved: Annual SOC 2 / Cyber Essentials renewals burn ops-lead weeks reconciling Vanta evidence against customer portal forms; Claude Code with browser MCPs fills the questionnaire from Vanta autonomously, gated by human review.

## What

Claude Code drives two browser MCPs in parallel — Playwright MCP for form-filling and visual tests on the customer's compliance portal, ChromeDev MCP for anything requiring saved Google auth (Vanta dashboards, GSC, deep-research browsing). The agent reads Vanta evidence (via API where available, via ChromeDev MCP where Vanta's API doesn't cover the field), maps each evidence item to the right questionnaire field on the customer portal, drafts answers, fills the form, and surfaces gaps for human review.

## Why it matters

The same operator who burned a week per annual renewal reports it dropped to a focused session. Generalizes across compliance frameworks (SOC 2, Cyber Essentials, ISO 27001 questionnaire surfaces) and across customer portals — any vendor that hands you a Google Form / OneTrust / TrustArc questionnaire is automatable.

## End-to-end

1. Install Playwright MCP and ChromeDev MCP in your Claude Code config. Use Playwright for general form-filling and visual tests; use ChromeDev when the target site requires a logged-in Google session (Vanta dashboards, Drive-backed exports).
2. Pull all available evidence from Vanta via its API to a local working dir.
3. For Vanta fields not exposed via API, have Claude Code use ChromeDev MCP to navigate the dashboard and scrape the missing values.
4. Open the customer's questionnaire portal in Playwright MCP. Snapshot the form fields.
5. Ask Claude Code to draft answers per field, citing the Vanta evidence ID for each. Anything without a matching evidence item gets flagged.
6. Human-review the draft answers. Edit in place.
7. Have Claude Code submit the form through Playwright MCP. Screenshot the confirmation.

## Gotchas

## Playwright cannot persist Google authentication — every fresh Playwright session is logged-out. Use ChromeDev MCP for anything that requires staying signed into a Google identity (Vanta SSO via Google Workspace is the classic case). Getting programmatic logins to work reliably took the originating operator a long while — the browser MCPs are still flaky enough that you should expect to babysit the first run.

## Tools

- Claude Code with both Playwright MCP and ChromeDev MCP installed.
- Active Vanta (or equivalent) tenant for evidence.
- A pre-existing SOC 2 / Cyber Essentials / ISO posture — this automates the *reporting*, not the controls.
