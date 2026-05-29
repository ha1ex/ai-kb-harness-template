---
id: B-125
tier: B
category: "Engineering productivity"
kind: tactic
title: "Reclaim 30–90K context tokens with Claude Code's MCP Tool Search (`ENABLE_TOOL_SEARCH=true`)"
subtitle: "Problem solved: Each MCP server registered in Claude Code injects 10–30K tokens of tool descriptions up-front; flipping one env var defers those descriptions until needed, recovering a large slice of the context window."
source: https://www.cybos.ai/cases/B-125
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "any Claude Code user with ≥2 MCP servers"
type: case
version: v0.1
---
# Reclaim 30–90K context tokens with Claude Code's MCP Tool Search (`ENABLE_TOOL_SEARCH=true`)

> Problem solved: Each MCP server registered in Claude Code injects 10–30K tokens of tool descriptions up-front; flipping one env var defers those descriptions until needed, recovering a large slice of the context window.

## What

Claude Code 2.1.7+ shipped a native flag: when registered MCP tool descriptions exceed roughly 10% of the context window, they auto-defer and Claude discovers them on demand through an `MCPSearch` tool. Two-line edit to settings; restart; the boot banner shows "mcp tools (loaded on-demand)" when active. One operator reported context dropping from 93.1K MCP-token usage to 0.429K after switching to the equivalent third-party proxy — the native flag now delivers the same benefit.

## Why it matters

Heavy MCP users (Figma, Linear, GitHub, Stripe, dataforseo, Chrome) commonly burn 30–50K tokens on tool descriptions before the first user message. That's a measurable hit to long-session quality. Reclaiming this is a single-line settings change with no functional regression for most setups.

## End-to-end

1. Upgrade Claude Code to 2.1.7 or later.
2. Edit `~/.claude/settings.json` and add the env block below.
3. Restart Claude Code.
4. Verify on the boot banner: look for `mcp tools (loaded on-demand)`.
5. Run `/context` and confirm MCP token cost is near zero until a tool is invoked.

## Prompts

```
`{
 "env": {
 "ENABLE_TOOL_SEARCH": "true"
 }
}
`
```

## Gotchas

## On-demand loading doesn't always handle MCP servers that need auth — one operator's Figma MCP failed in this mode and had to be left in the eager-load set. Also: MCP servers that expose unusually long tool descriptions can break the search-driven import path. If a specific MCP misbehaves, run with the flag off for that server and on for the rest.

## Tools

- Claude Code 2.1.7 or later
- One or more registered MCP servers
