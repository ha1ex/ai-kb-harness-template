---
type: report
title: Retrieval eval — recall@k / MRR / regression
ingested: 2026-06-18
version: v0.1
---

# Retrieval eval — recall@k / MRR

> 42 проб (golden-set `scripts/semantic/probes.mjs`), гибридный поиск vector+BM25+RRF, без LLM. Метрика — карточка в top-k, у которой И категория, И провайдер совпали.

**Overall:** recall@3 = **1** · recall@5 = **1** · MRR = **0.9484** (n=42).

**Δ vs baseline:** recall@3 ±0 · recall@5 ±0 · MRR ±0.

FACT: регрессий выше порога не обнаружено.

## По категориям

| Категория | recall@3 | recall@5 | MRR | n | Δ recall@3 |
| - | - | - | - | - | - |
| Customer success | 1 | 1 | 1 | 2 | ±0 |
| Cybersecurity | 1 | 1 | 1 | 3 | ±0 |
| Data & BI | 1 | 1 | 1 | 2 | ±0 |
| Design | 1 | 1 | 0.8333 | 3 | ±0 |
| Engineering productivity | 1 | 1 | 1 | 9 | ±0 |
| Founder productivity | 1 | 1 | 0.7778 | 3 | ±0 |
| HR & hiring | 1 | 1 | 1 | 3 | ±0 |
| Infrastructure | 1 | 1 | 1 | 2 | ±0 |
| Knowledge management | 1 | 1 | 1 | 3 | ±0 |
| Marketing & content | 1 | 1 | 0.8333 | 3 | ±0 |
| Operations | 1 | 1 | 1 | 3 | ±0 |
| Sales & outbound | 1 | 1 | 1 | 3 | ±0 |
| Strategy & leadership | 1 | 1 | 0.8333 | 3 | ±0 |

