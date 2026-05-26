---
id: B-114
tier: B
category: "Operations"
kind: pattern
title: "Browser-agent stack — assign Arc / Comet / Atlas / Claude-for-Chrome by task type"
subtitle: "Problem solved: No single agentic browser is good at everything; operators waste time discovering which one fails on research vs. logged-in scraping. A simple role assignment per browser captures the working stack."
source: https://www.cybos.ai/cases/B-114
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "operator · founder · ops analyst"
type: case
version: v0.1
---
# Browser-agent stack — assign Arc / Comet / Atlas / Claude-for-Chrome by task type

> Problem solved: No single agentic browser is good at everything; operators waste time discovering which one fails on research vs. logged-in scraping. A simple role assignment per browser captures the working stack.

## What

Instead of betting on one agentic browser, run all four and route by task. Arc is the everyday browser. Comet handles browser-use automations ("download every Uber invoice paid on the corp card for this date range"). Atlas does research and planning (returns clean Google Sheets). Claude-for-Chrome handles sites that require login (Twitter/X, LinkedIn, internal portals) — Haiku by default, escalate to Opus when it fails. Manus is the specialist for travel planning.

## Why it matters

Each browser agent has hard limits: Comet is great at structured ops but weak on research synthesis; Atlas is the inverse; Claude-for-Chrome is the only one with reliable session-cookie behavior on login-walled sites; pure-headless tools choke on JS-heavy pages. The cost of trying them in series ("Comet didn't work, let me try Atlas") on every task is real; the role assignment removes that branch.

## End-to-end

1. Install all four browser agents alongside Arc as the regular browser.
2. Default the route by task type: structured-ops → Comet; research/planning → Atlas; login-required scrape → Claude-for-Chrome; travel → Manus.
3. When an agent gets stuck on a state, screenshot the screen and paste it back as new context — agents recover faster from visual cues than from log scrolling.
4. For repeating tasks (weekly invoice pulls, daily competitor scans), save the task as a named command and schedule it.
5. When normal navigation stalls on a JS-heavy site, explicitly tell the agent to try JS injection — it won't try this on its own.
6. Re-evaluate the routing every quarter; Anthropic's Dec-2025 Claude-for-Chrome release closed gaps that previously forced operators back to Comet.

## Gotchas

## Browser agents silently freeze on stuck states more often than they error. The fix is operator-side: keep an eye on the tab, screenshot when stuck, paste back, and explicitly ask the agent to retry the navigation differently (JS injection, alternate selector). Don't trust "task complete" without spot-checking the artifact.

## Tools

- Arc (everyday browser)
- Comet (browser-use automation)
- Atlas (research/planning)
- Claude-for-Chrome (login-walled scrapes)
- Manus (travel planning vertical)
- A monthly or annual subscription on each that you actually use
