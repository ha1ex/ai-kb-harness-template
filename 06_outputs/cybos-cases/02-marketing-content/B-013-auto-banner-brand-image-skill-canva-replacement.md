---
id: B-013
tier: B
category: "Marketing & content"
kind: skill
title: "Auto-banner / brand-image skill (Canva replacement)"
subtitle: "Marketers wait on a designer for routine banners. A markdown brand-style file plus an agent ships them on demand."
source: https://www.cybos.ai/cases/B-013
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "Marketer · content lead · designer-of-one"
type: case
version: v0.1
---
# Auto-banner / brand-image skill (Canva replacement)

> Marketers wait on a designer for routine banners. A markdown brand-style file plus an agent ships them on demand.

## What

A skill that generates banners, story plates, podcast covers, and YouTube thumbnails in a saved brand style. The style definition lives as a markdown file the agent reads (`{rule} shaper-style.md`): brand colors, typography, layout rules, do/don't examples. Replaces a constellation of custom GPTs and a Canva seat per marketer.

## Why it matters

Routine in-brand assets stop being a designer-blocking task. The brand spec lives where the team can edit it (markdown in the vault) rather than locked in a SaaS account.

## End-to-end

1. Write `{rule} shaper-style.md` in the vault: brand colors with hex codes, typography stack, layout rules, do/don't examples, image-gen prompts that produce on-brand backgrounds.
2. Build skill (e.g., `banner-3-to-1`, `cover-generator`) that reads the style file plus a content topic.
3. Skill decides when to call the image-gen model for backgrounds vs reusing brand asset library.
4. Expose a small web UI for non-engineers: text input, color/background toggles, "regenerate" button.
5. Also expose a terminal mode for power users who want to iterate via voice.
6. Output formats per channel (3:1 for Telegram cover, 1:1 for Instagram, etc.) baked into named skill variants.

## Gotchas

- Keep a designer in the loop for two-pixel adjustments. The skill solves the 80% of routine assets; it does not replace a designer for hero brand work.

## Variations

- **Multi-tool brand-style stack.** Beyond Canva-replacement, a more comprehensive designer stack pairs (a) a vision model with brand-style ingestion (see [new-N14-15]) for on-brand asset generation, (b) Midjourney or equivalent for hero imagery, (c) a local LLM where data residency regulation requires it (e.g. for kid-content under regional residency rules), (d) ChatGPT for copy. Same operator orchestrates all four; the skill router picks the right tool by asset class.

## Tools

- Image-gen API (Recraft / DALL-E / similar) + cheap image-edit primitives (blur, layer)
- Style markdown file in the vault
- Minimal vibe-coded UI deployed somewhere accessible (Netlify is fine)
