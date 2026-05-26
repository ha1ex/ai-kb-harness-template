---
id: B-046
tier: B
category: "Engineering productivity"
kind: workflow
title: "Release Management Automation"
subtitle: "Release-notes prep takes 2-3 hours per ship. Agent drafts notes + runs pre-release checks; -93% time and the FTE goes away."
source: https://www.cybos.ai/cases/B-046
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "release manager · engineering lead"
type: case
version: v0.1
---
# Release Management Automation

> Release-notes prep takes 2-3 hours per ship. Agent drafts notes + runs pre-release checks; -93% time and the FTE goes away.

## What

Generates release notes, runs pre-release verification across MRs in the milestone, drafts the changelog, posts the announcement. A working prototype already exists in the field where an engineering lead built it for personal use; the team-wide version eliminates a dedicated release-manager FTE.

## Why it matters

Reported wins: release-notes prep 2–3 hours → ~10 minutes (-93%). Saves 2–8 days per release-manager per month. Removes the human bottleneck on shipping.

## End-to-end

1. Convention: every MR has a label set (`feature`, `bugfix`, `breaking`, `security`) and a short user-facing summary line in the description.
2. Skill `release-notes` queries the merged MRs in the milestone, groups by label, summarizes per group, generates two artifacts: internal changelog (full) and external release notes (concise, customer-language).
3. Skill `release-verify` runs the checklist: migrations applied, secrets rotated if needed, feature flags set, dashboards green, on-call rota updated.
4. Drafts a Slack/Telegram announcement post + an in-product banner copy.
5. Human signs off; skill publishes.
6. After release, skill posts a "what we shipped this week" summary to the public channel.

## Gotchas

- MR-description discipline is the actual bottleneck. If devs paste "wip" as the summary the agent makes up plausible nonsense. Enforce a description template + linter.
- Don't let the agent press "release" by itself. It drafts and verifies; humans ship.

## Tools

- Git host API (GitHub / GitLab)
- Label discipline on MRs
- Slack / Telegram webhook
