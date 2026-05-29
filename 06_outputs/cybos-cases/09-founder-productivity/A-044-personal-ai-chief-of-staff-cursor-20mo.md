---
id: A-044
tier: A
category: "Founder productivity"
kind: workflow
title: "Personal AI Chief of Staff — Cursor + $20/mo"
subtitle: "A real chief of staff costs $200K. This runs inbox triage + schedule defrag + Telegram aggregation for $20/mo."
source: https://www.cybos.ai/cases/A-044
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "Founder / C-level / anyone who consumes 100+ messages and 5+ meetings a day"
type: case
version: v0.1
---
# Personal AI Chief of Staff — Cursor + $20/mo

> A real chief of staff costs $200K. This runs inbox triage + schedule defrag + Telegram aggregation for $20/mo.

## What

A personal AI Chief of Staff built inside Cursor (or Claude Code) on a $20/mo subscription. Runs four loops on a schedule: (1) inbox triage — pulls Gmail + Telegram + Slack via MCP, classifies into Reply Now / Reply Later / Acknowledge / Ignore with one-line summaries; (2) schedule sweep — checks the next 7 days, flags conflicts, suggests defragmentation, drafts decline-templates for low-value meetings; (3) Telegram aggregation — collapses all unread group-chat noise into 3 themed bullets per chat per day; (4) Notion / vault sync — picks up any meeting notes touched since yesterday and pushes structured action-items into the task tracker. Single owner, single repo, no SaaS.

## Why it matters

One C-level operator built this for themselves in Cursor for $20/mo. Real, working, single-C-level deployment. Reported effects: inbox processed by 09:30 most days, Telegram aggregation killed the "I'm afraid to open the chat" reflex, and the schedule-sweep loop alone saved an estimated 4–6 hours per week of meeting that would otherwise have happened. Anchor cost reference: $20/mo per seat — concrete enough to put on a CFO's desk.

## End-to-end

1. **Create a single private repo `~/cos/`** with the following structure:

- `cos/AGENTS.md` (or a one-line `CLAUDE.md` that contains `@AGENTS.md`) — the master rules file (see prompt below).
- `cos/inputs/` — empty folder where MCP scrapers will drop JSON every hour.
- `cos/state/` — vault of recurring people, projects, "do not interrupt" rules, your own role and constraints.
- `cos/loops/` — one folder per loop: `inbox/`, `schedule/`, `telegram/`, `notion-sync/`. Each has a `loop.md` describing inputs, decision rules, outputs.
- `cos/output/` — where the loop writes its result (Markdown file per day per loop).
- `cos/scripts/` — small MCP scrapers and the cron runner.

