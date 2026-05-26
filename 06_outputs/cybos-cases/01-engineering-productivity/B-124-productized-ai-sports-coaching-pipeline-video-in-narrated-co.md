---
id: B-124
tier: B
category: "Engineering productivity"
kind: workflow
title: "Productized AI sports-coaching pipeline — video in, narrated coaching out"
subtitle: "Problem solved: Consumer-product founders need an end-to-end video analysis pipeline cheap enough to support $20–30/mo SaaS pricing; this stack ships at ~$2.79/hr to analyze 5fps 1080p video."
source: https://www.cybos.ai/cases/B-124
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "engineering lead · founder"
type: case
version: v0.1
---
# Productized AI sports-coaching pipeline — video in, narrated coaching out

> Problem solved: Consumer-product founders need an end-to-end video analysis pipeline cheap enough to support $20–30/mo SaaS pricing; this stack ships at ~$2.79/hr to analyze 5fps 1080p video.

## What

End-to-end video analysis pipeline on Google Cloud Run (8 vCPU, 32 GB RAM, no GPU): Gemini 2.5 Flash watches the footage and emits JSON segments with timestamps and coaching text; Google Cloud Video Intelligence (Person Detection) extracts 12 skeletal landmarks at 10 FPS; Gemini 2.5 Flash TTS narrates at 24 kHz, speed-adjusted via ffmpeg `atempo`; ffmpeg composes the final video (footage + skeleton overlay + caption + narration); results land in Firestore. Generalises to any video-analysis vertical (training, fitness, technique coaching).

## Why it matters

Processing time runs ~2 min for a 30-second clip. 13 languages supported. The economics ($2.79/hr to analyze 5fps 1080p) clear the bar for consumer-subscription pricing against $250–400/yr competitor pricing. The architecture is replicable for any coach-replacement product (golf, tennis, martial arts, dance, music technique).

## End-to-end

1. Stand up a Cloud Run service (8 vCPU, 32 GB RAM, no GPU is enough).
2. On upload, call Gemini 2.5 Flash with the video; parse output as JSON segments (timestamp ranges + coaching text).
3. In parallel, call Google Cloud Video Intelligence Person Detection for 12 skeletal landmarks at 10 FPS.
4. Send each coaching segment to Gemini 2.5 Flash TTS at 24 kHz; pad/compress audio length to segment length via ffmpeg `atempo`.
5. Compose final video with ffmpeg: original footage + skeleton overlay + captioned coaching text + narrated audio.
6. Write results (rendered video URL, segments, landmarks) to Firestore.
7. For 1-hour videos, fan out: split into ~12 chunks, run steps 2–4 in parallel, merge with a single text-merge prompt; wall-time collapses to one chunk's runtime.

## Gotchas

## Sequential single-pass processing on hour-long video burns wall time even though compute is cheap. The parallel-chunk fan-out (12 chunks → merge) is the unlock; without it the UX is "upload then come back tomorrow", which is fatal at consumer pricing.

## Tools

- Google Cloud Run, Gemini 2.5 Flash API (incl. TTS), Cloud Video Intelligence API
- ffmpeg (incl. `atempo` filter), OpenCV
- Firestore for results
- Parent app (web or mobile) that exposes the finished output
