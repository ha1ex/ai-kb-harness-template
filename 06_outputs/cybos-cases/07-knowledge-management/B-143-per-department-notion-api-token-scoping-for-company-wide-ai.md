---
id: B-143
tier: B
category: "Knowledge management"
kind: pattern
title: "Per-department Notion API token scoping for company-wide AI agents"
subtitle: "Problem solved: Notion is the company KB but a single shared API token lets any agent overwrite any department's pages; per-department scoped tokens plus one global read-only token keep the source-of-truth from sprawling."
source: https://www.cybos.ai/cases/B-143
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "ops lead · IT/infra lead"
type: case
version: v0.1
---
# Per-department Notion API token scoping for company-wide AI agents

> Problem solved: Notion is the company KB but a single shared API token lets any agent overwrite any department's pages; per-department scoped tokens plus one global read-only token keep the source-of-truth from sprawling.

## What

Issue one Notion API integration token per department, each scoped only to that department's page tree (pages + subpages). Issue one additional global read-only token for cross-team browse. Plug both into Claude Code so any employee can query company-wide knowledge but only write into their own area.

## Why it matters

The default Notion-integration pattern (one workspace-wide token) lets every agent stomp every team's pages. As soon as you have 10+ employees with agents writing into Notion, the KB becomes unreliable — one operator's phrase: the source-of-truth "sprawls". Department-scoped writes plus universal reads keep the KB internally consistent without locking knowledge into silos.

## End-to-end

1. **Create one Notion internal integration per department.** Scope each to that department's parent page; Notion's permission model propagates to subpages automatically.
2. **Create one global read-only integration.** Give it browse access to the whole workspace. This is the token any employee's research agent uses for cross-team Q&A.
3. **Push Notion through Claude Code as the unified write interface.** Each employee's Claude Code session has access to (a) their department's write token, (b) the global read-only token, (c) nothing else.
4. **Pre-install the plugin set each department needs.** Note-takers, scrapers, research tools, API wrappers — kept per-department so an engineer's setup doesn't drag in a sales-team scraper.
5. **Keep Slack and Notion tokens separate.** Different scopes, different audit trails. Don't merge them into one super-token even if Claude Code makes it tempting.
6. **Train staff on session-start and session-end skills.** Session-start loads relevant context from the right Notion pages; session-end writes back deltas. Without these, employees re-fetch the same context every session and the agent re-discovers the workspace structure on every run.

## Gotchas

- Assuming Notion AI alone covers this. Notion's own AI is fine for in-app questions but most agentic use happens in external models — so the token-scoping question still applies, and a single workspace-wide token will leak write-access to every external agent that holds it.

<hr/>

## Tools

- Notion workspace + Notion API
- Claude Code with the Notion plugin installed per employee
- Slack (separate integration)
- Internal session-start / session-end skill pair committed to your team-skill repo
