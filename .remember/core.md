# Durable project context

This project-owned file records context that should survive a session or client change. Update it when the project purpose or a confirmed constraint changes. Keep task progress in separate `.remember/tasks/<id>.json` records.

## Purpose

Use this knowledge base to collect sources, explain findings and support decisions. Replace this paragraph with the project's purpose, audience and desired outcomes.

## Working rules

- Preserve original evidence in `01_raw/` and cite sources for substantive claims.
- Distinguish facts, inference, assumptions, open questions and proposed decisions. A proposal requires an authorized decision before it becomes accepted policy.
- Follow `harness/rules/evidence.md` and `harness/rules/workflow.md`. Use `docs/human-interface.md` when preparing material for readers.
- Preserve project-owned content and client settings when updating the harness.
- Record actual checks and remaining work in an owned task handoff before ending a session.

## Project decisions and constraints

No project-specific decisions or constraints are recorded yet. Add confirmed decisions with links to their evidence or decision records; do not infer them from the template.

## Where context lives

`00_context/` describes the project; `01_raw/` preserves sources; `02_sources/` summarizes individual sources; `03_wiki/` explains concepts; `04_synthesis/` holds interpretation and open questions; `05_decisions/` records decisions; `06_outputs/` contains reader-facing artifacts.

`.remember/preferences.md` controls presentation. `.remember/now.md` is an optional human-curated overview. Each task handoff records its owner, goal, acceptance criteria, confirmed decisions, sources, changes, checks and next step.
