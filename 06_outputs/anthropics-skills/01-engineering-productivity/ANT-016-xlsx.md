---
id: ANT-016
tier: A
category: "Engineering productivity"
kind: reference
title: "XLSX (Excel) — read, edit, create spreadsheets with formulas"
subtitle: "Use this skill any time a spreadsheet file is the primary input or output."
source: https://github.com/anthropics/skills/blob/main/skills/xlsx/SKILL.md
upstream_name: "xlsx"
upstream_description: "Use this skill any time a spreadsheet file is the primary input or output. This means any task where the user wants to: open, read, edit, or fix an existing .xlsx, .xlsm, .csv, or .tsv file (e.g., adding columns, computing formulas, formatting, charting, cleaning messy data); create a new spreadsheet from scratch or from other data sources; or convert between tabular file formats. Trigger especially when the user references a spreadsheet file by name or path — even casually (like \\\"the xlsx in my downloads\\\") — and wants something done to it or produced from it. Also trigger for cleaning or restructuring messy tabular data files (malformed rows, misplaced headers, junk data) into proper spreadsheets. The deliverable must be a spreadsheet file. Do NOT trigger when the primary deliverable is a Word document, HTML report, standalone Python script, database pipeline, or Google Sheets API integration, even if tabular data is involved."
provider: anthropic
license: source-available
license_source: https://github.com/anthropics/skills/blob/main/skills/xlsx/LICENSE.txt
ingested: 2026-05-27
type: case
version: v0.1
---
# XLSX (Excel) — read, edit, create spreadsheets with formulas

> Use this skill any time a spreadsheet file is the primary input or output.

## What

**Reference-only card.** This skill exists in the upstream Anthropic repo but is
**source-available, not open source** — we cannot redistribute the body in this KB.
See `https://github.com/anthropics/skills/blob/main/skills/xlsx/SKILL.md` for the canonical implementation.

## When to use

> Use this skill any time a spreadsheet file is the primary input or output. This means any task where the user wants to: open, read, edit, or fix an existing .xlsx, .xlsm, .csv, or .tsv file (e.g., adding columns, computing formulas, formatting, charting, cleaning messy data); create a new spreadsheet from scratch or from other data sources; or convert between tabular file formats. Trigger especially when the user references a spreadsheet file by name or path — even casually (like \"the xlsx in my downloads\") — and wants something done to it or produced from it. Also trigger for cleaning or restructuring messy tabular data files (malformed rows, misplaced headers, junk data) into proper spreadsheets. The deliverable must be a spreadsheet file. Do NOT trigger when the primary deliverable is a Word document, HTML report, standalone Python script, database pipeline, or Google Sheets API integration, even if tabular data is involved.

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
3. Or read the upstream SKILL.md directly: [xlsx/SKILL.md](https://github.com/anthropics/skills/blob/main/skills/xlsx/SKILL.md)

## License

**Source-available.** Copyright © 2025 Anthropic, PBC. All rights reserved.
Terms: [xlsx/LICENSE.txt](https://github.com/anthropics/skills/blob/main/skills/xlsx/LICENSE.txt).

Allowed: reading the source for reference / inspiration.
NOT allowed: copying, redistributing, commercial use in derivative skills.

