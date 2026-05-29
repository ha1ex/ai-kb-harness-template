---
id: B-049
tier: B
category: "Engineering productivity"
kind: pattern
title: "Agent rules / Hooks as safety rails"
subtitle: "Rules in AGENTS.md don't stop the agent from making the repo public after deploy. Git hooks hard-block what rules only nudge against."
source: https://www.cybos.ai/cases/B-049
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer setting up the agent stack · everyone running agents"
type: case
version: v0.1
---
# Agent rules / Hooks as safety rails

> Rules in AGENTS.md don't stop the agent from making the repo public after deploy. Git hooks hard-block what rules only nudge against.

## What

Combines two layers of safety around coding agents: (a) **rules** in `AGENTS.md` / `CLAUDE.md` describing what the agent should and shouldn't do; (b) **Git/CLI hooks** that hard-block the dangerous actions regardless of what the model decides. Rules are guidance; hooks are enforcement.

## Why it matters

A real incident in the field: an agent set a deploy repo to **public** after a push, leaking sensitive info. Rules alone don't stop this — they nudge. Hooks do. Together they get the public-leak class of incidents close to zero.

## End-to-end

1. Write `AGENTS.md` with explicit rules:

- "Default new repos to private."
- "Never commit `.env`, `*.key`, or files matching `secrets/`."
- "Always create a tracker issue before starting non-trivial work."
- "Never push to `main` directly; always open a PR."
- "Confirm with the user before any destructive `git` command (`reset --hard`, `push --force`, `clean -f`)."

1. Add Git hooks: `pre-commit` rejects commits containing common secret patterns (use `gitleaks` or similar); `pre-push` blocks pushes to protected branches.
2. Add a CLI wrapper around the agent that intercepts shell commands and blocks an allowlist-violating set.
3. When the agent does something you didn't expect, write a more specific rule **and** a hook for it. Each incident widens both layers.
4. Review the rules monthly; prune obsolete ones (rule files rot if you only ever add).

## Gotchas

- "Rules don't always fire" — they're guidance. Treat any safety property you actually care about as something a hook must enforce; the rule is just for explanation.
- Don't pile 200 rules in `AGENTS.md`. Short and pointed wins. Push detail into linked rule files.
- Treat the agent like a smart stray dog: capable but unstructured, will follow whatever scent looks freshest. The cure is strict frames — templates, output gates, fixed schemas, hooks that fail loudly when the agent strays from format. Without rails, brilliance on Monday looks like sabotage on Friday.

## Variations

- **Skill-launch audit hook.** Beyond safety enforcement, use a `PreToolUse` (or equivalent) hook to log every skill invocation: skill name, trigger phrase, calling context, timestamp. Output to `~/.claude/skill-audit.log`. Weekly review answers "which skills actually fire, which never fire, which fire on the wrong trigger?" Lets you cull / refactor the skill library against real usage. A cohort participant running 30+ skills shipped this as a 5-line addition and used it to inform a three-tier skill refactor (see [new-N13-01]).

## Tools

- `AGENTS.md` / `CLAUDE.md` in every repo
- Git hooks framework (`pre-commit`, `husky`, etc.)
- A secret-scanner (`gitleaks` / `trufflehog`)
