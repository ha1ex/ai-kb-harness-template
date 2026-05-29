---
id: B-010
tier: B
category: "Marketing & content"
kind: workflow
title: "Auto-publish to Netlify with OG preview to Telegram"
subtitle: "\"I'll send the link tomorrow\" becomes \"you'll have it in 30 seconds\" — deployed, branded, with a preview card."
source: https://www.cybos.ai/cases/B-010
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "Founder · marketing lead · anyone shipping fast internal demos or microsites"
type: case
version: v0.1
---
# Auto-publish to Netlify with OG preview to Telegram

> "I'll send the link tomorrow" becomes "you'll have it in 30 seconds" — deployed, branded, with a preview card.

## What

A skill that takes a vibe-coded HTML artifact and: (1) deploys it to Netlify, (2) generates a styled web-preview cover image in the brand style, (3) sends the link to the founder's Telegram saved-messages with the cover card preview. Single voice prompt: "Deploy this to Netlify in our brand style. Make a web cover preview card. Send the link to my saved messages." A "scan for leaked secrets before deploy" guardrail runs first.

## Why it matters

Internal demos go from "I'll send the link tomorrow" to "you'll have the link in 30 seconds, with a preview card that won't look like a 2010 phpBB forum."

## End-to-end

1. Wire a Netlify MCP / personal access token.
2. Wire a Telegram MCP with access to your saved-messages chat.
3. The brand-banner skill (#26) is a prerequisite — the cover comes from it.
4. The deploy skill:

- Reads the target HTML directory
- Runs a `grep` / `gitleaks` pass for obvious secret patterns; aborts if found
- Calls Netlify deploy API, captures the URL
- Generates an OG image (1200×630) via the brand-banner skill
- Posts the URL + OG preview to Telegram saved-messages

1. Always include a "no posting to public channel" guardrail in the skill's rules — saved-messages only, unless the user explicitly asks for a channel.

## Gotchas

- The "no posting to public channel" guardrail is the case-defining safety. One accidental public post of an internal demo with API keys in the URL kills the pattern for the whole team.

<hr/>

## Tools

- Netlify account + MCP / PAT
- Telegram MCP
- Brand-banner skill (#26)
- A secret-scanner like `gitleaks` (or just a regex pass for AWS / OpenAI key patterns)
