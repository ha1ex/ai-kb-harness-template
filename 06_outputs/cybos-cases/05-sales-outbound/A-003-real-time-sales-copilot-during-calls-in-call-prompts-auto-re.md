---
id: A-003
tier: A
category: "Sales & outbound"
kind: workflow
title: "Real-time sales copilot during calls (in-call prompts + auto-recap)"
subtitle: "New reps wait 4 hours for senior answers and miss objections live. Both fixed during the call, not after."
source: https://www.cybos.ai/cases/A-003
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "SDR · AE · head of sales · founder running discovery calls"
type: case
version: v0.1
---
# Real-time sales copilot during calls (in-call prompts + auto-recap)

> New reps wait 4 hours for senior answers and miss objections live. Both fixed during the call, not after.

## What

A live copilot that runs alongside a sales call. It polls the meeting transcription API as the call progresses, watches for opportunities (an unanswered objection, a missed qualification question, a buying signal), and surfaces inline prompts to the rep: a one-line objection counter, a clarifying question to ask next, a relevant proof point from the knowledge base. When the call ends, the recap (with action items, agreed-next-step, CRM-shaped fields) is already drafted. Mature deployments wrap this with four more modules: an always-on knowledge-base bot that answers product questions instantly during the call ("what's our pricing for 1000 seats?"), personalized qualification prompts per prospect, real-time objection handling, and an auto-reply pathway into messenger campaigns.

## Why it matters

Three measurable outcomes from production deployments. (1) **Ramp-up time collapses.** A payments group cites the pre-AI baseline: new sellers wait 4–5 hours for product answers from senior reps, ramp-up runs three months; with the in-call knowledge-base bot, ramp is 2–4 weeks. (2) **Operator throughput improves.** A large wealth-management firm measured operator response speed (the in-call prompter) at **72% → 87%** after the prompter went live. (3) **Coverage of the right qualification turns into conversion lift.** Speech-analytics scoring on the same firm's calls ties specific call-path adherence to Net New Money; tying the in-call prompts to the same rubric pulls late-deal forecast risk forward by weeks.

## End-to-end

1. **Pick a transcription source that streams.** Granola Pro and Krisp expose live-meeting transcript APIs that update as the call runs; Fireflies and TLDV are batch-only (post-call). For the in-call piece you need a streaming source; for the recap piece, batch is fine.
2. **Spin a per-call session.** When the call starts (webhook from the meeting tool, or manual `start` from the rep), open a session keyed by meeting ID. The session has: prospect ID, account context, today's call objective, the rep's active playbook (qualification framework: SPICED / MEDDIC / a custom rubric), and a rolling buffer of the last N transcript chunks.
3. **Poll the transcript every ~5–10 seconds.** Each new chunk gets passed to a lightweight classifier (Haiku or similar) that emits one of: `objection_raised(text)`, `unanswered_question(text)`, `qualification_gap(field)`, `buying_signal(text)`, or `nothing`. The classifier prompt includes the playbook so "buying signal" is grounded in the company's actual definition, not a generic one.
4. **Surface a prompt when warranted.** Each classified event triggers a side-pane card in the rep's UI: short, scannable, with the suggested next sentence and a one-line "why". Cards expire after 60s or on user dismissal. Don't pop modals; respect that the rep is on a live call.
5. **Knowledge-base bot for product questions (the "instant answer" module).** When the transcript contains a question pattern ("can you do X", "what about Y"), the same session can issue a vector + structured lookup against the unified product KB and surface a one-paragraph answer with a citation. The rep paraphrases live; they don't read the screen.
6. **Auto-recap on call end.** Webhook from the meeting tool triggers a Sonnet pass over the full transcript with two prompts: (a) **internal recap for Slack** (≤1200 words, emoji-structured, action-focused, 80% client / 20% us); (b) **CRM record** with the VP-of-sales lens — lead source, next step, ICP fit, engagement level, 3 positive reactions, 3 pain points, 3 objections, Q&A breakdown. Both drop into `Sales Calls/[Client Name] v[NN]/`.
7. **Wire it into the CRM the way the seller already works.** Don't build a separate dashboard. Push the recap fields directly into the CRM record; expose the call-card with a "review and confirm" button; the seller approves with one click. This is the principle that separates copilots people use from copilots they ignore.
8. **Iterate the playbook, not the model.** All the call-path criteria live in a prompt file (the qualification rubric, the objection library, the buying-signal definitions). Sales ops edits the file; engineering doesn't redeploy. Daily iteration cadence on prompts, weekly on code.

