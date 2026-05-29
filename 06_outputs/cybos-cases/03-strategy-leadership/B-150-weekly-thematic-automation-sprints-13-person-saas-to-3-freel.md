---
id: B-150
tier: B
category: "Strategy & leadership"
kind: strategy
title: "Weekly thematic automation sprints — 13-person SaaS to 3 + freelancers in 6 months"
subtitle: "Problem solved: Founders running 10–20 person SaaS teams want a concrete, time-bounded playbook for compressing headcount via AI without breaking the product."
source: https://www.cybos.ai/cases/B-150
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "XL · Half-year+"
for: "founder · COO · head of operations"
type: case
version: v0.1
---
# Weekly thematic automation sprints — 13-person SaaS to 3 + freelancers in 6 months

> Problem solved: Founders running 10–20 person SaaS teams want a concrete, time-bounded playbook for compressing headcount via AI without breaking the product.

## What

Reorganize the company around AI agents in **weekly thematic sprints** — one functional area per week — while giving agents read access to the full company context (codebase, technical docs, decision history) as a "second brain" + an **AI board of directors** for strategic questions. Hire only people who can orchestrate agents, not those who manage humans.

## Why it matters

Reported outcome from one founder: **13 staff → 3 + a few freelancers** over six months, plus a pipeline of new internal products. First built product on top of the second brain: a daily sales-strategist agent that runs on every client's sales numbers and recommends actions grounded in the product's actual capabilities.

## End-to-end

1. **Build the second brain first.** Read access for agents to codebase, technical docs, decision history. Substrate for every later sprint.
2. **Codify dev philosophy + PRD recipe as a skill.** Sit with the agent and write down how you evaluate hypotheses and what makes a PRD ready. The templates themselves are not in source (`[needs founder input]`); the principle — codify these into a skill so the agent shares your lens — is what the operator reports works.
3. **Spin up the AI board of directors.** A small agent cluster that reads the second brain and answers strategic questions (competitive position, what to ship, margin leaks). Decision support, not decision-making.
4. **Run weekly thematic sprints.** One functional area per week. Documented week 1 = Marketing + Sales (cold outreach, qualification, enrichment, channel campaigns). Documented week 2 = Finance, mapping cash flow toward auto-reports. Source gestures at later weeks (new-feature marketing automation + PR, support optimization) but does not enumerate the full sequence. Each sprint ships a working automation by Friday or it doesn't ship that week.
5. **Set up competitor + industry-news pipeline.** Daily scan; agent recommendations flow into roadmap.
6. **Change the hiring filter.** From this point, hire only people who can orchestrate agents — not those who manage humans (verbatim rule below).
7. **Compress headcount on cadence, not in one cut.** The 13 → 3 reduction took 6 months of weekly sprints, not one layoff.

## Prompts

Hiring filter rule:

```
`Hire only people who can orchestrate agents — not those who manage humans.
`
```

## Gotchas

- **Don't build agents before the second brain.** Agents without context produce generic advice and lose credibility internally.
- **People manager ≠ agent orchestrator.** Don't auto-promote your current people-managers; several operators report human-management instincts actively hurt agent orchestration.

<hr/>

## Tools

- Claude Code with skill system
- An indexer over codebase + docs so agents have read access
- Agent orchestration platform (Paperclip or equivalent)
