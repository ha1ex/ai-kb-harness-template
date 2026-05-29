---
id: B-144
tier: B
category: "Knowledge management"
kind: pattern
title: "Privacy-tiered transcript routing for org-wide AI agents — 5 patterns"
subtitle: "Problem solved: Teams want AI agents queryable against meeting transcripts but need to keep exec / salary / strategy discussions private; five concrete routing patterns solve it without bespoke RBAC."
source: https://www.cybos.ai/cases/B-144
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "ops lead · head of IT · founder"
type: case
version: v0.1
---
# Privacy-tiered transcript routing for org-wide AI agents — 5 patterns

> Problem solved: Teams want AI agents queryable against meeting transcripts but need to keep exec / salary / strategy discussions private; five concrete routing patterns solve it without bespoke RBAC.

## What

Five patterns observed in production for letting team members query AI agents against meeting transcripts while preserving permission boundaries:

1. **Notion-mirrored single DB.** All transcripts land in one Notion database; a "Public" checkbox triggers a Notion automation that syncs the row to a team-visible mirror database. Agents query the mirror.
2. **Google Drive as filesystem.** Mount Google Drive locally; rely on native Drive sharing. Each app integrates trivially; each person sets folder-level privacy themselves.
3. **TLDV per-account + Zapier.** Every participant has their own TLDV account; TLDV records and transcribes for the participants individually; Zapier pipes the artifact into that user's personal Google Drive or GitHub repo; the user's Cursor or Claude Code reads from the local folder.
4. **Granola folders.** A Granola folder per recurring meeting type; Zapier pushes transcripts to a public or private workspace based on the source folder.
5. **Hard exclusion.** Don't admit any notetaker to confidential calls — far fewer of those than regular ones.

## Why it matters

Bespoke RBAC over a transcript store is weeks of work and brittle. These patterns inherit access control from tools that already have it (Notion, Drive, TLDV, Granola). The right pattern depends on which tool your team already lives in.

## End-to-end

- **Already on Notion as docs hub?** → Pattern 1 (single DB + public-flag mirror).
- **Heavy Drive user?** → Pattern 2 (mount + Drive native sharing).
- **Per-employee call recording?** → Pattern 3 (TLDV per-account + Zapier to personal storage).
- **Recurring meeting types with clear public/private split?** → Pattern 4 (Granola folder routing).
- **Few-but-sensitive calls?** → Pattern 5 (don't record them at all).

Mix patterns by tier: Pattern 5 for board / comp / legal; Patterns 1-4 for everything else.

## Gotchas

- **Notion-automation logic is "very crude" until you tighten it.** One operator's caveat: the public/private sync rules in Notion automations have edge cases (deletions, retroactive permission changes) that aren't bulletproof. Don't rely on Pattern 1 alone for genuinely sensitive material; pair with Pattern 5 for board-level discussions.

<hr/>

## Tools

- Notion / Google Drive / TLDV / Granola / Zapier — pick whichever matches your team's existing surface
- Cursor or Claude Code as the agent surface that reads from these stores
