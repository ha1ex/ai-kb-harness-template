---
id: A-048
tier: A
category: "Knowledge management"
kind: pattern
title: "Handoffs as the unit of agent memory — wave-numbered per-project handoff docs"
subtitle: "Long projects die when the agent's context window resets. Each session ends with a structured handoff; the next session reads it in 30 seconds."
source: https://www.cybos.ai/cases/A-048
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Founder · IC · anyone running multi-session agent work · teams sharing one repo"
type: case
version: v0.1
---
# Handoffs as the unit of agent memory — wave-numbered per-project handoff docs

> Long projects die when the agent's context window resets. Each session ends with a structured handoff; the next session reads it in 30 seconds.

## What

Every meaningful agent session ends by writing a structured **handoff document** — a per-project Markdown file that captures, at minimum: project name, where each artefact lives in Git, what backend/frontend the agent touched, which skills were created or used, which promises were completed vs. left incomplete, a timestamp, and a **wave number** (`Wave 8 — May 2, 14:00`). The next session begins with one phrase — "Pick up handoff for `<project>` latest" — and the agent reads the most recent handoff (and, when asked, N waves back) before doing anything else. The pattern is durable across sessions, across agents (Claude Code, Codex, Cursor), and across operators on the same team.

## Why it matters

This is the single most-cited "magic moment" from operators who have stabilised a multi-week vibe-coded build with non-engineer team members. It solves the universal "agent forgets context" problem at the **work-product level**, not at the session level — i.e. memory survives compaction, model swaps, IDE crashes, vacation, and handovers between humans. One operator reports that handoffs were the unlock that took the microservice fleet from "a solo project" to a team-owned operating system — the IT director can now resume any wave without re-asking what state things are in. Compared with the alternative (re-reading raw transcripts, scrolling chat history, or re-running discovery prompts), one handoff read costs ~30 seconds and 1–2K tokens; the saved minutes per session compound across every agent in the company.

Handoffs are the natural unit of memory because they are written **by the agent at the end of its own work**, when it knows what actually shipped — not at the start of the next session, when the next agent has to guess.

## End-to-end

1. **Pick a per-project location.** In each Git-backed project folder, create `handoffs/`. The handoff file naming convention is `handoffs/wave-NN-YYYY-MM-DD-HHMM.md` so a directory listing is already a timeline. Commit handoffs alongside the code they describe — the wave file is part of the project's source of truth.
2. **Install a `/handoff` skill** (Claude Code skill or equivalent) that the operator triggers at session end. The skill produces a fixed-structure document. Don't rely on freeform "summarise the session" — that drifts. The structure below is the load-bearing piece.
3. **Handoff document structure.** Six required sections, in this order:

- **Project & wave:** project name, wave number, date/time stamp, model used, operator name.
- **Where it lives:** repo URL, branch, key file paths the agent touched. One line per artefact.
- **System shape:** one paragraph each for backend, frontend, data, deploy. What is the artefact actually made of, after this wave?
- **Skills used / created:** list of skill files invoked + any new skill files committed this wave.
- **Promises:** two sub-lists — `[done]` (what shipped this wave) and `[open]` (what we said we'd do and didn't). Each item ends with a path to the relevant Issue / file / test.
- **Open questions:** anything the next agent must decide before writing more code. If empty, write `none`.

