---
id: B-100
tier: B
category: "Marketing & content"
kind: skill
title: "Remotion-video-director skill — explainer/infographic video from a brief"
subtitle: "Problem solved: Founders pay $500–2k per freelance explainer; a Claude Code skill on top of Remotion generates the full video from a content brief end to end."
source: https://www.cybos.ai/cases/B-100
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "marketing lead · founder"
type: case
version: v0.1
---
# Remotion-video-director skill — explainer/infographic video from a brief

> Problem solved: Founders pay $500–2k per freelance explainer; a Claude Code skill on top of Remotion generates the full video from a content brief end to end.

## What

A Claude Code skill wrapping Remotion takes a content brief, generates the Remotion JSX components for scenes, transitions, captions, and infographic elements, and renders the final video. One operator now ships videos to a public channel built entirely through the skill with no manual editing. Related approach: a JSX-for-video SDK family (community-shipped, narrower scope) that auto-composes GenAI clips — narrower scope but same family.

## Why it matters

Marketing video is a chronic bottleneck for small teams. Outsourcing is slow and expensive; AI-only video generators (text-to-video) produce uncanny output for explainer/infographic content. A code-generated Remotion video is sharp, on-brand, editable, and remixable. One iteration cycle drops from days (freelancer) to minutes.

## End-to-end

1. Install Node.js + Remotion locally.
2. Install Claude Code with skills enabled.
3. Add the remotion-video-director skill (public GitHub repo).
4. Write a content brief: key message, scenes, brand tokens, target length.
5. Prompt Claude with the brief; the skill generates Remotion JSX components.
6. Render via Remotion's CLI; iterate on weak scenes through the skill's update workflow.
7. For motion-graphics-as-code (interactive, remixable) extend with brand-specific component library.

## Gotchas

## Without a brand-token file the first renders look generically templated. Bundle brand assets + a style guide markdown into the skill input on iteration two; quality jumps immediately.

## Tools

- Node.js, Remotion
- Claude Code with skills enabled
- A brand asset bundle (logos, fonts, colors) the skill can pull from
