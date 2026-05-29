---
id: A-021
tier: A
category: "Operations"
kind: workflow
title: "Team-meeting transcript → auto-update project status cards"
subtitle: "Weekly status meetings get notes nobody updates. The transcript writes the updates into 20 per-project cards automatically."
source: https://www.cybos.ai/cases/A-021
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "PM · CS lead · marketing (for case-study harvest)"
type: case
version: v0.1
---
# Team-meeting transcript → auto-update project status cards

> Weekly status meetings get notes nobody updates. The transcript writes the updates into 20 per-project cards automatically.

## What

Every week the team has a status-review meeting where every active project gets discussed. The meeting is transcribed (notetaker), saved to a transcripts folder, and a single agent command — "take the latest team call transcript and update project status cards" — walks each project mentioned, updates its per-project status card with new status, current tasks, completed components, in-progress, pending, and tags each update with `[MEETING:yyyy-mm-dd]`. A second command produces a marketing-readiness summary: which projects are ready for testimonial collection or case-study development.

## Why it matters

Weekly project-portfolio maintenance without dedicated PM time. The Head of Customer Success at one 30-person agency used to sit in 20+ silent client calls per week just to "smell" project health. After installing this pattern, that listening time disappeared and the CS team got a per-client status card that was newer than anything they could have produced by hand. As a side effect, marketing receives a proactive weekly list of "3 projects ready for video testimonial" without asking — the case-study pipeline becomes self-feeding.

## End-to-end

1. **Set up the per-project status-card template.** One Markdown file per client/project under `Projects/Status-Projects/Client-<Industry>-Status-Card.md` with fields: Analyst, PM, Status, Last Update, Current Tasks, Completed, In-Progress, Pending, KPIs, Business Impact, Next Steps.
2. **Ingest the weekly team transcript.** Drop it in `Projects/Transcripts/Meeting-yyyy-mm-dd-Team-Status-Review.md`. (Most notetakers can do this automatically via webhook / Zapier.)
3. **Author one skill** that does the update pass. Inputs: latest team transcript + all status cards. For each project the transcript references, locate the matching card and append a `## Update yyyy-mm-dd` section with new status, blocked items, decisions; update top-of-file headers (Status, Last Update).
4. **Author a second skill** for marketing-readiness rollup. It reads all status cards, classifies each project into "ready for testimonial", "close — fix X first", "not ready"; produces `Docs/SalesAndMarketing/Client-Meetings-Analysis/AI-Projects-Review-Analysis_yyyy-mm-dd.md`.
5. **Tag rigorously.** Every appended update inherits the `[MEETING:yyyy-mm-dd]` tag so later "what changed since the 2026-04-15 meeting?" lookups work.
6. **Run after every weekly team call.** One person runs both commands; output is committed to git; whole team sees the diff.
7. **Anonymise before public sharing.** Names → segments, numbers → depersonalised, never publish negative statuses.

## Prompts

Project-tracker department rules (excerpt of `Projects/AGENTS.md` — referenced by the skill):

```
`Tag system (always apply these tags on any update):
- [MEETING:yyyy-mm-dd] — source meeting reference
- [PORTFOLIO:ACTIVE | INACTIVE] — portfolio bucket
- [STATUS:LAUNCH | SUPPORT | DEVELOPMENT]
- [ANALYSIS:INFERRED | INDUSTRY | TECHNICAL]
- [CLIENT:DIRECT | FEEDBACK | REQUIREMENT]

Anti-hallucination: every status assertion must cite source — either the transcript line range, or [CANONICAL] if first declaration, or [REF: <file>#<section>] if pointer.
`
```

Operator command, verbatim (from the demo file):

```
`Take the latest team call transcript and update project status cards.
`
```

Follow-up command:

```
`Create a summary of which projects are ready for testimonial collection.
`
```

## Gotchas

- **Anonymise before sharing.** Names → segments, numbers → depersonalised; never publish negative statuses to a public demo.
- **Don't merge transcripts and status cards into one file.** Transcripts are source-of-truth raw data; status cards are derived. Keep them separate so the derivation can be re-run.
- **Don't try to summarise the whole transcript.** Summary born without context is bad. Only update the project-specific sections; leave the rest of the transcript alone.
- **Tag drift kills retros.** Enforce the `[MEETING:yyyy-mm-dd]` tag via the rules file; reject untagged updates.
- **Don't replace the meeting itself.** The meeting is where humans decide; the skill is what saves you from manual status-card maintenance afterwards.

## Variations

- **Lighter:** A single skill that produces a weekly portfolio digest as one document (no per-project cards) — good for sub-10-project shops.
- **Heavier:** Per-project agents that don't just update cards but also enqueue tasks in the tracker and Slack the responsible IC.
- **Vertical:** For agencies, add a "client mood" classifier on each project update — flags accounts trending negative two weeks in a row.

## Tools

- Notetaker auto-saving team-status transcripts to a known folder
- `Projects/Status-Projects/` with one card per project (template provided)
- Department agent-rules file for project tracking
- Agent CLI with file-read/write tools
