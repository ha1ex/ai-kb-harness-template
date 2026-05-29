---
id: A-023
tier: A
category: "Operations"
kind: pattern
title: "Voice transcription + categorisation foundation"
subtitle: "Every voice-AI case (QA, churn signals, copilots) breaks without a transcript layer underneath. This is the layer."
source: https://www.cybos.ai/cases/A-023
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "Ops lead · CS lead · engineering lead"
type: case
version: v0.1
---
# Voice transcription + categorisation foundation

> Every voice-AI case (QA, churn signals, copilots) breaks without a transcript layer underneath. This is the layer.

## What

Captures every phone call, sales call, support call, and internal meeting as text, then classifies each transcript on a small set of operational axes (call type, sentiment, complexity, theme, named entities, action items). The transcript store and its classifications become a shared substrate that downstream agents reuse for QA scoring, in-call prompters, retention case workers, training simulators, and "voice of customer" rollups — none of which work without it.

## Why it matters

At a wealth-management firm running 100K+ transcriptions/month, this foundation moved random-sample call QA from 1–3% coverage toward 100%, and is what unlocked a churn-risk case worker that retained billions in AUM in a single quarter plus hundreds of millions in incremental inflow on 82 resolved cases. At a large fintech, the same foundation is what makes Support Agent Copilot (worth a low-seven-figures USD-equivalent annually by freeing 20–35 of 69 CS FTE) and Sales Speech Analytics (+10–15% conversion) buildable. Every other voice-centric AI initiative depends on it.

## End-to-end

1. **Pick the ASR engine first, by language and stack.** For English/multi-language teams, the live trade-off in early 2026 is between Whisper (cheapest, runs locally), Deepgram (best latency for streaming), AssemblyAI (best speaker diarisation + topic tagging out of the box). For non-English call centres, region-specific local ASR is often the production benchmark. Budget around $0.005–$0.02 per minute depending on tier and diarisation.
2. **Wire capture into the systems calls actually live in.** Three sources usually: telephony (Mango Office / Twilio / your VoIP), video meetings (Zoom / Google Meet via a notetaker — Granola / Krisp / Fireflies), and ad-hoc voice memos (Wispr Flow / SuperWhisper into a dropbox folder).
3. **Land transcripts in one canonical folder, naming convention enforced.** Filename pattern: `{transcript} {channel} {client-or-internal} – yyyy-mm-dd.md`. Avoid sub-folders by client at first — flat is faster to search; convention does the lookup.
4. **Run a small classification pass on every new transcript.** Fields: `call_type` (sales / support / internal / partnership), `sentiment` (1–5 plus dominant emotion), `complexity` (L1 / L2 / L3 / escalation), `themes` (multi-select from your taxonomy), `named_entities` (clients, products, competitors mentioned), `action_items` (verbatim list). Use Haiku-class for cost; one call per transcript.
5. **Expose the store via two interfaces.** (a) A filesystem view that any agent can grep; (b) a thin REST endpoint that returns the latest N transcripts plus their classifications for a given client, salesperson, or theme. The store becomes a building block, not a destination.
6. **Schedule it.** A cron job pulls new transcripts every 15 minutes from each notetaker / VoIP source, runs classification, commits to git. People open their workspace in the morning and the index is current (see #88).
7. **Add downstream features one at a time.** Order them by ROI: QA scoring → real-time prompter → retention case worker → neuro-trainer → voice-of-customer rollup.

## Prompts

System prompt for the per-call classifier (Haiku):

```
`You classify a single call transcript. Output strict JSON, no prose.

Schema:
{
 "call_type": "sales" | "support" | "internal" | "partnership",
 "sentiment_score": 1-5,
 "dominant_emotion": "calm" | "frustrated" | "excited" | "confused" | "angry" | "neutral",
 "complexity": "L1" | "L2" | "L3" | "escalation",
 "themes": [list of strings from THEMES below],
 "named_entities": {"clients": [...], "products": [...], "competitors": [...], "people": [...]},
 "action_items": [verbatim quotes of commitments, ≤10 items],
 "churn_signals": [verbatim quotes signalling intent to leave / dissatisfaction],
 "key_quote": "one verbatim sentence that best summarises the call"
}

THEMES: <your 12–20 topic taxonomy here>

Rules: never paraphrase action_items or churn_signals — verbatim quotes only. If a field is empty, return [] or null. No commentary.
`
```

Cron entry (every 15 minutes, headless Claude Code):

```
`*/15 * * * * cd /opt/workspace && claude -p "Run the transcript-ingest skill: pull new calls from Granola, Mango, and Fireflies; classify each; commit to transcripts/ with naming convention" --allowedTools Bash --max-turns 30 >> logs/transcript.log 2>&1
`
```

## Gotchas

- **Don't summarise on ingest.** Summaries born without context are worse than the raw transcript. Save raw + classifications; summarise on demand against the relevant query.
- **Don't dump full transcripts into every downstream prompt.** Pre-extract durable entities (decision-makers, agreements, deal stage) into separate per-entity files; downstream agents read entities, not raw text.
- **Voice is sometimes a revenue stream.** Before automating an L1 voice line, check the unit economics. In one wealth-management deployment 85% of clients preferred voice and inbound calls were a revenue channel — automating them indiscriminately would have hurt growth.
- **Diarisation matters.** Without per-speaker labels the classifier mis-attributes complaints. Use Krisp DNA / Deepgram diarisation; tag speakers once and let them propagate.
- **Mind PII.** Anonymise before sending to any cloud LLM if you're in a regulated industry; or use a local model for classification and only let the redacted summary leave the building.

## Variations

- **Lighter:** Start with one notetaker (e.g. Granola only) and a single classifier; skip the cron — manual run after the day's calls.
- **Heavier:** On-prem ASR + locally-hosted classifier for regulated industries; add per-speaker fingerprinting so role files (#41) get auto-populated.
- **Vertical:** Wealth management — add a "withdrawal-intent" boolean as a top-level field and a 200M-AUM escalation rule for the CRM case worker.

## Tools

- ASR engine — Whisper / Deepgram / AssemblyAI / a region-specific local ASR
- Notetaker for video calls — Granola / Krisp / Fireflies
- A shared workspace with a `transcripts/` folder under git
- Haiku-class LLM for classification
- Cron host with the agent CLI installed
