---
id: A-006
tier: A
category: "Sales & outbound"
kind: workflow
title: "Call scoring (sales + QA): same engine, two consumers"
subtitle: "Managers listen to 5 of 200 calls per rep per month. This scores all 200, in both sales and support flavours."
source: https://www.cybos.ai/cases/A-006
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "head of sales · sales-enablement lead · head of CS · QA lead"
type: case
version: v0.1
---
# Call scoring (sales + QA): same engine, two consumers

> Managers listen to 5 of 200 calls per rep per month. This scores all 200, in both sales and support flavours.

## What

A single transcription-and-scoring engine that scores 100% of calls against a checklist, producing two distinct artifacts for two distinct consumers. For **sales**: per-call score + specific feedback to the seller ("you didn't ask about volume"), seller-level ranking on the leaderboard, automatic extraction of best-practice patterns from top-performers. For **QA**: per-call score against the support rubric (script adherence, tone, accuracy, resolution), automatic identification of repeat-issue patterns, weekly action review tied to upstream owners. One ASR pipeline, one scoring runtime, one transcript store; two prompt files, two dashboards.

## Why it matters

Two compounding ROI levers, both quantified in production deployments. **Sales side**: tying call-path adherence to revenue. A fintech projected **+10–15% conversion** from speech-analytics scoring + targeted coaching, sized at +58–87 sales/mo × ~$200 ≈ several million dollars/year on a 150-seller team. Build cost: ~$50K, payback inside a quarter. **QA side**: replacing a 5-calls-per-agent-per-month random sample (which covers ~2.5% of total calls) with AI scoring 100% of calls. Projected **−15–20% repeat tickets** = several hundred thousand dollars/year, plus the freed time of 6 QA auditors. A large wealth-management firm runs 100K+ transcriptions/month on the same foundation and uses it to power the in-call prompter (which separately measures 72% → 87% operator speed).

## End-to-end