1. **Trigger at session end.** Operator (or the agent's own session-end hook) runs the skill: "Save the handoff for this wave: what we did, what's incomplete, what's deployed where." Agent fills the template, commits, pushes.
2. **Wave numbering.** Each new substantive session increments the wave number. Trivial fixes (typos, formatting) re-use the latest wave. The agent asks at start of session: "is this a new wave, or are we continuing wave N?" — the human decides.
3. **Session start ritual.** "Pick up handoff for `<project>` latest." Agent reads the latest handoff file, then announces what it understands the state to be and what it is about to do. Operator confirms or corrects before any code is written. If the agent's understanding is wrong, fix the handoff file — don't fix the prompt.
4. **N-back reads.** When the next wave is non-obvious (a feature thread that paused two weeks ago), prompt: "Pick up handoff for `<project>` — read the last 5 waves." The agent reconstructs the trajectory. This is materially cheaper than re-running discovery.
5. **Weekly handoff retrospective.** Once a week, walk the project's `handoffs/` folder and ask the agent: "list every promise we made in waves N–N+k that is still `open`, sorted by age." The output is the project's true backlog — not whatever the legacy task tracker claims.
6. **Cross-team / cross-operator handoffs.** When passing a project from operator A to operator B, the handoff doc is the entire artefact handed over. No call, no Loom. B reads, asks clarifying questions if the wave file is ambiguous, and starts wave N+1. The doc structure ensures the same fields are present regardless of who wrote it.

## Prompts

End-of-session handoff prompt (paste into the agent or invoke `/handoff`):

```
`Save the handoff for this wave to handoffs/wave-<NN>-<YYYY-MM-DD>-<HHMM>.md.

Structure (do not skip sections, do not reorder):

1. Project & wave
 - project: <name>
 - wave: <NN>
 - timestamp: <ISO>
 - model: <model + reasoning effort used this wave>
 - operator: <name>

2. Where it lives
 - repo: <url>
 - branch: <name>
 - touched files (one per line, repo-relative):
 - <path>
 - <path>

3. System shape (one paragraph each)
 - backend: <what it is right now, post-wave>
 - frontend: <what it is right now, post-wave>
 - data: <stores, schemas, fixtures>
 - deploy: <where it runs, URL if any>

4. Skills used / created this wave
 - used: <list of skill files invoked>
 - created/changed: <list of skill files committed>

5. Promises
 [done]
 - <item> — <link to file/Issue/test>
 [open]
 - <item> — <link to file/Issue/test>

6. Open questions for next wave
 - <question or "none">

Then: commit the handoff file along with this wave's code. Suggest the commit message.
`
```

Session-start prompt:

```
`Pick up handoff for <project> latest. Read the file. Restate, in 5 bullets:
 - what state the system is in,
 - which promises are still open,
 - which open questions need answering before code,
 - the next concrete step you propose,
 - the wave number this session will be (N+1, or continuation of N).
Then WAIT for my confirmation. Do not write any code yet.
`
```

N-back read for a resurrected project:

```
`Pick up handoff for <project>. Read the last 5 wave files in handoffs/.
Produce a 10-line trajectory: what we tried, what we abandoned, what stuck.
Then propose: continue, fork a new wave, or archive.
`
```

## Gotchas

- **Free-form "summary" handoffs drift.** If you let the agent write whatever it wants at session end, by wave 5 the files are unstructured and the next agent skims rather than reads. The six-section template above is the contract. Enforce it in the skill, not in your head.
- **Don't store handoffs outside the repo.** They are part of the project. A handoff in a personal vault that the next operator can't read is worse than no handoff. Commit them; they are not embarrassing.
- **Don't trust in-session memory across waves.** Even within a single long session, the agent will compact and forget. Write the handoff *before* you ask one more "small" question — the small question is what blows the window.
- **`[open]` promises decay.** A promise from wave 3 still listed in wave 12 is a signal — either fold it into a planned wave or kill it explicitly. Don't carry zombie promises forward; the cost is real (every read costs tokens).
- **File-chaos open question.** Operators have flagged that they don't yet have a clean cross-project folder structure for handoffs that span multiple projects (e.g. "where did we discuss this?"). Solution-in-progress: a top-level `handoffs/INDEX.md` that lists active projects and their latest wave number, regenerated by a cron agent.
- **Wave numbering should not be auto-incremented blindly.** A typo fix that touches one line is still wave-N; only a substantive session opens wave-N+1. Otherwise you accumulate 200 trivial wave files in a month.

## Variations

- **Lighter:** for one-shot scripts and disposable tools, skip handoffs. The pattern earns its keep at ~3 sessions into a project.
- **Heavier (multi-agent / multi-repo):** add a top-level `handoffs/INDEX.md` regenerated nightly by a cron agent — one row per project with `latest_wave`, `open_promises_count`, `last_touched_at`. The founder's morning ritual is "read the index."
- **Cross-team variant:** when handing a project to a new operator, run a "handoff QA" — the receiving operator reads the latest wave, then prompts the *previous* agent: "given my reading, what's missing from this handoff?" The previous agent fills gaps before the operator-to-operator call ever happens.
- **GitHub Issues variant:** if you already use Issues-as-memory (see A-027), the handoff doc can be a comment on a dedicated project-state Issue rather than a file. Same structure, different surface. Use whichever your team already reads.

## Tools

- Any coding agent (Claude Code, Codex, Cursor) — the pattern is agent-agnostic
- Git repo per project; `handoffs/` directory committed alongside code
- A `/handoff` skill (Claude Code skill file, Codex AGENTS.md block, or shell script) — published versions circulate inside the cohort; the structure above is the minimum
- An operator habit: run `/handoff` before closing the session. Hook into shell `exit` if you keep forgetting
- Markdown is sufficient — no JSON, no DB
