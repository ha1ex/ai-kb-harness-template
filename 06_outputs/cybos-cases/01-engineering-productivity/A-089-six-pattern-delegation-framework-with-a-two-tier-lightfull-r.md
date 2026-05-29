---
id: A-089
tier: A
category: "Engineering productivity"
kind: framework
title: "Six-pattern delegation framework with a two-tier light/full rule"
subtitle: "Problem solved: Operators burn agent-spawn overhead on one-shot extraction tasks and stand up multi-agent teams for single-file work; a six-pattern catalog plus a two-tier light/full rule routes each task to the right delegation shape."
source: https://www.cybos.ai/cases/A-089
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · engineering lead · anyone running long multi-workstream agent sessions"
type: case
version: v0.1
---
# Six-pattern delegation framework with a two-tier light/full rule

> Problem solved: Operators burn agent-spawn overhead on one-shot extraction tasks and stand up multi-agent teams for single-file work; a six-pattern catalog plus a two-tier light/full rule routes each task to the right delegation shape.

## What

Codifies six distinct delegation patterns inside Claude Code with a decision rubric for when to use each, plus a two-tier rule that decides whether a task even needs a full agent. The load-bearing distinction: **custom agents** (unique-personality workers composed on the fly, launched as fire-and-forget parallel `Task` calls with no shared state) and **agent teams** (persistent, coordinated, multi-turn collaborators with a shared task list) are *not the same system* and confusing them is the most common orchestration mistake. The two-tier rule, drawing on the Recursive Language Model framing (Zhang/Kraska/Khattab 2025, `llm_query()` vs `rlm_query()`), splits work into lightweight (cheap model, capped turns, inline content, one-shot extraction/classification; 2–5s return) vs full (default model, no turn cap, agent uses tools autonomously; 10–30s spawn overhead).

## Why it matters

Over an Extended+ session with 10+ delegations, routing one-shot extraction/classification to the lightweight tier instead of a full agent saves minutes per run by avoiding 10–30s of spawn overhead each. Worktree isolation eliminates merge conflicts on parallel file edits. And the decision matrix prevents the expensive default failure — spinning up a coordinated multi-agent team for work a single agent finishes faster — captured in the source's own line: "one agent that can both read code and write JSX is better than three specialists who can't coordinate."

## End-to-end

1. **Qualify the work for delegation at all.** Delegate when there are 3+ independent workstreams at Extended+ effort, OR multiple identical non-serial tasks, OR specialized expertise is needed, OR 5+ file changes, OR research and execution can run simultaneously. Otherwise, don't.
2. **Apply the two-tier rule first.** Ask: "Can this be answered in one model call with no tool use?" If yes → lightweight (cheap model, `max_turns=3`, inline input; 2–5s). If no → full delegation (default model, no turn cap, agent uses tools; 10–30s spawn).
3. **Route by intent.** "Custom / specialized / spin-up agents" → compose a custom agent identity, then launch it as a general-purpose `Task`. "Agent team / swarm" → the team-creation flow (persistent shared task list + messaging).
4. **Pattern 1–4 — pick the delegation shape:** built-in role agents for internal routing (`Task(subagent_type="Engineer")` etc., always with full context + effort budget + expected output format); worktree-isolated agents (`isolation: "worktree"`) for conflict-free parallel edits to the same files; background agents (`run_in_background: true`) for long builds/research, read the output file later; foreground agents (default) for blocking work.
5. **Pattern 5 — custom agents:** compose distinct trait sets per agent so each has a unique lens, then launch each as a general-purpose `Task` with the composed prompt. Use different trait combinations per agent; never reuse a built-in agent type for custom work.
6. **Pattern 6 — agent teams:** create the team, create tasks, assign owners, and message teammates to wake them between idle turns (`TeamCreate` → `TaskCreate` → `Task(subagent_type=…, team_name=…)` → `TaskUpdate(owner=…)` → `SendMessage`).
7. **Scale by effort level.** Instant/Fast = no delegation; Standard = 1–2 foreground; Extended = 2–4 agents + background research; Advanced = 4–8 + a team for 3+ workstreams; Deep = full team orchestration.
8. **Log every run.** Append one JSONL line per completed workflow (timestamp, skill, workflow, status, duration) to a persistent execution log so you can audit what was delegated and how long it took.

## Prompts

Routing matrix (verbatim) — the load-bearing custom-vs-team distinction:

```
`| User Says | System | Tool | What Happens |
| "custom agents", "specialized agents", "spin up agents", "launch agents" | Agents Skill (ComposeAgent) | `Task(subagent_type="general-purpose", prompt=<ComposeAgent output>)` | Unique personalities, voices, colors via trait composition |
| "create an agent team", "agent team", "swarm" | Claude Code Teams | `TeamCreate` → `TaskCreate` → `SendMessage` | Persistent team with shared task list, message coordination, multi-turn collaboration |
`
```

Custom-agent compose-then-launch (verbatim):

```
`# Step 1: Compose agent identity
bun run ~/.claude/skills/Agents/Tools/ComposeAgent.ts --traits "security,skeptical,thorough" --task "Review auth" --output json

# Step 2: Launch with composed prompt
Task(subagent_type="general-purpose", prompt=<ComposeAgent JSON.prompt field>)
`
```

Per-workflow JSONL telemetry line (verbatim):

```
`echo '{"ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","skill":"Delegation","workflow":"WORKFLOW_USED","input":"8_WORD_SUMMARY","status":"ok|error","duration_s":SECONDS}' >> ~/.claude/PAI/MEMORY/SKILLS/execution.jsonl
`
```

## Gotchas

- **Don't delegate what Grep/Glob/Read does in under 2s.** Spawn overhead dwarfs the task.
- **Don't spawn agents for single-file changes, and don't create a team for fewer than 3 independent workstreams.** Teams add coordination cost that only pays back at 3+ parallel streams.
- **Custom agents ≠ agent teams.** Custom agents are fire-and-forget parallel workers with no shared state; teams are persistent multi-turn collaborators with a shared task list. Using a built-in agent type when the user asked for a "specialized" or "custom" agent is the most common misroute — always compose a custom identity instead.
- **Don't send agents work without full context.** They start fresh; an under-specified handoff produces confident-but-wrong output.
- **Don't use full delegation for one-shot extraction/classification.** That is exactly what the lightweight tier exists for.

<hr/>

## Tools

- Claude Code with the Task tool + TeamCreate / TaskCreate / SendMessage / TaskUpdate
- A custom-agent composition tool (the `ComposeAgent.ts` referenced above) for Pattern 5
- bun runtime — to run the composition tool
- A session dashboard (optional) — to watch parallel worktree-isolated agents; a personal-context store for cross-session memory
- Install: `curl -sSL https://ourpai.ai/install.sh | bash`
