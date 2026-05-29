---
id: A-067
tier: A
category: "Engineering productivity"
kind: framework
title: "Subsystem-specialized agent teams — orchestrator + 4-12 parallel agents"
subtitle: "Problem solved: Naive multi-agent setups copy the human org chart (CEO → GM → Tech-Lead → Builder) and burn half their token budget on routing chatter without merging code. Specialize agents by subsystem boundary (~10 source files each) with one Claude orchestrator using Schedule task self-pinging, no heartbeat on the workers."
source: https://www.cybos.ai/cases/A-067
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "founder · engineering lead · factory operator running multi-product portfolios"
type: case
version: v0.1
---
# Subsystem-specialized agent teams — orchestrator + 4-12 parallel agents

> Problem solved: Naive multi-agent setups copy the human org chart (CEO → GM → Tech-Lead → Builder) and burn half their token budget on routing chatter without merging code. Specialize agents by subsystem boundary (~10 source files each) with one Claude orchestrator using Schedule task self-pinging, no heartbeat on the workers.

## What

A working architecture for >50k-LOC codebases driven by 4–12 parallel agents. The shape: one **orchestrator** (Claude with a 1M-context window, running in a terminal with an explicit orchestration skill — it does not write code, it routes) supervises N **workers**, each scoped to a single subsystem boundary of ~10 source files. The orchestrator uses Claude Code's built-in `Schedule task` to self-ping every 5–10 minutes; workers have **no heartbeat** and act only on events / triggers. Two intermediate tools enter the picture: Paperclip (PPC) when async multi-day worker pools are needed, and Claude Code's built-in Agent Teams when cross-system features need same-window orchestration. Sits one rung above (parallel-agent dev workflow on a single human IDE) and one rung below (App Factory strategy across product portfolios).

## Why it matters

Reported field numbers from operators running this:

- **800 PRs in 2 months solo** on a ~200k-LOC, 5-project monorepo plus a factory layer; 4–6 specialized agents in parallel ceiling.
- **First product built end-to-end in 24 hours** at one factory (a research-aggregator demo); second product in 20 days as a multi-domain SaaS for small-business operators.
- One operator caps personal attention at **4–6 simultaneous agents**; another at 3–4 — beyond that, context-switching overhead wipes the throughput gain.
- Negative case: first attempt with **CEO/GM/Tech-Lead/Builder agent hierarchy** burned ~half of a $200 Codex budget without merging a single PR. *"Drowned in paperwork."* Restructuring to subsystem-boundary specialists is what unblocked it.
- An honest field report: **$470 in a few days** (Claude $200 + Codex $120 + extra Claude $150) on a Paperclip-orchestrated MVP attempt; output was 10% of expectations and 75% rework — fixed by capping users to subscription-only Claude and pairing the orchestrator with a UI-design skill (see ).

## End-to-end

1. **Slice the codebase by subsystem, not by role.** Auth, billing, ingestion, dashboard, scraping, deploy — pick the natural ownership boundaries. One agent per boundary. Subsystem ≈ ~10 source files plus the skills/docs that explain them.
2. **Run the orchestrator in a terminal with a 1M-context Claude.** Its job is routing — issuing tasks, polling worker progress, holding the helicopter view. **Don't try to have the orchestrator code.** Give it an explicit orchestration skill that says: never edit code, only delegate.
3. **Set the orchestrator to self-ping every 5–10 minutes.** Use Claude Code's native `Schedule task` so the orchestrator wakes itself, polls workers, and reissues work. Codex tends to drop the timer mid-loop; Claude maintains the schedule reliably.
4. **Disable heartbeat on the workers.** Workers act on events / triggers only. If a worker is allowed to "ping in and check what to do" autonomously, it re-orients on every wake and never goes deep on its subsystem.
5. **Pick the worker-pool host based on async needs.** Three converging options observed in source:

- **Claude Code's experimental Agent Teams** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) for in-session cross-subsystem features.
- **Paperclip** as backend task tracker + specialized worker pool when work is multi-day; install in `~/`, not inside the project, so multiple projects can share it.
- **oh-my-claudecode / oh-my-codex** for role-split agent bundles inside the terminal itself, no separate orchestration CLI.

