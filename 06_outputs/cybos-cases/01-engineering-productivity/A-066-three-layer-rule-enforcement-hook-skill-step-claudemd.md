---
id: A-066
tier: A
category: "Engineering productivity"
kind: pattern
title: "Three-layer rule enforcement — hook + skill step + CLAUDE.md"
subtitle: "Problem solved: Rules in CLAUDE.md alone get forgotten within ~40 minutes of context; rules inside a SKILL.md are still bypassable; only a PreToolUse hook with exit 2 can actually block. Layer all three and AI drift on critical invariants disappears."
source: https://www.cybos.ai/cases/A-066
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · engineering lead · agency operator"
type: case
version: v0.1
---
# Three-layer rule enforcement — hook + skill step + CLAUDE.md

> Problem solved: Rules in CLAUDE.md alone get forgotten within ~40 minutes of context; rules inside a SKILL.md are still bypassable; only a PreToolUse hook with exit 2 can actually block. Layer all three and AI drift on critical invariants disappears.

## What

Restate every critical agent rule in **three layers**: (L1) a shell hook bound to a Claude Code lifecycle event (`PreToolUse`, `SessionEnd`, or `UserPromptSubmit`) that `exit 2`s and blocks the action if the rule is violated; (L2) a one-line reminder inside the relevant `SKILL.md`; (L3) a paragraph of "why" inside `CLAUDE.md`. The hook is the only layer the model cannot bypass — the shell literally refuses to let the action proceed until the rule is satisfied. Pairs with a "two failed edits → start over and propose 2–3 structurally different alternatives" gate on correction loops so the agent doesn't grind on the same wrong approach.

## Why it matters

Reported by one operator running this on a deck-production pipeline: a 70+ slide McKinsey-style client report with multiple revision cycles, delivered without manual layout, that the operator describes as previously taking days and now stable end-to-end. Before introducing hooks, only the SKILL.md reminder and the CLAUDE.md paragraph existed — the agent "listened at the start of the session, then quietly forgot within ~40 minutes, cut corners, and repeated errors." Hardening with hooks eliminated the drift on `LEARNINGS.md` updates, secrets-in-config checks, and MCP port collisions. The operator's framing: *"If the model persistently won't follow a rule, that's not a model problem, it's the absence of an enforcement layer. The AI doesn't like discipline. The infrastructure can provide it."*

## End-to-end

1. **Identify the critical invariant.** Pick a rule the agent has actually violated more than once. Reference invariants from source: "must update `LEARNINGS.md` before closing session", "no secrets committed to config files", "no port collisions across registered MCPs", "agent never assembles a slide from raw rectangles — only by composing approved components from a design library".
2. **Write a hook script.** Plain shell. It reads the tool-call payload from stdin (or env), checks the invariant, and `exit 2` blocks the action. `exit 0` lets it through. Any other exit code is treated as a soft warning.
3. **Register the hook in `~/.claude/settings.json`.** Bind to the right lifecycle event: `PreToolUse` to block actions before they run, `SessionEnd` to gate session close (e.g. "no close until `LEARNINGS.md` was touched today"), `UserPromptSubmit` to filter / annotate the user's prompt before the agent sees it.
4. **Add a one-line reminder inside the relevant `SKILL.md`.** Keep it terse — the agent reads many skills; long text gets compressed.
5. **Add a "why" paragraph in `CLAUDE.md`.** Explain the rationale once. The agent reasons about the rule when first encountering it; the explanation is what makes the rule survive paraphrase in compaction.
6. **Add the two-failed-edits rule.** Either as a SKILL.md rule or as another hook: track edit-attempts on the same file/element; after the second failed attempt, force the agent to stop, redo from scratch, and propose 2–3 structurally different alternatives. Cheaper in the moment costs less in the long run than grinding a broken approach.
7. **Treat the hook layer as the only contract.** L2 and L3 are reminders for *future operators reading the repo*, not enforcement. If a rule isn't worth a hook, it probably isn't worth being in `CLAUDE.md` either.

## Prompts

Operator rationale, verbatim(translated from source language):

```
`If the model persistently won't follow a rule, that's not a model problem.
It's the absence of an enforcement layer. The AI doesn't like discipline
(as it explained to me itself). The infrastructure can provide it.
`
```

Settings.json fragment registering a hook against three lifecycle events:

```
`{
 "hooks": {
 "PreToolUse": "~/.claude/hooks/check-secrets-and-ports.sh",
 "SessionEnd": "~/.claude/hooks/learnings-gate.sh",
 "UserPromptSubmit": "~/.claude/hooks/sanitize-prompt.sh"
 }
}
`
```

```
`#!/usr/bin/env bash
# learnings-gate.sh — block session close if today had significant edits
# but LEARNINGS.md was not modified today.
TODAY=$(date +%Y-%m-%d)
if git log --since="$TODAY 00:00" --pretty=oneline | grep -qv 'LEARNINGS.md'; then
 if [ "$(stat -f %Sm -t %Y-%m-%d LEARNINGS.md 2>/dev/null)"!= "$TODAY" ]; then
 echo "BLOCK: significant edits today but LEARNINGS.md untouched." >&2
 exit 2
 fi
fi
exit 0
`
```

## Gotchas

- **Hook registration is undocumented in the settings UI.** One operator only discovered Claude Code hooks via a friend's tip; the agent itself never surfaced the feature even after weeks of complaining about rule drift. Read the docs at code.claude.com/docs/en/hooks before assuming a feature doesn't exist.
- **Don't make the hook a "polite request".** A non-zero soft-warning exit code that doesn't actually block teaches the agent to ignore the layer. Either `exit 2` and block, or remove the hook.
- **Two failed edits is the right threshold.** One failed edit is normal; three is a sunk-cost trap. The operator's "force a structurally different alternative" rule kicks in at exactly two.
- **Critical rules must be a hook, not a SKILL.md bullet.** On long sessions any non-enforced instruction drifts. If the rule's failure costs production data, secrets, or a deadline, it has to be a `exit 2`.

<hr/>

## Tools

- Claude Code with native hook support (`PreToolUse`, `SessionEnd`, `UserPromptSubmit` lifecycle events)
- Shell (any POSIX) for the hook scripts
- `~/.claude/settings.json` write access
- Existing `CLAUDE.md` and a per-skill `SKILL.md` per critical invariant
