---
id: B-021
tier: B
category: "HR & hiring"
kind: skill
title: "Personal-context interview skill — extract tacit knowledge"
subtitle: "Tacit working knowledge takes 3 months to absorb by osmosis. An agent-driven interview extracts it in a 2-hour onboarding session — now scanner-driven and phased so the corpus refreshes without firehose-prompting."
source: https://www.cybos.ai/cases/B-021
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "HR lead · manager · founder"
type: case
version: v0.1
---
# Personal-context interview skill — extract tacit knowledge

> Tacit working knowledge takes 3 months to absorb by osmosis. An agent-driven interview extracts it in a 2-hour onboarding session — now scanner-driven and phased so the corpus refreshes without firehose-prompting.

## What

A reusable interview skill that bootstraps a person's tacit working knowledge into a structured personal-context file. The interview is agent-driven: a Claude Code skill asks targeted questions, branches on answers, and outputs a structured `personal/me/` folder (CV, psychometric notes, working preferences, decision heuristics, recurring rituals). Used during onboarding (week 1) and at major role transitions.

## Why it matters

Tacit knowledge — "how I actually decide", "who I ping when X", "the 3 things I never delegate" — is hardest to transfer and what makes seniors valuable. A structured interview agent extracts it in a 2-hour session instead of 3 months of observation. The resulting file becomes the context an AI agent uses to draft work in the person's voice. The source-16 merge adds the missing re-run discipline: founder context files decay silently, and re-running a full firehose interview annually is exhausting, so the merged pattern makes the re-interview *scanner-driven and phased* — it only asks about what is actually stale.

## End-to-end

1. Create the skill `skills/personal-context-interview/` with a branching question protocol.
2. Bootstrap from existing self-data: psychometric tests, year-end retrospective, prior journals.
3. Run a 2-hour voice session — agent asks, person answers via Wispr Flow.
4. Agent transcribes and structures into `personal/me/`: CV, working hours, decision heuristics, key relationships, "what I never delegate", trigger events for asking for help.
5. **Scanner-driven phased re-run (source-16 merge).** On every re-run, the skill first runs a completeness scan over each context file, then walks a fixed priority order (always do the foundational file first; then proceed by leverage — mission/identity → goals → problems → strategies → …). Per file, switch mode by completeness: ≥80% complete → **Review mode** ("still accurate / outdated / missing / sharpen?"); <80% → **Fill mode** (walk the scanner prompts to populate it). Ask **one question at a time**. Voice-confirm only on an actual write (avoids alarm fatigue from confirming every read). After any foundational change, regenerate the rendered summary file so downstream skills inherit the update.
6. Mark with a high-security flag — never leaves the personal vault.
7. Reference from agent skills that draft email/proposals in the person's voice.
8. Re-run annually as the year-review ritual — using the scanner-driven phased mode, not a fresh firehose.

## Gotchas

- Security boundary matters — this file contains things you'd never put in Slack. Keep in the personal vault only; don't sync to a team workspace.
- **Don't re-run as a firehose.** The annual re-interview fails if it re-asks everything; people skip it. The scanner-driven phased mode is what makes the re-run survivable — only ask about files that scanned <80% complete or that the person flags as outdated.
- **Voice-confirm only on writes.** Confirming every read produces alarm fatigue and the operator starts rubber-stamping. Confirm on the actual write, not the scan.
- **Regenerate the rendered summary after foundational changes.** If the mission/identity file changes but the rendered summary isn't regenerated, every downstream skill keeps drafting from a stale persona.

## Tools

- Claude Code + the interview skill
- Wispr Flow for voice input
- Existing self-data (optional: psychometric test results)
- Optional public personal-AI interview pack for the scanner-driven phased pattern: `curl -sSL https://ourpai.ai/install.sh | bash`
