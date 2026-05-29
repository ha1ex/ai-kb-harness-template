---
id: B-110
tier: B
category: "Operations"
kind: skill
title: "Install Anthropic's pdf / xlsx / pptx skills to ship client-ready deliverables from Claude Code"
subtitle: "Problem solved: Claude Code happily renders HTML, but consultants, ops teams, and founders need real PDF / XLSX / PPTX files for clients; pre-built Anthropic skills bridge the gap."
source: https://www.cybos.ai/cases/B-110
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · ops lead · consultant · marketer"
type: case
version: v0.1
---
# Install Anthropic's pdf / xlsx / pptx skills to ship client-ready deliverables from Claude Code

> Problem solved: Claude Code happily renders HTML, but consultants, ops teams, and founders need real PDF / XLSX / PPTX files for clients; pre-built Anthropic skills bridge the gap.

## What

Install the official Anthropic skills for invoicing, PDF, XLSX, PPTX, webapp-testing, and frontend-design from the community skill registries. Inside Claude Code, invoke them by name. Result: deterministic, client-ready files generated directly from messy inputs — CSVs become PDF reports, URLs become XLSX QA matrices, course notes become slide decks. Browse the catalogs at the awesome-claude-skills repo and smithery.ai/skills before authoring anything yourself.

## Why it matters

The gap between "Claude produced a great analysis" and "client received a deliverable" is usually a file-format conversion step. Skills collapse that step into a single prompt. Lets non-engineers ship Excel/PowerPoint-grade deliverables on the same loop as their engineers ship code.

## End-to-end

1. Pick the first deliverable type you ship most often: PDF reports, XLSX matrices, or PPTX decks.
2. Browse the catalogs (awesome-claude-skills, smithery.ai/skills) and install the matching official skill.
3. Pre-stage your inputs in the project folder: source data (CSV, JSON, transcripts), branding assets, templates.
4. Invoke the skill from a Claude Code session: e.g. "use the pdf skill to turn this CSV into a client report with our logo on page 1."
5. For slides, layer one `CLAUDE.md` per course or product to carry persistent context, plus a per-deck instruction file telling the skill what tone and structure to use. The pptx skill produces HTML first, then converts to pptx + a PDF export.
6. Spot-check the deterministic output; for slides, expect ~90% auto with a final pass in Keynote or PowerPoint.

## Gotchas

- Browse the skill catalogs before authoring your own. Days get wasted building a custom skill that already exists in one of the two main registries — particularly for the obvious file-format conversions.

<hr/>

## Tools

- Claude Code (or any skill-capable Anthropic surface)
- The relevant skills (pdf, xlsx, pptx, webapp-testing, frontend-design)
- Underlying libraries the skills depend on: openpyxl, reportlab, python-pptx, playwright
- One `CLAUDE.md` per project carrying brand and tone context
