---
id: B-126
tier: B
category: "Engineering productivity"
kind: tactic
title: "Claude Code anti-regression settings — force max-effort thinking when the agent \"gets dumber\""
subtitle: "Problem solved: Mid-2026 Claude Code regression dropped read/edit ratio from 6.6 → 2.0 and doubled loop rate; settings + env vars restore quality at 2–4× token cost until upstream patches."
source: https://www.cybos.ai/cases/B-126
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "any heavy Claude Code user feeling quality drop"
type: case
version: v0.1
---
# Claude Code anti-regression settings — force max-effort thinking when the agent "gets dumber"

> Problem solved: Mid-2026 Claude Code regression dropped read/edit ratio from 6.6 → 2.0 and doubled loop rate; settings + env vars restore quality at 2–4× token cost until upstream patches.

## What

Forces Claude Code into its highest-effort thinking mode and disables adaptive thinking — the dynamic behavior that throttles thinking budget on "easy" steps and is implicated in the regression. Adds an explicit `MAX_THINKING_TOKENS` ceiling and (optionally) shrinks the working window to force earlier compaction. Combined effect: the agent stops short-circuiting and resumes the read-heavy, edit-careful behavior operators expected.

## Why it matters

Anthropic engineering acknowledged the regression on HN. Operator-reported symptoms: more failed edits, more re-reads, more "I'll just try this" loops. The settings below are a workaround, not a fix — but they cost only token spend, and they materially restore quality on long sessions until the upstream patch ships.

## End-to-end

1. Edit `~/.claude/settings.json` and set `effortLevel: "high"` (or `"max"` per session if needed).
2. Add the env vars below to the same file's `env` block: `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1` and `MAX_THINKING_TOKENS=128000`.
3. Optional: set `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` to force earlier compaction, keeping the working context smaller.
4. Restart Claude Code.
5. One-shot alternative: `npm install -g claude-code-anti-regression && cc-anti-regression install`. Use `cc-anti-regression check` to diagnose first; `cc-anti-regression uninstall` to roll back.
6. When upstream patches, roll back — these settings double or quadruple token spend.

## Prompts

```
`{
 "effortLevel": "high",
 "env": {
 "CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING": "1",
 "MAX_THINKING_TOKENS": "128000"
 }
}
`
```

```
`npm install -g claude-code-anti-regression
cc-anti-regression check # diagnostic
cc-anti-regression install # apply
cc-anti-regression uninstall # rollback
`
```

## Gotchas

## This is a workaround, not a fix. Token spend goes up 2–4× while it's on. Set a calendar reminder to roll back after the upstream patch (track the GitHub issue linked in the Anthropic HN thread). If your plan caps usage, you'll hit it faster — consider this only when you have token headroom or when quality genuinely matters more than spend.

## Tools

- Claude Code CLI
- npm (only for the one-shot CLI wrapper)
