---
id: A-008
tier: A
category: "Sales & outbound"
kind: workflow
title: "Risk-of-churn case worker embedded in the CRM"
subtitle: "Clients say \"I'm thinking of leaving\" on calls and nobody acts. Now a case lands on their card within hours."
source: https://www.cybos.ai/cases/A-008
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "account-management lead · retention team · head of CS"
type: case
version: v0.1
---
# Risk-of-churn case worker embedded in the CRM

> Clients say "I'm thinking of leaving" on calls and nobody acts. Now a case lands on their card within hours.

## What

A pipeline that listens to relationship-manager calls, classifies them for churn signals (especially explicit withdrawal intent), and **opens a case directly inside the existing CRM** — tied to the client card the relationship manager already works in — for the manager to action. Not a separate dashboard, not a separate tool, not a separate inbox. The case is a row on the existing client record, with a transcript snippet, an extracted churn signal, a recommended next action, and an escalation rule for the largest accounts (an automatic three-party meeting trigger for clients above a threshold AUM).

## Why it matters

The single highest-leverage embedded-AI case in the corpus. A large wealth-management firm reported Q1 2026 outcomes: **billions in AUM retained**, including a significant share from clients who had explicitly stated an intent to withdraw on a recorded call; **201 cases in work, 82 resolved**; **hundreds of millions in incremental inflow** on the resolved cases. The principle the team explicitly highlights as "principle #1" of their AI playbook is that this works **because it is embedded in the CRM, not because it is a separate dashboard**. Operators look at the cases on the same client card they already open every morning; they don't have to discover, learn, or remember to check anything new.

## End-to-end

