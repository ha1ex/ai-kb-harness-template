---
id: A-042
tier: A
category: "Founder productivity"
kind: tactic
title: "Mobile Claude Code via Telegram"
subtitle: "Problem solved: Walks, airports, school pickup — the founder's AI is laptop-only. A Telegram bridge makes the full vault phone-reachable, and 2026 produced a full catalog of ready-to-use bridges."
source: https://www.cybos.ai/cases/A-042
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Founder · mobile-heavy C-level · anyone who thinks on the move"
type: case
version: v0.1
---
# Mobile Claude Code via Telegram

> Problem solved: Walks, airports, school pickup — the founder's AI is laptop-only. A Telegram bridge makes the full vault phone-reachable, and 2026 produced a full catalog of ready-to-use bridges.

## What

A Telegram bot that wraps Claude Code (or Codex). The bot listens to your messages and forwards them as prompts to a Claude Code instance running on your workstation or a VPS, with the workspace folder mounted as context. From the phone, you talk to your full personal OS — your vault, your CRM, your strategy folder, your skills library — as if you were sitting at the laptop. Voice messages are transcribed on the bridge (Whisper) and forwarded as prompts.

By mid-2026 there's a public catalog of ready bridges: a community Telegram bot starter (`claude-code-telegram`), a productized commercial mobile client, [Concilium](https://concilium.dev/)-ecosystem `happy.engineering` reference deploys, lightweight wrappers (`ductor`, `ccbot`, `takopi`), and one operator's self-built personal-OS Telegram layer. The Codex Remote Control (Claude mobile app + claude.ai/code) provides a vendor-native equivalent for mobile pickup of laptop-started sessions. Pick by your security tolerance, multi-platform needs, and willingness to self-host.

## Why it matters

Founder mental load is mobile-first. The walk-to-the-coffee-shop, the airport gate, the school pickup — none of those moments have a laptop. Without a phone bridge, the founder's AI is laptop-only and dies in mobile mode. With the bridge, the personal CRM is reachable 24/7, the strategy folder is one voice prompt away, and the team can be DM'd from inside the same context. Multiple founders in the source corpus cite this as the single biggest "ergonomic shift" of 2026. The threshold question shifts from "should I bother capturing this thought?" to "saved".

The 2026-Q1 catalog evolution matters because the build-vs-buy line moved. Self-building a ~200-line Python bridge still takes a day; ready-to-install variants drop that to under an hour, and the OpenClaw / Paperclip ecosystem now ships sandboxed defaults so the highest-blast-radius surface in your stack ships with sane perimeters.

## End-to-end

1. **Pick or build your bridge.** The minimal self-built variant is ~80–200 lines of Python (`python-telegram-bot` + `subprocess` to invoke `claude -p` with the right working directory). Production-grade alternatives in the wild: OpenClaw (canonical open-source agent harness, with Telegram + multiple other messengers); a commercial mobile-client product with Apple Watch + iPhone + Android via secure tunnel (no cloud); `happy.engineering` reference deployments; `ductor`, `ccbot`, `takopi` as lighter wrappers; and a personal-OS Telegram layer wrapping Claude Code CLI on a VPS with crons + ExcaliDraw integration. Check current options on GitHub before committing to a specific fork.
2. **Provision a runtime.** Three options in increasing order of capability:

- **(a) Your laptop, always-on.** Easiest: the bridge runs locally; works when the laptop is awake. Use `caffeinate` or a wake schedule.
- **(b) Mac mini / VPS.** $5–20/mo VPS (DigitalOcean / Hetzner). Bridge runs as a systemd service; survives laptop sleep.
- **(c) Sandboxed micro-VM.** For production-grade use: containerised bridge with restricted filesystem access. OpenClaw's sandboxed-deployer ecosystem ships this as default.

1. **Wire credentials.** Telegram bot token from `@BotFather`. Anthropic API key (or Claude Max subscription if the bridge supports CLI mode). Lock the bot to your Telegram user ID — the bot ignores everyone else's messages. Critical: anyone with bot access has full workspace access; treat the token like an SSH key.
2. **Point the bridge at your workspace.** The bridge's `working_directory` setting → your vault root. Every prompt the bot receives runs as `claude -p <prompt>` (or `codex exec <prompt>`) with that working directory, so your `CLAUDE.md` / `AGENTS.md` / naming conventions / skills all apply automatically.
3. **Test the round-trip.** From your phone: "summarise my last partnership call and draft a follow-up." Bot relays → Claude reads transcript folder → produces summary + draft → DMs back. Expected latency: 5–30s read-only; 30–120s for write ops.
4. **Pair with voice on mobile.** Hold the Telegram voice button, speak; the bridge transcribes via Whisper (or Wispr Flow / SuperWhisper / aidictation upstream of Telegram if you prefer on-device transcription).
5. **Add a guardrail rule.** In `CLAUDE.md`: "When invoked via Telegram bridge: never push to git without confirmation; never delete files; never send email/Telegram messages without explicit human approval in the same thread."
6. **Use it for the right tasks.** Highest-value on mobile: log a call, kick off a research task, pull a memo, draft a reply. Lowest value: anything requiring a screen of context.

