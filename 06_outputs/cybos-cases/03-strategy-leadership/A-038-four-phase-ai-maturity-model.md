---
id: A-038
tier: A
category: "Strategy & leadership"
kind: framework
title: "Four-phase AI maturity model"
subtitle: "Teams skip to Phase 3 features before Phase 1 daily usage is solid. A four-phase map names which one you're actually in."
source: https://www.cybos.ai/cases/A-038
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "Founder + leadership team"
type: case
version: v0.1
---
# Four-phase AI maturity model

> Teams skip to Phase 3 features before Phase 1 daily usage is solid. A four-phase map names which one you're actually in.

## What

A four-phase model for any team's AI-transformation journey, distilled from one reference deployment that has walked through all four phases in ~18 months. Each phase has its own success criteria, its own dominant failure mode, and a specific transition trigger to the next. Lets a founder honestly answer "what phase are we actually in?" and design the next move accordingly — rather than chasing flashy features from a phase three steps ahead.

## Why it matters

The biggest reason transformations stall is mis-sequencing — trying Phase 3 (cross-team workflows replacing process) before Phase 1 (everyone using Cursor / Claude Code daily) is solid. The phases are not a marketing taxonomy; they're prerequisites. Each unlocks the next.

## End-to-end

**Phase 0 — Foundation ("Cursorization" of the company)**

Three preconditions; without all three, nothing else compounds:

1. **Every team lead personally uses Cursor / Claude Code daily** for their own work. Founders who say "I'll just hire an AI lead" mostly fail. The founder must set up the tooling themselves and solve their own tasks first.
2. **Single Shared Workspace** (#162) holding all company knowledge. Department repos under `Docs/`. Personal files in Downloads/Desktop are killed.
3. **Central navigation file** (`CLAUDE.md` / `AGENTS.md` at root) — a *distributor*, not a rules dump. Two-level hierarchy: root → department.
**Success criterion:** Every team lead can answer a cross-department question from their workspace inside 60 seconds.
**Failure mode:** Founder delegates the setup. Don't.

**Phase 1 — Workflows shared across the team**

- Department heads adopt Cursor for personal work.
- They share "aha moments" with their team (~15–30 minutes in every leadership meeting; sometimes a whole meeting).
- Teams build small skills/workflows for themselves — research, prep, summaries.
- Force-function: deprecate the legacy wiki ("4 weeks to migrate; killing the knowledge base was the best admin tool I used"). Rotate one team lead who didn't adopt; replace with a senior who did. "~12 weeks of attention, 2×/week, until the point of no return."
**Success criteria:** −50% Slack/Telegram messages, −15% internal meetings; meeting content shifts from "syncing" to "deciding". Sales-assistant headcount drops by 1; some analysts cut; one salesperson leaves and isn't replaced.
**Spend signal:** AI subscriptions ≈ ~4% of payroll, growing.
**Failure mode:** Stalling at "some power users." Without the deprecation event you stay at 40% adoption forever.

**Phase 2 — Cross-team workflows replace the process**

- An owner (head of analytics / head of CS) writes one big "workflow skill" — a ~200-line markdown file describing the *entire* end-to-end process (e.g., client onboarding) with links to sub-instructions for each step.
- Operator says to agent: "start it" (one word, just go). Agent walks the 200-line plan. When it stalls, the human fixes the workflow file, not their head.
- All learnings flow back into workflow files, not into people's heads or chat history.
- Org effect: Integration team and Product team start working on the same artifacts (the agents). Time to integrate a client: 6 weeks → 2 weeks → 1–2 days.
**Success criterion:** ≥1 end-to-end process has been replaced by a workflow skill running unattended for ≥2 weeks.
**Transition trigger to Phase 3:** Founder realizes ≥2 heads of function are writing prompts that direct their team's daily priorities.

**Phase 3 — AI Overlord (proactive workflow agent directs the team)**

- The head of a function writes a long prompt that *directs the team*.
- A per-project agent runs nightly/regularly, reads everything (correspondence, tasks, transcripts, comments, data), and produces a per-project priority list / dashboard / instructions for human operators.
- People work the prompts instead of dashboards. People are happier (clear priority list, less ambiguity). The head needs less daily discipline to spot the right priorities.
**Success criterion:** A team member's morning ritual is "read what the agent decided is most important today" rather than "open Linear and Slack and try to triage."
**Failure mode:** Framing it as "AI manages humans." Frame it as "AI prioritizes, human decides" — people feel relief, not surveillance.

**Phase 4 — Selling agents**

- "Software used to be a cost-saver. AI software directly makes/saves money — so you can charge as a service provider with success-based pricing." (See #196.)
- Two product flavors:
- **Copilot for the client's team** ($5–15K/mo at reference deployment; lots of small clients): agent connects to client's systems, runs ad-hoc analyses, suggests rules. Human at client still owns.
- **Outsourced agent-driven service** (high prices, success-based): the company takes responsibility for the outcome; 90% of work done by agents, ~1 customer-success person per client.
- Inside structure: layers = data → product → agents → tools → skills → automations.
**Success criterion:** Real paying pilots in either tier.

## Prompts

Self-diagnosis card — fill in honestly, then place yourself:

```
`Foundation:
[ ] Every team lead opens Cursor/Claude Code ≥3×/day for their own work
[ ] Single Shared Workspace exists, every employee is in it
[ ] Root CLAUDE.md/AGENTS.md works as a navigation distributor

Phase 1 signals:
[ ] AI subscriptions ≈ 3–5% of payroll, centralized billing
[ ] Slack/Telegram volume down ≥30% YoY
[ ] At least one role's headcount didn't grow with revenue
[ ] Legacy wiki has been formally killed (not just discouraged)

Phase 2 signals:
[ ] ≥1 end-to-end process has a 100–300-line workflow skill that ships work unattended
[ ] Time-to-integrate (or analog metric) has dropped ≥3×

Phase 3 signals:
[ ] ≥1 head of function has a "directing prompt" that team members work from daily
[ ] People say their mornings are less chaotic, not more surveilled

Phase 4 signals:
[ ] You've packaged an agent service externally (copilot or outsourced)
[ ] At least one paying pilot exists

You are in the lowest-numbered phase where any signal is unchecked.
`
```

Phase-by-phase rate-limiting question to ask weekly:

```
`Phase 0: "Have I personally solved a real work task with Cursor this week?"
Phase 1: "Did I move one important file out of Notion/Slack/Drive into the workspace?"
Phase 2: "Did I extend the workflow file when the agent stalled, or did I do the work manually?"
Phase 3: "Did the team work from the directing prompt today, or from Linear?"
Phase 4: "Do I have a customer paying for an outcome, not a seat?"
`
```

## Gotchas

- **Don't claim Phase 3 with Phase 1 infrastructure.** Most companies that say "we have AI agents directing the team" actually have one prompt that runs nightly and is mostly ignored. That's Phase 2 attempted poorly. Fix the workflow files first.
- **The 4% rule.** AI subscription spend ≈ 4% of payroll at maturity; budget 5–10% for next year. Below 1% you're under-investing; above 8% without phase-aligned ROI you're overspending without process gains.
- **80–90% of new-hire success has nothing to do with AI skills.** Speed, judgment, domain fit, team match. AI skills are picked up in ~8 weeks if the person isn't resistant.

## Tools

- Honest self-assessment; ideally one outside reviewer
- Diagnostic methodology (#176) helps anchor Phase 0/1 baselines
- Shared Workspace (#162) is the Phase-0/1 substrate
