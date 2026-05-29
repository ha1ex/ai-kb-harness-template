---
id: A-018
tier: A
category: "Customer success"
kind: workflow
title: "Per-project Customer Success status dashboard"
subtitle: "CS leads sit in 20 silent client calls a week to \"smell\" project health. Replace with one auto-refreshed card per account."
source: https://www.cybos.ai/cases/A-018
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "customer success lead · account manager · founder doing portfolio review"
type: case
version: v0.1
---
# Per-project Customer Success status dashboard

> CS leads sit in 20 silent client calls a week to "smell" project health. Replace with one auto-refreshed card per account.

## What

A workflow that automatically generates a status dashboard per client. For each client it cross-references: commercial terms, the people involved, what was promised, what was delivered, current value being delivered, what's blocked, whose side the blockage sits on, whether deadlines are at risk, and verbatim key quotes from communications — all with inline citations to the source files. Built by a single CS lead in ~6 hours of focused work; evolves daily via scheduled cron updates.

## Why it matters

A CS lead used to spend 5–8 hours every week sitting silently on internal client calls just to "smell" project health — pure information ingestion, zero action. Replaced. One CS manager can now run a portfolio of 20+ accounts without sitting in any of those calls; the founder can review the full portfolio in 15 minutes a week. The dashboard's existence also surfaces stale or drifting projects that nobody had flagged because nobody had a holistic view.

## End-to-end

1. **Pre-requisite: the shared workspace foundation.** Every per-client artifact — email threads, chat dumps, call transcripts, task-tracker comments, commercial terms, integration data — must be ingested into a per-client folder in the workspace (e.g., `Projects/Status-Projects/Client-{Industry}-{Name}/`). Without the data layer, the dashboard is empty. If you don't have this in place, do that first (it is the substrate; see the shared-workspace foundation case).
2. **Initial build session (~6 hours, no Zoom).** The CS lead opens Claude Code at the workspace root and writes one long prompt: "Build me a per-client status card. Read everything in `Projects/{client}/`. Output a single markdown file per client with these fixed sections: Analyst, Project Manager, Status (Green/Yellow/Red), Last Update (date), Current Tasks (open with owner + deadline), Completed Components, In-Progress, Pending, KPIs (against targets), Business Impact (current), Next Steps. Cite every claim with `[REF: file#section]`." Iterate the prompt across 6 hours until the output is consistently usable. The 6-hour budget is a feature: it forces the lead to converge on a small set of fields rather than over-engineer.
3. **Standardise the status-card template.** Once the prompt produces a usable card for one client, lock the template at `Projects/Status-Projects/Client-Status-Card-Template.md`. Generate the first batch of cards (one per client) from existing data.
4. **Schedule daily updates (cron).** Run Claude Code in headless mode on a dedicated VM (or any always-on machine) nightly. The cron job: (a) pull latest transcripts from the meeting recorder, (b) pull latest task-tracker comments, (c) pull latest CRM data, (d) re-run the status-card prompt per client, (e) commit and push the updated cards to the workspace repo. Users see fresh data when they open the workspace in the morning.
5. **Split data-pullable vs analytical updates.** Some fields (current tasks list, latest call date, KPI numbers) are deterministic — pull them with scripts, not the agent. Other fields (Status colour, Business Impact narrative, Next Steps recommendation) are analytical — only the agent does these. Keeps the agent's context-window focused on judgement work and reduces token cost.
6. **Consolidated portfolio dashboard.** Once 10+ per-client cards exist, generate a single consolidated view: a one-page Markdown table with one row per client (status colour + last update + 1-line headline + link to the per-client card). Founder reviews this every Monday in ~15 minutes.
7. **Anonymise for sharing.** A rule baked into the workspace: "names → segments, numbers → depersonalized, don't publish negative statuses." Public-facing exports (testimonial-collection summaries, board reports) run through an anonymization pass.

## Prompts

Status-card generation prompt (skeleton):

```
`Read everything under Projects/{client-folder}/.
This includes:
 - All email threads (Projects/{client}/emails/)
 - All chat dumps (Projects/{client}/chats/)
 - All call transcripts (Projects/{client}/transcripts/)
 - Task tracker comments (Projects/{client}/tasks/)
 - Intake docs and commercial terms (Projects/{client}/intake/)
 - Integration data (Projects/{client}/data/)

Produce Projects/Status-Projects/Client-{Name}-Status-Card.md with these fixed sections:

 - Analyst: name + role on our side
 - Project Manager: name + role on client side
 - Status: GREEN / YELLOW / RED + 1-line rationale
 - Last Update: most-recent dated artifact you read
 - Current Tasks: bulleted list with owner + deadline + [REF: source]
 - Completed Components: in the last 30 days, each with [REF:]
 - In-Progress: with [REF:]
 - Pending: with [REF:] and blocker explanation
 - KPIs: bullet list of metric → target → current, each with [REF:]
 - Business Impact: 2-3 sentences of current value being delivered
 - Next Steps: 3-5 recommended actions in priority order

Rules:
 - Every factual claim must include [REF: file#section].
 - If you cannot find evidence for a field, write [INSUFFICIENT DATA] — never guess.
 - Status RED requires a one-line justification citing the worst-performing KPI.
 - Tag every meeting reference with [MEETING:YYYY-MM-DD].
`
```

Tag conventions (baked into the workspace `AGENTS.md` / `CLAUDE.md`):

```
`[MEETING:YYYY-MM-DD]
[PORTFOLIO:ACTIVE] / [PORTFOLIO:INACTIVE]
[STATUS:LAUNCH] / [STATUS:SUPPORT] / [STATUS:DEVELOPMENT]
[ANALYSIS:INFERRED] / [ANALYSIS:INDUSTRY] / [ANALYSIS:TECHNICAL]
[CLIENT:DIRECT] / [CLIENT:FEEDBACK] / [CLIENT:REQUIREMENT]
`
```

Cron wrapper (illustrative):

```
``
```

## Gotchas

- **Anonymise before sharing publicly.** Names → segments, numbers → depersonalized, never publish negative statuses externally. The internal version uses real names; the export pipeline strips.
- **Split deterministic from analytical fields.** Putting KPI numbers in the analytical-pass is how the agent invents them. Pull KPI numbers with a script; let the agent only narrate them.
- **Don't let the cron silently fail.** Add a heartbeat to the cron: if the nightly run doesn't commit a new card for >36 hours, alert. Otherwise the dashboard drifts and nobody notices.
- **Don't widen the per-client folder during the build session.** Keep the input set fixed during the 6-hour build; only widen after the template is stable. Drifting inputs make the prompt unstable.

## Variations

- **Lighter (5–10 clients):** skip the cron; run the refresh manually before each Monday review.
- **Heavier:** add an alerting layer — when a client's status flips to YELLOW or RED, post to a Slack channel with the cited reason and tag the owning CS manager. (This becomes the foundation for case #69, the proactive workflow agent.)
- **Vertical-specific:** for SaaS integrators, add a "integration data" section pulling current data-pipeline health metrics; for agencies, add a "creative-pipeline" section pulling delivery counts.

## Tools

- A populated per-client folder structure (the foundation case).
- Claude Code with the workspace as cwd.
- A meeting recorder integration (Fireflies, TLDV, Otter, Granola) writing transcripts into per-client folders.
- A dedicated VM or always-on machine to host the headless cron.
- Optional: a Notion / Linear MCP for cross-pulling status from external trackers.
