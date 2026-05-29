---
id: A-020
tier: A
category: "Operations"
kind: skill
title: "200-line end-to-end client-onboarding workflow skill"
subtitle: "Onboarding a new client takes six weeks because every step lives in someone's head. One file walks the agent through all of them."
source: https://www.cybos.ai/cases/A-020
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "Ops lead · integration team lead · founder"
type: case
version: v0.1
---
# 200-line end-to-end client-onboarding workflow skill

> Onboarding a new client takes six weeks because every step lives in someone's head. One file walks the agent through all of them.

## What

A single ~200-line Markdown file that scripts the entire end-to-end process of taking a newly-signed client from "contract signed" to "fully integrated and reporting live data." The file is a numbered playbook with each step linking out to detailed sub-instructions: create project folders, run deep research on the client, ingest pre-sales materials, generate data definitions and project documentation, provision a database instance, kick off access requests, schedule kickoff calls, configure connectors, set up dashboards, and so on. The operator runs it by saying "start" to their agent, and the agent walks the file top to bottom. When the agent stalls on an edge case, the operator edits the workflow file inline; the next run is better. Knowledge accumulates in the file, not in chat history or anyone's head.

## Why it matters

At a small AI media-buying startup, this workflow file compressed the "first 80% of integration" from six weeks to two weeks to one or two days within a few months. As a side effect, the integration team and the product team converged on working the same artefacts (the agents running integrations), which structurally unified two previously parallel functions. Staff turnover stopped destroying onboarding quality because the workflow file outlasted the people who wrote it.

## End-to-end

1. **Make sure Phase-1 prerequisites are in place.** Shared workspace exists (see #162), team uses Cursor or Claude Code daily, naming convention is enforced, root agent-config file points at department rules. Without these the 200-line skill has nothing to index.
2. **Pick a single obsessive owner.** Usually the head of analytics, integration lead, or COO. Not a committee.
3. **Draft a rough first version in one sitting.** Aim for a numbered list of 30–80 steps. Each step is one line. Mark sub-steps with bullets. Mark every required-document or required-credential as `[INPUT: …]`. Mark every produced artefact as `[OUTPUT: path/to/file.md]`.
4. **Link each step to a sub-instruction file in the workspace.** `Docs/Product/Tools/data-definitions.md`, `Docs/Operations/Access-Requests-Process.md`, `Docs/Operations/Kickoff-Call-Template.md`. The 200-line file is the table of contents; the sub-files hold the detail.
5. **Drop it next to the rest of ops:** `Docs/Operations/Client-Onboarding-Workflow.md`.
6. **Run it for the next real client.** Operator: "Use ops context. Start: new client = `[Client Name]`." Agent reads the file, executes each step in order, asks for confirmation where required.
7. **The edge cases are the spec.** Every time the agent stalls, asks a wrong question, or skips a required step, the operator edits the file inline (not their head, not a Slack thread). Commit the edit.
8. **Roll out to the rest of the team.** "We no longer launch projects manually. Open the agent, say 'start'." Hold a 30-min screen-share for each integrator showing the actual flow.
9. **After ~10 client launches, do a retro.** Which steps the agent still gets wrong? Which steps are dead weight? What new steps appeared? Edit the file.

## Prompts

Opening lines of the workflow file (anchor + invocation contract):

```
``
```

## Gotchas

- **Don't write a perfect spec on day one.** First version is a rough 200 lines. It improves with each run. "Worst version is your starting point" applies.
- **Don't try this before Phase 1 is solid.** If everyone isn't already using the agent for daily work, the workflow file has no audience.
- **Don't let learnings escape into Slack.** Every edge case is a one-line edit on the workflow file. If you find yourself answering the same question twice in Slack, the answer should have been a workflow-file commit.
- **Don't bury the file under sub-folders.** Single canonical path. One owner. PR-style review for big edits.
- **One workflow first** — don't try to write workflow skills for five processes at once. Pick the most painful repeating process; instrument it; expand after it stabilises.

## Variations

- **Lighter:** A 50-line workflow for a sub-process (e.g. "new partner intake") before attempting the full onboarding.
- **Heavier:** Multi-phase workflow with explicit handoffs between teams; each phase has its own `start` invocation and its own owner.
- **Vertical:** For B2B SaaS with a long integration, add a "data-readiness gate" step that fails fast if the client doesn't have the required schemas.

## Tools

- Shared workspace under git
- Cursor or Claude Code (or Codex) at every operator's seat
- Department-level agent-rules file under `Docs/Operations/`
- Naming convention adopted across the workspace
- One owner with authority to edit the workflow file
