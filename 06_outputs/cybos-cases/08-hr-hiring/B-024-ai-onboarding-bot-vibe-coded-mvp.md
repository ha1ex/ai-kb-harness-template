---
id: B-024
tier: B
category: "HR & hiring"
kind: workflow
title: "AI Onboarding Bot (vibe-coded MVP)"
subtitle: "New hires ask \"what's our Slack convention?\" for the first month. A chatbot over the Welcome Package + tool docs answers it."
source: https://www.cybos.ai/cases/B-024
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "HR lead · ops lead"
type: case
version: v0.1
---
# AI Onboarding Bot (vibe-coded MVP)

> New hires ask "what's our Slack convention?" for the first month. A chatbot over the Welcome Package + tool docs answers it.

## What

A chatbot a new hire interacts with during their first weeks — answers "what tools do we use", "where do I get access to X", "who do I ask about Y", "what's our async-first norm". Pulls from the company's Welcome Package + onboarding checklist + tool stack docs. Vibe-coded in a weekend on Base44 / Lovable / Vibe Coder; no infra team needed.

## Why it matters

Compresses new-hire ramp-up from 3 months to 2–4 weeks at companies that have already digitized their onboarding docs. Removes the recurring "what's our Slack convention?" thread from every hire and shifts the manager's first month from doc-pointing to actual coaching.

## End-to-end

1. Consolidate onboarding artifacts into one folder: Welcome Package, 5-stage checklist, tool stack table (tool → purpose → access URL), org chart, FAQ.
2. Pick a no-code agent platform (Base44, Lovable, Vibe Coder, or a Claude Code skill).
3. Point the platform at the folder as a RAG source.
4. Add the company's communication SLAs and async-first culture statement as a system prompt.
5. Generate a chat surface (web or Telegram bot).
6. Pilot with the next 1–2 new hires; capture every question the bot couldn't answer.
7. For each miss: add a doc, don't rewrite the bot. The bot improves as the docs improve.

## Gotchas

- Don't try to make the bot omniscient. Cap scope at first-30-days questions; route anything else to a named human (buddy, manager). Bots that pretend to know everything erode trust on day three when they hallucinate an access URL.

<hr/>

## Tools

- A no-code agent platform OR Claude Code + a simple web UI
- Consolidated onboarding docs (Welcome Package + checklist)
- Telegram bot OR web chat surface
