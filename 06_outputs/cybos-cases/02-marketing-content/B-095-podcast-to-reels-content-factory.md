---
id: B-095
tier: B
category: "Marketing & content"
kind: workflow
title: "Podcast-to-Reels content factory"
subtitle: "A 3-person Reels team costs several thousand a month. Cut 20 candidate clips per podcast automatically; one operator picks 5-10."
source: https://www.cybos.ai/cases/B-095
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "Content marketer / podcast producer"
type: case
version: v0.1
---
# Podcast-to-Reels content factory

> A 3-person Reels team costs several thousand a month. Cut 20 candidate clips per podcast automatically; one operator picks 5-10.

## What

Pipeline: record video podcast → LLM scans transcript for "wow moments" by signal (laughter, pause, exclamation, dense info) → auto-cut to ~20 Reels per hour-long podcast → auto-subtitles + b-roll → operator reviews ~20 candidates, picks 5–10, edits, publishes. Replaces an external content team that previously cost several thousand dollars per month.

## Why it matters

A franchise founder shipped this and is productizing it as a low-cost bot service for franchisees (replacing an external social-media service). The economics: one operator reviewing 20 candidates per podcast in ~15 minutes is throughput-equivalent to a 3-person content team at 1/30th cost. Different from A-011 (text ContentVoice) and A-010 (talk → article); this is the **video → social-vertical** assembly line.

## End-to-end

1. Recording standard: dual-camera, clean audio, consistent intros / outros (lets the LLM ignore template segments).
2. Transcribe (Whisper / Otter / Granola alternative — see [new-N13-05]).
3. Wow-moment detector: LLM reads transcript with signals like "duration of laugh, exclamation density, definitional statement, surprising number." Output: 20 candidate spans with start/end timestamps and a one-sentence hook.
4. Auto-cut: ffmpeg slice + vertical reframe (1080×1920) — track speaker face if multiple speakers.
5. Auto-subtitles: word-by-word burned in, brand font + colour. Standard caption stylesheet.
6. B-roll suggestions: model proposes 2–3 image / chart overlays per Reel; operator picks.
7. Operator review queue: 20 candidates → pick 5–10 → micro-edit → publish. Track engagement; feed back into wow-moment scorer.

## Gotchas

- Don't skip the operator review. Auto-publish-all produces brand drift within 2 weeks; a 15-minute human review keeps voice consistent.

## Tools

- Whisper / transcription
- LLM with structured output for the wow-moment pass
- ffmpeg + (optional) a vertical-reframe tool
- A publishing queue (Buffer / Later / native scheduling)
