---
id: B-111
tier: B
category: "Operations"
kind: skill
title: "NDA review-redline-sign skill — built on Claude's default NDA skill, ships signed PDF"
subtitle: "Problem solved: Founders and fundraising ops drown in incoming NDAs; a custom Claude skill (on top of Anthropic's default NDA-review skill) analyzes each NDA, generates a redline .docx with tracked changes per company standards, and outputs a clean PDF with the founder's signature inserted."
source: https://www.cybos.ai/cases/B-111
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · BD lead · fundraising ops · COO"
type: case
version: v0.1
---
# NDA review-redline-sign skill — built on Claude's default NDA skill, ships signed PDF

> Problem solved: Founders and fundraising ops drown in incoming NDAs; a custom Claude skill (on top of Anthropic's default NDA-review skill) analyzes each NDA, generates a redline .docx with tracked changes per company standards, and outputs a clean PDF with the founder's signature inserted.

## What

The operator paste-loads an inbound NDA file into Claude Code. A custom skill runs the analysis pass (using Anthropic's bundled NDA-review skill as the base), proposes redlines according to a per-company standards doc, generates a `.docx` with tracked changes, generates a clean PDF, and inserts a stored signature image into the signature block. The operator confirms which redlines to keep, then ships.

## Why it matters

A fundraising founder reported signing 6 NDAs in one week using this flow, with counterparty turnaround in 1-2 days. Two effects beyond raw speed: (1) signals to counterparties that the company can move quickly, (2) the redlines are reasoned, not boilerplate, so they pass legal review on the other side.

## End-to-end

1. Start from Anthropic's default NDA-review skill (bundled in Claude). Don't rebuild what's already there.
2. Author a company-specific standards doc: which clauses you accept, which you redline, your standard limitations of liability, term, governing law, mutual-vs-one-way preferences.
3. Build a skill that takes an inbound NDA, runs the default NDA review for analysis, then applies your standards doc on top to produce the redline.
4. Have the skill emit a `.docx` with tracked changes (so counterparty sees what changed) plus a clean PDF with your signature inserted.
5. Explicitly instruct the skill *not to sign correspondence as "Claude"* — easy to forget; awkward when caught.
6. Operator confirms each redline in chat before the skill finalizes the file.
7. Send. Track win-rate (how often the counterparty accepts your redlines unchanged) to refine the standards doc.

## Gotchas

## The skill will, if not constrained, sign its own correspondence as "Claude" in cover messages — caught in production, embarrassing. Add an explicit "never sign as Claude; use the configured human name" rule. Second gotcha: standards docs are company-vertical and counterparty-dependent (an enterprise vendor's standards differ wildly from a fund's). Expect to maintain 2-3 standards docs, not one.

## Tools

- Claude Code with skill support.
- Anthropic's default NDA-review skill as the foundation.
- A company-specific standards doc (the actual content of redlines; this is the company-vertical piece — write it once, refine over months).
- A stored signature image; PDF generation in the skill.
