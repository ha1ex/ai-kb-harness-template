---
id: B-039
tier: B
category: "Engineering productivity"
kind: pattern
title: "Planner/executor split between two coding agents"
subtitle: "One agent can't both research the web cheaply and run your build. Split: a planner with web/search access; an executor with IDE/repo access; state on GitHub between them."
source: https://www.cybos.ai/cases/B-039
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · engineer · anyone alternating between phone and laptop"
type: case
version: v0.1
---
# Planner/executor split between two coding agents

> One agent can't both research the web cheaply and run your build. Split: a planner with web/search access; an executor with IDE/repo access; state on GitHub between them.

## What

A two-agent workflow. The **planner** runs in a high-context environment with web/search access — cheap inference, big context window, fast iteration — and never writes code; its only output is a structured prompt for the executor. The **executor** is a coding agent with deep IDE / repo integration — Codex CLI, Claude Code, Cursor, Aider, or whatever ships in the workspace — and never plans; its only job is to take the prompt, ship code, open a PR. State lives in GitHub between them, accessible from any device.

Specific 2026 stacks where this still applies: Claude Code as plan author + Codex CLI as the executor running in a tmux worker tab; Claude (web or desktop) for plan + Cursor or Aider for inline edits; Sonnet-as-planner + Haiku (or any direct-execution model) wired into the coding agent. The constraint is asymmetric — pick the cheaper, longer-context model for planning; the IDE-native, tool-rich model for execution — not which vendor wraps each role.

## Why it matters

The planner agent has cheaper tokens and better search; the coding agent has the build/test environment. Splitting them by role saves tokens, reduces context-window competition between coordination and code, and produces better plans. Codex and Claude Code both now run directly from CLI, mobile, or GitHub Actions environments — so the executor side is invokable from a phone or a CI hook, not just a laptop. Founders can dispatch real engineering work by voice from the car: the planner agent on the phone drafts the prompt; the executor opens a PR.

## End-to-end

1. Put every project in GitHub (private repo is fine). The repo is the shared state surface between the two agents.
2. Configure the planner agent with a custom-instructions persona: *"Never write code in chat. Act as my planning agent. When asked to do something, output a prompt for my coding agent. Describe what to do; do not implement."* Enable the GitHub connector / repo-read tool so it can browse code before drafting prompts.
3. Configure the executor: Codex CLI (`codex exec`), Claude Code, or the IDE-native equivalent — running locally in a worker tmux tab, or invoked headlessly via the GitHub-hosted runner (Codex web agent at chatgpt.com/codex, Claude Code via GitHub Actions, etc.).
4. Workflow: ask the planner "I want to add X to repo Y. What are the next steps? Output the prompt for my coding agent." Get a structured prompt back. Paste into the executor; it runs.
5. For mobile / voice: the planner agent (on phone) dispatches a prompt; the executor runs in a hosted environment and opens a PR. Same workflow from laptop, phone, car.
6. Same workflow holds when the planner and executor are different model tiers inside the same vendor (Sonnet-plan / Haiku-execute) — the asymmetry is the point, not the vendor.

## Prompts

```
`Planner-agent custom instructions:
Never write code in chat replies. Act as my planning agent. When asked to do something, output a prompt for my coding agent. The prompt should describe what to do, in English. Prioritise: security, implementation speed, most popular solutions on the market. End with: "Run this in the executor agent; report back."
`
```

## Gotchas

- Sometimes the planner skips web search even with the connector enabled. Add "browse the repo and the web before answering" to the prompt explicitly.
- Don't expect the planner to know your private docs unless they're committed to the repo. Treat GitHub as the universal context drive.
- Don't collapse the roles. The temptation is to let the coding agent also plan, since it has repo access — but the planner's cheaper tokens and broader context are the whole point. Keep them split.

## Variations

- **Claude as network-admin, Codex as coder.** A more explicit role asymmetry from a cohort technical lead: Claude Code holds the coordinator role (orchestrates skills, owns the personal-OS surface, manages tmux tabs), while Codex CLI runs in worker tabs and writes / executes code. Claude doesn't write code in this configuration; Codex doesn't own the coordinator surface. Reduces context-window competition between the two roles and avoids accidental work duplication.

## Tools

- A planner agent with web/search and repo-read access (Claude.ai, ChatGPT, Claude Code with web search, etc.)
- An executor coding agent with IDE / repo write access (Codex CLI, Claude Code, Cursor, Aider, or the hosted equivalent)
- A repo on GitHub as the shared state surface