1. **Wire 4 MCPs:** Gmail (read-only is fine), Telegram (your own session), Google Calendar, Notion (or whatever your vault is). Each MCP gets a small Python wrapper in `cos/scripts/` that on schedule writes a JSON snapshot to `cos/inputs/<source>.json`.
2. **Write the master rules file.** This is the chief-of-staff "constitution" — what to do, what not to do, who to interrupt, who not to.
3. **Write the four loop prompts.** Each loop's `loop.md` is a runnable instruction the agent executes when invoked.
4. **Schedule via cron.** Hourly: scrape inputs. Every morning at 07:00: run inbox loop. Every Sunday evening: run schedule sweep. Three times a day: run Telegram aggregation. End of day: run Notion sync. All write to `cos/output/`.
5. **Daily review surface.** Either open `cos/output/` directly in Cursor, or read it from your personal dashboard (see #208 case above) where the four daily output files appear as a single panel.
6. **Tune weekly.** Every Sunday, read the week's output files, ask the agent "where did you mis-classify? what rules should I add?" — and append to `AGENTS.md`. The system improves itself.

## Prompts

The `AGENTS.md` (chief-of-staff constitution):

```
`You are my Personal Chief of Staff.

WHO I AM
- A founder / commercial officer at [Company].
- Calendar densest 10:00-19:00 local. Mornings 07:00-10:00 are sacred for deep work.
- Currently focused: [3 priorities, updated monthly]
- Currently NOT engaging: [3-5 topics I'm deferring]

INPUTS YOU CAN READ
- cos/inputs/gmail.json — last 200 threads, oldest-first
- cos/inputs/telegram.json — last 24h of all chats and saved messages
- cos/inputs/calendar.json — next 14 days
- cos/inputs/notion.json — pages I touched since yesterday

OUTPUT RULES
- Always write to cos/output/<YYYY-MM-DD>-<loop>.md
- Lowercase headers. En-dash separator. No emoji.
- Cite source: "[gmail #thread_id]" or "[tg @chat 14:32]" on every claim.
- NEVER invent tasks. If a task isn't explicit in source, write [needs founder confirmation].
- NEVER classify a person as low-priority without 3 prior conflicting signals.
- NEVER touch the calendar without my approval.

DO NOT INTERRUPT
- Anything from [list of 5-10 names — partners, key clients, family]
- Anything tagged [URGENT] or [LP] in subject

INTERRUPT-WORTHY
- Any reply that mentions money figures > $X
- Any message from [list of investors / board]
- Any thread that's been open > 7 days from someone in [list]

WHEN UNCERTAIN
- Ask one specific question. Do not guess.
`
```

The inbox loop prompt (`cos/loops/inbox/loop.md`):

```
`Read cos/inputs/gmail.json + cos/inputs/telegram.json.

For each thread, classify into one of:
- REPLY NOW — needs my hand today, < 5 min response
- REPLY LATER — needs my hand this week, draft a starter response in cos/output/<today>-drafts/<thread_id>.md
- ACKNOWLEDGE — one-tap "got it, will look" reply; you can draft it
- IGNORE — no action needed, archive

For REPLY NOW: output a single-table by-thread with (sender, one-line ask, suggested action, deadline).
For REPLY LATER: write the draft. I will polish and send.
For ACKNOWLEDGE: list them; I'll batch-approve.
For IGNORE: list them silently at the bottom.

End with: "INTERRUPTIONS" section — anything that overrides my DO NOT INTERRUPT list per my AGENTS.md.

Cite every claim. Never invent.
`
```

Daily cron (sample crontab):

```
``
```

## Gotchas

- **Do not let the agent send.** Drafts only, ever. The day it sends without your eyes on it is the day a partner gets a wrong number and your trust evaporates.
- **DO NOT INVENT TASKS rule (founder CRM lesson from 2026-04 era):** explicitly encoded in `AGENTS.md`. Past pain: agent extrapolated "obvious next steps" and produced a follow-up list that included tasks no one had actually committed to. The founder DM'd the entire fake list to a contact. Hard rule now.
- **Tune the DO NOT INTERRUPT list weekly.** Stale lists are the failure mode — someone got bumped to "regular" and the agent quietly stopped flagging them.
- **Don't run multiple loops concurrently on the same inputs file.** Snapshots first, loops second. Otherwise inbox loop and telegram loop write contradictory action items.
- **Cost watch:** if your loops occasionally blow up to long-context, your Pro plan can be exhausted on a single bad day. Cap per-loop turns and timeout aggressively (`--max-turns 20`, `--timeout 180`).
- **Time and attention are the only finite resources.** Design every CoS surface against the test "does this save me a minute of attention or cost me a minute?" If a CoS feature requires more reading than it replaces, kill it. Operators who skip this test end up curating their CoS instead of being served by it.

## Variations

- **Lighter version (no MCPs yet):** start with just an Apple Mail export + a Telegram desktop export dropped in a folder, run the inbox loop manually. You'll discover the pattern before wiring real-time data.
- **Heavier version (mid-size agency class):** instead of four loops, build a graph that ingests every token continuously (token metabolism). Loops become continuous services. Add a "shadow employee" twin reachable at `agent@you.com` that handles routine email replies in your voice with delegation rules.
- **Team variant — Champions:** each team lead runs their own CoS with their own rules; share only the *patterns* (which loops you found valuable), never the contents. Federation, not template.
- **Cron-less variant:** instead of cron, invoke loops from your dashboard — "refresh CoS" button calls the same prompts on demand. Lower latency, more energy on you.

## Tools

- Cursor or Claude Code subscription ($20/mo Pro tier, or Max — flat rate, no per-token billing for routine loops).
- MCP servers for: Gmail, Telegram (e.g. a self-hosted Telegram MCP that uses your user session), calendar, your vault tool.
- A laptop or always-on box (Mac mini works) to run the cron jobs. Or a small VPS if you want it independent of laptop sleep.
- Optional Wispr Flow / Raycast for the voice-tune loop ("hey, also stop classifying X as REPLY LATER").
