---
id: A-060
tier: A
category: "Marketing & content"
kind: workflow
title: "Brand-consistent slide-deck pipeline — Figma Team Library + custom MCP + plugin bridge"
subtitle: "Problem solved: Agencies and consultancies shipping client decks at 70+ slides need brand-consistent layout without days of manual production; the design system + Figma + custom MCP + companion plugin + canvas-comments loop collapses production from days to hours."
source: https://www.cybos.ai/cases/A-060
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "XL · Half-year+"
for: "agency lead · design-system owner · \"AI developer\" embedded in delivery"
type: case
version: v0.1
---
# Brand-consistent slide-deck pipeline — Figma Team Library + custom MCP + plugin bridge

> Problem solved: Agencies and consultancies shipping client decks at 70+ slides need brand-consistent layout without days of manual production; the design system + Figma + custom MCP + companion plugin + canvas-comments loop collapses production from days to hours.

## What

A three-layer design system (brand tokens → Figma Team Library components → Claude-readable component descriptions) plus a custom **MCP server** (forked from `figma-console-mcp`, Node.js) plus a companion **Figma Desktop plugin** that holds a WebSocket connection from inside Figma's sandbox. Claude Code drives slide composition through the MCP; the plugin is the only legal way into Figma's sandbox to actually create slides, import elements from the Team Library, and edit text. Strict rule: **Claude never assembles a slide from raw rectangles — only by composing approved components from the Team Library.** Feedback flows back via Figma canvas comments; a cron every 3 min lets Claude read new comments, fix minor issues itself, and escalate major ones.

## Why it matters

Reported delivery: a **70+ slide McKinsey-style client report** with multiple revisions, shipped without manual layout. Operator: "without this pipeline I don't know how long the delivery would have taken." The architectural primitive — fork the official MCP, write a companion plugin that exposes the host app's sandbox to your MCP via WebSocket — is reusable for any sandboxed tool (Figma, Sketch, native design apps). The 37-heuristic memory file and the "two failed edits → start over" gate are durable patterns that survive any model swap.

## End-to-end

1. **Three-layer design system.** Tokens (colors, fonts, spacing) → components in a Figma Team Library → component descriptions written *for an agent, not a designer*. The agent-facing description per component states: which text slots it has, which variants exist (dark / light / two-column), where it should not be used.
2. **Mirror component descriptions into a Claude-readable file.** Markdown or JSON in the repo. The agent loads this when composing slides — it's the catalog the agent shops from.
3. **Fork `figma-console-mcp` for slide assembly.** The reference MCP doesn't speak slide-assembly; fork it to Node.js, add operations for slide create, component import from Team Library, text edit. Run the MCP server in a terminal.
4. **Build a companion Figma Desktop plugin.** Figma's sandbox blocks outside processes — the plugin is the only legal way to execute code inside it. Architecture: MCP server runs in your terminal and talks WebSocket to the plugin running inside Figma Desktop. The plugin holds connections to both the design-system file and the working presentation file simultaneously.
5. **Wire MCP into Claude Code.** Now Claude can create slides, import elements from the Team Library, edit text — all via the MCP, which forwards to the plugin, which executes in Figma.
6. **Enforce the components-only rule via hooks.** Critical rule lives in three places: (a) a hook script that `exit 2`s and blocks the action if the agent tries to draw from raw rectangles; (b) a step inside the SKILL.md as a reminder; (c) a paragraph in CLAUDE.md explaining why. Before the hook layer, the agent forgot within ~40 minutes.
7. **Git as agency knowledge graph.** Rules, methodologies, past decisions, 37 heuristics (each one is the cost of a real debug that won't repeat). Notion is the human-readable view; Git is the source of truth.
8. **Canvas-comments feedback loop.** Stakeholders comment directly on slides in Figma. A cron every 3 min: Claude reads new comments, performs technical fixes itself, escalates strategic/design-judgment ones to the operator. Pair with the **two-failed-edits-then-start-over rule** — if the agent gives feedback and two consecutive edit-attempts fail to land, it stops, redoes from scratch, and proposes two or three structurally different alternatives.

## Prompts

Author's principle:

```
`If the model persistently won't follow a rule, that's not a model problem,
it's the absence of an enforcement layer. The AI doesn't like discipline.
The infrastructure can provide it.
`
```

The components-only rule:

```
`Hard rule: Claude does not have permission to assemble a slide from
rectangles. Only finished templates from the Team Library — that's
what makes the whole document visually consistent.
`
```

Tech stack:

```
`Claude Code, Notion, Figma, Figma Slides, our own MCP server (fork of
figma-console-mcp on Node.js), our own Figma Desktop plugin, and Git
as the agency's knowledge graph — single source of truth for all agents.
`
```

## Gotchas

- **The plugin bridge is non-optional.** Figma's sandbox does not allow outside processes. Without the companion plugin, the MCP has no way to actually execute. This is the single insight that unlocks any sandboxed-host integration.
- **New client onboarding still takes ~1 day.** Recreating the client's design system in agent-readable form is manual. Operator is working to standardize so new clients connect in a day.
- **Each manual final-doc edit should ideally become a "component-missing" signal.** If three different decks were edited in the same place, that's a new Team Library component. Not yet automated — manual cycle.
- **Reminders + CLAUDE.md alone aren't enough.** Before hooks were added, the agent forgot within ~40 minutes. The hook is the only layer the agent can't bypass.
- **Two failed edits = restart.** If you let the feedback loop run further with the same prompt structure, the agent burrows deeper into the wrong solution. Stop at two; force fresh structural alternatives.
- **One operator on Codex used the built-in research tool instead of the configured skill** in a related slide-generation pipeline — model-default behavior can silently override your carefully-built pipeline. Hard-code the path through your skill.

<hr/>

## Tools

- Figma with Team Library (paid org plan)
- Custom Figma Desktop plugin you build (WebSocket bridge into the sandbox)
- Custom MCP server forked from `figma-console-mcp`, Node.js
- Claude Code with hook support
- Git as knowledge graph; Notion as human-readable mirror
- Cron for the canvas-comments polling loop
