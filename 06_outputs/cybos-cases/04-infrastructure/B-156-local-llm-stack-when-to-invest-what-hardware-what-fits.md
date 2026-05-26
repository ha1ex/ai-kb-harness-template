---
id: B-156
tier: B
category: "Infrastructure"
kind: pattern
title: "Local LLM stack — when to invest, what hardware, what fits"
subtitle: "Problem solved: Founders weighing a $5k–$20k local-inference rig against cloud API spend need an honest economics + hardware-fit map before buying."
source: https://www.cybos.ai/cases/B-156
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · engineering lead · ops lead"
type: case
version: v0.1
---
# Local LLM stack — when to invest, what hardware, what fits

> Problem solved: Founders weighing a $5k–$20k local-inference rig against cloud API spend need an honest economics + hardware-fit map before buying.

## What

Maps which AI workloads are tractable on Apple Silicon today versus those that still belong in the cloud. STT and TTS run at production quality locally; frontier-class LLMs require either an unquantized 512 GB Mac Studio or remain cheaper as APIs. A practical fallback ladder sits in between: Qwen3-Coder-Next on an M1 Ultra 64 GB handles code review and heartbeat tasks, GLM-5.1 4-bit quantized on an M3 Ultra 512 GB handles review.

## Why it matters

A loaded Mac Studio (M3 Ultra 512 GB unified memory) lands around $20k; one operator measured ~170 tok/s running GPT-OSS 120B / Qwen3-235B / Kimi K2.5 fully local. That competes with cloud only when privacy or outage continuity dominates — Cerebras at 2000+ TPS with zero data retention out-amortizes local hardware for raw frontier inference. The honest verdict: pay APIs for frontier; spend local-hardware budget on the edge (audio) and on a fallback model for vendor outages.

## End-to-end

1. Decide the workload class first: STT/TTS (local wins), code review / heartbeat (local fallback fine), frontier LLM coding (cloud still wins).
2. For audio at the edge: run Whisper-grade STT + TTS on any current Apple Silicon Mac; keep the LLM call remote.
3. For a code-review / outage fallback: M1 Ultra 64 GB runs Qwen3-Coder-Next with 80k context via LM Studio; pipe into the existing agent harness as inference backend.
4. For private-data exploration of frontier open weights: M3 Ultra 512 GB fits GPT-OSS 120B, Qwen3-235B-A22B, and Kimi K2.5 nearly unquantized; benchmark on your real prompts before purchase.
5. Memory bandwidth beats raw RAM — an M1 Ultra at 800 GB/s outperforms a 273 GB/s DGX Spark on inference. Compare bandwidth, not GB.
6. Track an alternative stack (Mirai / Uzu) that ships its own quantization and an OpenAI-compatible local server for on-device deployment.
7. Route operational (non-codegen) traffic through Chinese open-weight models via OpenRouter when cost matters — ~10× cheaper than Opus for low-stakes ops; do not trust them for serious work.

## Gotchas

## Buying a $20k Mac Studio for emotional reasons when an $8/mo VPS works for the same workload is a documented anti-pattern. The same operator that runs M3 Ultra 512 GB calls Chinese open-weight models "garbage for serious work" — they hallucinate more and burn more tokens per task than the cost savings recover. Verify with your real prompts before committing hardware.

## Tools

- Apple Silicon Mac (M1 Ultra 64 GB for fallback; M3 Ultra 512 GB for frontier-class local) or wait for M5
- LM Studio / llama.cpp / MLX for serving
- OpenRouter account for cloud open-weight routing
- Qwen3-Coder-Next, GLM-5.1-GGUF, GPT-OSS, Kimi K2.5 — Hugging Face weights
- Existing agent harness (Claude Code / Codex / equivalent) configured to accept a custom OpenAI-compatible endpoint
