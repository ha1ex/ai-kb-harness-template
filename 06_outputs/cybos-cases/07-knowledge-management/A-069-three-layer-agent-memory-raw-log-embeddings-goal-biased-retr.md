---
id: A-069
tier: A
category: "Knowledge management"
kind: framework
title: "Three-layer agent memory — raw log + embeddings + goal-biased retrieval"
subtitle: "Problem solved: Stateless agents lose every conversation on context compaction; a three-layer memory architecture gives bots persistent identity, recallable history, and goal-aware retrieval."
source: https://www.cybos.ai/cases/A-069
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "founder · engineering lead · CTO of an AI-native team"
type: case
version: v0.1
---
# Three-layer agent memory — raw log + embeddings + goal-biased retrieval

> Problem solved: Stateless agents lose every conversation on context compaction; a three-layer memory architecture gives bots persistent identity, recallable history, and goal-aware retrieval.

## What

Patch the agent harness's message lifecycle to emit `message:received` and `message:sent` events, then stack three layers on top: **(L1)** an append-only jsonl raw log per chat per day, **(L2)** vector embeddings over the log with hybrid 70/30 BM25 + vector search, **(L3)** goal-biased retrieval where the bot first classifies the query (technical / recall / plan / reflect) and routes to the appropriate source. A nightly cron applies multiple "lenses" to the raw log to extract goals, roles, important facts, and weekly synthesis. Three time lenses run at different cadences — immediate (<24 h), weekly, strategic (>1 month).

## Why it matters

Quote from one engineering lead: *"without this patch the agent doesn't know about messages outside the agent — they exist only in the current session context and disappear at compaction."* The architecture converts a stateless bot into a persistent one — capable of recovering identity after every session restart. Reported production deployments include 2,657 vectors embedded for one personal bot and a richer variant with ~900 nodes and ~3,100 edges in a temporal knowledge graph for a different agent.

## End-to-end

1. **Patch the harness's message lifecycle.** For OpenClaw, this means modifying its Telegram handler to fire `message:received` before the agent processes input and `message:sent` after it dispatches output. Without these hooks, messages live only in the session context and vanish on compaction.
2. **Layer 1 — raw jsonl log.** Each event appends to `raw/<channel>/<chat_id>/<year>/<month>/<day>.jsonl`. This is canonical truth — no transformations, no filtering. Survives any downstream layer collapse.
3. **Layer 2 — vector embeddings with hybrid search.** Chunk raw events; embed with Gemini embeddings (or equivalent); store in sqlite, duckdb, or a managed vector store. Search hybrid: ~70% vector similarity + ~30% BM25 keyword. Hybrid weights are tunable; this 70/30 split is the working default in source.
4. **Layer 3 — goal-biased retrieval.** Before answering, classify the query intent: technical / recall / plan / reflect. Each intent routes to a different source mix:

- *"how do I fix this bug?"* → `learnings.md` + raw log
- *"do you remember what we did yesterday?"* → memory_search + raw log
- *"what's the plan for the week?"* → `goals/weekly.md` + `alignment.yaml`

1. **Time-lens nightly cron.** Three cadences write distilled outputs at different intervals — *immediate* (before context compression, runs frequently), *weekly* (synthesis cron), *strategic* (Sundays). The cron applies multiple agent personalities ("lenses") to the same raw log to extract different views: goals, roles user is playing, facts to remember, weekly summary, strategic alignment.
2. **Curated long-term file.** One bot keeps a single `MEMORY.md` under 5K characters that loads into every main session — the bot's curated identity. Pair with `SOUL.md` (personality), `USER.md` (user profile), `TOOLS.md` (env config) as flat-file companions.
3. **Optional Layer 3+ — temporal knowledge graph.** A more ambitious variant uses Graphiti + Neo4j on top of layers 1–2 to extract entities and relationships *with timestamps* — tracking *when* facts were true, not just *what*. Auto-ingests new sessions hourly. Pairs with Vertex AI RAG corpus synced every 6 h. Useful when "when did this become true" matters.
4. **Discipline: write-as-you-go.** Append after every significant task, not at session end. If the session crashes, the file survives.

## Prompts

Raw-log path convention:

```
`raw/telegram/chats/<chat_id>/<year>/<month>/<day>.jsonl
`
```

Goal-routing dispatch:

```
`goal: "fix bug?" → search: learnings.md + raw log
goal: "remember yesterday?" → search: memory_search + raw log
goal: "plan for the week?" → search: goals/weekly.md + alignment.yaml
`
```

Nightly cron skeleton — applies multiple "lenses" to the raw log:

```
`# cron: 0 3 * * * (every night at 03:00)
# Each lens is a separate prompt-personality applied to today's raw jsonl
lenses=(goal-extraction role-detection fact-extraction weekly-summary alignment)
for lens in "${lenses[@]}"; do
 claude --skill memory-synthesis --input raw/$(date +%Y/%m/%d).jsonl \
 --lens "$lens" --output memory/${lens}-$(date +%Y%m%d).md
done
`
```

## Gotchas

- **Post-send DLP is detection only, not prevention.** An output filter on `message:sent` can catch a secret leak after the message has left — but to *block* before send, you have to fork the harness core. Layer prompt-level + OS isolation + DLP as defense-in-depth.
- **"Without evals it's all play."** One critic in the source insists fancy memory architectures need offline evals to prove they actually help; recommended evermind.ai as eval tooling. Another goes further: simple text + grep may be all you need before reaching for vectors. Test against your real query distribution before committing.
- **Merge conflicts on the patch.** Patching the upstream harness's message handler means re-applying after every upstream update. One operator submitted a PR upstream but plans to maintain a fork as backup.
- **Layer 3 routing failures.** Goal classification is itself a prompt — when it misclassifies, the wrong sources are queried. Log misclassifications and tune the classifier on real traffic before trusting Layer 3 in production.

<hr/>

## Tools

- An agent harness whose message lifecycle you can patch (OpenClaw is the reference deployment; sqlite / duckdb / managed vector store both work for L2)
- Gemini embeddings API (or equivalent) for L2 vectorization
- jsonl + standard filesystem for L1 (no database needed)
- Cron for nightly synthesis
- Optional: Graphiti + Neo4j + Vertex AI RAG corpus for the temporal-KG variant
