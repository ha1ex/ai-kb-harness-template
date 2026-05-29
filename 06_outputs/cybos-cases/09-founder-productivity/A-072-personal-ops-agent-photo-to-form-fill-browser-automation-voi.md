---
id: A-072
tier: A
category: "Founder productivity"
kind: workflow
title: "Personal-ops agent — photo-to-form-fill + browser automation + voice-call chores"
subtitle: "Problem solved: Founders drown in admin paperwork — insurance forms, parking tickets, hotel bookings, food orders, voice calls to service providers, quarterly tax filings. A personal agent with vision OCR + browser automation + voice-call orchestration parses tasks, explains them, and on approval executes — reclaiming minutes per task across dozens per month."
source: https://www.cybos.ai/cases/A-072
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · founder's spouse · operator"
type: case
version: v0.1
---
# Personal-ops agent — photo-to-form-fill + browser automation + voice-call chores

> Problem solved: Founders drown in admin paperwork — insurance forms, parking tickets, hotel bookings, food orders, voice calls to service providers, quarterly tax filings. A personal agent with vision OCR + browser automation + voice-call orchestration parses tasks, explains them, and on approval executes — reclaiming minutes per task across dozens per month.

## What

A personal agent harness (OpenClaw is the reference deployment) sits in your Telegram, accepts a photo or text or voice message, and routes to one of several execution surfaces: **Gemini Vision OCR** for parsing forms, **browser automation** for filling and submitting web forms, **ADB into a physical Android phone** for app-only workflows that have no web equivalent (food delivery, ride-hailing), and a **voice-call stack** (Vapi + Twilio + Deepgram + GPT-4o-mini + ElevenLabs) for outbound calls to humans on the other end. User data (claim numbers, addresses, payment cards via 1Password shared vault) lives in the agent's memory. Every action is proposed first, executed on operator "go".

## Why it matters

Concrete tasks operators report completed end-to-end through this stack: insurance-form completion from a phone photo; parking-ticket auto-payment on a municipal site; first hotel booking from chat ("my agent booked me a hotel today for the first time"); DoorDash water reorder by saying "order water"; quarterly CA Sales Tax filing **"every quarter just in 2 clicks"**; outbound calls to hair salons and kids' activity clubs with transcript delivered back to Telegram. Each task is small. The pattern aggregates across dozens per month into real recovered hours — and the agent doesn't forget paperwork the way humans do.

## End-to-end

1. **Pick a host.** Mac mini or VPS — not a laptop. The agent needs to be always-on to be useful; if it dies when you close the lid, you'll stop trusting it. Most operators run a cloud VPS for safety isolation; one runs a Mac mini for cost and IP locality.
2. **Wire the messaging interface.** Telegram bot or a regular (non-bot) Telegram account driven by the harness — your single inbox for personal-ops requests.
3. **Vision OCR for forms.** Gemini Vision API (or equivalent). Pipe the photo, get back structured fields. The agent then maps fields to user-data memory ("name → from profile", "claim number → from claim memory") and explains what's needed before filling.
4. **Browser automation for web forms.** Chrome via Playwright is the standard. Agent navigates, fills, proposes the final pre-submit state, executes on "go". Credentials live in 1Password shared vault, not in the harness's environment.
5. **ADB for app-only surfaces.** When the workflow only exists in a mobile app (food delivery is the canonical example), connect a physical Android phone via ADB to the host. Agent takes screenshots, sends taps and text via xdotool-equivalent commands. Gemini Vision interprets the screenshots; coordinates are the failure-prone part.
6. **Voice-call stack for outbound human calls.** Reference layering: **Vapi** (orchestration) → **Twilio** (telephony / phone number) → **Deepgram Nova-2** (speech-to-text) → **GPT-4o-mini** (brains, no webhook — direct) → **ElevenLabs** (cloned voice) → notification back to Telegram with transcript. Add an explicit "hang up sharply after intent is fulfilled" instruction — otherwise the agent lingers on goodbyes.
7. **Memory file for user data.** Single MEMORY.md (or equivalent) with name, addresses, claim numbers, family details. Loads into every session. Update as you go — don't wait for the agent to ask.
8. **Approval gate by default.** Every action is proposed; the operator types "go" or equivalent. Fully-autonomous mode is for the operator who has spent months tuning a single workflow (CA Sales Tax filing is the reference). Don't start there.

## Prompts

Voice-call stack:

```
`Vapi (orchestration)
 ↓
Twilio (telephony)
 ↓
Deepgram Nova-2 (speech transcription)
 ↓
GPT-4o-mini (brains, direct — no webhook)
 ↓
ElevenLabs (cloned voice)
 ↓
Notification to Telegram with transcript
`
```

Voice-call discipline rule: instruct the agent to **hang up sharply after intent is fulfilled** — without this, the agent lingers on goodbyes and burns minutes.

DoorDash credentials handoff:

```
`1Password shared vault → OpenClaw connector
Add DoorDash credentials to the shared vault
Telegram: "order water" → agent logs in, finds past orders,
 recreates cart, tips, confirms
`
```

## Gotchas

- **Coordinate drift on ADB phone screenshots.** Vision models often return coordinates that are slightly off; the agent taps the wrong UI element. Mitigations: use a vision model tuned for grounding (Holo2-8B is one community recommendation); keep the phone screen at consistent zoom; avoid keyboard-overlapping fields.
- **Linger on voice-call goodbyes.** Without the explicit "hang up sharply" instruction, the agent stays on the line saying thanks for minutes. Hard rule in the system prompt.
- **Don't run a persistently-authed personal agent on your local laptop.** OAuth-bearing always-on agents have wide blast radius. Cloud-host with isolated keys; treat as a separate machine even if you trust yourself.
- **Public-facing personal agents are higher prompt-injection risk.** Anything that reads inbound email or messages from non-trusted senders needs a separate prompt-injection defense layer.
- **"Who pays the fines?"** — operator gotcha from the chat: if the agent files your spouse's quarterly sales tax wrong, who pays the penalty? Approval gate, double-check before submit, audit log of every filing — non-optional for anything with legal consequences.
- **Per-task time savings are small; the pattern is the win.** Don't expect any single task to be a "this is amazing" moment. The wins compound across dozens of tasks per month.

<hr/>

## Tools

- OpenClaw (or equivalent personal-agent harness) on Mac mini or VPS
- Telegram (bot or user account driven by the harness)
- Gemini Vision API — form OCR from photos
- Chrome + Playwright — web-form automation
- ADB + a physical Android phone — app-only workflows (food, ride-hailing)
- Vapi + Twilio + Deepgram + ElevenLabs + OpenAI key — outbound voice-call stack
- 1Password shared vault — credentials handoff (not env-files)
- Sonetel.com or Google Voice — phone number for the voice-call stack (~$2/mo for Sonetel, free US-only for Google Voice)
