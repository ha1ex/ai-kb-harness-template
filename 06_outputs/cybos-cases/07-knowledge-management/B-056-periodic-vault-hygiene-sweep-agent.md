---
id: B-056
tier: B
category: "Knowledge management"
kind: skill
title: "Periodic vault-hygiene sweep agent"
subtitle: "Vaults past 5K files quietly rot (broken links, naming drift, duplicates). A periodic agent sweep proposes hygiene moves to confirm."
source: https://www.cybos.ai/cases/B-056
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · knowledge worker · anyone with a large vault"
type: case
version: v0.1
---
# Periodic vault-hygiene sweep agent

> Vaults past 5K files quietly rot (broken links, naming drift, duplicates). A periodic agent sweep proposes hygiene moves to confirm.

## What

A skill that walks the entire vault and proposes hygiene operations: rename files that violate the naming convention, move misfiled notes, remove duplicates, fix broken bidirectional links, archive items older than N months with no incoming references. Always proposes a diff first; applies only on confirmation.

## Why it matters

A vault that grows past ~5K files quietly rots — links break, naming drift accumulates, duplicates multiply. A founder running an AI-native operations cohort admitted: "Hygiene is everyone's responsibility, but rarely happens — even I'm bad at it." A periodic agent-driven sweep is the only realistic way to keep a 15-20K file vault navigable.

## End-to-end

1. **Codify your naming convention** as a markdown file in the vault root.
2. **Write a `world-clean` skill** that takes inputs: naming convention path, vault root, dry-run flag.
3. **Steps the skill performs**: scan all files; group by violations (bad name, missing frontmatter, broken link, duplicate hash); emit a proposed-changes report; on confirm, apply with bidirectional-link preservation (Obsidian backlink syntax).
4. **Run dry-run weekly**; apply quarterly.
5. **Always commit the vault before running.** This is a recovery point.
6. **Keep an audit log** of what the skill renamed/moved — future-you needs it.

## Gotchas

- Auto-apply without preview eats important files. The skill must always emit a diff and demand confirmation; the team that skipped this lost half a vault to a Dropbox-sync cascade.

## Tools

- A vault with consistent naming convention
- Skill or agent capable of file ops with diff preview
- Git history on the vault as a safety net
