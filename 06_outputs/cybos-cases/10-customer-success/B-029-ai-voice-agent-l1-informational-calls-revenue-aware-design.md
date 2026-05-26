---
id: B-029
tier: B
category: "Customer success"
kind: workflow
title: "AI Voice Agent — L1 informational calls (revenue-aware design)"
subtitle: "\"Automate all voice\" cannibalizes upsell revenue (85% prefer voice). Split: AI on L1 informational; humans on revenue calls."
source: https://www.cybos.ai/cases/B-029
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "CS lead · ops lead"
type: case
version: v0.1
---
# AI Voice Agent — L1 informational calls (revenue-aware design)

> "Automate all voice" cannibalizes upsell revenue (85% prefer voice). Split: AI on L1 informational; humans on revenue calls.

## What

An AI voice agent that handles L1 **informational** calls — account balance, product status, "how do I…" — while keeping all **revenue-generating** voice interactions (upsell, retention, complex troubleshooting) on human agents. The split is the design — not an afterthought. Targets the 14K-voice-calls/month range where 70% of contacts are voice but only a subset is monetized.

## Why it matters

Naïve "automate all voice" deployments cannibalize revenue. A payments group had to flag this explicitly: "voice itself is a revenue stream — 85% of merchants prefer voice, especially for upsell". Correct design splits informational L1 (AI) from revenue interactions (human) and routes accordingly. At 14K voice/month with 40% informational, this is roughly mid-six-figures USD-equivalent annually in deflection while protecting upsell.

## End-to-end

1. Audit the last 1,000 voice calls — classify each as **informational** vs **revenue-generating** vs **complex troubleshooting**.
2. Pick the 5–8 highest-volume informational categories — these are AI candidates.
3. Stand up the voice agent (Whisper or Deepgram ASR + LLM + TTS) on a separate phone tree branch.
4. Route by intent classification at call open — informational → AI; anything revenue-adjacent → human.
5. Hard rule: AI must escalate on first mention of "cancel", "downgrade", "buy more", "complaint" — these are revenue interactions even if they start as a question.
6. Measure CSAT + revenue retention separately. CSAT shouldn't drop; revenue must not drop.
7. Expand intent coverage only after both metrics are stable for 4+ weeks.

## Gotchas

- The "automate voice" trap is real — measure revenue impact, not just deflection rate. Most large players lose 3–8% upsell when they fail to carve out revenue calls. Run a 4-week A/B before rolling out wide.

<hr/>

## Tools

- ASR (Whisper / Deepgram); LLM; TTS (ElevenLabs / Azure)
- Phone-tree platform (Twilio / Mango / Asterisk)
- Intent classifier + escalation rules
