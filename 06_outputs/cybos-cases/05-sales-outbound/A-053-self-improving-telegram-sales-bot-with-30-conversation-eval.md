---
id: A-053
tier: A
category: "Sales & outbound"
kind: workflow
title: "Self-improving Telegram sales bot with 30-conversation eval-rewrite loop"
subtitle: "Problem solved: Founders selling courses, B2C info products, or SMB SaaS need to qualify and warm hundreds of leads concurrently in Telegram without hiring SDRs; a multi-user OpenClaw bot with RAG over methodology docs runs as the salesperson, an eval-agent every 30 conversations rewrites its system prompt, and warm leads route to the founder."
source: https://www.cybos.ai/cases/A-053
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "founder · head of sales · course creator · SMB SaaS founder"
type: case
version: v0.1
---
# Self-improving Telegram sales bot with 30-conversation eval-rewrite loop

> Problem solved: Founders selling courses, B2C info products, or SMB SaaS need to qualify and warm hundreds of leads concurrently in Telegram without hiring SDRs; a multi-user OpenClaw bot with RAG over methodology docs runs as the salesperson, an eval-agent every 30 conversations rewrites its system prompt, and warm leads route to the founder.

## What

Patch OpenClaw so a single instance can handle many concurrent Telegram conversations — one history `.jsonl` file per user, scoped per chat. Feed the bot ~20 markdown files of your sales-relevant knowledge (methodology, product docs, FAQs) into the agent's `memory/` directory so RAG kicks in automatically (hybrid vector + BM25, local embeddings). Stand up an admin dashboard (Cloudflare tunnel + your local server) for live conversation review. A lead-temperature scorer runs on every conversation and DM-forwards warm leads to the operator. **The signature primitive:** every 30 new conversations, an eval-agent reads the batch, rates the sales bot on 4 metrics, and **rewrites the bot's system prompt** (and can in principle rewrite its code — hasn't yet at time of source). Reported deployment: 250 users in 2 days; ~10-15 sales projected; subjective response-quality drift positive, metric trust still low.

## Why it matters

The self-rewrite loop is the case-defining mechanic — not the Telegram bot, not the RAG, not the lead scoring. Most "AI sales bots" ship with a fixed system prompt and degrade as the operator's product evolves. This loop converts the system prompt itself into a continuously-tuned artifact. The 30-conversation cadence is small enough to react to real prompt failures but large enough that the eval has a statistical signal. Pair it with a stronger model on the eval pass than on the response pass (the operator runs Gemini 3 Flash for responses on OpenRouter, Opus 4.5 via Claude Max for the eval) to get cheap inference where it scales (per-user replies) and quality inference where it doesn't (one eval every 30 conversations).

## End-to-end

1. **Patch OpenClaw for multi-user.** OpenClaw's default handler is single-session. Modify the Telegram entry point so each `chat_id` maps to its own conversation-history `.jsonl` under `raw/telegram/chats/<chat_id>/...`. Each user gets a fully isolated history; the bot's identity and system prompt stay shared.
2. **Load the knowledge base into `memory/`.** Drop your ~20 markdown files (methodology, product docs, pricing, objection handling, FAQ) into the OpenClaw agent's `memory/` directory — **not** alongside random files. OpenClaw's built-in hybrid retrieval (vector + BM25, free local embeddings) only activates on files in `memory/`. Files placed elsewhere get loaded whole into context and the model drowns + falls back to its default generic knowledge.
3. **Force memory-first answering in SOUL.md.** Add a hard rule to the agent's identity file: "ALWAYS use memory_search before answering questions about the courses. NEVER answer from your general knowledge. If the answer is not in the base — say you don't know and offer to connect with the team." (Verbatim translation below.) Without this rule, the model defaults to generic knowledge on edge cases and the brand-voice / methodology drift is visible to the user inside three messages.
4. **Cloudflare tunnel + admin dashboard.** If the agent runs on your laptop (not yet on a VPS), use a Cloudflare tunnel to expose the admin dashboard at a stable domain. Dashboard reads the per-user `.jsonl` files for live review. Later: move to a VPS and drop the tunnel.
5. **Lead-temperature scorer + warm-lead routing.** Every conversation runs through a scoring agent (warm / cold / spam). Warm leads ping the operator's personal Telegram. The scoring agent can be lighter than the responder — it doesn't need to write, just classify.
6. **30-conversation eval-rewrite loop.** A separate eval-agent fires every 30 new conversations. It reads the batch and rates the sales bot on 4 metrics (qualification accuracy, methodology adherence, conversion-step progression, recovery from objections). On a regression: it rewrites the bot's system prompt to improve the lagging metric, commits the change, and the bot picks up the new prompt on the next conversation. The eval agent is empowered to rewrite **code too** (not just prompts) — at time of source, it hasn't actually done a code rewrite yet.
7. **Public the invite + measure.** Drop the invite link in your personal Telegram channel ("ask the bot questions about my courses"). Reported throughput: 250 users / 2 days; projected 10-15 sales.
8. **Model split: cheap response, expensive eval.** Gemini 3 Flash via OpenRouter for the per-message responses (cheap at scale); Opus 4.5 via Claude Max subscription for the eval and rewrite (quality where the cadence is low).

## Prompts

The SOUL.md rule that prevents the bot from falling back to generic knowledge:

```
`ALWAYS use memory_search before answering a question about the courses.
NEVER answer from your general knowledge. If the answer is not in the
knowledge base — say you don't know and offer to connect with the team.
`
```

The operator's case summary:

```
`• Rewrote OpenClaw so it can talk to many people in parallel through a
 Telegram bot. Each user gets their own conversation-history file.
• Fed it the knowledge base for my courses, ~20.md files.
• Built an admin dashboard for reviewing conversations; bound it to a
 domain via Cloudflare tunnel.
• Built an agent that, after 30 new conversations, reads them, scores the
 bot as a salesperson on 4 metrics, and rewrites the system prompts to
 improve the metrics. It can also rewrite its own code, but hasn't yet.
• Metrics are growing. Subjectively the response quality is improving.
 Confidence in the metrics is still low.
• Posted in my Telegram channel: "talk to the bot if you have questions
 about my courses".
• Lead-temperature process: warm leads get forwarded to admins privately.
• Bot talked to 250 people in 2 days; projecting 10-15 sales.
• Responses on gemini-3-flash-preview via OpenRouter; the eval agent on
 opus 4.5 via Claude Max subscription.
• Main problems — hallucinations and falling back to default product-management
 knowledge instead of my methodology.
`
```

## Gotchas

- **Files outside `memory/` skip RAG entirely.** Drop your 20 markdown files alongside random project files and OpenClaw loads them whole into context — the model sees a wall of text, gets confused, and falls back to its generic training. The fix is structural, not prompt-level: the files have to be in `memory/`.
- **Flash hallucinates on tools and skills even with good embeddings.** One reviewer in source: "Flash will be dumb even with well-tuned embeddings — it just gets confused." A/B against Gemini 2.5 Pro before committing to Flash on a public-facing bot; the adherence-to-system-prompt delta is visible.
- **Public-facing bots are higher prompt-injection risk.** Small / cheap models are easier to jailbreak. For a public bot on a small model, you can't fully sandbox `exec` through Docker against upstream OpenClaw out of the box — that needs a core patch. Either upgrade to a stronger model or fork the harness to enforce exec isolation.
- **Anthropic banned programmatic subscription access on Jan 9, 2026.** If your meta-agent (the eval loop) calls Opus automatically via a subscription OAuth token, the account is at ban risk. Move the meta-agent to an API key. Subscription is for human-driven sessions.
- **Metric trust lags subjective quality.** The operator's honest report: "Subjectively quality is growing; trust in the metrics is still low." Don't fire the rewrite-loop into production with no human-in-the-loop on the prompt changes until the metrics correlate with shipped outcomes (sales, warm-lead conversion). Otherwise the eval agent will optimize against a proxy that doesn't predict revenue.

<hr/>

## Tools

- OpenClaw with a multi-user patch (per-`chat_id` history file)
- OpenRouter (for cheap Gemini 3 Flash on responses)
- Claude Max subscription (for Opus 4.5 on eval) — **note:** Anthropic banned programmatic OAuth subscription access on Jan 9; an automated eval agent calling Opus must use an API key, not a subscription token, or the account is at ban risk
- OpenClaw built-in hybrid RAG (vector + BM25, local free embeddings) — files must live in `memory/`
- Cloudflare tunnel — only needed if the bot runs on a laptop, not a VPS
- Telegram Bot API
