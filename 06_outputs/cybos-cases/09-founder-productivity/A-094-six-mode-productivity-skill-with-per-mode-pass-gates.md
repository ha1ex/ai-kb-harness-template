---
id: A-094
tier: A
category: "Founder productivity"
kind: framework
title: "Six-mode productivity skill with per-mode pass-gates"
subtitle: "Problem solved: AI productivity assistants produce aspirational plans, agendaless meetings, and activity-based status updates; a mode-router with an explicit exit gate per mode prevents each of those failures."
source: https://www.cybos.ai/cases/A-094
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder running daily/weekly planning · manager running standups/retros · ops lead auditing meeting cost · OKR owner · chief of staff producing executive updates"
type: case
version: v0.1
---
# Six-mode productivity skill with per-mode pass-gates

> Problem solved: AI productivity assistants produce aspirational plans, agendaless meetings, and activity-based status updates; a mode-router with an explicit exit gate per mode prevents each of those failures.

## What

A mode-router that classifies a request into one of six modes — TASK / PLAN / MEETING / STATUS / REVIEW / GOAL — loads the matching internal reference for that mode plus a productivity-failure-modes guard, and runs the work through an explicit gate the agent cannot pass without satisfying. The gates are the marquee feature: every task needs an action verb + completion condition + time estimate; every daily plan must reconcile against the actual calendar (not aspirational free time) with deep-work blocks ≥ 90 minutes and total planned work ≤ 80% of available hours; every meeting needs a stated purpose that *couldn't* be achieved async; every status update is framed as outcomes, not activities, with a named owner and deadline on each ask.

## Why it matters

Generic AI productivity output is plausible and useless — it explains a framework instead of applying it, and it plans against time the operator does not actually have. The gates convert that into something an operator can act on. Two artifacts from the skill body travel well on their own:

- **Meeting cost in dollars.** "A weekly 1-hour meeting with 8 people at $75/hr = **$31,200/year**." Surfacing this number is what turns "should we keep this meeting" from opinion into arithmetic.
- **The Top-3 rule:** *more than 3 priorities = zero priorities.* The canonical priority filter is "if only these 3 things got done, would today feel successful?"

The skill also targets a measurable **40% deep-work-to-reactive ratio** and rejects "aspirational free time" outright (total planned work ≤ available hours − 20%, because unplanned work always appears).

## End-to-end

1. **Route the request.** Classify into one mode via the signal-phrase table: "decompose work" → TASK, "plan my day" → PLAN, "meeting agenda" → MEETING, "weekly update" → STATUS, "retro" → REVIEW, "quarterly OKRs" → GOAL.
2. **TASK mode.** Decompose using vertical slicing (good: "User can upload a CSV and see a preview" — shippable alone; weak: "Build the upload API" — needs UI to deliver value). Estimate with the 1/2/4-hour bucket system; anything > 4h gets decomposed. Prioritize with the right framework for context — Eisenhower for personal daily, ICE for backlog ranking, Weighted Scoring for team sprint planning. Batch by context (context-switching costs 15–25 minutes per switch).
3. **PLAN mode.** Gather constraints (calendar commitments, hard deadlines, energy level, carryover). Pick the Top 3 outcomes (more than 3 = zero). Map to time blocks (deep work 90–120 min on peak-energy hours; reactive work 30–60 min batches in low-energy hours; admin 30 min end of day; 15-min buffers). Flag conflicts where meetings fragment deep work. Output a concrete time-blocked plan with the Top 3 highlighted.
4. **MEETING mode.** Audit with the 5P framework (Purpose, Participants, Preparation, Process, Payoff) and compute the dollar cost (participants × hourly rate × duration × frequency). Design the new agenda so every item carries Type (Decision / Discussion / Information / Brainstorm) + Owner + Time + Pre-read + Outcome. Convert to async via the decision tree (doc-with-comments will do? do that; need a one-person decision? 1-page memo with a deadline).
5. **STATUS mode.** Detect audience and frame accordingly (see config below). Frame everything as outcomes ("Shipped search indexing, 40% faster queries") not activities ("worked on search"). Every problem gets a specific ask with a named owner and deadline.
6. **REVIEW mode.** Compare planned vs actual; classify each incomplete item as deferred-still-relevant (reschedule) / deferred-no-longer-relevant (remove) / blocked (name the unblock action + owner) / abandoned (archive with reason). Reflect on patterns (what type of work keeps slipping; where unplanned work enters; the deep-work ratio vs the 40% target). Decide 1–3 specific testable adjustments ("Block 9–11am as no-meeting time" — not "do more deep work").
7. **GOAL mode.** Set goals on the outcome hierarchy (Vision 1–3 yrs → Objective quarterly → Key Result quarterly measurable → Initiative weeks concrete). Validate each for measurability, influence (you control it vs hope), tension (conflict with another goal), and stretch calibration (70% confidence = good stretch; 100% = sandbagging; 30% = wish). Connect to this week's tasks — goals that don't connect are intentions, not goals.
8. **Always apply the failure-mode guard.** Each mode loads an internal reference that blocks the common failures: aspirational planning, unestimated tasks, generic advice, agendaless meetings, shallow reviews (just a task list), activity-based status, and explaining a framework instead of applying it to the specific situation.

## Prompts

STATUS-mode audience routing table, verbatim:

```
`Audience | Frame | Length | Lead With
Manager (1:1) | Progress + blockers + asks | 3-5 bullets | What you need from them
Team (standup)| Yesterday/Today/Blockers | 60 seconds spoken | Blockers first
Stakeholders | Outcomes + timeline + risks | 1 page | Business impact
Executives | Red/Yellow/Green + decisions needed| < 200 words | Decisions needed
`
```

PLAN-mode time-block template, verbatim:

```
`Block Type | When to Schedule | Duration
Deep work (creation, analysis) | Peak energy hours (usually morning) | 90-120 min
Reactive work (email, Slack, reviews)| Low energy hours (usually post-lunch)| 30-60 min batches
Admin/maintenance | End of day | 30 min
Buffer | Between blocks | 15 min minimum
`
```

## Gotchas

- **The gate is the point.** Each mode has an exit gate the agent cannot pass without satisfying it. Removing or softening the gates collapses the skill back into generic advice.
- **Framework explanation instead of application** is the single most common failure flagged — the skill blocks producing a description of Eisenhower/ICE/OKR instead of applying it to the user's actual list.
- **Aspirational free time is explicitly rejected.** "Total planned work ≤ available hours − 20%" — plans that fill 100% of nominal hours always fail because unplanned work appears.
- **Shallow reviews** (a list of what didn't get done, no pattern analysis, no testable adjustment) fail the REVIEW gate.

<hr/>

## Tools

- Install: `git clone https://github.com/notque/vexjoy-agent.git ~/vexjoy-agent && cd ~/vexjoy-agent &&./install.sh --symlink` (symlinks into `~/.claude/`, `~/.codex/`, `~/.gemini/`, `~/.factory/` — works in Claude Code `/do`, Codex `$do`, Gemini CLI `/do`, Factory `/do`)
- The skill is user-invocable for daily/weekly planning rituals
- Internal mode references and the productivity-failure-modes catalog ship inside the repo — loaded automatically per mode, nothing to author
