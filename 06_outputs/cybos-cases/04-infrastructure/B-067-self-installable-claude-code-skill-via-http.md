---
id: B-067
tier: B
category: "Infrastructure"
kind: pattern
title: "Self-installable Claude Code skill via HTTP"
subtitle: "Internal tools need a UI you don't have time to build. Ship a curl-pipe-bash skill; teammates onboard in 30 seconds; LLM is the frontend."
source: https://www.cybos.ai/cases/B-067
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · platform owner · anyone exposing an internal tool to teammates"
type: case
version: v0.1
---
# Self-installable Claude Code skill via HTTP

> Internal tools need a UI you don't have time to build. Ship a curl-pipe-bash skill; teammates onboard in 30 seconds; LLM is the frontend.

## What

Lets a teammate install your skill with a single curl-pipe-bash command: `curl -fsSL http://your-host/install/skill-name.sh | bash`. The installer fetches a `SKILL.md` over plain HTTP, drops it into `~/.claude/skills/`, and prompts the user to set two env vars (API URL + bearer token). New teammates onboard in 30 seconds; the LLM becomes the frontend to your internal platform.

## Why it matters

Building a UI for every internal operation is expensive and rarely pays back. Exposing a versioned REST API and shipping a Claude Code skill that talks to it lets any teammate run "show me founders," "send email to @x," "list replies" in natural language without you maintaining a frontend. A founder-discovery CLI uses this pattern and rolls onboarding to a 30-second curl.

## End-to-end

1. **Build a versioned REST API under `/api/v1/*`** with bearer-token auth.
2. **Write `SKILL.md`** documenting each endpoint and the natural-language workflows ("list founders" = `GET /api/v1/founders/feed`).
3. **Serve `SKILL.md` over HTTP at `/install/skill-name.md`** as raw text — never via the `Read` tool from a git checkout (otherwise the parent `CLAUDE.md` gets injected as a `<system-reminder>` and confuses everything).
4. **Ship a bash installer at `/install/skill-name.sh`** that does: create `~/.claude/skills/skill-name/`, curl SKILL.md, prompt for env vars, write to shell rc.
5. **Generate per-user API keys** (a small CLI: `manage_keys.py issue <email>`).
6. **In SKILL.md, use `${VAR:?missing}` shell idiom** so misconfigured installs fail loudly, not silently.

## Gotchas

- Serve raw text, not git-cloned files. If another Claude reads via the `Read` tool from a local checkout, the parent project's `CLAUDE.md` is injected as a system-reminder — looks like prompt injection, breaks behavior.

## Tools

- Web server with TLS
- REST API + key middleware
- A skill markdown file
