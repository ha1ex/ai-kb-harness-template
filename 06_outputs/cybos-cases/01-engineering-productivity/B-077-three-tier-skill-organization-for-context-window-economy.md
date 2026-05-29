---
id: B-077
tier: B
category: "Engineering productivity"
kind: pattern
title: "Three-tier skill organization for context-window economy"
subtitle: "30+ skills load 40% context before any work starts. Router + bundles + atoms drop it under 10% and recover the planning budget."
source: https://www.cybos.ai/cases/B-077
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "Operator with a skill library past ~20 skills"
type: case
version: v0.1
---
# Three-tier skill organization for context-window economy

> 30+ skills load 40% context before any work starts. Router + bundles + atoms drop it under 10% and recover the planning budget.

## What

Refactor a sprawling skill library into three layers: (1) one parent/router "mother" skill that owns the trigger surface and dispatches to children; (2) command-group skills bundling related families (for example `office-skills` bundling `pptx` + `docx` + `pdf` extraction); (3) atomic command scripts that do the actual work. The router loads ~5 KB of trigger metadata into context; the heavy SKILL.md content stays cold until needed.

## Why it matters

A cohort participant managing 30+ accumulated skills was burning context to ~40 % saturation on session start before doing any work. Three-tier organization drops that to under 10 %, recovers the planning budget, and produces an auditable answer to "which skill fired and why?" via a launch hook.

## End-to-end

1. Inventory every SKILL.md you have. Tag each as router-candidate, group-candidate, or atomic.
2. Group atomics by domain (office, code-review, research, content). Each group gets one parent SKILL.md whose body is a 20-line dispatch table.
3. Author the top-level router skill. Its body is a one-line description per group plus trigger phrases. No business logic — just routing.
4. Add a hook on skill-launch (`PreToolUse` for `SkillTool` or equivalent) that appends the firing skill name + trigger phrase to `~/.claude/skill-audit.log`. Review weekly.
5. Replace direct invocation paths in your AGENTS.md with router-only references.
6. Watch context-window startup cost in `claude --debug` before/after.
7. On every new skill: decide layer first, write second.

## Gotchas

- Group skills must not contain business logic — they only route. The moment a group skill "helps a little" you have a 4-tier mess and the hook log no longer maps to outcomes.
- Don't pre-load the audit hook into the router skill itself; log at the harness layer so the router stays cheap.

## Tools

- Claude Code (or any agent CLI with skill loading)
- A `PreToolUse` hook capable of logging tool calls
- Existing skill library big enough to feel the pain (≥ 20)
