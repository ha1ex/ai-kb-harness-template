---
id: A-027
tier: A
category: "Engineering productivity"
kind: pattern
title: "GitHub Issues as agent memory — \"project as memory\""
subtitle: "Problem solved: Agents forget mid-task and you re-explain every session. State lives on GitHub Issues; any agent picks up from the last comment — and on engineering-heavy teams, the gh CLI gives agents native, MCP-free access."
source: https://www.cybos.ai/cases/A-027
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Founder · IC · anyone running multi-step or long-running agent work"
type: case
version: v0.1
---
# GitHub Issues as agent memory — "project as memory"

> Problem solved: Agents forget mid-task and you re-explain every session. State lives on GitHub Issues; any agent picks up from the last comment — and on engineering-heavy teams, the gh CLI gives agents native, MCP-free access.

## What

The agent's working memory is externalised to GitHub Issues. Every task starts by creating an Issue (if one doesn't yet exist). Every intermediate step appends a comment with that step's output, version number, and links to artefacts. The agent picks up from the latest comment; no in-session memory is trusted. Issues are tagged by ISO week (`week-19-2026`); a weekly retro skill scans the closed Issues for the week, surfaces recurring sequences of actions, and proposes them as candidates for packaging into reusable skills.

The 2026-Q2 reinforcement: on engineering-heavy teams, agents talk to GitHub Issues via the native `gh` CLI rather than via an MCP. That's because Claude Code / Codex / Cursor all know `gh` out of the box; no MCP server to install, no permission prompts per call, and the agent can grep its own state with `gh issue list --search...`. The downside is staff comfort — non-engineers won't open a terminal — so non-engineering departments need a friendlier surface (Notion + scoped tokens, Linear, or a simple chat-bot UI).

## Why it matters

Solves the universal "agent forgets context" problem for free. Handoffs between agents (one on the laptop, one on the phone, one on a cron VM) become seamless because state lives on GitHub, not in any one agent's session. The weekly retro turns ad-hoc daily wins into compounding personal automation. At one source's blog pipeline (~3,000 readers/month) the entire content-production line runs on Issues-as-memory; the pipeline survives sessions ending, models being swapped, and operator handoffs without a single dropped state.

## End-to-end

1. **Pick the repo.** One private GitHub repo per "department" or per workstream. Free GitHub plan is fine.
2. **Authenticate the agent's `gh` CLI.** Once per machine. Note: `gh` is native to Claude Code — no MCP needed; agents can run `gh issue list/comment/close/view` directly.
3. **Add a global agent rule.** In `AGENTS.md`: "Any work starts by creating a GitHub Issue for the task if one does not yet exist. After every meaningful step, append a comment with the step's output and a one-line status."
4. **Tag every Issue with the current ISO week.** `week-19-2026`, `week-20-2026`.
5. **Author the weekly retro skill.** Inputs: all Issues closed during the current ISO week. Output: a Markdown report with (a) what was done, (b) repeated sequences of actions, (c) candidates for skill extraction with proposed names and trigger phrases.
6. **Author the multi-repo router skill.** When you say "schedule a doctor visit," the router knows that's a `corp-health` task and creates the Issue there.
7. **Run the retro on Sunday.** Manually. Review the candidate-skill list; promote the top one or two into actual skill files.
8. **Wire mobile dispatch (optional).** Add the repo to the Codex web agent or equivalent; from your phone, voice-trigger "new task in `corp-pulse`: do X."

## Prompts

`AGENTS.md` rule block (paste into every memory-backed repo):

```
``
```

## Gotchas

- **Don't trust in-session agent memory across long tasks.** Sessions end, models swap, hardware reboots. Persist or perish.
- **Tag every Issue by ISO week from day one.** Backfilling is painful.
- **Rules don't always fire.** Pair the "create Issue first" rule with a pre-commit hook that rejects commits not referenced by an open Issue.
- **Don't put secrets in Issues.** Issue comments are visible to every collaborator.
- **NEW — Issues-as-memory is engineering-heavy**. One operator's team runs everything in GitHub Issues precisely because `gh` CLI is native to Claude Code. The counter-objection from another operator was immediate: non-engineering staff won't touch GitHub. Resolution: use Issues for the engineering substrate; use Notion + scoped tokens or Linear for cross-functional departments. Don't try to force one substrate on the whole company — federate per A-051 / B-054.
- **2026-04-29 lesson:** an agent rule said "default to private repo" but the agent set a repo public after a deploy and leaked sensitive info. Pair the rule with a git hook that fails if `git remote -v` shows a public URL.

## Variations

- **Lighter:** One personal GitHub repo, no router skill, no mobile dispatch. Still gets the memory-and-retro payoff for a solo operator.
- **Heavier:** Per-team repos with the same protocol; the weekly retro produces team-skill candidates that team leads promote.
- **Different substrate:** SQLite, Linear, Notion, or Asana can all play the Issues role — choose by where the team already lives. The pattern is the invariant.
- **Decision-graph store variant.** Every architectural decision is logged to a dedicated decision graph: input context, decision text, model identity, confidence, alternatives considered, lineage to prior decisions. Federated-search via a small CLI; linked to GitHub Projects kanban cards.

<hr/>

## Tools

- GitHub account (free) and `gh` CLI authenticated
- Agent CLI with shell-access permissions
- A skill-manager / router skill if you have more than one memory repo
- One canonical `AGENTS.md` with the memory protocol above
- (For the decision-graph variant) A small Postgres / SQLite store + a thin CLI that reads/writes decision records; a GitHub Projects link layer.
