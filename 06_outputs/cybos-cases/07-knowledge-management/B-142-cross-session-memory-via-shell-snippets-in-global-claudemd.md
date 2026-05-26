---
id: B-142
tier: B
category: "Knowledge management"
kind: tactic
title: "Cross-session memory via shell snippets in global CLAUDE.md"
subtitle: "Problem solved: Claude Code doesn't know about its own past session files; three bash snippets in the global claude.md let every new conversation list, grep, and read prior sessions across all projects."
source: https://www.cybos.ai/cases/B-142
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "any Claude Code user working across multiple projects"
type: case
version: v0.1
---
# Cross-session memory via shell snippets in global CLAUDE.md

> Problem solved: Claude Code doesn't know about its own past session files; three bash snippets in the global claude.md let every new conversation list, grep, and read prior sessions across all projects.

## What

Claude Code stores every session as a `~/.claude/projects/<project-slug>/<session-id>.jsonl` file, but the agent has no awareness of those files unless you tell it. Adding three bash recipes to the global `claude.md` — list recent sessions, grep sessions by keyword, dump a specific session's dialog — gives any new conversation the ability to recall prior ones on demand. "This was an outright breakthrough" for cross-project memory.

## Why it matters

Replaces ad-hoc `docs/` folder maintenance: instead of writing handover notes between sessions, you let Claude grep its own history. The native `/insights` command shipped later covers part of this use case (pattern extraction), but the raw-grep recipe is still the right tool when you need to recall a specific conversation, not a synthesized pattern.

## End-to-end

1. Open your user-level `~/.claude/CLAUDE.md` (or project-level CLAUDE.md, depending on scope).
2. Add a section with the three snippets below — list-recent, grep-by-keyword, read-specific-session. Replace the path template with your username and project name (use dashes, not slashes).
3. Save. Open a new Claude Code session; the agent now has the recipes in context.
4. Ask: "list my last 10 sessions on this project" or "grep my sessions for `redis`" — Claude runs the bash and returns hits.
5. Drill into a specific session: "read session abc-123 and summarize what we decided about caching."

## Prompts

```
`# Project sessions directory (replace USER_NAME, PROJECT_NAME; use dashes)
SESSION_DIR=~/.claude/projects/-Users-USER_NAME-Developer-PROJECT_NAME

# 1. List recent sessions with a first-message preview
for f in $(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null | head -15); do
 echo "=== $f ==="
 head -1 "$f"
done

# 2. Search sessions by keyword
grep -l "redis" "$SESSION_DIR"/*.jsonl

# 3. Dump a specific session's dialog
cat "$SESSION_DIR/SESSION_ID.jsonl" \
 | python3 -c "import sys, json; [print(json.loads(l).get('content','')) for l in sys.stdin]"
`
```

## Gotchas

## Session files balloon: a heavy CC user accumulates GB of `.jsonl` in `~/.claude/projects/` within months. The grep snippet works fine; the dialog-dump snippet on a huge session will burn context fast. Use it on the smallest matching session, not on the whole project. Also: if you migrate machines, copy `~/.claude/projects/` along with everything else — that's where your cross-session memory actually lives.

## Tools

- Claude Code with `~/.claude/projects/` populated
- bash, python3 (for the dialog dump one-liner)
- A global or project-level CLAUDE.md the agent reads on every session
