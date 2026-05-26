---
id: A-085
tier: A
category: "HR & hiring"
kind: workflow
title: "Unified candidate-status lookup across the ATS, Gmail, Calendar, and the internal candidate platform"
subtitle: "Problem solved: Answering \"what's the status of this candidate?\" means tab-switching across the ATS, three Gmail searches, Calendar, and an internal platform; one prompt collapses six tabs into one verdict — and never says \"scheduled\" when the invite was only sent."
source: https://www.cybos.ai/cases/A-085
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "hiring manager · recruiting ops · founder triaging a candidate inbox"
type: case
version: v0.1
---
# Unified candidate-status lookup across the ATS, Gmail, Calendar, and the internal candidate platform

> Problem solved: Answering "what's the status of this candidate?" means tab-switching across the ATS, three Gmail searches, Calendar, and an internal platform; one prompt collapses six tabs into one verdict — and never says "scheduled" when the invite was only sent.

## What

An open-sourced internal recruiting skill (from a US accelerator's software team) that resolves a candidate name into a single unified status table by querying four systems in parallel: **Ashby** (ATS) for profile, application, pipeline stage, and history; **Gmail** (inbox, sent, drafts) for last communications in both directions and any drafted reply; **Google Calendar** for upcoming interviews with `responseStatus` precision; and the internal candidate platform for additional notes. The output is one per-candidate table — email, LinkedIn, Ashby URL, background, stage, source, calendar event + responseStatus, last email each direction, draft status, days waiting, and an explicit **"Action needed"** verdict. The load-bearing rule: it **never reports a meeting as "scheduled" unless `responseStatus` is `accepted`** — invite-sent is not scheduled. It will not present results until every source has been queried; a failed query is reported as a failure, never silently skipped.

## Why it matters

The hiring-manager status check is the classic multi-tool tax: the ATS shows a stage but not whether the candidate replied to yesterday's email; Gmail shows the email but not whether there's a draft you forgot to send; Calendar shows an event but not whether the candidate actually accepted. The ambiguity that costs real time is "scheduled vs just invited" — this skill kills it by surfacing `responseStatus` precisely (`accepted` = confirmed, `declined` = rejected invite, `tentative` = tentatively accepted, `needsAction` = invite sent, no response). The "Action needed" field is the differentiator: it is a verdict ("draft exists, send it" / "ball is in candidate's court"), not a data dump that still leaves the manager to decide. Demoable in two minutes; applicable wherever Ashby/Greenhouse/Lever coexist with Gmail and Calendar.

## End-to-end

1. **Install the MCPs and read config first.** `git clone https://github.com/yc-software/recruiting.git`, `uv tool install git+https://github.com/yc-software/waas-mcp`, `uv tool install git+https://github.com/ryankicks/mcp-ashby`; Google Workspace via Claude Code's built-in integrations. Then read the bundled config: hiring-manager identity (email, Zoom, office, Slack IDs), ATS config (source IDs, archive reasons, email style, draft rules), internal-platform config (pipeline stages, job IDs, MCP tools), job-spec files (job + stage IDs, candidate bar, outreach template, tone), and the shared 4-source merge procedure.
2. **Ashby — resolve the candidate.** `candidate_search(name)` → extract name, primary email, position, company, school, LinkedIn from socialLinks, first applicationId, bio summary / stage / source from customFields, profile URL.
3. **Ashby — application detail.** If applicationIds exist, `application_info(applicationId)` → currentInterviewStage.title, status (Active/Archived/Hired), archiveReason, applicationHistory with dates + actors, source.title.
4. **Gmail — inbound and sent.** `gmail_query_emails(user_id, query: "from:<email> newer_than:14d", max_results: 3)` for their most recent message; `gmail_query_emails(user_id, query: "in:sent to:<email> newer_than:14d", max_results: 3)` for the hiring manager's last reply. Scan the thread for any email-address-change request before reporting the email.
5. **Gmail — drafts.** `gmail_list_drafts(maxResults: 10)`; cross-reference draft threadIds against the candidate's thread IDs from step 4 to surface a forgotten unsent reply.
6. **Calendar — upcoming interviews.** `calendar_get_events(user_id, calendar_id: "primary", time_min: today, time_max: today+4 weeks, timezone: "America/Los_Angeles")`. Filter events by the candidate's first/last/full name. The key field is `attendees[].responseStatus` — `accepted` = confirmed, `declined` = rejected, `tentative` = tentative, `needsAction` = invite sent, no response. Cross-reference with Ashby `interview_schedule_list`.
7. **Internal platform — notes.** If a short_id exists, `candidate_notes_list(short_id)` for additional notes the ATS doesn't carry.
8. **Gate, then present.** Do not present until every source has been queried (Ashby, Gmail inbox 14d, Gmail sent 14d, drafts, Calendar 4 weeks, internal platform if applicable). Any failed query is reported as a failure. Emit a "Checked / Skipped" header and the per-candidate table ending in the "Action needed" verdict.

## Prompts

Per-step MCP calls (verbatim):

```
`candidate_search(name: "<candidate name>")
application_info(applicationId: "<first application ID>")
gmail_query_emails(user_id: "<hiring manager email>", query: "from:<candidate email> newer_than:14d", max_results: 3)
gmail_query_emails(user_id: "<hiring manager email>", query: "in:sent to:<candidate email> newer_than:14d", max_results: 3)
gmail_list_drafts(maxResults: 10)
calendar_get_events(user_id: "<hiring manager email>", calendar_id: "primary", time_min: <today>, time_max: <4 weeks from today>, timezone: "America/Los_Angeles")
candidate_notes_list(short_id)
`
```

Output table (verbatim):

```
`| Field | Value |
|-------|-------|
| **Email** | <email> (note if they requested a different one) |
| **LinkedIn** | <url> |
| **Ashby** | <profile url> |
| **Background** | <position @ company, school — from Ashby or email> |
| **Ashby Stage** | <stage> (<Active/Archived>) |
| **Source** | <how they entered: internal platform, intro, Applied, Sourced, etc.> |
| **Calendar** | <event details + responseStatus, or "No upcoming events"> |
| **Last email (them)** | <date — snippet> |
| **Last email (hiring manager)** | <date — snippet> |
| **Draft exists** | <Yes (threadId) / No> |
| **Days waiting** | <days since candidate's last email, if they're waiting on the hiring manager> |
| **Action needed** | <what the hiring manager should do next, or "None — ball is in candidate's court"> |
`
```

Install (verbatim — keep runnable):

```
`git clone https://github.com/yc-software/recruiting.git
uv tool install git+https://github.com/yc-software/waas-mcp
uv tool install git+https://github.com/ryankicks/mcp-ashby
# Google Workspace via Claude Code built-in integrations
`
```

## Gotchas

- **Never say "scheduled" unless `responseStatus` is `accepted`.** Invite-sent (`needsAction`) is not scheduled. This is the single most important rule in the skill — reporting "scheduled" off a sent-but-unaccepted invite is the exact failure it exists to prevent.
- **Query everything before presenting; never silently skip a source.** A failed query is reported as a failure with the "Checked / Skipped" header — a partial answer presented as complete is worse than an explicit gap.
- **Check for an email-address-change request inside the thread before reporting the email.** Reporting a stale address routes the next outreach into a dead inbox.
- **Compute days-of-week correctly — verify, don't guess.** The skill explicitly calls out date-arithmetic errors; "days waiting" and weekday claims must be checked, not assumed.
- **No per-candidate state without the config.** The skill is driven by the bundled config (job IDs, stage IDs, draft rules); running it without reading config first produces a generic, wrong-stage answer — the recruiting-intake anti-pattern of skipping per-candidate context.

<hr/>

## Tools

- Claude Code with MCPs configured: Google Workspace (gmail_query_emails, gmail_get_email, calendar_get_events), a Gmail-drafts MCP (gmail_list_drafts), an Ashby MCP (candidate_search, candidate_info, application_info, application_feedback_list, interview_schedule_list, interview_event_list), and the internal-platform MCP (candidate notes/status/messages), plus `Read` and `Bash`
- A config directory with hiring-manager identity, ATS source/archive/draft rules, internal-platform stage/job IDs, job-spec files, and the shared 4-source merge procedure
- Ashby (or generalize the recipe to Greenhouse/Lever) + Gmail + Google Calendar coexisting on the same hiring stack
