---
id: B-097
tier: B
category: "Infrastructure"
kind: tactic
title: "tmux with persisted named tabs for ~50 simultaneous Claude sessions"
subtitle: "Problem solved: Operators running 30–50 parallel projects lose them faster than they ship. Persistent named tabs survive reboots; weeks-old projects resume in seconds — and there's now a small ecosystem of community-built variants."
source: https://www.cybos.ai/cases/B-097
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "Power-user operator running many parallel projects"
type: case
version: v0.1
---
# tmux with persisted named tabs for ~50 simultaneous Claude sessions

> Problem solved: Operators running 30–50 parallel projects lose them faster than they ship. Persistent named tabs survive reboots; weeks-old projects resume in seconds — and there's now a small ecosystem of community-built variants.

## What

A tmux configuration where each tab is one project with a Claude Code (or Codex) session running. Tabs survive reboots via `tmux-resurrect` / `tmux-continuum`; each tab re-launches its own Claude on relaunch. When the operator remembers a stalled project from weeks ago, they open the tab, ask Claude "find where we left off," and Claude opens a sub-tab and re-hydrates. Periodic `compactify` to keep memory usage sane.

The community shipped two adjacent tools in 2026 that address the same problem-space:

- **`tmux-claude-resurrect`** — a plugin layered on top of `tmux-resurrect` + `tmux-continuum` that *also* restores the Claude Code session per window by matching session name with tmux window name. Solves the gap where the original `tmux-resurrect` brought back the tabs but each tab needed manual `claude --resume`.
- **`cmux`** — a different terminal entirely, designed for many parallel Claude Code agents. Split-pane inside VS Code; native clipboard-image paste hotkey; many horizontal split tabs per agent. Some operators prefer it over a tmux setup; the underlying primitive (many parallel sessions, one repo, isolated working trees) is the same.
- **`warper`** — a fork of the now-open-sourced Warp terminal that strips all cloud features and plugs an OpenRouter API key directly. Useful if you want a Warp-style terminal harness for free; single-maintainer fork, so check vendor health before adopting.

Pick by your ergonomic preference and clipboard / VS Code integration needs. All three converge on the same primitive.

## Why it matters

Operators running 30–50 parallel projects (vibe-coded artifacts, research threads, microservices) lose the projects faster than they ship them without OS-level continuity. Persistent named tabs are the meta-tool the cohort's technical lead built; multiple participants adopted it within a week of seeing the demo. Different from A-027 (Issues as memory — within a project) and A-048 (handoff compression — within a session); this is the **workstation-OS layer**.

## End-to-end

1. Install tmux + tmux-resurrect + tmux-continuum (plugins via TPM).
2. Layer on `tmux-claude-resurrect` so Claude Code sessions reattach automatically after tmux reboot (instead of needing manual `claude --resume` per window).
3. `~/.tmux.conf`: enable continuum auto-save every 15 min; set window-name = project-name; bind a "new project" key.
4. Per-project: one tab named `<project-slug>`; `cwd` set to that project's folder; auto-start command `claude` so reopening the tab starts the agent.
5. 2-level deep subfolder hierarchy: `~/work/<area>/<project>/`. Keeps the project list navigable.
6. Periodic compactify: weekly, close any tab whose project hasn't been touched in 14 days; archive its claude session if needed.
7. Reboot handling: continuum restores all tabs; each tab's claude command runs again.
8. "Find where we left off" prompt template: drop into any tab, run, get a 5-bullet status from the project's git log + recent files + last claude session.

## Gotchas

- The install will eat "a day of fighting" — quoted directly from operators who shipped this. Don't start on a Friday. Set a budget; if the budget overruns, fall back to a simpler `screen` or `zellij` setup.
- **NEW — Pin VS Code** if you're using cmux-inside-VS-Code, or use plain tmux. Restoring sessions after a VS Code update is painful; the editor restart can wipe the in-pane state.

## Variations

- **`tmux-claude-resurrect`** as the default add-on for the canonical tmux setup. Drops the manual `claude --resume` step per window after reboot.
- **`cmux` inside VS Code** for operators who want IDE comfort + many parallel agents in split panes. Native clipboard-image paste is the killer ergonomic feature. One operator publicly named cmux his preferred terminal for Claude Code after trying many alternatives.
- **`warper` for free OpenRouter access** when you want a Warp-style harness without the subscription. Single-maintainer fork; check vendor health.
- **`supacode.sh`** (covered in calibration; mentioned here for completeness): Docker-per-agent variant if you want stronger isolation per session at the cost of slower startup.

<hr/>

## Tools

- tmux ≥ 3.0
- tmux-resurrect + tmux-continuum
- `tmux-claude-resurrect` plugin (optional but high-value)
- Claude Code or Codex CLI
- A consistent project folder convention
