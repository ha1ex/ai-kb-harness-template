---
id: C-097
tier: C
category: "Engineering productivity"
kind: pattern
title: "Self-administering personal agent — a separate CC process can repair the bot it lives with"
subtitle: "Problem solved: Long-running personal agents (Telegram bots, daemons) periodically wedge themselves — compaction failures, dead heartbeats, broken sessions — and need a hands-on operator to restart them."
source: https://www.cybos.ai/cases/C-097
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "operator running 24/7 personal agents on a VPS / Mac mini"
type: case
version: v0.1
---
# Self-administering personal agent — a separate CC process can repair the bot it lives with

> Problem solved: Long-running personal agents (Telegram bots, daemons) periodically wedge themselves — compaction failures, dead heartbeats, broken sessions — and need a hands-on operator to restart them.

## What

On the same VM where the bot runs, install Claude Code as a separate user/process. When the primary bot detects it's broken (or via watchdog), it shells out to `claude -p "investigate and fix yourself"` and the second CC process diagnoses + repairs the first. Self-administering pattern; converts "page the operator" into "page the meta-agent."
