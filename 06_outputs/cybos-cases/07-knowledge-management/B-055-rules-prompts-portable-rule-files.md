---
id: B-055
tier: B
category: "Knowledge management"
kind: pattern
title: "Rules > Prompts — portable rule files"
subtitle: "Switching from Claude Code to Codex breaks every prompt embedded in tool configs. Logic in markdown rule files survives the vendor churn."
source: https://www.cybos.ai/cases/B-055
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · engineering lead · any agent power-user"
type: case
version: v0.1
---
# Rules > Prompts — portable rule files

> Switching from Claude Code to Codex breaks every prompt embedded in tool configs. Logic in markdown rule files survives the vendor churn.

## What

Logic that you'd otherwise paste into prompts lives in versioned `rules/*.md` files in the vault. Each agent's main config (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`) references the rule files by path rather than embedding the content. A rule looks like: when X tool breaks, follow these recovery steps; or, when writing outreach, never use these banned phrases; or, when publishing, post to saved-messages first, never directly to channels.

## Why it matters

The rule layer outlives any specific agent vendor. When the team switched from Claude Code to Codex and back, the prompts that were embedded in tool configs all broke — the rules in markdown files kept working unchanged. Cross-agent portability is a hedge against an ecosystem that's churning every quarter.

## End-to-end

1. **Pick one piece of logic** that currently lives inside a prompt — say, "how to write internal docs" or "how to publish a post."
2. **Move it to `rules/{name}.md`** with a one-paragraph header explaining when to apply it.
3. **Reference it from `AGENTS.md`** by relative path.
4. **Test in two agents** (e.g., Claude Code and Codex) to confirm both pick it up.
5. **Migrate the rest of your prompts** over a week. Audit for rules that should be skills (multi-step) versus rules that stay as guidance text.
6. **On any breakage**, fix the rule file, not the agent config. Rule changes propagate to every project that references them.

## Gotchas

- Resist embedding company-specific data into rules. Rules are logic; data goes elsewhere (graph, MCP). When the two mix, rules become brittle.

## Tools

- A vault with version control
- Cross-agent `AGENTS.md` convention adopted by the team