1. **Foundation: call transcription at scale.** This case sits on top of the transcription-foundation case (cf. [#19+#72]). Without 100% transcription coverage of relationship-manager calls, you can't classify for churn signals; you have a sampling problem. The same wealth firm runs 100K+/month transcriptions on a region-appropriate ASR.
2. **Churn-signal classifier.** Per-call LLM pass (Sonnet-class) that emits: `{ churn_risk: low | medium | high | explicit_withdraw, signal_phrase: "<verbatim quote>", topic: <product / fees / service / market_view / personal>, recommended_action: <one of N>, evidence_offset: <seconds into call> }`. The prompt is short — 10–15 lines — but the rubric is sharp: "explicit_withdraw" is reserved for verbatim phrases like "I'm thinking about moving my money" or "we want to close the account"; "high" is reserved for compound signals (complaint + competitor reference + sustained negative tone); "medium" requires two distinct dissatisfaction markers; "low" is everything else.
3. **Voice-of-client extraction (in parallel).** Same call also gets a topic classification — what did the client actually want to talk about? Aggregated weekly into a Voice-of-Client report that surfaces the top 10 topics by frequency and by total AUM-at-risk, routed to product/ops/legal owners.
4. **Auto-create the case inside the CRM.** Not a webhook to a dashboard; not a Slack message. An API call against the CRM that creates a case object on the client's record, with: `severity`, `signal_phrase`, `evidence_link` (deep link to the minute of the recording), `recommended_action`, `assigned_to` (the client's relationship manager), `due_by` (24h for `high`, 1h for `explicit_withdraw`).
5. **Escalation rule for the largest accounts.** If the client's AUM is above a high-value threshold (the firm uses a nine-figure cutoff), the case auto-triggers a three-party meeting — relationship manager + their direct manager + a retention specialist — and a notification fires to all three. Below the threshold, the case stays in the relationship manager's queue.
6. **Resolution flow with audit trail.** The relationship manager opens the case, plays the deep-linked clip, takes the recommended action (or overrides), logs the outcome (resolved / further escalation / lost). Every state transition is logged with the AUM impact. The Q1 numbers above come directly from this audit trail.
7. **Manager dashboard for the head of retention.** Open cases, time-in-state distribution, resolution rate by manager, AUM-at-risk by topic. This is the *only* standalone dashboard in the entire pipeline — and it lives in the existing CRM's manager view, not as a separate tool.
8. **Weekly review tied to product.** The top Voice-of-Client topics get routed to the relevant product/ops/legal owner for upstream fixes — same upstream-deflection pattern as the QA side of case [#19+#72]. A pattern of "fees" complaints triggers a fees-review project; a pattern of "service" triggers a process review.

## Prompts

Churn-signal classifier prompt (short, sharp, the hard part is rubric calibration):

```
`Score this relationship-manager call for churn risk.

Output JSON exactly:
{
 "churn_risk": "low" | "medium" | "high" | "explicit_withdraw",
 "signal_phrase": "<verbatim quote that drove the score, or null>",
 "topic": "product" | "fees" | "service" | "market_view" | "personal",
 "recommended_action": <one of: schedule_followup, escalate_to_manager,
 three_party_meeting, fee_review, product_pitch,
 no_action>,
 "evidence_offset_s": <seconds into call where signal occurs, or null>
}

Rubric:
 - explicit_withdraw: verbatim "I'm moving", "I want to close", "transferring out".
 - high: 2+ compound signals (complaint + competitor + sustained negative).
 - medium: 2+ distinct dissatisfaction markers.
 - low: everything else.

Bias toward false negatives over false positives at the explicit_withdraw level
(false positives trigger a three-party meeting; respect operator attention).
`
```

Case-creation payload (the embedded principle in action — note that this goes into the CRM's existing case object, not a new system):

```
`POST /crm/clients/<client_id>/cases
{
 "type": "retention_risk",
 "severity": "<churn_risk from classifier>",
 "title": "<topic>: <signal_phrase first 60 chars>",
 "body_md": <pre-rendered case card with signal quote, recommended action, deep link>,
 "assigned_to": <client's primary relationship manager>,
 "due_by": <24h for high, 1h for explicit_withdraw>,
 "auto_escalate": <true if client.aum_rub >= 200_000_000>,
 "evidence_url": <deep link to the minute of the recording>,
 "source": "ai_churn_classifier_v2"
}
`
```

Escalation rule (deterministic, lives in code not prompt):

```
`if case.severity == "explicit_withdraw" or client.aum_rub >= 200_000_000:
 schedule_three_party_meeting(
 attendees=[manager, manager.lead, retention_specialist],
 within_hours=24 if case.severity == "explicit_withdraw" else 72,
 context=case.id
 )
`
```

## Gotchas

- **Build it as a case in the CRM, not as a dashboard.** This is "principle #1: embedding > standalone." A standalone dashboard rots within weeks because nobody routes to it; a case on the client card the manager opens every morning gets worked. Same engine, opposite outcomes.
- **Don't auto-escalate small accounts.** The AUM threshold isn't optional. A three-party meeting for a small-balance account wastes more attention than the account is worth. The threshold is part of the design, not a tuning afterthought.
- **The classifier's hard call is `explicit_withdraw`.** Calibrate this on 100+ real calls before going live. False positives waste retention-specialist attention; false negatives lose AUM. Bias toward false negatives at this severity level.
- **Don't try to do this without a relationship-manager role that owns retention.** "Without a business owner, it dies" is principle #3 of the same playbook. The retention lead must own the resolution-rate metric and have authority to escalate.
- **Don't measure model quality; measure financial increment.** The team explicitly: "measure not model quality but financial increment vs. the best non-AI alternative." Hundreds of millions of incremental inflow is the metric that matters; classifier F1 is plumbing.

## Tools

- ASR foundation (cf. case [#19+#72])
- Existing CRM with an API for case creation (Salesforce / HubSpot / an internal CRM — almost any will do)
- LLM runtime (Sonnet-class for classification)
- A small data join: client AUM (or equivalent value metric) joined to the call → case routing
- The retention team's commitment to actually work the cases (this is a human-discipline problem more than an AI problem)
