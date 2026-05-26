---
id: A-049
tier: A
category: "Operations"
kind: strategy
title: "Microservices replace the task tracker as the company's operating system"
subtitle: "24,000 open tasks in Jira and growing. Replace recurring work with code; abandon the tracker."
source: https://www.cybos.ai/cases/A-049
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "Founder / co-owner with absolute mandate · head of integration · every department's \"person with the pain\""
type: case
version: v0.1
---
# Microservices replace the task tracker as the company's operating system

> 24,000 open tasks in Jira and growing. Replace recurring work with code; abandon the tracker.

## What

Kills the legacy task tracker (Jira, Linear, Asana, ClickUp, Trello, or equivalent) as the company's unit of work. Replaces "tasks" with two new abstractions:

- **Microservices.** Any recurring workflow — invoice approval, contract approval, barcode dedup, marketplace commission flow, margin calc, compliance-required product-labeling — becomes a small piece of code the agent wrote. It runs on a schedule or on a trigger; it has an SLA spoken into existence by the operator; it has a deployed URL.
- **Incidents.** Genuinely one-off problems that can't be a microservice become incidents — treated like quality/operational incidents in a manufacturing line, not like tickets to assign.

The default question for any new ask becomes: **"prove to me why this CAN'T be a microservice."** Free-form work that survives that filter goes into a vibe-coded kanban that mirrors how the founder thinks, not into the old tracker. The old tracker is not migrated — it is simply abandoned and allowed to decay.

## Why it matters

At one mid-size cosmetics retailer, the previous CEO had accumulated **24,000 open tasks in the legacy task tracker over 24 months**. The new operator stopped opening the tracker on Day 1 of the transformation. Within 6 weeks the company had **~25 microservices** in real production across ~17 departments (R&D lab, production, logistics, ecom/marketplaces, sales offline, legal, finance, etc.) — built by the founder personally in Claude Code, then handed to the former IT director (now "Chief Integration Officer") to harden. The operating model now supports a planned FTE cut of **>50%**. The operator reports: "stopping the tracker froze inbound work for one week. Then it forced me to build the most-needed microservices first — invoice approval, contract approval. Those became durable."

The deeper claim is structural: a task tracker is a queue of work assigned to humans. A microservice is a queue of work done by code. Once the unit of work shifts, the question "how many people do we need to do this?" stops mapping cleanly onto headcount, because most of the work no longer requires assignment at all.

## End-to-end

1. **Secure absolute mandate first.** This case does not work in a multi-stakeholder political environment — the operator needs unilateral authority to abandon the legacy tracker (see the precondition case "Absolute mandate"). Without it, every "we should still update the old tracker too" comment defeats the move.
2. **Pick the abandonment date.** Announce it, then on the date, stop opening the old tracker yourself. Don't migrate, don't archive, don't even close tasks — just stop. At the reference deployment the founder opened the legacy tracker exactly once in the first 6 weeks, for one security-related task. The 24K-task backlog is allowed to rot; nobody died.
3. **Install the default-microservice rule.** New rule communicated in every 1:1 and every department meeting: "want to ask the org to do something? Either (a) it's a microservice — we'll write code — or (b) it's an incident, treated as a quality event with root cause." No third option. Operator's job is to ask "why CAN'T this be a microservice?" until it either becomes one or proves it's an incident.
4. **Walk to the person with the pain.** Don't write specs. Walk to the production economist / logistics manager / marketplace operator. Get the input files they actually use (Excel exports, marketplace cabinet screenshots, e-document portal exports). Have them describe the desired output **by voice** — not in writing, not in a wiki page.
5. **Hand input + voice description to the agent.** Drop the Excel and the screenshots into Claude Code in a project folder. Paste the transcribed voice description. Ask for a minimal MVP. Iterate 1–2 times until the employee says "yes, that's what I wanted." No formal meetings, no specs.
6. **Track each microservice as a hub.** A simple kanban (vibe-coded, see Variations) where each hub has: hub name, owner, current iteration date, last-modified date, deployed URL, and the linked Git repo. Iteration dates are the social pressure — `11 Apr`, `15 Apr`, `28 Apr` visible on each card. Departments with stale dates get a 1:1.
7. **Speak SLAs into the microservice config.** Once a workflow is a microservice, scheduling is trivial. Speak the SLA into the agent: "in logistics, you do East→East from 06:00–08:00 and 17:00–18:00." The agent writes the scheduling config, deploys it. Previously this kind of SLA was impossible to enforce in the ERP without weeks of custom dev.
8. **Hand hardening to a Chief Integration Officer.** The first batch of MVPs are sloppy (paths hard-coded, error handling absent, etc.). After ~2 weeks the operator's old IT director — re-titled and re-scoped — converts the MVPs into proper microservices with logging, retries, monitoring. The founder keeps shipping MVPs upstream; the integration officer hardens downstream.
9. **Wrap, don't replace, the legacy ERP.** All microservices read from / write to the existing ERP (SAP / Oracle / NetSuite / equivalent) via API. None of them modify the ERP's standard modules (accounting, tax, banking integration). The ERP becomes a thin data sink — a "cash register." Money for ERP specialists is spent only on in-ERP modules; everything else lives outside. See the companion ERP-wrapping principle.
10. **What stays in the old surface (deliberately).** Bank integrations, regulator-side electronic-document workflows (tax filings, e-signature on state portals), and any heavily regulator-dependent business logic. Don't try to rewrite these — the entity-specific business logic + regulator dependencies are huge. Off-the-shelf products + human specialists own them.
11. **Free-form work gets a vibe-coded kanban.** Whatever survives the microservice/incident filter goes into a small custom kanban — built in Claude Code in an afternoon, matching exactly how the operator thinks (columns, filters, card fields). Not Linear. Not Asana. Not the legacy task tracker. The kanban is itself a microservice.

