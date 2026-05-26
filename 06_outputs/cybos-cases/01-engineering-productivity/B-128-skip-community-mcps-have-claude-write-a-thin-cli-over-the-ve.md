---
id: B-128
tier: B
category: "Engineering productivity"
kind: pattern
title: "Skip community MCPs — have Claude write a thin CLI over the vendor API"
subtitle: "Problem solved: Community MCP servers break on the 2nd or 3rd retry, leak keys into the agent context, and add a token tax for tool descriptions; a Claude-authored thin CLI wrapper over the same vendor API is more reliable, auditable, and cheaper to run."
source: https://www.cybos.ai/cases/B-128
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · founder"
type: case
version: v0.1
---
# Skip community MCPs — have Claude write a thin CLI over the vendor API

> Problem solved: Community MCP servers break on the 2nd or 3rd retry, leak keys into the agent context, and add a token tax for tool descriptions; a Claude-authored thin CLI wrapper over the same vendor API is more reliable, auditable, and cheaper to run.

## What

For each integration you'd otherwise reach for an MCP server (Notion, Google Ads, GSC, Drive, Linear, etc.), have Claude generate a thin command-line wrapper over the underlying REST/SDK. Keep auth in environment variables — the agent never sees the credentials. The agent invokes the CLI as a normal shell command, with predictable args and exit codes. Counter-pattern to the "install all the MCPs" reflex: MCP is fine for prototyping; for anything production, use a CLI.

## Why it matters

Reliability is the headline. One operator reports rewriting several integrations off MCP onto custom CLI libs and getting reliable Notion search where the MCP would fail on the 2nd or 3rd retry. Bonus: fewer permission prompts, no key leakage into the prompt, and you control the surface area exposed to the agent.

## End-to-end

1. Pick one integration that's flaky on MCP today (often Notion, Google Ads, Drive).
2. Ask Claude to read the vendor's REST docs and generate a small CLI binary or script (`my-notion search "query"`, `my-notion page get <id>`, etc.). Keep the surface narrow — only the operations you actually use.
3. Store credentials as env vars; the CLI reads them. The agent never sees the key.
4. Replace the MCP entry in your config with the CLI; give the agent the help text so it knows the command shape.
5. For Google Ads specifically, an even stronger pattern: dump the local Google Ads Editor's SQLite to disk, version it with git, and let Claude write `sqlite3` queries against it directly. Faster than any API, fully offline.
6. Maintain the CLI like any other internal tool: tests, a short README, semver, and a sync script Claude can re-run.

## Gotchas

- Resist the urge to wrap every endpoint. Build only the verbs your agents actually use; each new command is a new failure surface and another piece of doc the agent has to keep loaded.

<hr/>

## Tools

- Vendor API access for the integration
- Claude Code to author and maintain the CLI
- A safe place for credentials (env vars, secrets manager)
- Optionally: sqlite3 CLI for local-data integrations
