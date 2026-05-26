---
id: B-006
tier: B
category: "Sales & outbound"
kind: workflow
title: "Reply-back generator grounded in conversation history + voice doc"
subtitle: "Operators spend 30 minutes writing each reply. Generator drafts in the founder's voice; operator approves in 2 minutes."
source: https://www.cybos.ai/cases/B-006
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "SDR · founder running cold outbound · account manager"
type: case
version: v0.1
---
# Reply-back generator grounded in conversation history + voice doc

> Operators spend 30 minutes writing each reply. Generator drafts in the founder's voice; operator approves in 2 minutes.

## What

When an inbound reply hits an outbound thread, the generator skips hook extraction and instead loads (a) the entire thread oldest→newest and (b) a single `voice_doc.md` with canonical Q&A pairs, identity facts, banned phrases, and 3–5 worked examples. The LLM maps the latest inbound to a canonical intent ("what's the timeline?", "send a deck?", "we're not raising") and restates the matching answer in voice, anchored on what the founder actually said.

## Why it matters

Reply latency drops from ~30 min per reply (operator writes from scratch) to ~2 min (operator approves draft). Voice stays consistent across teammates, so a prospect can't tell that three different operators have been replying.

## End-to-end

1. Write `voice_doc.md`: canonical Q&A pairs, identity facts, voice rules, banned phrases, NEVER-do list, 3–5 example threads.
2. Build a per-target conversation log table (every email in + out, timestamped).
3. On inbound, assemble prompt: `OUTPUT FORMAT OVERRIDE (REPLY)` block + `REPLY CONTEXT DOC` (voice_doc.md) + `FOUNDER CONVERSATION SO FAR` (oldest→newest) + `LATEST INBOUND` + free-form operator notes.
4. Generate with the same Opus-writer + regex banned-word validator + Sonnet fact-checker stack used for cold sends.
5. Operator approves or edits in one click; send through whatever outbox the cold stack already uses.

## Gotchas

- Voice doc maintenance is real work — every time the offer or terms change, the doc must change. A stale doc will confidently quote a deadline that no longer exists.

<hr/>

## Tools

- Claude (Opus for write, Sonnet for fact-check)
- Conversation log table (SQLite is fine)
- `voice_doc.md` checked into the repo so changes are reviewable
