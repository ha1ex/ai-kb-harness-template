---
id: ANT-015
tier: A
category: "Engineering productivity"
kind: reference
title: "PPTX (PowerPoint) — create, read, edit slide decks"
subtitle: "Use this skill any time a .pptx file is involved in any way — as input, output, or both."
source: https://github.com/anthropics/skills/blob/main/skills/pptx/SKILL.md
upstream_name: "pptx"
upstream_description: "Use this skill any time a .pptx file is involved in any way — as input, output, or both. This includes: creating slide decks, pitch decks, or presentations; reading, parsing, or extracting text from any .pptx file (even if the extracted content will be used elsewhere, like in an email or summary); editing, modifying, or updating existing presentations; combining or splitting slide files; working with templates, layouts, speaker notes, or comments. Trigger whenever the user mentions \\\"deck,\\\" \\\"slides,\\\" \\\"presentation,\\\" or references a .pptx filename, regardless of what they plan to do with the content afterward. If a .pptx file needs to be opened, created, or touched, use this skill."
provider: anthropic
license: source-available
license_source: https://github.com/anthropics/skills/blob/main/skills/pptx/LICENSE.txt
ingested: 2026-05-27
type: case
version: v0.1
---
# PPTX (PowerPoint) — create, read, edit slide decks

> Use this skill any time a .pptx file is involved in any way — as input, output, or both.

## What

**Reference-only card.** This skill exists in the upstream Anthropic repo but is
**source-available, not open source** — we cannot redistribute the body in this KB.
See `https://github.com/anthropics/skills/blob/main/skills/pptx/SKILL.md` for the canonical implementation.

## When to use

> Use this skill any time a .pptx file is involved in any way — as input, output, or both. This includes: creating slide decks, pitch decks, or presentations; reading, parsing, or extracting text from any .pptx file (even if the extracted content will be used elsewhere, like in an email or summary); editing, modifying, or updating existing presentations; combining or splitting slide files; working with templates, layouts, speaker notes, or comments. Trigger whenever the user mentions \"deck,\" \"slides,\" \"presentation,\" or references a .pptx filename, regardless of what they plan to do with the content afterward. If a .pptx file needs to be opened, created, or touched, use this skill.

## How to access

1. Clone the upstream repo:
   ```bash
   git clone --depth=1 https://github.com/anthropics/skills.git
   ```
2. Use the skill in Claude Code by installing the Anthropic plugin marketplace:
   ```
   /plugin marketplace add anthropics/skills
   /plugin install document-skills@anthropic-agent-skills
   ```
3. Or read the upstream SKILL.md directly: [pptx/SKILL.md](https://github.com/anthropics/skills/blob/main/skills/pptx/SKILL.md)

## License

**Source-available.** Copyright © 2025 Anthropic, PBC. All rights reserved.
Terms: [pptx/LICENSE.txt](https://github.com/anthropics/skills/blob/main/skills/pptx/LICENSE.txt).

Allowed: reading the source for reference / inspiration.
NOT allowed: copying, redistributing, commercial use in derivative skills.

