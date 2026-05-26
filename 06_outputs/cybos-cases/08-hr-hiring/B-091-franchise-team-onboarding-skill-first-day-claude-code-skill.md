---
id: B-091
tier: B
category: "HR & hiring"
kind: skill
title: "Franchise / team onboarding skill (first-day Claude Code skill)"
subtitle: "New hires sit in onboarding limbo for 1-4 weeks. A Day-1 skill provisions everything and ends with a real shipped task."
source: https://www.cybos.ai/cases/B-091
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "Founder / HR lead at hire kickoff"
type: case
version: v0.1
---
# Franchise / team onboarding skill (first-day Claude Code skill)

> New hires sit in onboarding limbo for 1-4 weeks. A Day-1 skill provisions everything and ends with a real shipped task.

## What

A Claude Code skill that any new hire runs on Day 1. The skill: ingests the hire's profile + tasks they already own, provisions accesses (VPN, Claude subscription, call-recording client, repo access), installs the call-recording client locally, and — critically — guides the hire to **complete one real work task by end of Day 1**. Output: working laptop, working subscriptions, and one closed ticket the hire personally shipped.

## Why it matters

Standard onboarding takes 1–4 weeks before a hire ships anything. An operator at a small team verified by test: tested skill on one franchise → new hire shipped a real (small) task by end of Day 1, 7-day "onboarding limbo" eliminated. The same skill provisions the operator-level AI subscriptions, which is the load-bearing detail other onboarding flows miss.

## End-to-end

1. Skill SKILL.md with named steps: profile-intake → access-provisioning → tool-install → first-task.
2. Profile-intake: 5 questions (role, prior tools, OS, time zone, accessibility needs). Outputs `hire-profile.json`.
3. Access-provisioning: list of access requests routed to IT (VPN, repos, KB, calendar). Each is a one-call to your IT request API.
4. Tool-install: scripted installs of call-recorder, Claude Code, agent CLIs, Wispr Flow (or equivalent). On Mac: brew; on Windows: winget.
5. VPN provisioning step for restricted regions (use case: any geography where SaaS access is restricted).
6. First-task module: pull one ticket from the hire's intended queue, route it through Claude Code with the new hire shadowing, ship.
7. End-of-day artifact: a one-page "Day 1 report" that the hire generates and the manager skims.

## Gotchas

- Don't skip the first-task module. An onboarding skill that ends at "subscriptions provisioned" is the standard SaaS-checklist trap. The Day-1 shipped-ticket is what produces commitment.

## Tools

- Claude Code skill harness
- IT request API or human-in-loop for accesses
- A ticket queue with at least one good "starter" task waiting
- VPN provisioning capability if relevant