1. **Transcription foundation.** This is the load-bearing infra. ASR pipeline over the existing call-recording system (a sales-call-recording platform like the one widely used, plus a phone vendor's API). Whisper or a region-specific ASR for the target language. Output: time-coded diarized transcripts, stored in a single index. Scale target: 100K+/month is feasible on a single mid-size VM.
2. **Two prompt files, not one engine fork.**

- `sales_scoring.txt` — scores against the sales rubric (greeting, discovery, qualification, objection handling, close, next-step). Output: per-call scores (1–5 per category), one-line specific feedback per category, three top moments, three missed moments.
- `qa_scoring.txt` — scores against the support rubric (script, tone, accuracy, resolution). Output: per-call scores, repeat-issue tag, root-cause classification, upstream-owner suggestion.

1. **One scoring runtime, both prompts.** A small batch worker pulls new transcripts from the index, dispatches both prompts in parallel (Sonnet-class for both), writes results into two tables (`sales_scores`, `qa_scores`) keyed by transcript_id.
2. **Two consumer dashboards.**

- Sales dashboard: per-seller leaderboard, per-category trend, "best-practice patterns" extracted weekly (a Sonnet pass over the top 10% of scored calls produces "phrases that closed" + "patterns that opened the next step").
- QA dashboard: root-cause Pareto, "you have a recurring issue tagged X — owner is engineering team Y" routing, weekly action review with upstream owners.

1. **Tie key phrases to revenue.** This is the leap from "coaching tool" to "growth engine". Join the scoring table to the deal table by call_id. Look for phrases that correlate with Net New Money. Surface the top 5 as "what works on this team's calls" in the sales dashboard. Iterate.
2. **Coaching flow.** Replace the manager's "listen to 5 calls per rep per month" with a manager-side view: "your 3 worst-scored calls this week + the specific category + the 30-second clip". The manager spends 20 minutes instead of 5 hours, and the feedback is grounded.
3. **Upstream deflection on the QA side.** Per the same firm's CS playbook: sampled calls → tag root cause → route to upstream owner → track closure. Weekly action review. Projected **−15–20% avoidable contact** = 4–5 FTE saved on a 69-agent CS team.
4. **Roll out gradually.** Start with one team (one squad, one product line, one geo). Score in shadow for two weeks before showing reps their scores; tune the rubric on real corpus before introducing it as a coaching tool. The rubric is the product; the engine is plumbing.

## Prompts

Sales scoring rubric (canonical six-category structure used in production):

```
`Score this call (1-5 per category, with one-line specific feedback).
Output JSON exactly:

{
 "greeting": {"score": N, "feedback": "..."},
 "discovery": {"score": N, "feedback": "..."},
 "qualification": {"score": N, "feedback": "..."},
 "objection_handling": {"score": N, "feedback": "..."},
 "close": {"score": N, "feedback": "..."},
 "next_step": {"score": N, "feedback": "..."},
 "top_moments": ["verbatim quote 1", "verbatim quote 2", "verbatim quote 3"],
 "missed_moments": ["...", "...", "..."],
 "overall_one_liner": "..."
}

Discovery means: did the rep ask about budget, authority, need, timeline?
Qualification means: did the rep score the prospect against ICP criteria below?

ICP CRITERIA:
<inject your ICP, same block as case [#12]>
`
```

QA scoring rubric (support-side):

```
`Score this support call (1-5 per category):

{
 "script_adherence": {"score": N, "feedback": "..."},
 "tone": {"score": N, "feedback": "..."},
 "accuracy": {"score": N, "feedback": "..."},
 "resolution": {"score": N, "feedback": "..."},
 "repeat_issue_tag": "<single-word tag>",
 "root_cause": "process | knowledge | product | training | other",
 "upstream_owner_guess": "<team or owner>",
 "one_liner": "..."
}
`
```

Best-practice extraction pass (weekly cron over the top-scoring calls):

```
`You are reviewing the 10 highest-scoring sales calls of this week
on the [team / product / geo].
Extract:
 - 5 phrases that opened qualification well (verbatim)
 - 5 phrases that handled objections well (verbatim)
 - 5 phrases that secured a next-step (verbatim)

Output as markdown for posting to the sales channel.
`
```

## Gotchas

- **Don't ship the score to the rep before the rubric is calibrated.** Two weeks of shadow scoring; tune the rubric on at least 200 calls; only then turn on the seller-facing dashboard. Reps lose trust in 24 hours if a poorly-tuned rubric tells them they're failing on something they actually did.
- **Score 100% or score nothing.** A "we score 10% of calls" middle state combines the cost of building the pipeline with the trust problem of "why did you sample mine and not his?". The whole point is universal coverage.
- **The rubric is the product.** Sales ops + sales managers must own and version the rubric file. Engineering owns the runtime. If engineering owns the rubric, it stops getting iterated and the scores drift from reality.
- **Don't use the QA score as a salary input for support agents.** Use it as a coaching input + a root-cause-routing tool. Tying the score to compensation creates incentives to game the rubric and destroys the upstream-deflection flywheel.
- **Don't pretend voice automation is free.** Voice calls are often a revenue stream in their own right (one fintech: "85% of customers prefer voice"). The scoring engine works fine; just don't replace the human on revenue-bearing calls. Scope automation to L1 informational + post-call coaching.
- **Repeat-issue tags drift if you don't review them.** Weekly action review with the QA lead is mandatory. Without it the tag set explodes from 20 useful labels to 200 noise labels and the Pareto chart becomes useless.

## Variations

- **Sales-only first.** Most teams should start here. Ship the sales rubric on a 5–20 seller pilot; expand once the conversion lift is measurable.
- **QA-only first.** Support-led companies (especially in regulated industries) often go this way for compliance reasons; tie root causes to product/eng tickets via the upstream-deflection loop.
- **Single-language vs multi-language.** Whisper handles 80+ languages; for many non-English markets, a region-specific local ASR is the gold standard. A multi-market deployment runs different ASR per region but the same scoring runtime and the same rubric.
- **Lighter (no live dashboard).** Run weekly cron over last week's calls; post the top/bottom per seller to a private channel; skip the dashboard entirely. Works at <50 sellers.

## Tools

- ASR pipeline: Whisper / Deepgram / a region-specific ASR for the target language; a phone vendor's API for call audio
- Storage: a single table or column store for transcripts; PostgreSQL + S3 (or ClickHouse for high-volume) for scores
- LLM runtime: Sonnet-class for scoring; Opus optional for weekly best-practice extraction
- Two dashboards: a thin internal app for sales and another for QA, or two views over the same table
- The shared workspace foundation if you want managers' coaching workflow to live in Cursor/Claude Code alongside everything else
