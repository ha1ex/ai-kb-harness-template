---
id: A-019
tier: A
category: "Operations"
kind: skill
title: "Daily Focus skill — intentional manual morning ritual"
subtitle: "Mornings start with inbox triage instead of priorities. One typed command produces the day's top three before email opens."
source: https://www.cybos.ai/cases/A-019
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Founder · exec · team lead · IC"
type: case
version: v0.1
---
# Daily Focus skill — intentional manual morning ritual

> Mornings start with inbox triage instead of priorities. One typed command produces the day's top three before email opens.

## What

Every morning the operator opens their agent and runs a single skill: `/daily-focus`. The skill asks one question — "how do you feel, what's your energy?" — and produces a single "card" file for today: a one-screen prioritised plan that pulls in current tasks from the task tracker, today's calendar, anything missed from yesterday, and any open commitments from the past week's transcripts. Output is a Markdown file named with today's date that doubles as a journal and as the input for any later "what did I commit to today?" agent query.

The critical design choice is that this skill is **not automated**. It runs only when the operator opens the terminal and types the command. The manual trigger is the ritual.

## Why it matters

Replaces the morning standup for solo operators and partially replaces it for small teams. Forces a conscious daily prioritisation pass rather than letting the agent silently degrade the user's attention with auto-generated noise. The deeper insight is operational: when you fully automate a high-stakes ritual, "continuous degradation" kicks in — outputs slowly drift away from what you actually need because no human is in the loop to correct them. Daily Focus is the canonical case for "manual trigger is a feature, not a bug." Founders running this report better attention budget control and meaningful relief from inbox-driven days.

## End-to-end

1. **Create the skill file** under `skills/daily-focus/SKILL.md` (or your agent's equivalent). Keep it short — a header, the question set, the data sources to pull, and the output shape.
2. **Wire the data sources via MCP.** Calendar MCP (today's events), task-tracker MCP (Linear / Asana / Jira open tasks), the transcripts folder (yesterday's calls), and the previous day's daily-focus card (so missed items roll forward).
3. **Define the output card.** Header with date, energy state, top-3 focus, full task list categorised P0/P1/P2, calendar block, "rolled-over from yesterday" section, "long-pending commitments" section. Save under `daily-focus/yyyy-mm-dd.md` using the naming convention.
4. **Add a voice trigger.** Wispr Flow + a Raycast snippet → "open terminal at workspace, run `/daily-focus`."
5. **Optional: post to a team chat.** A one-line summary card to a team Telegram or Slack channel, so partners see the focus without prying.
6. **Hold the line on manual trigger.** Resist the urge to cron it. The conscious "I am now opening this" is half the value.
7. **Retro weekly.** What ended up in P0 but didn't move? What rolled over four days in a row? That signals a skill-extraction candidate (see #127).

## Prompts

Skill body (excerpted, paste into `skills/daily-focus/SKILL.md`):

```
`---
name: daily-focus
trigger_phrases: ["daily focus", "morning ritual", "/daily-focus"]
---
`
```

## Gotchas

- **Do not cron it.** Continuous-degradation drift kicks in within two weeks. The conscious open-terminal-type-command motion is the practice.
- **Don't merge it with the team standup.** Daily Focus is a personal artefact; the team-side equivalent is a separate retro/sync skill.
- **Don't let it grow.** If the card runs past one screen, the skill is doing too much. Move side-quests (analytics, deep planning) to their own skills.
- **Energy state isn't decoration.** Use it: low-energy days produce a 2-item P0, high-energy days an aggressive 5-item P0. Without this lever the skill becomes a glorified task list.
- **Naming-convention drift kills retros.** All daily-focus files must follow `daily-focus/yyyy-mm-dd.md` exactly; otherwise the "what rolled over" lookup breaks.

## Variations

- **Lighter:** Just a static Markdown template the operator fills by hand each morning, with no agent involvement.
- **Heavier:** Pair with a weekly-sync skill that aggregates seven daily-focus cards into a Friday retro; surface candidates for new skills (see #127).
- **Team-side:** Each team-member runs Daily Focus; the one-line top-3 lines get posted to a Telegram thread the founder reads as a daily situational-awareness brief — replaces the all-hands stand-up.

## Tools

- Agent CLI (Claude Code / Codex / Cursor)
- Calendar MCP, task-tracker MCP, transcripts folder
- Naming convention adopted
- Optional: Wispr Flow + Raycast for one-click invocation