## Prompts

The default question, asked every time someone proposes "a task":

```
`"Prove to me why this CANNOT be a microservice. Tell me: what data does it
need on the input? What artefact does it produce? Who consumes that artefact?
How often? If you can't tell me, it's a microservice. If you can, and the
answer is 'literally once, ever', it's an incident."
`
```

Building a microservice from a pain conversation (paste into the agent):

```
`I'm in /microservices/<dept>/<service-name>. Attached: the Excel the team
currently uses, two screenshots from the marketplace cabinet, and a
voice-transcribed description of what they want.

Build the minimum viable microservice:
- One Python file, no framework, no Docker.
- Reads input file from data/in/, writes output to data/out/.
- Logs each step to data/log/<timestamp>.log.
- Hard-code paths for now; we'll wire to the ERP API after the operator confirms.
- Print a one-paragraph "what this does" at the top of the file.

After it works on the example, write a handoff (see /handoff skill) and
commit. Do not wire schedulers yet.
`
```

Speaking an SLA into the scheduler config:

```
`The logistics microservice <service-name> should run weekdays at 06:00 and
17:00 local time, doing East→East routing. On weekends it doesn't run.
On public holidays it doesn't run. Update the schedule config in
schedule.yaml and explain what you changed in one line.
`
```

Hub kanban card schema (paste into the custom kanban skill):

```
`hub:
 name: <dept-service-name>
 owner_human: <who feels the pain>
 owner_agent: <Claude / Codex>
 iterations:
 - date: 2026-04-11
 summary: "v1 — file-based, manual run"
 - date: 2026-04-15
 summary: "v2 — wired to ERP read API"
 - date: 2026-04-28
 summary: "v3 — scheduler + alerting"
 current_status: production | staging | abandoned
 deployed_url: <if any>
 repo: <git url>
 notes: <free-form one paragraph>
`
```

## Gotchas

- **Don't try this without mandate.** In a consensus-driven culture, every department lead will negotiate "we should also still update the old tracker" and the move dies. The mandate case is the precondition.
- **Don't migrate the backlog.** The 24K legacy tasks are not your problem; they are the previous CEO's audit trail. Migrating them recreates the queue. Let them decay.
- **Don't put microservice tickets into the new kanban.** The kanban is for free-form work the microservice/incident filter could not absorb — it is the residual, not the primary surface. If it grows fast, ask why so much work is escaping the filter.
- **Don't pay an ERP specialist to "integrate" the new microservices.** Use the ERP's API. Specialists are for in-ERP modules (where the regulator depends on you using the standard accounting object). Outside the ERP, the LLM can wire APIs without expensive consultants — confirmed by multiple operators ("Claude can wire the ERP API without paying expensive specialists by the hour").
- **Don't rewrite banking / tax / e-signature integrations.** Off-the-shelf products + human specialists. Even with mandate, the regulator dependency cost dominates.
- **2026-Q2 lesson — accidental public deploy:** one operator's MVP was deployed in a way that landed in a public search index within hours. Caught and removed quickly, but the principle stands: pair the deploy step with the safety rails from A-025 phase 7 (private-by-default, secret-scan hook).

## Tools

- A coding agent (Claude Code, Codex)
- Git per microservice — small repos, one per hub
- Direct API access to the existing ERP/CRM (SAP, Oracle, NetSuite, Salesforce, HubSpot, or equivalent) — read AND write
- A custom kanban (vibe-coded in an afternoon — see A-025 vibe-coding playbook)
- One person who can convert MVPs into hardened microservices (the former IT director re-roled as Chief Integration Officer is the standard pattern)
- Absolute mandate from the operator's level of authority. Without this, see Gotchas.
