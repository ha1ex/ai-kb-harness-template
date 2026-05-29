---
id: A-034
tier: A
category: "Knowledge management"
kind: pattern
title: "Naming convention as operating axis"
subtitle: "Vault search returns 200 results because every file is named differently. One filename schema; agents and humans find anything in two clicks."
source: https://www.cybos.ai/cases/A-034
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Every employee · founder mandates it"
type: case
version: v0.1
---
# Naming convention as operating axis

> Vault search returns 200 results because every file is named differently. One filename schema; agents and humans find anything in two clicks.

## What

A single strict filename schema that every human and every agent in the company uses. The filename is itself a parseable API: project code, content type, short description, date — in a fixed order. Agents find what they need without scanning content; humans find anything in two clicks. This is the *foundational* knowledge-management case — if a team takes one thing from this playbook, this is the one. Two reference workshop hosts converge on essentially the same convention from independent paths.

## Why it matters

Without a naming convention, your vault becomes a content-search problem: every agent query becomes a slow scan, every human search returns 200 results, every "did we have this conversation?" question dies in Slack. With it: `{strategy} {meeting} acme-renewal – 2026-05-08.md` is enough for an agent to know, before opening the file, that this is a strategy meeting note about Acme's renewal from last week. That's an order-of-magnitude latency win on every retrieval, every day, for everyone. Zero infrastructure cost.

## End-to-end

1. **Adopt the formula.** Single canonical form: `{project} {type} short-description – yyyy-mm-dd.md`. En dash (`–`, not hyphen). Curly braces around tokens. Lowercase description. Date last so sort-by-name = sort-by-date.
2. **Define the `{type}` vocabulary — small and closed.** Working list: `{rule} {guide} {plan} {template} {prompt} {tool} {prd} {process} {transcript} {summary} {meeting} {action-items} {research} {analysis} {overview} {report} {workshop} {demo} {case} {handout} {checklist} {retro} {feedback} {message} {post} {article} {announce} {draft}`. ~25 types covers ~99% of files. Don't add new types casually.
3. **Define `{project}` codes.** Short, parseable, lowercase. Examples: `{acme}` for a client, `{q2-launch}` for a campaign, `{infra}` for shared infrastructure work. Archive old projects by prefixing `{arch-}`.
4. **Carve out exceptions.** Files that don't get the date/project format: `AGENTS.md`, `CLAUDE.md`, `README.md`, `CHANGELOG.md`, `HOUSE-STYLE.md`. Always at the root of whatever they govern.
5. **Add YAML frontmatter** to every file. Minimum: `tags`, `type`, `created`, `project`, `status` (draft/review/final/archived), `author`, `linear` (optional ticket id).
6. **Folder structure** stays flat. Don't double-encode: if the filename has `{acme} {meeting}`, you don't also need `Clients/Acme/Meetings/`. One source of truth per axis.
7. **Six-point pre-save checklist.** Before saving any file, the agent (and human) checks: formula correct? project code valid? type known? en dash? lowercase description? correct folder?
8. **The naming-convention file itself.** Commit `{naming-convention} – yyyy-mm-dd.md` at the vault root. Reference it from `CLAUDE.md` / `AGENTS.md`. Every agent reads it first.
9. **Migrate the old vault.** New files follow the convention from day one. Old files: run the retroactive renamer (below) on one folder at a time. Don't try a big-bang rename — broken backlinks are painful.
10. **Build a retroactive-renamer agent.** A skill that takes a folder, proposes renames per convention with rationale per file, asks for confirmation, then renames atomically and updates all Obsidian backlinks. Skip files in `_archive/`.

## Prompts

Worked good/bad examples:

```
`GOOD:
{acme} {meeting} q2-renewal-prep – 2026-05-08.md
{infra} {prd} skills-graph-visualizer – 2026-04-12.md
{q2-launch} {post} project-launch-announcement – 2026-05-01.md
{rule} mcpi-telegram-integration.md (exception: rules have no date)

