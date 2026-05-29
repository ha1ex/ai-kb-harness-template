---
id: A-065
tier: A
category: "Engineering productivity"
kind: workflow
title: "Parallel-agent dev workflow — 4–6 subsystem agents in worktrees"
subtitle: "Problem solved: Solo founders and small engineering teams hit single-agent throughput limits; running 4–6 specialized Claude/Codex agents in isolated worktrees compresses weeks of work into days."
source: https://www.cybos.ai/cases/A-065
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · engineering lead · senior IC"
type: case
version: v0.1
---
# Parallel-agent dev workflow — 4–6 subsystem agents in worktrees

> Problem solved: Solo founders and small engineering teams hit single-agent throughput limits; running 4–6 specialized Claude/Codex agents in isolated worktrees compresses weeks of work into days.

## What

Slice a mid-sized codebase by **subsystem** (~10 files of context per agent — not by human role like "tester / architect"), give each subsystem its own git worktree, and run one terminal session per agent in parallel. A human orchestrator at the top routes work and reviews diffs; agents cross-review each other's output using the *other* model family (Codex reviews Claude's diff, Claude reviews Codex's). For overnight runs, an outer loop drives PR-after-PR without supervision.

## Why it matters

Reported throughput by one founder running this six months: **180k LOC and 480 PRs in 3 weeks solo**, and **800 PRs in 2 months** on a 200k-LOC, 5-project monorepo. One overnight cycle clocked **~7.5 h start-to-merge with ~1.5 h human time in the brainstorm/approval phase, then ~6 h autonomous**. Cross-model review catches a class of errors no single model finds — one operator reports the secondary reviewer model finds something **"100% of the time"**.

## End-to-end

1. **Slice by subsystem, not by role.** Identify ~4–6 boundary-of-ownership chunks of the codebase (auth, billing, ingestion, dashboard, etc.). One agent per chunk. Give each agent its own small skill catalog — about 10 context files (relevant code, conventions, recent PRs).
2. **One worktree per agent.** `git worktree add../<feature> -b <feature>` for each. Worktrees keep branches and working trees isolated so agents don't collide on file edits.
3. **One terminal session per agent.** Open VS Code (or cmux split panes) with one terminal per worktree. Start Claude Code in some, Codex in others — split by which model handles each subsystem best. Beyond 6 parallel sessions, operators report psychological capacity breaks down; one operator caps at 3–4.
4. **Human orchestrator at the top.** A long-context Claude session (1M context window) acts as the human's orchestrator — issues tasks, mounts timers, polls progress, holds the helicopter view. Don't try to have the orchestrator code; its job is routing.
5. **Cross-model review on merge.** Before merging branch A: paste the diff to a different model family with "review this diff." Codex catches Claude's confabulated edits ("I wrote X" when it didn't); Claude catches Codex's structural drift. Hand each merge candidate to the opposite model.
6. **Outer-loop for overnight runs.** Wrap stable workflows with a Stop hook + "continue until done" sentinel so agents keep working past their default stop condition. The native Claude Code `/loop` command serves the same purpose for well-defined task files.
7. **Gate prod deploys.** Everything else is autonomous; only require human approval on the deploy-to-prod step. Devcontainer + `--dangerously-skip-permissions` is one operator's default; safety net is independent test pipeline, DB backups, append-only writes, fast rollback.
8. **Pick a terminal/orchestration host.** Options observed across this community: plain `tmux` + git worktree, `cmux` (split-pane terminal with native clipboard paste), `supacode.sh` (Docker-per-agent), Conductor (Mac-only, UX-strong but SSH-poor). All converge on the same primitive — many parallel sessions, one repo, isolated working trees.

## Prompts

```
`git worktree add../feature-a -b feature-a
git worktree add../feature-b -b feature-b
# terminal A: cd../feature-a && claude
# terminal B: cd../feature-b && codex
# at merge time, paste each diff into the other agent:
# "review this diff"
`
```

```
`# Append to root CLAUDE.md for self-improving agents
Every time you hit a problem and find a solution, immediately update the
relevant skill or rule file with the lesson learned. Spawn a dedicated
sub-agent for the skill-update so it does not pollute the main agent's
context.
`
```

## Gotchas

- **Don't structure agents along the human org chart.** "CEO → GM → Tech-Lead → Builder" multi-agent setups burn tokens on routing chatter and rarely merge code. Subsystem-boundary slicing is what works.
- **Don't exceed your personal parallel ceiling.** One founder caps at 4–6 simultaneous agents; another at 3–4. Beyond that, context-switching cost wipes out the throughput gain.
- **Auto-memory in Claude Code burns tokens 2–3× faster** than expected because it invalidates cache. `/memory` → turn auto-memory off if you're seeing fast limit-burn.
- **Restoring sessions after VS Code update is painful.** Pin VS Code, or use cmux/tmux which survive editor restarts.
- **One operator's $470 burn in a few days** running Paperclip-orchestrated agents without a UI-design skill: MVP was 10% of expectations, 75% rework. Cap users to subscription-only Claude by default; pair multi-agent orchestration with a frontend-design skill before expecting usable UI.

<hr/>

## Tools

- Claude Code (paid subscription) — primary agent
- Codex CLI (paid subscription or API) — counter-model for review and execution
- `git worktree` — isolation primitive
- Terminal multiplexer: cmux, tmux, or VS Code embedded terminals
- VS Code or Cursor as IDE (file visibility + remote-SSH for cloud dev)
- Optional 24/7 driver: a Mac mini or VPS so sessions outlive your laptop
