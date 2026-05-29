---
id: A-030
tier: A
category: "Knowledge management"
kind: tactic
title: "Skills knowledge-graph visualization"
subtitle: "By month six you have 60+ skills, four of which nobody knows exist. A graph shows which to keep, kill, or merge in 10 minutes a week."
source: https://www.cybos.ai/cases/A-030
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Founder or any heavy skill-user"
type: case
version: v0.1
---
# Skills knowledge-graph visualization

> By month six you have 60+ skills, four of which nobody knows exist. A graph shows which to keep, kill, or merge in 10 minutes a week.

## What

Generates a live force-directed graph of every skill, rule, and MCP server in your stack — personal layer, team layer, global/external layer — and the edges between them (which skill calls which, how often, last 30 days). One look and you see: which skills are load-bearing, which are dead, which overlap, where MCP failures cascade. Deployable as a static HTML page in one prompt. Used by a workshop host running ~90 personal skills + 39 team skills to keep the catalog sane.

## Why it matters

Skill sprawl is the silent productivity killer of a maturing AI org. By month six you have 60+ skills, three of which do almost the same thing, two of which silently broke when an MCP updated, and four of which nobody on the team knows exist. The graph turns "skill management" from a memory game into a visual review you do in 10 minutes a week.

## End-to-end

1. **Standardize skill files.** Each skill is a markdown file with YAML frontmatter declaring: `name`, `trigger_phrases`, `calls` (list of other skills), `rules` (list of rule files), `mcps` (list of MCP servers used), `owner`, `last_modified`. Without this frontmatter the graph is guesswork.
2. **Build a usage log.** Hook every skill invocation to append a single line to `~/.skills/usage.jsonl`: `{ts, skill, caller, success, duration_ms}`. Two-line shell wrapper around skill execution.
3. **Write the visualizer skill.** A skill named `/skills-graph` that: walks the skills folder, parses frontmatter, joins to `usage.jsonl` for edge weights, emits a single self-contained `skills-graph.html` with D3 force-directed layout, color by tier (personal/team/global), node size by usage count, edge thickness by call frequency.
4. **Deploy.** Either open locally or `/netlify-deploy skills-graph.html` to share with team.
5. **Add the "ask the graph" feature.** A floating text box on the HTML that posts the user's question + the graph JSON to an LLM endpoint. Questions like "which skills haven't run in 60 days?" or "which MCP failure would break the most skills?" become trivial.
6. **Make it a weekly ritual.** Add to your week-close routine: regenerate the graph, look at orange (low-use) and red (broken) nodes, kill or merge.

## Prompts

The single prompt that builds the graph:

```
`Read every file under ~/.claude/skills/ and ~/team-skills/ and the live MCP
registry. Parse frontmatter. Join to ~/.skills/usage.jsonl for the last 30 days.

Render a force-directed D3 graph with:
- three vertical bands: personal (left), team (middle), global/MCP (right)
- node size = log(invocation_count + 1)
- node color = tier
- edge thickness = call frequency
- hover: name, owner, last_modified, top 3 callers
- click: open the skill source file

Output a single self-contained skills-graph.html. Include an "ask the graph"
text box at the bottom; on submit, POST {graph_json, question} to /api/ask.

Surface in a sidebar:
- skills with 0 invocations in 30 days (candidates to archive)
- broken edges (skill references a missing skill or dead MCP)
- top 5 most-called skills
`
```

Frontmatter convention for every skill file:

```
`---
name: weekly-sync-partnership
trigger_phrases: ["weekly sync", "partnership sync", "wsp"]
calls: [content-voice, telegram-mcp-fetch, linear-task-create]
rules: [rules_tech/mcpi-telegram-integration.md]
mcps: [telegram, linear]
owner: founder
last_modified: 2026-05-08
status: production # production | draft | deprecated
---
`
```

## Gotchas

- **No frontmatter, no graph.** Retrofitting frontmatter onto 60 ad-hoc skills is the actual work; budget half a day.
- **Don't render every edge.** Filter to edges with >2 invocations in 30 days; otherwise the graph is a hairball.
- **Static HTML beats live dashboard.** A regenerated-weekly HTML loads fast and is shareable; a live React app rots.

## Variations

- **Lighter:** Skip usage logging; just render the static structure. Still surfaces orphans and overlaps.
- **Heavier:** Add an MCP-health overlay (green/yellow/red per MCP) and a recovery-protocol link per dead edge. Tie to rules-as-recovery-protocols pattern.
- **Team mode:** Render personal + team graphs side by side; highlight skills that exist twice (one personal, one team) — strong candidate for promotion.

## Tools

- Claude Code with skills system (`~/.claude/skills/` or equivalent)
- Frontmatter discipline on every skill file
- A shell-wrapper or hook that appends to `usage.jsonl`
- A vibe-coding stack to render the HTML (D3 via CDN is enough)
- Optional Netlify for sharing