BAD (and why):
2026-05-08 meeting notes acme.md → date first breaks alphasort sort grouping by project
acme - q2 - renewal prep 2026-05-08.md → no type token, hyphen instead of en dash
{acme}{meeting}q2-renewal-prep-2026-05-08.md → no spaces, unreadable
acme meeting 2026-05-08.md → no braces, unparseable by regex
{ACME} {Meeting} Q2-Renewal-Prep – 2026-05-08.md → mixed case, fragile in regex
`
```

Single parsing regex agents use:

```
`^\{(?P<project>[a-z0-9-]+)\}\s+\{(?P<type>[a-z-]+)\}\s+(?P<desc>[a-z0-9- ]+?)\s+–\s+(?P<date>\d{4}-\d{2}-\d{2})\.md$
`
```

Retroactive-renamer agent prompt:

```
`Walk the folder I attached. For every.md file that does NOT match the naming
regex (in /vault/{naming-convention} – 2026-05-08.md):

1) Read the first 50 lines + the frontmatter (if any).
2) Propose a rename:
 - project: pick from /vault/{projects-registry}.md or propose new
 - type: pick from the 25-type vocabulary
 - description: 3–6 lowercase words, hyphen-separated
 - date: created-date from frontmatter; if missing, fs mtime
3) Output a CSV: old_path, new_path, project, type, rationale, confidence
4) After I approve the CSV, atomically rename AND update every Obsidian wikilink
 that references the old basename.

Hard rules:
- NEVER rename files in _archive/
- NEVER invent a project code; propose with [NEW-PROJECT] tag
- If confidence < 0.6, leave alone and add to needs-review.csv
`
```

`CLAUDE.md` reference snippet:

```
``
```

## Gotchas

- **Don't put date in the middle.** Breaks chronological sort within a project — the single highest-value affordance the convention gives you.
- **Don't allow two conventions to coexist.** "Personal" and "team" can differ slightly, but within a vault, one. Adopting two is the same as having none.
- **Don't expand the type vocabulary casually.** Every new type is a coordination tax on the whole team. Keep ≤30.
- **Don't try big-bang migration.** Move one folder at a time. Broken Obsidian backlinks during a partial rename are the #1 reason teams abandon the convention. Update backlinks atomically.
- **2026-05-05 lesson (from the anti-pattern catalog):** never use per-candidate subfolders like `Candidates/John-Doe/cv.md`; use flat `candidate {John Doe} – 2026-05-05.md` files. Subfolders defeat the regex and split context across three views. This generalizes: prefer flat + parseable over deep + pretty.

## Variations

- **Lighter (5-person team):** Drop the project code; keep `{type} description – yyyy-mm-dd.md`. Migrate in an afternoon.
- **Heavier (50+ person co):** Add a calendar-tag inheritance: calendar events with `[#q2-launch]` produce transcripts named `{q2-launch} {transcript} …`. Closes the loop from meeting → file automatically.
- **Cross-tool:** The same convention applies to Linear ticket titles, Slack canvases, and Notion pages during migration. One regex, three surfaces.
- **Heavier — 11-parameter call-transcript naming.** Instead of the 25-type vocabulary, encode call transcripts with 11 named parameters in the filename: project, type (e.g. `strategic` / `internal` / `client`), date, participants, duration-band, decision-class, follow-up-due-by, owner, channel (call / inperson / async), source-tool, confidence. Example: `proj-aether_strategic_2026-05-12_alex+marina_60-90_decisive_2026-05-19_marina_call_granola_high.md`. Downstream agents filter by filename regex without parsing content (`*_strategic_internal_*.md`). Tradeoff: filenames are long; the regex-grep speed and zero-parse cost is the point.

## Tools

- Any markdown editor (Obsidian preferred for backlinks)
- Vault root with `CLAUDE.md` or `AGENTS.md`
- A snippet expansion tool for today's date (macOS Text Replacement is enough; Raycast or Stream Deck for power users)
- The naming-convention doc itself, version-controlled
- For migration: Claude Code or Cursor with file-system access
