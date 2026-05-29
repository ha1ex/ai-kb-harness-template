---
id: B-054
tier: B
category: "Knowledge management"
kind: pattern
title: "Personal OS / personal vault architecture"
subtitle: "Problem solved: Company-wide tools fail because each person works differently. Federate sovereign personal vaults; share what needs sharing in a common subtree — and treat the vault as a 10-year migration target, not a clean-slate project."
source: https://www.cybos.ai/cases/B-054
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · IC · every employee individually"
type: case
version: v0.1
---
# Personal OS / personal vault architecture

> Problem solved: Company-wide tools fail because each person works differently. Federate sovereign personal vaults; share what needs sharing in a common subtree — and treat the vault as a 10-year migration target, not a clean-slate project.

## What

Each person sets up their own markdown vault — Obsidian on top of a Dropbox / iCloud / Git folder — that holds transcripts, notes, design docs, partner cards, daily focus files, and skills. Calendar, Linear, Telegram are reached via MCP rather than copied in. The vault is opened in Claude Code / Codex / Cursor; the agent operates on the same files the human reads.

The 2026-Q1 reinforcement added three operational refinements: (1) **Notion = work brain, Obsidian = personal brain** as the canonical split for operators who need both; (2) a **typical full personal-AI ops repo structure** with `rules/`, `skills/`, `scripts/` as top-level folders; and (3) a documented 10-year migration target — one operator publicly migrated a decade of documents into a plaintext Obsidian vault and wrote up the process. The migration is the test: any vault architecture that can't absorb your existing decade of docs is the wrong architecture.

## Why it matters

The company emerges as a federation of personal OSes rather than one monolithic system. A founder running this on a 30–100 person team observed adoption stays high precisely because each member is sovereign over their own setup, while shared assets (partner CRM, calls, content) sit in a common subtree. "If you take one thing from the lecture, take this" — multiple workshop hosts say this is the highest-ROI single artifact.

The 10-year migration angle matters because vault architectures that *only* hold new content drift into irrelevance — the moment the operator needs something from before the vault existed, they're back in Evernote/Notion/OneNote. Migrating the historical corpus is what makes the vault actually replace the prior tooling.

## End-to-end

1. **Pick a sync layer.** Obsidian Sync, Dropbox, iCloud, or Git. Don't agonize; switch later if needed.
2. **Decide store-locally vs reach-via-MCP per source.** Text artifacts (transcripts, notes) → local. Calendar / Linear / CRM → MCP.
3. **Apply the Notion/Obsidian split if you need both.** Notion = work brain (shared with team, structured tables, integrations); Obsidian = personal brain (private vault, plaintext, agent-readable). The split keeps shared work surfaces tidy and private notes private — and lets each side use its native strengths.
4. **Use the canonical personal-AI ops repo structure**:

- `rules/` — long-form rule files referenced from `AGENTS.md`
- `skills/` — versioned skill files
- `scripts/` — utility scripts (Playwright, ChromeDev MCP, transcript extractors)
- `Org/` (or your equivalent) — Strategy / Product / Operations / HR subtrees
- `transcripts/` — flat call/meeting dump
- `inbox/` — unsorted capture (voice notes, screenshots)

1. **Define three config tiers.** `~/CLAUDE.md` (global), vault-root `CLAUDE.md` (conventions), project-root `CLAUDE.md` (project-specific). Each is a router pointing to skills + rules, not a content dump. See A-026.
2. **Adopt the cross-agent `AGENTS.md` convention** so the same file works in Claude, Codex, Cursor.
3. **Bootstrap context by migrating historical docs.** Export Telegram history, Notion workspace, Evernote, OneNote, prior Google Docs — drop everything into the agent as plaintext + Markdown and have it generate folders + per-person cards. One operator's public writeup of a 10-year doc migration to Obsidian + Claude Code is the canonical reference.
4. **Add MCPs for live services** (Calendar, Linear, Telegram, Google Drive, Notion read-only).
5. **Run the system for 2 weeks before optimizing.**

## Gotchas

- Trying to enforce one company-wide system kills adoption. Federation wins: shared subtrees for what truly must be shared; private subtrees for everything else.
- **NEW — Don't migrate selectively.** Operators who migrate "just the recent docs" find themselves back in the old tool within a month — the moment they need something older. The 10-year migration is the test of the architecture; if it can't absorb the historical corpus, change the architecture.
- **NEW — Don't put company-specific data into the `rules/` files.** Rules are logic; data goes elsewhere (graph, MCP). Mixing the two makes rules brittle — see B-055.

## Variations

- **Solo operator, lightweight:** Obsidian + iCloud + Claude Code + `~/CLAUDE.md` only. No multi-tier; no MCPs at first. Add as needed.
- **Team federation:** each person runs their own variant; shared subtree at `Org/_shared/` for CRM, calls, content. Per-department Notion tokens ( pattern) for the work-brain side.
- **Phone-reachable:** layer a Telegram bridge (A-042) over the vault so the personal OS is reachable from anywhere. One operator packages this as a single deployment.
- **ExcaliDraw integration** for visual thinking inside the vault — the same operator wired ExcaliDraw MCP to auto-draw system diagrams from textual descriptions.

<hr/>

## Tools

- Obsidian (visual layer) over Dropbox / iCloud / Git folder
- Claude Code / Codex / Cursor
- MCP connectors for live services
- (Optional) Notion + scoped tokens for shared work surfaces; see the per-department-token pattern in
- (Optional) A Telegram wrapper layer (OpenClaw or a self-built equivalent) so the same vault is reachable from phone — see A-042
