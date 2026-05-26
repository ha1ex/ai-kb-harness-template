---
id: B-071
tier: B
category: "Infrastructure"
kind: pattern
title: "Repo-as-Skill packaging pattern"
subtitle: "Skill repos conflate three audiences in one README. Three docs + two folders split runtime instructions, install steps, and architecture cleanly."
source: https://www.cybos.ai/cases/B-071
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · founder · anyone shipping a Claude Code skill"
type: case
version: v0.1
---
# Repo-as-Skill packaging pattern

> Skill repos conflate three audiences in one README. Three docs + two folders split runtime instructions, install steps, and architecture cleanly.

## What

Standardizes the layout of any Claude Code skill repo into a canonical 3-doc + 2-folder shape:

```
`skill-name/
├── SKILL.md # YAML frontmatter + run-time instructions (what Claude reads)
├── README.md # Human-facing intro / install (what users read)
├── HOW_IT_WORKS.md # Architecture / calibration / behavior contract (what auditors read)
├── LICENSE
├── scripts/ # Deterministic shell + python steps
└── templates/ # Stub configs (env.example etc.)
`
```

Install for the user is one line: `cp -r skill-name ~/.claude/skills/`.

## Why it matters

Three audiences (Claude at runtime, human installer, architect/auditor) each have different needs that get conflated when you put everything in `README.md`. The runtime-vs-human separation prevents the classic failure where a skill's user-facing intro accidentally injects parent-project instructions into the Claude session. A founder-discovery CLI uses this layout and a deal-intake bot adopted it verbatim; both are friend-shareable in one `cp -r`.

## End-to-end

1. **Move runtime instructions into `SKILL.md`** with YAML frontmatter: `name`, `description` (concise — Claude uses this to decide when to invoke).
2. **Move human install / quickstart into `README.md`.** This is what GitHub renders.
3. **Move architecture, calibration notes, edge cases into `HOW_IT_WORKS.md`** — auditors and future maintainers read this.
4. **Put all bash / python in `scripts/`**; each script has its own one-paragraph docstring.
5. **Stub configs in `templates/env.example`** so users copy-then-edit.
6. **Add `LICENSE`** (MIT or equivalent if shareable).
7. **Test install on a clean machine**: `mkdir -p ~/.claude/skills && cp -r skill-name ~/.claude/skills/` — works without further steps.

## Gotchas

- Don't put runtime instructions in `README.md` thinking "Claude will read it anyway." The parent project's `CLAUDE.md` then gets injected as a `<system-reminder>` and your skill behaves unpredictably. SKILL.md is for the agent; README is for humans. Separate, always.

## Tools

- Claude Code installed locally
- Git repo for the skill
