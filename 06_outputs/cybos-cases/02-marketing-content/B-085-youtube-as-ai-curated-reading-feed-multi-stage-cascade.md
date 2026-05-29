---
id: B-085
tier: B
category: "Marketing & content"
kind: workflow
title: "YouTube-as-AI-curated-reading-feed (multi-stage cascade)"
subtitle: "Hour-long videos are the most under-leveraged input for busy operators. Three-model cascade turns each into a 5-minute illustrated read."
source: https://www.cybos.ai/cases/B-085
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "Founder · marketer · anyone consuming many hours of long-form video"
type: case
version: v0.1
---
# YouTube-as-AI-curated-reading-feed (multi-stage cascade)

> Hour-long videos are the most under-leveraged input for busy operators. Three-model cascade turns each into a 5-minute illustrated read.

## What

Curate a list of YouTube channels you would watch if you had time. A cron scraper pulls new videos via Bright Data / SerpAPI. A cheap model (Haiku) parses subtitles for topic + structure. A mid-tier model (Gemini Flash) enriches with screenshots at key moments + a 200-word summary. Output: a markdown digest in Obsidian, with embedded images, sized so a 1-hour video becomes a 5-minute read.

## Why it matters

Long-form video is the most under-leveraged channel for a busy operator. SaaS summarizers exist but cost per video and miss visual content. This cascade is cost-conscious (Haiku where cheap suffices, Gemini Flash for vision) and lands in the operator's KM substrate, not a third-party app.

## End-to-end

1. Channel list: 10–30 channels worth watching. Markdown file checked in.
2. Cron scraper (Bright Data or SerpAPI) — pulls new uploads daily.
3. Stage 1 (Haiku): fetch transcript / captions → classify topic + outline.
4. Stage 2 (Gemini Flash with vision): for the top 5–10 moments by transcript signal, grab the screenshot + 2-sentence caption.
5. Compose markdown: title, source, 200-word abstract, outline, 5–10 screenshots with captions, source link, runtime.
6. Drop into Obsidian under `inbox/youtube/<date>/`.
7. Daily morning digest: top 5 items by interestingness → Telegram.

## Gotchas

- Stage 1 hallucinates aggressively on bad captions. Always retain the original transcript path so downstream agents can re-derive. Don't let the Haiku abstract become the ground truth.

## Tools

- Bright Data, SerpAPI, or yt-dlp + a YouTube data API key
- Haiku + Gemini Flash via API (or whatever cheap-with-vision pair exists at run time)
- Obsidian (or equivalent) for output
