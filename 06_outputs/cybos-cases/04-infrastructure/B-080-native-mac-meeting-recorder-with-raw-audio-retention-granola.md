---
id: B-080
tier: B
category: "Infrastructure"
kind: tactic
title: "Native Mac meeting recorder with raw-audio retention (Granola alternative)"
subtitle: "Problem solved: Granola/Krisp delete raw audio after transcription — non-starter for finance, healthcare, M&A. Local recorder keeps the audio for dispute resolution. Plus: the 2026 ecosystem now has half a dozen capture-and-pipe variants worth choosing between."
source: https://www.cybos.ai/cases/B-080
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "Ops lead · IT/infosec lead · founder of a privacy-sensitive team"
type: case
version: v0.1
---
# Native Mac meeting recorder with raw-audio retention (Granola alternative)

> Problem solved: Granola/Krisp delete raw audio after transcription — non-starter for finance, healthcare, M&A. Local recorder keeps the audio for dispute resolution. Plus: the 2026 ecosystem now has half a dozen capture-and-pipe variants worth choosing between.

## What

A macOS (and Windows) app that captures meeting audio as two separate streams (your mic, system audio), runs per-stream Whisper transcription so speakers never collide, diarises participants, and — critically — **retains the raw audio file** in a per-user vault. A vault-keeper agent gates access. A cleanup pass strips Whisper hallucinations ("Subtitles by motorzhok", "Thanks for watching!") before the transcript hits downstream pipelines.

The 2026-Q1 ecosystem added six adjacent capture-and-pipe variants. Pick by language coverage, privacy requirements, and whether you already own a hardware recorder:

- **Granola** — consensus winner for English-only meetings; weaker coverage outside English.
- **Krisp** — auto-starts/stops recording; good UX; broad multi-language coverage including non-English. One operator pipes Krisp summaries into Obsidian via a Google-Drive-mounted folder; before Krisp shipped webhooks/MCP, a Playwright headless script scraped the UI.
- **Notion AI Meeting Notes** — the preferred fallback when Granola coverage is weak on the operator's target language.
- **Plaud Note Pro hardware recorder** — three documented pipelines: (a) plug-in-as-USB-mass-storage + udev-style watcher script that pulls audio off, transcribes, saves into Obsidian, deletes from the device, ejects; (b) Plaud's Zapier integration → Cursor repo folder + Notion; (c) a Zapier → VPS → `.md` drop variant. Note: latest Plaud firmware reportedly disables USB-mass-storage mode, so option (a) is firmware-dependent.
- **Local Whisper + Zoom folder watcher**. A local script watches the Zoom recording folder; when a new file appears, sends it to OpenAI Whisper API for transcription; indexes locally. Workaround for Granola's lack of raw-transcript API at team scale.
- **Granola → Obsidian via Claude Code at session start**. A Claude Code session-start hook auto-extracts the full Granola meeting transcript every time Claude starts, runs a classification prompt (deals/companies), and pre-loads the transcripts into the agent's context. Removes the need to manually share meeting context with the agent each session.
- **Granola → Obsidian via the published Reddit recipe** — a community walk-through for the same wiring, linkable to non-engineers who want to copy the pattern.

The on-prem recorder remains the right answer when raw audio retention is a hard requirement; the ecosystem variants are right when you can tolerate the SaaS recorder's data handling and want a transcript pipe into your vault.

## Why it matters

Off-the-shelf SaaS recorders (Granola / Krisp / Fireflies) discard raw audio after transcription and route it through their own cloud, which is a non-starter for finance, healthcare, M&A conversations. One mid-size operator built and shipped this as the foundation for any dispute-resolution claim ("show me the exact second the client said $1M then said $100K"). A franchise founder in a different cohort adopted the same tool for the same reason. The session-start hook variant separately solves the "agent has no context about today's meetings" problem for free — every Claude session opens already aware of recent calls.

## End-to-end

1. Dual-stream capture: route system audio (loopback) and mic to separate WAV writers — avoids the most common Whisper failure (one speaker overrides another).
2. Per-stream Whisper transcription. Local whisper.cpp on M-series Mac is fast enough for real-time; CPU-only fallback for Windows.
3. Diarisation pass over the merged transcript (speaker labels from the two streams).
4. Cleanup pass: regex + small-LLM filter that strips Whisper's known hallucinations and language-confidence < 0.5 spans.
5. Apply the team naming convention on output filename.
6. Store raw audio + transcript in a per-user vault. Vault-keeper agent gates inter-user access on read.
7. Add a Claude Code session-start hook (`load-context.ts` + `extract-granola.ts` or your recorder's equivalent) that pulls today's transcripts into the agent at session start. Optional classification prompt at load time.
8. Optional: export hooks into your second brain (Obsidian, GitHub).

## Gotchas

- Don't skip the hallucination-cleanup pass. Whisper produces convincing nonsense at the boundaries of silence — those phrases then poison every downstream agent that ingests the transcript.
- **NEW — Non-English-language coverage is uneven**. Granola is weak outside English; Notion AI Meeting Notes or Krisp are the alternatives. If your team is bilingual, run two recorders (one for each language) rather than trying to force one to do both.
- **NEW — Plaud's USB-mass-storage trick is firmware-dependent**. Operators reporting the latest firmware no longer exposes the device as a flash drive. If you build the watcher-script pipeline, version-pin your firmware or be ready to fall back to the Zapier path.
- **NEW — Vendor health check before adopting**. For Plaud specifically: GitHub search showed only <30-star third-party libraries existed for their "API" — red flag for vendor health. Run the same check before building around any recorder's API.

## Variations

- **Off-the-shelf SaaS pipe (lightest):** Granola (or Krisp for non-English-dominant teams) + a Claude Code session-start hook that pulls today's transcripts into the agent. Five minutes of setup; works for non-privacy-sensitive teams.
- **Hardware-recorder pipeline:** Plaud Note Pro + a watcher script (USB-mount variant) or + Zapier → Cursor/Notion. Choose by firmware.
- **Local-Whisper + Zoom-folder-watcher:** when Granola's lack of raw-transcript API blocks team-scale analytics, run a local script over the Zoom recording folder. Cheap and works.
- **Hosted-but-private:** Granola for transcript; Krisp + Circleback running in parallel for redundancy. Some operators do all three for reliability of the transcript pipe; storage stays per-vendor though.
- **On-prem recorder (heaviest):** the canonical case above. Right answer when raw-audio retention is a compliance requirement.
- **Krisp → Google-Drive-mount → Obsidian**: one operator mounts a Google Drive folder on Mac, uses it as the Obsidian vault, and configures Krisp to drop summaries there. Pre-MCP era used a Playwright headless script to scrape Krisp's UI.

<hr/>

## Tools

- macOS (M-series ideal) or Windows
- whisper.cpp (local) or local Whisper via Python
- A loopback audio driver (BlackHole on Mac; VB-Cable on Windows)
- A vault directory structure with per-user permission gates
- Optional: Claude Code session-start hook support for the auto-load pattern
- Optional: Plaud Note Pro / Krisp / Granola subscription if using the SaaS-capture-then-pipe variants
