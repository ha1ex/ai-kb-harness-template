---
id: B-016
tier: B
category: "HR & hiring"
kind: skill
title: "Auto-generated JD landing pages"
subtitle: "Job boards charge per listing and OG previews are ugly. One CLI command turns your JD markdown into a shareable branded page."
source: https://www.cybos.ai/cases/B-016
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · HR lead · ops lead"
type: case
version: v0.1
---
# Auto-generated JD landing pages

> Job boards charge per listing and OG previews are ugly. One CLI command turns your JD markdown into a shareable branded page.

## What

One CLI command reads a markdown JD source file and generates a public landing page (HTML on GitHub Pages, Notion public page, or Webflow/Framer). The JD frontmatter is updated with the live `public_landing:` URL. Each JD becomes a shareable marketing asset with OG previews, instead of a row on a paid job board.

## Why it matters

A self-hosted JD landing replaces LinkedIn/HH listings, gives you analytics (who clicked from where), and lets warm-channel sharing in Telegram/LinkedIn render an OG-cover preview automatically. At an 8–30 person team, this kills the need for an ATS or job board subscription entirely.

## End-to-end

1. Create JD source at `Org/HR/hiring/{Company} {jd} [Role] – YYYY-MM-DD.md` from the JD template.
2. Fill the 12+ required sections (essence, anti-patterns, must-haves, KPI, comp range in USD equiv, apply checklist, benchmarks).
3. Run `/team-hr hire marketing` (or role slug).
4. Skill renders HTML / Notion landing and writes `public_landing:` back into JD frontmatter.
5. Publish on GitHub Pages repo (e.g., `{org}-apply`) or Notion public URL.
6. Share the URL in warm channels — personal TG broadcast, LinkedIn for senior roles.
7. On close: set `status: closed`, `hired: [Name]`, move JD to `hiring/archive/`, kick off onboarding.

## Gotchas

- **Don't reuse one generic JD template across roles.** The "Who we're NOT looking for" anti-pattern list, KPI definition, and must-have AI-fluency level are role-specific. A copy-pasted template surfaces wrong candidates and burns founder time. Lesson: every role gets a fresh JD pass with role-specific anti-patterns declared up front.

<hr/>

## Tools

- Claude Code with a `team-hr` skill installed
- GitHub Pages repo OR Notion workspace with public-page permission OR Webflow/Framer
- Markdown vault with `Org/HR/hiring/` folder
