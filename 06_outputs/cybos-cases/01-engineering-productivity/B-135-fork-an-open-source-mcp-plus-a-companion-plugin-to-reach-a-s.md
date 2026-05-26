---
id: B-135
tier: B
category: "Engineering productivity"
kind: pattern
title: "Fork an open-source MCP plus a companion plugin to reach a sandboxed tool"
subtitle: "Problem solved: Sandboxed desktop tools (Figma, Adobe, Sketch) forbid outside processes; no off-the-shelf MCP exists for many of them."
source: https://www.cybos.ai/cases/B-135
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "engineer · design-eng"
type: case
version: v0.1
---
# Fork an open-source MCP plus a companion plugin to reach a sandboxed tool

> Problem solved: Sandboxed desktop tools (Figma, Adobe, Sketch) forbid outside processes; no off-the-shelf MCP exists for many of them.

## What

The legal way into a sandboxed tool's runtime: fork an open-source MCP server that targets a related tool, replace its API client with calls to a companion in-app plugin you also build, and connect them via WebSocket. The plugin runs inside the sandbox (allowed) and exposes the tool's plugin API; the MCP runs outside (allowed) and brokers between Claude and the WebSocket. The documented instance: a forked `figma-console-mcp` (rewritten to Node.js) paired with a Figma Desktop plugin, driving consistent multi-slide deck assembly inside Figma Team Library.

## Why it matters

Without this pattern, agents can't touch Figma, Adobe apps, Sketch, Logic, or any tool that ships a strict plugin sandbox. Building from scratch is weeks; forking an MCP that already speaks Claude's protocol drops it to days. Generalizes to any tool with a plugin SDK plus a hostile process boundary.

## End-to-end

1. Find an open-source MCP server in the same domain (figma-console-mcp, browser-MCP, etc.). Verify license allows fork.
2. Fork it. Migrate to a runtime you can debug well (the Figma case migrated Python → Node.js because the plugin SDK is JS-native).
3. Replace the MCP's API client with calls to a WebSocket the plugin will host.
4. Build the in-app plugin using the tool's plugin SDK. Expose only the operations you need (read selection, create node, set property — not arbitrary code).
5. Inside the plugin, open a WebSocket server on a local port; the MCP connects from outside the sandbox.
6. Wire the MCP's tool definitions through to the WebSocket commands.
7. Document the protocol — if you change either side without the other, both break silently.

## Gotchas

- Sandboxes typically block outbound network too — the WebSocket has to be loopback only, and the user has to keep the plugin window open while the agent runs. If the user closes the tool, the agent's MCP calls hang with no clear error; emit a heartbeat and surface "plugin not connected" promptly.

<hr/>

## Tools

- Node.js (or your chosen runtime)
- The target tool's plugin SDK
- A close-enough open-source MCP to fork
- Local-loopback WebSocket library