## Prompts

Telegram bot skeleton (~80 lines, the self-built pattern):

```
``
```

## Gotchas

- **Lock the bot to your Telegram user ID.** Without the filter, your AI is publicly callable.
- **Never store the bot token in your dotfiles / git repo.** Past failure: a C-level showed the bot token in a screenshare during a 40-person all-hands. Revoked + rotated within the hour.
- **Don't run on a public IP without a sandbox.** A bridge with full filesystem access + an open Telegram listener is the highest-blast-radius surface in your stack.
- **Default to one-paragraph responses on mobile.** Long answers wrap badly.
- **Don't auto-send messages on your behalf.** Always draft, never send.
- **Don't rely on it as primary interface.** Use it as capture + quick-recall; laptop remains the heavy-edit surface.
- **Latency budget:** 30–120s for write ops is normal; cap aggressively (`--max-turns 20 --timeout 300`).

## Variations

- **Lightest version:** self-built ~80-line Python script. No skills, no sandbox; private bot routing prompts to local `claude -p`. Suitable for one user, on a Mac mini.
- **Community starter:** the `claude-code-telegram` public repo — 6 months stale at first surfacing but rich functionality; operators "stole features selectively". Good as a copy-paste reference; layer your own integrations (Gmail, Calendar, Todoist, Obsidian) on top.
- **Productized commercial client:** a public Telegram-CC mobile interface with Apple Watch + iPhone + Android via secure tunnel, self-hosted, no cloud. Good for "I want this to just work without ops" + control.
- **OpenClaw stack:** canonical open-source agent harness with first-class Telegram + WhatsApp + Discord + Signal + iMessage. Containerised variants ship with security defaults baked in.
- **Lightweight wrappers**: `ductor`, `ccbot`, `takopi.dev` — each a thin Telegram → CC bridge with slightly different ergonomics. Survey before committing.
- **`happy.engineering` reference deployments** — ready-to-use Telegram-CC instances in the [Concilium](https://concilium.dev/)-adjacent ecosystem, helpful when you want to skip the runtime-provisioning step.
- **Personal-OS Telegram layer** — one operator's self-built personal OS on Claude Code CLI with crons + ExcaliDraw integration, driven through Telegram from phone, SSH from Cursor when needing direct CC work.
- **Codex Remote Control / Claude mobile pickup**. Vendor-native equivalent: kick off a Claude Code task in terminal, pick up from phone via the Claude app or claude.ai/code. No self-hosted bridge needed. Initial releases were sticky (mobile app couldn't persist state, prompted approvals repeatedly) — check current build before betting.
- **Secure-by-default containerised variant** (Vercel Sandbox / Firecracker microVM): restricted filesystem; bridge talks to Claude via API; logs every action; supports approval-required modes. Recommended for any VPS-hosted bridge.
- **Multi-platform variant:** one bot reachable via Telegram + WhatsApp + Discord + Signal + iMessage. Useful when team is split across messengers.
- **Team variant:** one bot per person (not shared), each pointing at that person's vault. Federation principle from B-054 applies.
- **Codex flavour:** swap `claude -p` for `codex exec` if you prefer ChatGPT-side execution.
- **Mobile-CRM-specific:** wire the bridge specifically into your fundraising CRM repo. Voice → contact-file append → propose-not-add task.
- **Web-terminal session continuity.** Run a web-terminal frontend (Termius / ttyd / a self-hosted web SSH) pointed at the same workstation that hosts your Claude Code session. From your phone browser: open the URL, you're inside the exact tmux session you left on the laptop, voice-mode included.
- **Always-open Obsidian bridge.** A second corroborating pattern: a Telegram bot wired to Obsidian + an SSH session, listening 24/7. Voice messages → transcribed → forwarded to Claude Code on the workstation → outputs flow back into Obsidian under `inbox/voice-<date>/`.

<hr/>

## Tools

- Telegram account + a private bot from `@BotFather` (free)
- A runtime: laptop / Mac mini / VPS / sandboxed container; ~$5–20/mo for a VPS
- Claude Code CLI or Anthropic API key; optional: Codex CLI fallback
- A workspace folder structured per the personal-OS pattern (vault root with `CLAUDE.md`)
- Optional: Whisper-based STT for voice mode
- Optional: containerisation (Docker / Vercel Sandbox / Firecracker microVM) if on a VPS