## Prompts

Live-chunk classifier system prompt (illustrative; works at production quality after 2–3 iterations on your call corpus):

```
`You watch a live sales call transcript chunk by chunk. After each chunk,
classify it as exactly one of:
 - objection_raised(text) # prospect named a blocker
 - unanswered_question(text) # rep asked a question and the prospect dodged
 - qualification_gap(field) # a required playbook field is still empty
 - buying_signal(text) # explicit purchase-intent phrase
 - nothing

The playbook for THIS team is:
<inject team's qualification framework here, verbatim>

The objection library is:
<inject team's known-objection list with canonical counters>

Output one line of JSON. No commentary.
`
```

Recap dual prompts (the production pattern; verbatim shape from a reference agency's deployment):

```
`PROMPT A — Internal Slack summary (max ~1200 words, emoji-structured):
 Sections: meeting purpose, client overview, tech stack, pain points,
 key discussion points, next steps, action items with owners.
 Rule: 80% of content describes the CLIENT, 20% us. Action-focused.

PROMPT B — CRM record (VP-Sales lens):
 Fields: lead source, next step, contact role, business type,
 ad spend / budget, decision-maker status, ICP fit (against codified
 ICP criteria: <ICP criteria injected verbatim>), engagement level,
 3 positive reactions, 3 pain points, 3 objections, detailed Q&A
 breakdown, presentation flow assessment, call quality.
`
```

Five-module bundle the bigger deployments converge to:

```
`1. AI knowledge-base bot: instant answers vs 4-5h wait
2. Personalized qualification prompts per prospect
3. Real-time objection handling
4. Auto-reply to marketing campaigns via messenger bot
5. Voice robot for scripted outbound calls
`
```

## Gotchas

- **Latency is the feature.** A prompt that surfaces 20 seconds after the moment is worse than no prompt. Budget end-to-end latency (transcript chunk → classifier → side-pane render) at <5 seconds; if you can't hit that, drop to recap-only.
- **Don't pop modals during the call.** Side-pane cards only; no audio, no flashing. The rep is talking to a human.
- **Knowledge base hallucination is the #1 risk.** The bot module must cite a source (KB page ID or section) and refuse to answer when no match is found. If the rep paraphrases a fabricated answer, the deal dies. Reject "best-guess" mode entirely.
- **The recap belongs IN the CRM record, not as a Notion doc the rep has to copy from.** Embedded > standalone. The same firm's principle: "AI lives where the employee already works."
- **The playbook file is the product.** Treat it like prod code — versioned, reviewed, with diffs visible to the whole sales team. The team will trust the copilot only as far as they trust the playbook it's reading from.
- **Don't ship voice agents on revenue-bearing calls without a human in the loop.** Voice is itself a revenue stream in many businesses (one fintech explicitly: 85% of customers prefer voice, and the L1 voice agent must hand off to a human the moment buying signal is detected). Scope voice to informational calls; keep humans on revenue interactions.

## Variations

- **Recap-only (no live).** Drop the streaming-transcript piece; run Fireflies/TLDV batch pipeline only. Easier and still highly valuable; cuts post-call CRM time from ~10 minutes to ~30 seconds of approval.
- **Voice-only outbound robot.** Scripted outbound calls for renewals or qualified-lead callbacks. One deployment automated 8 FTE's worth of outbound this way ($480K/yr avoided). Keep tightly scoped; this is not a discovery-call replacement.
- **Embedded inside an existing sales tool.** If the team already lives in Gong or a similar call-recording platform, build the side-pane against that platform's webhook + transcript API rather than installing a parallel tool. Adoption wins.

## Tools

- Live-streaming transcription source (Granola Pro / Krisp) for the in-call piece
- Batch transcription source (Fireflies / TLDV) for the recap piece
- LLM runtime — Haiku/Sonnet for live classification, Sonnet for recap
- Unified product knowledge base (markdown + vector index) for the KB-bot module
- CRM with an API for the recap write-back
- A side-pane UI for the rep — browser extension or a thin Electron panel works
