---
id: A-026
tier: A
category: "Engineering productivity"
kind: tactic
title: "Hierarchical agent config — AGENTS.md three-tier (with CLAUDE.md bridge)"
subtitle: "Problem solved: Same prompt, same model, mediocre output because the agent can't find your context. A short hierarchy of agent-config files unlocks 50–70% quality gains — provided you cap them and refuse to bloat them."
source: https://www.cybos.ai/cases/A-026
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Engineering lead · every IC"
type: case
version: v0.1
---
# Hierarchical agent config — AGENTS.md three-tier (with CLAUDE.md bridge)

> Problem solved: Same prompt, same model, mediocre output because the agent can't find your context. A short hierarchy of agent-config files unlocks 50–70% quality gains — provided you cap them and refuse to bloat them.

## What

Three layers of agent-context files, each short, each pointing at the next. The root file (in the user's home directory or at workspace root) sets universal principles and lists every department / project under management. The department/project-level file (at the repo or department-folder root) describes that domain's mission, key files, common use cases, and domain-specific anti-hallucination rules. The leaf file (per project under a department) holds project-specific focus prompts. Each file is a router, not a rules dump — the maximum recommended depth is two layers of routing before the agent should hit the actual content.

The cross-agent convention is `AGENTS.md` (stewarded under the Linux Foundation; natively supported by Codex, Cursor, Gemini CLI, Aider, Jules, Windsurf, VS Code, GitHub Copilot's coding agent, Zed, Warp, and ~20 other tools). Claude Code reads `CLAUDE.md` per Anthropic's docs. Recommended pattern: one-line `CLAUDE.md` containing `@AGENTS.md`.

## Why it matters

Multi-source-validated +50–70% AI output quality bump on the same model, attributed to the agent finding the right context without bespoke per-task prompts. Setup is an afternoon. The portability payoff is bigger than the immediate quality bump — when the next agent / model / vendor appears, the rule files port over unchanged.

The second-order lesson, learned the hard way in 2026 Q1: **rule bloat is its own anti-pattern**. OpenAI cut the Codex GPT-5 system prompt from 310 lines to 104 (~66% reduction) when migrating from o3 — Anthropic published research showing over-guardrailing constrains model capability. The same shape applies to your `CLAUDE.md`: add rules sparingly; keep the root file under ~200 lines; rely on hooks for invariants, not on prose.

## End-to-end

1. **Pick `AGENTS.md` as the canonical name.** Add a one-line `CLAUDE.md` (`@AGENTS.md`) for Claude Code. Legacy: for older Cursor builds, also drop a one-line `.cursorrules` stub that says `see AGENTS.md`.
2. **Write the global file** at `~/AGENTS.md`. Sections: who you are (one paragraph), broad principles, where your active workspaces live, naming convention pointer, agent-tool preferences, critical NEVER rules.
3. **Write the department / workspace-level file** at the workspace root. Sections: overview, folder structure with one-line descriptions, department-context switching commands, cross-department rules, anti-hallucination tags (`[CANONICAL]`, `[REF: …]`, `[PLACEHOLDER: owner]`).
4. **Write a department-rules file** under each major folder. ~50–200 lines.
5. **Cap routing at two layers.** Root → department → file. Three or more layers means refactor.
6. **Pair every must-not-break invariant with a hook**, not just a rule paragraph. Rules go stale; hooks `exit 2` and block the action. See #B-049 / for the three-layer enforcement pattern.
7. **Maintain via PR review.** Edits to the root file get reviewed like code.
8. **Test the navigation periodically.** Ask an agent an abstract question and watch it follow the breadcrumb. Failure = fix the rules, not the prompt.

## Prompts

Canonical `AGENTS.md` skeleton (~150 lines, paste into workspace root):

```
``
```

## Gotchas

- **Don't expand to 3+ navigation layers.** Root → department → file. Beyond that, agents start mis-routing and humans stop reading.
- **Don't make the root file a rules dump.** Keep it under ~200 lines.
- **NEW — Spec-kit ceremony is overkill**. One operator running ~100 ablation studies at a coding-agent shop found public benchmarks are contaminated, multi-step "YOLO" runs don't always pay, and `github/spec-kit` is overkill for both humans and models. Better: keep a per-project-type `CLAUDE.md` boilerplate plus an ad-hoc "make a plan and tasks" prompt. Test on your own internal evals, not on public leaderboards.
- **NEW — Don't keep adding rules; cut them**. Anthropic research surfaced that excessive guardrailing degrades model capability. OpenAI cut their Codex system prompt from 310 → 104 lines moving from o3 to GPT-5. Apply the same lesson: every rule has a cost; periodically run the anti-bloat self-check above and delete what isn't earning its keep.
- **NEW — Skills require explicit refresh**. One operator hit a real bug: when skills update, the main `CLAUDE.md` doesn't auto-refresh, so the agent uses stale invocations. Fix: add an explicit rule in the main file requiring re-read of `skills/` at session start, or use a session-start hook.
- **2026-05-04 lesson:** at one workshop, a team that had been editing `cursor.md` for six months had a different agent (Codex) ignore the whole rulebook on first run. Move to `AGENTS.md`.
- **Don't let the rule files lie.** When the agent fails because the rule says "data lives in X" but it's in Y, fix the rule file, not the prompt.

<hr/>

## Tools

- Agent CLI (Claude Code / Cursor / Codex / Gemini)
- Workspace under git
- Naming-convention file adopted
- Hook support enabled (for invariant enforcement; see B-049)
