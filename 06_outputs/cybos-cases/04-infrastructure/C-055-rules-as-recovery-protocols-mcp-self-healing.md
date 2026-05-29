---
id: C-055
tier: C
category: "Infrastructure"
kind: pattern
title: "Rules-as-recovery-protocols (MCP self-healing)"
subtitle: "MCP breaks at 3am and the agent has no path forward. Each integration has a recovery-protocol rule file; agent finds it by phrase."
source: https://www.cybos.ai/cases/C-055
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "skill author · MCP user"
type: case
version: v0.1
---
# Rules-as-recovery-protocols (MCP self-healing)

> MCP breaks at 3am and the agent has no path forward. Each integration has a recovery-protocol rule file; agent finds it by phrase.

## What

Each MCP integration has a corresponding rule file. When the MCP breaks, the agent finds the rule by phrase ("Telegram MCP failing") and follows the documented recovery procedure (fallback layers, retry order). Don't kill old working layers when introducing new ones — keep both rules in the file.
