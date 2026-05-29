---
id: A-070
tier: A
category: "Knowledge management"
kind: framework
title: "Six-layer Second Brain — md-in-git + nightly graph-lint + cross-session watcher"
subtitle: "Problem solved: Knowledge across parallel agent sessions drifts; static docs go stale; trackers don't merge cleanly with documents. Six layers — md-in-git as source of truth, nightly graph-lint, session-start brief, cross-session watcher, /help advisor command, PostToolUse DECISIONS-INBOX runner — turn an agency's knowledge into a substrate agents can actually rely on."
source: https://www.cybos.ai/cases/A-070
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "founder · knowledge lead · engineering lead · agency operator"
type: case
version: v0.1
---
# Six-layer Second Brain — md-in-git + nightly graph-lint + cross-session watcher

> Problem solved: Knowledge across parallel agent sessions drifts; static docs go stale; trackers don't merge cleanly with documents. Six layers — md-in-git as source of truth, nightly graph-lint, session-start brief, cross-session watcher, /help advisor command, PostToolUse DECISIONS-INBOX runner — turn an agency's knowledge into a substrate agents can actually rely on.

## What

A production Second-Brain architecture for a small agency. Source of truth: plain `.md` files in a git repo, with `[[wiki-link]]` syntax between nodes. Six software layers maintain it:

1. **`graph-lint.py`** — nightly cron walks every node and reports broken wiki-links, orphan nodes, frontmatter violations, stale decisions (past `revisit_by` date), cosine-similarity dupes, and contradictions between decision-nodes. Outputs a morning report. **Doesn't auto-fix.**
2. **`session-graph-brief.py`** — `SessionStart` hook injects the top-5 most relevant nodes (by project tags + topic) into every new Claude Code session.
3. **Cross-session watcher daemon** — polls all open Claude Code session timelines every 60s; when two sessions touch overlapping nodes or files, writes a nudge to `watcher-nudges/<session-id>.jsonl`.
4. **`inject-watcher-nudges.py`** — `UserPromptSubmit` hook reads watcher-nudges and prepends them to the user's next prompt.
5. **`/help` slash command** — spawns a Task-subagent with an advisor prompt, hands it the current session's timeline plus graph-walked relevant nodes, returns a structured recommendation written into `docs/DECISIONS-INBOX/from-advisor-*.md`.
6. **`post-observe.py`** — `PostToolUse` hook with a pluggable handlers list (`cross_session_sync/handlers/`). After each tool-call, it scans DECISIONS-INBOX for items relevant to the current project and injects them into `additionalContext`. The hook must be registered in `settings.json` **before** the session starts — it cannot retroactively activate.

Tasks intentionally stay in a tracker (Linear); knowledge stays in flat `.md`. Nightly export of Linear → `vault/linear-snapshot-YYYY-MM-DD.md` lets agents grep the snapshot instead of calling the tracker API.

## Why it matters

Reported by one agency operator running this for ~three months: doc drift — the operator's stated main problem at month 0 — was eliminated by month 3. Agents now reference each other's work across parallel sessions; the operator's framing: *"decisions never get stale because graph-lint catches them."* Pairs with three-layer rule enforcement ( ) at the per-rule level and three-layer agent memory at the per-bot level — all from the same operator's ecosystem, all converging on the same principle: **deterministic-where-possible, AI-where-not.**

## End-to-end

1. **Stand up the vault.** A git repo, every node a `.md` file, `[[wiki-link]]` between them (Obsidian / foam-style). Each node has frontmatter — at minimum `id`, `title`, `tags`, and decision nodes have `revisit_by`.
2. **Write `graph-lint.py`** (nightly cron). Checks: broken wiki-link targets, orphan nodes (no inbound or outbound links), frontmatter validation against schema, stale decisions past `revisit_by`, cosine-similarity duplicates (flag pairs above your threshold for review), contradictions between decision-nodes (two decisions on the same topic with opposite conclusions). Output a morning report. **Do not auto-fix** — the cost of a wrong auto-merge is higher than the cost of a daily 10-minute manual triage.
3. **Add `session-graph-brief.py` as a `SessionStart` hook.** Takes the project context + tags, walks the graph, ranks nodes by relevance, injects the top 5 into the session opening. *"This removed half of 'I forgot we already have something on this'."*
4. **Build the cross-session watcher daemon.** Every 60s: read open Claude Code session timelines (Claude Code writes session state to a known directory), compute overlap on touched nodes / files, write nudges to `watcher-nudges/<session-id>.jsonl` when two sessions converge on the same node.
5. **Add `inject-watcher-nudges.py` as a `UserPromptSubmit` hook.** It reads the current session's watcher-nudges file and prepends content to the user's submission so the agent sees "Note: another open session is also editing X."
6. **Add the `/help` slash command.** It spawns a Task-subagent whose system prompt is "you are an independent second brain; do not switch the user's window; answer from the timeline + the graph nodes I'm handing you." Output goes to `docs/DECISIONS-INBOX/from-advisor-*.md` with a `Target project:` frontmatter field.
7. **Add `post-observe.py` as a `PostToolUse` hook with pluggable handlers.** This is what makes #6 useful retroactively. After each tool call, the hook iterates a `HANDLERS` list of small scripts in `cross_session_sync/handlers/`, each of which scans DECISIONS-INBOX for items relevant to the current project's frontmatter and adds them to `additionalContext`. Adding a new surfacing point = drop a handler in the folder, append to `HANDLERS` — no new hook registration, no settings.json edit, no SKILL.md change.
8. **For tasks: keep them in the tracker; grep a nightly snapshot.** Two-way sync between tracker and `.md` is the trap — race conditions break it. The hybrid that works: Linear (or equivalent) holds tasks with deadlines and assignees; every night an export writes `vault/linear-snapshot-YYYY-MM-DD.md`; agents grep the snapshot, not the API. One source of truth per concern, no race.

