---
id: B-065
tier: B
category: "Infrastructure"
kind: pattern
title: "Claude Max subprocess as zero-cost LLM runtime"
subtitle: "Per-token API billing distorts what's worth building internally. Subprocess to Claude Max ($200/mo flat) runs unlimited L1/L2/L3 at zero marginal cost."
source: https://www.cybos.ai/cases/B-065
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · founder · anyone running LLM workloads at scale"
type: case
version: v0.1
---
# Claude Max subprocess as zero-cost LLM runtime

> Per-token API billing distorts what's worth building internally. Subprocess to Claude Max ($200/mo flat) runs unlimited L1/L2/L3 at zero marginal cost.

## What

Every LLM call in your codebase goes through `subprocess.run(["claude", "-p", "--output-format", "text", "--model", model, "--system-prompt-file", path,...])` rather than the Anthropic SDK. No `ANTHROPIC_API_KEY` anywhere. Claude Max subscribers ($200/mo flat) run unlimited workloads — L1 classifiers, L2 enrichment, L3 deep research with WebSearch+Bash — at zero marginal cost. A ~80-line `llm.py` wrapper module is copy-paste-portable across projects.

## Why it matters

For internal tools and small-team automation, per-token billing distorts what's worth building. A founder-discovery CLI and a deal-intake bot share the same `claude -p` wrapper and run 4000 tweets/day classification plus ~40 Opus deep-research memos a day at $0 marginal cost. Same pattern works for any team running L1/L2/L3 pipelines, batch translation, content rewriting, or agentic workflows. Beyond a few thousand calls/month, the Max subscription pays for itself.

## End-to-end

1. **Install Claude Code globally**: `npm i -g @anthropic-ai/claude-code; claude auth login` with a Max-tier account.
2. **Write `llm.py:claude_call(prompt, model='sonnet', system_file=None, allowed_tools=None, max_turns=1)`** that wraps `subprocess.run([...])` and returns stdout.
3. **Add JSON-extraction helper** for prompts that should emit JSON (look for the first `{`–`}` block; one retry with "produce JSON only" prompt on parse fail).
4. **Migrate your existing API calls** to this wrapper.
5. **For tool-using runs** (WebSearch, Bash, Read), pass `--allowedTools WebSearch --allowedTools Bash --max-turns 25 --timeout 420`.
6. **Watch the Max plan's rate limits** — they exist but are generous; throttle batch jobs to 2–4 parallel.
7. **Keep an SDK fallback** for one specific edge case (e.g., when you need streaming responses) — the rest of the codebase stays on `claude -p`.

## Gotchas

- Don't ship Max-authenticated calls into customer-facing production where each end-user fires LLM calls — the Max plan is for you and your team, not your users. Customer-facing usage needs a metered API key.

## Tools

- Claude Max subscription
- Claude CLI installed
- Python subprocess (or any shell)
