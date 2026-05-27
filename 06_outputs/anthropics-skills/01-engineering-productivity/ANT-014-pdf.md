---
id: ANT-014
tier: A
category: "Engineering productivity"
kind: reference
title: "PDF processing — extract, merge, split, OCR, fill forms"
subtitle: "Use this skill whenever the user wants to do anything with PDF files."
source: https://github.com/anthropics/skills/blob/main/skills/pdf/SKILL.md
upstream_name: "pdf"
upstream_description: "Use this skill whenever the user wants to do anything with PDF files. This includes reading or extracting text/tables from PDFs, combining or merging multiple PDFs into one, splitting PDFs apart, rotating pages, adding watermarks, creating new PDFs, filling PDF forms, encrypting/decrypting PDFs, extracting images, and OCR on scanned PDFs to make them searchable. If the user mentions a .pdf file or asks to produce one, use this skill."
provider: anthropic
license: source-available
license_source: https://github.com/anthropics/skills/blob/main/skills/pdf/LICENSE.txt
ingested: 2026-05-27
type: case
version: v0.1
---
# PDF processing — extract, merge, split, OCR, fill forms

> Use this skill whenever the user wants to do anything with PDF files.

## What

**Reference-only card.** This skill exists in the upstream Anthropic repo but is
**source-available, not open source** — we cannot redistribute the body in this KB.
See `https://github.com/anthropics/skills/blob/main/skills/pdf/SKILL.md` for the canonical implementation.

## When to use

> Use this skill whenever the user wants to do anything with PDF files. This includes reading or extracting text/tables from PDFs, combining or merging multiple PDFs into one, splitting PDFs apart, rotating pages, adding watermarks, creating new PDFs, filling PDF forms, encrypting/decrypting PDFs, extracting images, and OCR on scanned PDFs to make them searchable. If the user mentions a .pdf file or asks to produce one, use this skill.

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
3. Or read the upstream SKILL.md directly: [pdf/SKILL.md](https://github.com/anthropics/skills/blob/main/skills/pdf/SKILL.md)

## License

**Source-available.** Copyright © 2025 Anthropic, PBC. All rights reserved.
Terms: [pdf/LICENSE.txt](https://github.com/anthropics/skills/blob/main/skills/pdf/LICENSE.txt).

Allowed: reading the source for reference / inspiration.
NOT allowed: copying, redistributing, commercial use in derivative skills.