## Prompts

The architecture description, verbatim(translated):

```
`1. Source of truth: plain.md in git, [[wiki-link]] between nodes.
 No trackers as canonical.

2. Every night graph-lint.py walks all nodes: broken wiki-links, orphan
 nodes, frontmatter violations, stale decisions past revisit_by,
 cosine-similarity dupes, contradictions between decision nodes.
 Doesn't fix itself — drops a report, I triage in the morning.

3. SessionStart hook session-graph-brief.py: Claude gets top-5 relevant
 nodes by tags + topic of the current project before session start.
 This removed half of "I forgot we already have something on this."

4. Cross-session sync: each open Claude Code window runs a watcher
 that every 60s reads timelines of all live sessions, computes
 overlap on mentioned nodes / files, writes a nudge to
 watcher-nudges/<session-id>.jsonl. inject-watcher-nudges.py hook
 picks it up on the next UserPromptSubmit.

5. /help command spawns a Task-subagent with the advisor prompt; we
 feed it the timeline of the current session and relevant nodes
 from a graph walk. It returns a structured recommendation. Useful
 when you're stuck and need a second brain without switching window.
 Result written to docs/DECISIONS-INBOX/from-advisor-*.md with
 Target project: field.

6. Runner for cross-session surfacing: PostToolUse hook post-observe.py
 registered in settings.json from session start. Built-in runner with
 pluggable handlers — after each tool-call it reads DECISIONS-INBOX,
 looks for fresh spinoff handoffs and watcher-nudges. If something
 new for the current project — injects into additionalContext.
 Critical: it works in already-open long sessions, because
 post-observe was in settings before the sessions started.

 Pluggable: add a new surfacing point = drop a handler in
 cross_session_sync/handlers/, add to HANDLERS list. No new hooks,
 no settings.json edits, no skills.

For the tasks-vs-docs question:
- For tasks with deadlines and assignees: trackers win.
- For knowledge (decisions, methodologies, frameworks, meeting notes,
 insights): flat.md wins — greppable, diffs in git, merges on
 conflicts, agents read it without API abstractions.

Hybrid: tasks in Linear; at night export to
vault/linear-snapshot-YYYY-MM-DD.md; agents grep the snapshot, not
the API. One source of truth, speed preserved.
`
```

Suggested vault layout:

```
`vault/
├── nodes/ # the.md files, source of truth
├── docs/DECISIONS-INBOX/ # output of /help and other advisors
├── watcher-nudges/ # per-session jsonl from the watcher daemon
├── cross_session_sync/handlers/ # pluggable PostToolUse handlers
├── scripts/
│ ├── graph-lint.py
│ ├── session-graph-brief.py
│ ├── inject-watcher-nudges.py
│ └── post-observe.py
└── linear-snapshot-YYYY-MM-DD.md # nightly tracker export
`
```

## Gotchas

- **Don't try two-way sync between tracker and `.md`.** Race conditions break it; source operator explicitly rejected this and ships nightly snapshot instead.
- **`post-observe.py` must be in `settings.json` from session start.** New hooks can't retroactively activate in already-open sessions. If you decide to add the PostToolUse layer halfway through a project, close every open session first or accept that your current sessions don't get the benefit until they restart.
- **graph-lint should report, not fix.** A wrong auto-merge of cosine-similarity dupes corrupts the vault silently; the cost of triage is lower than the cost of recovery. Same logic applies to broken wiki-link "auto-repair" suggestions — let a human decide.
- **For tasks, trackers still win.** Flat `.md` is for knowledge, not for things with deadlines and assignees. The hybrid is the working answer; don't try to make `.md` files into a tracker.
- **The watcher daemon eats battery.** Polling every 60s × N open sessions is fine on a desktop, less fine on a laptop running on battery. Make the interval configurable; back it off when sessions are idle.

<hr/>

## Tools

- Git repo for the vault
- Python (for graph-lint, hooks, watcher daemon, post-observe handlers)
- Claude Code with full hook lifecycle support (`SessionStart`, `UserPromptSubmit`, `PostToolUse`)
- An Obsidian / foam-style wiki-link parser (or roll your own; format is simple)
- Optional: Linear (or equivalent tracker) with a nightly export job to the vault
- A cron host that survives between sessions (laptop is fine if always on; a small VPS is fine; see for the personal-agent host catalog)
