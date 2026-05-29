---
id: B-113
tier: B
category: "Operations"
kind: tactic
title: "Subscription ROAS via ccusage to size your plan"
subtitle: "Problem solved: Founders pay $100-$200/month for Claude/Cursor/Codex plans with no idea whether they're overpaying or undersubscribed."
source: https://www.cybos.ai/cases/B-113
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · finance ops"
type: case
version: v0.1
---
# Subscription ROAS via ccusage to size your plan

> Problem solved: Founders pay $100-$200/month for Claude/Cursor/Codex plans with no idea whether they're overpaying or undersubscribed.

## What

`ccusage` is a local CLI that reads `~/.claude/stats-cache.json` and reports your usage at API-equivalent prices. Divide that monthly number by your subscription price and you get a one-number ROAS for the plan. The 30-second decision: ROAS well above 1 means you're saving money; near or below 1 means downgrade.

## Why it matters

Reported reference points from the community: 20x ROAS on a $200 Max plan for a heavy CC user; ~4x on a $100 plan (still positive); one operator confirmed Max $100 returned ~$650 of equivalent API. Same logic applies to Cursor (the "Cursor unlock" benchmark referenced $1,100/month in equivalent API spend on a $200 plan) and Codex. The number tells you when to rotate up to Max, rotate down, or open a second account.

## End-to-end

1. Install Node.js and pnpm if you don't have them.
2. Run `pnpm dlx ccusage@latest monthly -b` from your shell.
3. Read the total monthly API-equivalent cost line.
4. Divide by the plan price you actually pay (Pro, Max $100, Max $200).
5. Repeat at the end of each month; if ROAS < 1 for two consecutive months, downgrade or cancel.
6. Optional: a menu-bar variant exists for live token-remaining display across multiple CC accounts.

## Prompts

```
`pnpm dlx ccusage@latest monthly -b
`
```

## Gotchas

- `pnpm dlx` pulls and runs arbitrary npm code each invocation — non-trivial supply-chain risk. At least one operator vetted the package source before running it. Pin a version or vendor the script if you put this in cron.

<hr/>

## Tools

- Node.js + pnpm
- Claude Code with local stats cache
