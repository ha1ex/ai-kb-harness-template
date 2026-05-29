---
id: A-016
tier: A
category: "Customer success"
kind: workflow
title: "AI Overlord — proactive workflow agent directing the team"
subtitle: "CS managers don't know what to focus on this morning. An agent ranks 3-5 actions per client using a prompt the head of CS edits."
source: https://www.cybos.ai/cases/A-016
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "head of customer success · head of any function with portfolio-style work"
type: case
version: v0.1
---
# AI Overlord — proactive workflow agent directing the team

> CS managers don't know what to focus on this morning. An agent ranks 3-5 actions per client using a prompt the head of CS edits.

## What

A scheduled agent that reads each project's full state (per the status dashboard, case #68) and produces, per project, a specific instruction list for the human operator: what to focus on this week, what to push the client on, what value to deliver next, in what order. Replaces the manager's discipline of "noticing the right thing" — the directing prompt is tuned by the head of function. Operators work the priority list instead of dashboards. The head changes company priorities by changing one prompt.

## Why it matters

The bottleneck at the head-of-function level is not generating dashboards (case #68 did that) — it is the daily discipline of looking at the dashboards and saying to the right person "this account, push on integration; that account, prepare a churn-save call." The Overlord makes the prioritisation explicit and machine-runnable: org-wide priority changes propagate from one prompt edit to twenty operators overnight.

## End-to-end

1. **Pre-requisite: the per-project status dashboard (case #68) must be running and trusted.** The Overlord's quality is bounded by the dashboard's accuracy. Don't deploy on top of a flaky dashboard.
2. **The head of function writes the directing prompt.** This is the work. The prompt encodes the function's prioritisation philosophy as evaluable criteria. Below is a reference structure synthesised from the decision-criteria described in the source corpus (urgency × importance × business value × cost of attention) — the source describes the pattern but does not include a verbatim prompt; flagged as synthesis.
3. **Wire to per-project execution.** For each active client, the agent runs nightly (or on schedule, e.g., 6am local). Inputs: the per-client status card from case #68, the per-client priority list from the prior run (for continuity), the function's directing prompt. Output: an updated per-client priority list of 3–5 actions in rank order with rationale and cited evidence.
4. **Confirmation mode first, autopilot later.** Initial deployment: the human CS manager opens the priority list each morning and confirms (or overrides) each suggestion before acting. After 2–3 weeks of stable agreement, move routine items (e.g., "send X follow-up", "schedule check-in for Y") to autopilot; keep judgement-heavy items (e.g., "push on commercial renegotiation") on confirm.
5. **Aggregation view for the head.** Across all clients, the head gets one rolled-up view: top-N priorities by aggregate business value at risk, plus an outlier list (clients where the agent says "the right thing to do is unclear — head input needed"). The head spends 10 minutes a day on the outlier list; routine throughput happens beneath them.
6. **Prompt tuning loop.** The head edits the directing prompt as the team's behaviour reveals edge cases. Treat the prompt like code: PR review for changes; rollback if a tuning regression appears; comment edge cases inline. The prompt becomes the operating system of the function — over 6–12 months it accumulates institutional judgement that survives staff turnover.
7. **People-first framing in roll-out comms.** Do not ship as "AI manages humans". Frame as "AI helps prioritise, human decides." The same artifact under the wrong frame becomes a surveillance crisis; under the right frame it produces relief.

## Prompts

Directing prompt — synthesised from first principles using the decision-criteria described in the corpus (urgency × importance × business value × cost of attention).

```
`You are the Customer Success Director's deputy.
You direct the human CS manager who owns this account.

Inputs (read in order):
 1. Projects/Status-Projects/Client-{Name}-Status-Card.md
 (current state; status colour; KPIs; open tasks; recent quotes)
 2. Projects/Priorities/Client-{Name}-Priorities-{YYYY-MM-DD}.md
 (yesterday's priority list, for continuity)
 3. Docs/CS/policies.md
 (function-level priorities — what we push on this quarter)
 4. Docs/CS/account-tier.md
 (commercial tier of this account: A / B / C)

Output: Projects/Priorities/Client-{Name}-Priorities-{today}.md

The output is a ranked list of 3-5 actions for the CS manager today.
For each action use this rubric:

 Score = (Urgency × Importance × Business Value) / Cost of Attention
 - Urgency: when does this stop being recoverable? (1 = months away, 5 = today)
 - Importance: impact on the account's renewal probability (1 = cosmetic, 5 = make-or-break)
 - Business Value: revenue at stake if action succeeds (in $; map to 1-5 vs portfolio median)
 - Cost of Attention: hours of CS manager time required (1 = <30 min, 5 = full day)

Required output structure per action:

 Action 1. [imperative verb-phrase, e.g., "Schedule churn-save call with PM"]
 - Why now: [1-2 sentences, cite [REF:] in status card]
 - Score: U=_ × I=_ × V=_ / C=_ = _
 - First step: [the concrete next move — call, email, draft, message]
 - Success signal: [what changes in the status card if this works]

Hard rules:
 - Never recommend an action without citing a [REF:] in the status card.
 - If the status card shows [INSUFFICIENT DATA] on a key field, the top
 recommended action MUST be "fix the data gap" — not a client-facing move.
 - If yesterday's #1 action was not done and is still high-score, repeat it as today's #1
 with a one-line note: "Carried over from {date}. Owner: {name}."
 - If the account is tier-C (commercial), recommend MAX 2 actions for today.
 - Surface an outlier flag at the bottom if you are uncertain about the top action
 — title it "Director input needed: {one-line question}".

Tone: imperative, calm, specific. No hedging. No "consider" or "you might want to".
`
```

Aggregator prompt for the head-of-function morning view:

```
`Read every Client-*-Priorities-{today}.md.
Output Docs/CS/Director-Morning-Brief-{today}.md with:
 - Top 10 priorities across the portfolio, ranked by Score.
 - Outlier flags (one section per "Director input needed" item).
 - Carry-over count: how many priorities are repeats from yesterday (warning if > 3).
 - One-line per-CSM workload summary: who has > 5 actions today.
`
```

## Gotchas

- **Do not deploy on a flaky dashboard.** If #68's status cards are stale or partly hallucinated, the Overlord's priorities will be confidently wrong and the team will lose trust fast. Two weeks of clean status cards before turning on the Overlord.
- **Surveillance framing kills it.** "AI manages humans" → revolt. "AI prioritises, you decide" → relief. Identical artifact, opposite outcome.
- **Don't ship full autopilot at launch.** Two to three weeks in confirm-mode before moving any routine items to autopilot. The trust gradient matters more than the throughput gradient.
- **Don't let the prompt drift uncritically.** Treat changes as code review. Bad prompt edits propagate to twenty operators overnight; rollback discipline is mandatory.

## Tools

- The per-project status dashboard (#68) running and trusted.
- A scheduled execution environment (cron + Claude Code headless, or a workflow runner).
- A version-controlled directing prompt (treat as code).
- A confirmation-mode UI for CSMs in the first 2–3 weeks (any markdown viewer + a "✓ done" tag in the file works).
