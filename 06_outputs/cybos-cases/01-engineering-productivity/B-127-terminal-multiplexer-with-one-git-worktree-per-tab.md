---
id: B-127
tier: B
category: "Engineering productivity"
kind: tactic
title: "Terminal multiplexer with one git-worktree per tab"
subtitle: "Problem solved: Running 5+ Claude Code sessions against the same repo causes file conflicts unless each gets its own worktree."
source: https://www.cybos.ai/cases/B-127
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · founder"
type: case
version: v0.1
---
# Terminal multiplexer with one git-worktree per tab

> Problem solved: Running 5+ Claude Code sessions against the same repo causes file conflicts unless each gets its own worktree.

## What

Use a terminal multiplexer (supacode.sh, cmux, or conductor.build) that auto-creates a fresh `git worktree` per new tab. Each tab is a parallel CC session on its own feature branch, isolated from the others. Audible chime when an agent needs attention. Tabs grouped by repository. The combination unlocks reliably running 5-10 parallel agents on the same codebase.

## Why it matters

The pattern is what's actually behind the "10 parallel agents" claims you see — they're not magic, they're worktree-per-tab plus a tab manager that handles the bookkeeping. One operator's setup: 3-5 feature branches open simultaneously in supacode tabs, each with a CC + Codex pair, jumping between them when the chime fires. Real productivity multiplier vs serial work; pairs naturally with B-097 (tmux with persisted tabs) for crash recovery.

## End-to-end

1. Pick a multiplexer: supacode.sh (Mac, polished UX), cmux (split panes inside VSCode, native image paste), or conductor.build (Mac, orchestration-focused). All do worktree-per-tab.
2. Install and point at your repo.
3. Press the "new tab" hotkey — the multiplexer creates a fresh `git worktree` under a sibling directory and `cd`s in.
4. Start Claude Code or Codex inside the new tab on its own feature branch.
5. Configure audible alerts so you only context-switch when an agent has a question.
6. For crash recovery, pair with a tmux session-resurrect plugin (search GitHub for current options) if you're on tmux — auto-restores `--resume` on each tab after a restart.

## Gotchas

- Worktrees share the same `.git` directory; running `git gc` or destructive history rewrites in one worktree can break the others. Treat each worktree as ephemeral — merge, then delete it — rather than as a long-lived workspace.

<hr/>

## Tools

- supacode.sh, cmux, or conductor.build
- `git` 2.5+ with worktree support (default everywhere modern)
