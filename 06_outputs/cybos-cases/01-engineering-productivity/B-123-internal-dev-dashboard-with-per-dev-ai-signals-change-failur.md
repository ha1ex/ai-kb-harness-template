---
id: B-123
tier: B
category: "Engineering productivity"
kind: workflow
title: "Internal dev dashboard with per-dev AI signals + change failure rate"
subtitle: "Problem solved: Eng leaders running 10+ dev teams can't tell whether the AI rollout is helping; per-dev dashboards with PR counts, fixes-per-feature, and change failure rate surface bottlenecks — often not the ones leadership expected."
source: https://www.cybos.ai/cases/B-123
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "eng lead · VP eng · CTO"
type: case
version: v0.1
---
# Internal dev dashboard with per-dev AI signals + change failure rate

> Problem solved: Eng leaders running 10+ dev teams can't tell whether the AI rollout is helping; per-dev dashboards with PR counts, fixes-per-feature, and change failure rate surface bottlenecks — often not the ones leadership expected.

## What

Build a small internal dashboard that pulls per-developer signals from CI/CD and the repo: PR counts, fixes-per-feature (how many follow-up PRs land on a feature after the first merge), change failure rate (deploys that need a rollback or hotfix), and qualitative signals like "verifies AI output before merging." Pair the raw data with a Claude pass over the same artifacts as an independent validator of your manager intuitions. Use the dashboard to coach low scorers and to spot structural bottlenecks.

## Why it matters

A real operator's surprise finding: deploying this dashboard revealed the bottleneck wasn't under-use of AI — it was too many PRs flowing too slowly through review. They responded by shrinking teams to 2–3 people with Kanban + WIP limits, dropping sprint cycles entirely. Without the dashboard, the leadership instinct would have been the opposite move.

## End-to-end

1. Pick a deterministic data spine: PR history, CI/CD outcomes (deploys, rollbacks, hotfixes), Claude/Codex transcript counts per dev.
2. Build a per-dev row: PR count, fixes-per-feature, change failure rate, plus 2–3 qualitative axes (verifies output, splits work appropriately).
3. Have Claude review the same artifacts independently — its read often differs from a manager's gut, and the gap is informative both ways.
4. Rank 0–10. Coach low scorers; let go of the unteachable.
5. Look for the system-level signal, not just individual rankings. If your bottleneck is throughput rather than skill, reorganize: smaller teams, Kanban with WIP limits, kill the sprint cadence.

## Gotchas

- Judging people on artifacts (commits, PRs) rather than outcomes is a fast path to gaming. Pair every artifact metric with an outcome metric (incidents, churn, NPS) so devs can't optimize for the dashboard at the expense of the product.

<hr/>

## Tools

- CI/CD with deploy outcome logging for change failure rate
- Repo + PR history access
- Claude/Codex transcript history if you want the independent-validator pass
- A small custom dashboard (internal tool; no public open-source equivalent yet)
