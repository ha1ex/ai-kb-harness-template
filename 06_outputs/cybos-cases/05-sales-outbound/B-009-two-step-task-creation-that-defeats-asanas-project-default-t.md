---
id: B-009
tier: B
category: "Sales & outbound"
kind: pattern
title: "Two-step task creation that defeats Asana's project default-template"
subtitle: "Asana's project default-template silently overwrites your task body. Two API calls per task and the right HTML tags fix it."
source: https://www.cybos.ai/cases/B-009
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "Engineer integrating LLM agents with Asana / Jira / Linear / Notion"
type: case
version: v0.1
---
# Two-step task creation that defeats Asana's project default-template

> Asana's project default-template silently overwrites your task body. Two API calls per task and the right HTML tags fix it.

## What

Asana projects that have a default-task template silently overwrite `html_notes` at creation time. The fix is two API calls per task: POST `/tasks` with the name + project memberships + assignee + every custom-field GID populated; then PUT `/tasks/{gid}` with the real `html_notes`. The body uses only Asana's whitelisted HTML tags (`<body><h1><hr/><ul><li><strong><em><a>`) — no `<p>` or `<br>`; each paragraph is wrapped in `<ul><li>...</li></ul>`.

## Why it matters

Eliminates the 5-minute manual fill of ~12 custom fields per deal. At 50 deals per week that's roughly four hours saved per week, with zero "forgot to set the vertical" errors.

## End-to-end

1. Discover custom-field GIDs once: `GET /projects/{gid}/tasks?opt_fields=custom_fields.gid,custom_fields.name,custom_fields.enum_options.name,custom_fields.enum_options.gid`.
2. Hardcode the `GID → name → option_gid` map per project in code (one dict per enum field).
3. POST `/tasks` with `data.custom_fields = {gid: option_gid_or_value}`, plus `memberships: [{project, section}]` to land in the correct section.
4. PUT `/tasks/{gid}` with `data.html_notes = "<body>...</body>"` built from the four-section template (Team / Product / Traction / Competitors).

## Gotchas

- The `html_notes` whitelist is undocumented and the project-template overwrite is undocumented — both were reverse-engineered. Asana admins adding or disabling enum options will silently break the hardcoded GID map; re-run the discovery query whenever the option set changes.

<hr/>

## Tools

- Asana Personal Access Token
- Python `httpx` (or any HTTP client)
