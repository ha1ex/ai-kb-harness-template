---
id: ANT-013
tier: A
category: "Engineering productivity"
kind: reference
title: "DOCX (Microsoft Word) creation, editing, and analysis"
subtitle: "Use this skill whenever the user wants to create, read, edit, or manipulate Word documents (.docx files)."
source: https://github.com/anthropics/skills/blob/main/skills/docx/SKILL.md
upstream_name: "docx"
upstream_description: "Use this skill whenever the user wants to create, read, edit, or manipulate Word documents (.docx files). Triggers include: any mention of 'Word doc', 'word document', '.docx', or requests to produce professional documents with formatting like tables of contents, headings, page numbers, or letterheads. Also use when extracting or reorganizing content from .docx files, inserting or replacing images in documents, performing find-and-replace in Word files, working with tracked changes or comments, or converting content into a polished Word document. If the user asks for a 'report', 'memo', 'letter', 'template', or similar deliverable as a Word or .docx file, use this skill. Do NOT use for PDFs, spreadsheets, Google Docs, or general coding tasks unrelated to document generation."
provider: anthropic
license: source-available
license_source: https://github.com/anthropics/skills/blob/main/skills/docx/LICENSE.txt
ingested: 2026-05-27
type: case
version: v0.1
---
# DOCX (Microsoft Word) creation, editing, and analysis

> Use this skill whenever the user wants to create, read, edit, or manipulate Word documents (.docx files).

## What

**Reference-only card.** This skill exists in the upstream Anthropic repo but is
**source-available, not open source** — we cannot redistribute the body in this KB.
See `https://github.com/anthropics/skills/blob/main/skills/docx/SKILL.md` for the canonical implementation.

## When to use

> Use this skill whenever the user wants to create, read, edit, or manipulate Word documents (.docx files). Triggers include: any mention of 'Word doc', 'word document', '.docx', or requests to produce professional documents with formatting like tables of contents, headings, page numbers, or letterheads. Also use when extracting or reorganizing content from .docx files, inserting or replacing images in documents, performing find-and-replace in Word files, working with tracked changes or comments, or converting content into a polished Word document. If the user asks for a 'report', 'memo', 'letter', 'template', or similar deliverable as a Word or .docx file, use this skill. Do NOT use for PDFs, spreadsheets, Google Docs, or general coding tasks unrelated to document generation.

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
3. Or read the upstream SKILL.md directly: [docx/SKILL.md](https://github.com/anthropics/skills/blob/main/skills/docx/SKILL.md)

## License

**Source-available.** Copyright © 2025 Anthropic, PBC. All rights reserved.
Terms: [docx/LICENSE.txt](https://github.com/anthropics/skills/blob/main/skills/docx/LICENSE.txt).

Allowed: reading the source for reference / inspiration.
NOT allowed: copying, redistributing, commercial use in derivative skills.