1. **Cross-model review on merge.** When a subsystem worker produces a PR, hand the diff to a worker of the *other* model family (Codex reviews Claude's, Claude reviews Codex's). One operator reports the secondary reviewer finds something **"100% of the time"** — confabulated edits, structural drift, missing tests.
2. **Gate prod deploys, automate everything else.** Run the rest with `--dangerously-skip-permissions` if you have a devcontainer + DB backups + fast rollback. Production deploy approval is the last bastion to remove only after you trust the simulation/e2e layer.
3. **Visualize what each agent is doing.** A simple dashboard (one operator built a custom visualization) showing each agent's current task + last commit + queue depth is what makes the 4–6-agent ceiling survivable. Without it, attention thrashes.

## Prompts

Enable Claude Code's experimental Agent Teams flagand the factory operator's public pitch:

```
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
`
```

Swarm-mode kickoff phrase, verbatim(translated):

```
`Discuss top-level product requirements with the coordinator.
Then: "switch to swarm mode and call your friends. Let's design together.
Must include an architect, a researcher, a product manager, and whoever
else you think this task needs."
`
```

Orchestrator skill outline (drop into the orchestrator agent's skill catalog):

```
`# Orchestrator skill — routing only, never code
1. You do not write or edit code. You delegate to specialized workers.
2. Every worker is scoped to one subsystem (~10 source files).
3. Workers have NO heartbeat. Only you self-ping (Schedule task, 5-10 min).
4. On wake: read PR queue, classify by subsystem, dispatch.
5. On cross-subsystem features: spawn an Agent Team in-session.
6. On multi-day async work: dispatch via Paperclip.
7. When a worker produces a diff: assign cross-model review BEFORE merge.
 (Claude diff → Codex reviewer; Codex diff → Claude reviewer.)
8. Production deploy: ALWAYS pause for human approval.
`
```

## Gotchas

- **Don't structure agents along your human org chart.** CEO → GM → Tech-Lead → Builder is the most expensive way to burn tokens with zero merged PRs. One operator: *"Don't structure agents along human org hierarchy — structure them so the orchestrator finds them convenient. The orchestrator knows best."*
- **Don't exceed your personal parallel ceiling.** Sources land between 3–4 and 4–6. Past that, attention thrashes and one wrong delegation undoes the throughput gain. Cap explicitly; don't drift upward.
- **Heartbeats on workers kill depth.** Broad-scope or heartbeat-on workers re-orient on every wake and never go deep. Workers stay quiet until the orchestrator wakes them.
- **"Honest assessment" prompts make Builders sandbag.** Source observes that workers tend to *"optimize for reporting truth rather than changing code"* when their instructions emphasize honesty over delivery. Frame worker prompts around outcomes, not reporting.
- **Codex drops scheduled tasks; Claude doesn't.** If your orchestrator is Codex, its self-ping fails. Use Claude for the orchestrator until this changes upstream.
- **Don't run multi-agent orchestration without a UI/design skill.** One field report: $470 burn, 75% rework, interface "barely existed" after 2 days of black-box MVP development on a Paperclip-orchestrated factory. Pair multi-agent orchestration with a frontend-design skill (see ) before expecting usable UI.
- **VS Code updates break parallel sessions.** Restoring 6 terminal sessions after editor restart is painful. Pin VS Code, or run workers in tmux/cmux which survive editor restarts.

<hr/>

## Tools

- Claude Code with a 1M-context plan for the orchestrator
- Codex CLI (or API) for the counter-model in cross-model review
- Claude Code's experimental Agent Teams flag for in-session cross-subsystem features
- Paperclip for async multi-day worker pools (install at `~/`, not inside the project)
- VS Code (multiple windows) or cmux/tmux for parallel terminal sessions
- A simple dashboard / visualization showing each agent's current state — custom or shell + tmux status line
- Optional: `oh-my-claudecode` / `oh-my-codex` skill bundles for terminal-native role splits
- Optional: Playwright + Chrome MCP for autonomous e2e testing before deploy
- A devcontainer + DB backups + fast rollback if you intend to run workers with `--dangerously-skip-permissions`
