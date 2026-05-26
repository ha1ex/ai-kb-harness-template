---
id: B-022
tier: B
category: "HR & hiring"
kind: pattern
title: "Role card schema — single source of truth per person"
subtitle: "\"Who owns X?\" is a daily Slack question. One file per person with Owns / Co-owns / NOT-owns + running 1:1 history answers it."
source: https://www.cybos.ai/cases/B-022
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · ops lead · every IC"
type: case
version: v0.1
---
# Role card schema — single source of truth per person

> "Who owns X?" is a daily Slack question. One file per person with Owns / Co-owns / NOT-owns + running 1:1 history answers it.

## What

Defines one markdown file per person at `Org/HR/roles/{role} {First Last}.md` with strict frontmatter (`type: role`, `status: active|trial|parted`, `person`, `position`, `format`, `start`) and five required sections: **Expertise**, **Zones of Responsibility** (Owns / Co-owns / NOT owns), **Agreements** (compensation marked PRIVATE — pointer to personal HR folder; schedule; vacation; quarterly KPIs), **Team Interactions** (named counterparts with cadence), **1-1 History** (running log). Drives the `roster`, `review`, and `status` commands.

## Why it matters

Every IC reads their own card to align on what they own; the team reads each other's to coordinate. Cuts "who does X?" Slack questions and forms the data backbone for every other HR command. Compensation calibration becomes data-driven because the 1-1 History runs continuously.

## End-to-end

1. Copy the role-card example to `Org/HR/roles/{role} {Name}.md`.
2. Fill required frontmatter.
3. Fill Expertise (background, network, languages).
4. Fill Zones of Responsibility with explicit **Owns / Co-owns / NOT owns** lists.
5. Mark Agreements compensation as `[PRIVATE — see personal HR folder]`.
6. Set quarterly KPIs (numeric, not activity-based).
7. List Team Interactions cadence with named counterparts.
8. After each 1-on-1, append a dated entry to `## 1-1 History`.

## Gotchas

- **The NOT owns section is critical and most teams skip it.** Most role docs list responsibilities only; without an explicit "NOT owns" list, ownership ambiguity surfaces at the worst moment. 2026-05-05 lesson: missing "NOT owns" on two adjacent role cards blocked a quarter's hiring decision because nobody could agree which incumbent should expand scope before backfilling. Always list 3–5 things this person is explicitly **not** responsible for.
- Compensation must **not** leak into the role card body — a grep hygiene check (`$NK/month`, `€N/month` patterns outside `Org/HR/`) catches this on the weekly eval run.

<hr/>

## Tools

- Markdown vault with `Org/HR/roles/` folder
- Naming discipline (`{role} {First Last}.md`)
