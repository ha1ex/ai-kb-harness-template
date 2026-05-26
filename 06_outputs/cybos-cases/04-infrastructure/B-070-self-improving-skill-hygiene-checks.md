---
id: B-070
tier: B
category: "Infrastructure"
kind: pattern
title: "Self-improving skill-hygiene checks"
subtitle: "Skills accumulate cruft and new people break conventions. A bash block in SKILL.md grep-checks for past anti-patterns; extends from real failures."
source: https://www.cybos.ai/cases/B-070
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "ops lead · founder · any skill maintainer"
type: case
version: v0.1
---
# Self-improving skill-hygiene checks

> Skills accumulate cruft and new people break conventions. A bash block in SKILL.md grep-checks for past anti-patterns; extends from real failures.

## What

A bash block at the bottom of `SKILL.md` that runs a handful of grep-based hygiene checks against the data the skill operates on. Each check is a real anti-pattern with a real date. Examples from a small-team HR skill: (1) candidates are flat files, not in subfolders; (2) candidate files have `cv:` in frontmatter; (3) candidates with `status: intro` older than 14 days surface (forces a decision); (4) role cards have `status:` and `1-1 History` sections; (5) compensation strings never leak outside the HR folder. The rule: if eval finds a violation, fix the file; if eval *fails to find* something it should have, add a new check.

## Why it matters

Skills accumulate cruft. New people break the conventions. The eval block is the immune system — runs cheap, surfaces specific violations, and self-extends from real failures. A small-team HR skill caught the per-candidate-folders anti-pattern on a specific date and added a check the same day; the bug cannot recur.

## End-to-end

1. **At the bottom of `SKILL.md`, add a fenced bash block** that sets `VAULT=` and `SKILL_HOME=` paths.
2. **Write 3–5 grep checks** for your top anti-patterns. Each check echoes "FAIL: <description>" on hit; exits 0 always (so checks compose).
3. **Run on demand**: extract the block with awk, pipe to bash:

```
`awk '/^```bash$/{flag=1;next}/^```$/{flag=0}flag' SKILL.md | bash
`
```

1. **Schedule weekly** via cron or a calendar reminder.
2. **On every real failure**, ask: would a grep check have caught this? If yes, add it. If no, file it as a lesson.
3. **Whitelist names / paths inline** in the bash where needed (team members' folder names, valid statuses).

## Gotchas

- `stat -f %m` is BSD/macOS; Linux needs `stat -c %Y`. Pick one and document it. Whitelists must update when team membership changes.

## Variations

- **Generalize beyond grep** — wrap any skill with versioning + a self-improvement step that runs after each invocation. The same eval-loop shape applies to any skill domain where "after a change, run this audit prompt" is the right reflex.

## Tools

- bash, awk, find, grep, stat, date (BSD or GNU; mind the `stat` flags)
- Disciplined naming conventions so checks are pattern-able
