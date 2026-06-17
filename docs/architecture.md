---
type: reference
title: Карта архитектуры харнесса — ортогональные измерения
version: v0.1
ingested: 2026-06-17
---

# Карта архитектуры харнесса

> Этот документ — карта внутреннего устройства оснастки (не контент KB). Лежит в `docs/`,
> которая в `SKIP_DIRS` семантического индекса (`scripts/semantic/lib.mjs`) — поэтому не
> попадает в поиск и не проверяется `kb-doctor`. Для онбординга: как из чего собран харнесс.

## Откуда идея

Структура вдохновлена проектом **[HarnessX](https://github.com/Darwin-Agent/HarnessX)** (harness
foundry) и его тезисом **«харнесс, а не модель, определяет качество»**: композиция поведения по
ортогональным измерениям и петля **Compose → Adapt → Evolve**, где каждый прогон оставляет
оценённый след, возвращающийся в улучшение.

Здесь тот же принцип перенесён на **KB-харнесс**: вместо исполнения агента — поиск/синтез по
markdown-репозиторию-как-базе-знаний. Петля «оцени → проверь → наблюдай → улучшай» реализована
для двух слоёв: **скиллы** (через `skillopt`) и **retrieval/synthesis** (через
`eval` / `verify` / `kb-journal`).

## Измерения → файлы

| Измерение | Что отвечает у нас | Реализация |
|---|---|---|
| **Context** | Каноническая иерархия чтения, пирамида `00→06` | `AGENTS.md`, `index.md`, `00_context/`, `scripts/semantic/lib.mjs#INDEXABLE_LAYERS` |
| **Memory** | Рабочая память, непрерывность сессий | `.remember/core.md` (semantic invariant), `scripts/session-start-context.mjs` |
| **Retrieval** | On-device hybrid RAG (e5-small + sqlite-vec + FTS5 + RRF) | `scripts/semantic/lib.mjs` (`searchVec`/`searchBM25`/`fuseRRF`), `index.mjs`, `search.mjs`, `think.mjs` |
| **Tools** | MCP-поверхность для любого клиента | `scripts/semantic/mcp-server.mjs` (`kb_search`/`kb_think`/`kb_backlinks`/`kb_verify`), `scripts/skillopt/mcp-server.mjs` |
| **Evaluate** | Бенчмарки + health-check | `scripts/semantic/eval.mjs` (+ `eval-baseline.json`), `scripts/search-quality-probes.mjs`, `scripts/kb-doctor.mjs`, `scripts/skillopt/evals/` |
| **Control** | Guardrails / проверка цитат | хуки `.claude/settings.json` (`check-decisions`, `check-md-frontmatter`), `scripts/semantic/verify.mjs` |
| **Observe** | Журнал операций / телеметрия | `scripts/lib/journal.mjs` → `.context/kb-journal.jsonl`, `scripts/skillopt/storage/metrics.mjs` |
| **Evolve** | Петли самоулучшения | `scripts/skillopt/` (rollout→reflect→diff→apply), `scripts/dream-cycle.mjs` |

## Compose → Adapt → Evolve

- **Compose** = Context + Retrieval + Tools — собрать поведение из переиспользуемых частей
  (слои, гибридный поиск, MCP-инструменты), без переписывания агента.
- **Adapt** = Evaluate + Control + Observe — мерить качество (`eval` recall@k/MRR + регрессии),
  проверять утверждения (`verify` цитат), наблюдать фактические операции (`kb-journal`).
- **Evolve** = `skillopt` + `dream-cycle` — возвращать измерения в улучшение: оптимизация скиллов
  по eval-cases и еженедельный LLM-аудит KB, который теперь читает и журнал операций.

## Петля retrieval/synthesis (что добавлено поверх skillopt)

```
запрос → kb_search/kb_think ──┐
                              ├─→ kb-journal.jsonl (Observe)
ответ с [source:] → kb_verify ┘        │
                                       ▼
golden-set probes → kb:eval ──→ eval-baseline.json (Evaluate, гейт в CI)
                                       │
                              dream-cycle (Evolve): git + журнал + open-questions → аудит
```

- **Evaluate:** `node scripts/semantic/eval.mjs` — recall@3/@5, MRR, разбивка по категориям,
  детекция регрессий vs `eval-baseline.json` (порог 0.02), exit 1 при регрессии. Гейт в `kb-ci.yml`.
- **Control:** `node scripts/semantic/verify.mjs` — Tier-1 (файл существует, слой допустим,
  carve-out для external-corpus) гейтит; Tier-2 (мягкий семантический балл, только для меток
  `FACT:`) — advisory, никогда не блокирует. Цитаты у нас path-only, поэтому семантика — подсказка,
  а не вердикт: не штампует галлюцинации и не бракует легитимный `INFERENCE:`.
- **Observe:** `scripts/lib/journal.mjs` пишет компактные записи (пути/скоры/тайминги, без прозы)
  в gitignored `.context/kb-journal.jsonl`; opt-out `KB_JOURNAL=0`.
- **Evolve:** `dream-cycle` сводит журнал (`summarizeJournal`) в раздел аудита — пустые выдачи
  (пробелы KB) и проваленные verify становятся пунктами open-questions.

## Команды

```bash
pnpm kb:index     # построить семантический индекс
pnpm kb:search    # гибридный поиск
pnpm kb:think     # промпт-синтез с цитатами
pnpm kb:eval      # retrieval-бенчмарк + регрессия vs baseline
pnpm kb:verify    # проверка цитат [source: /path]
pnpm kb:doctor    # health-check KB
pnpm kb:dream     # еженедельный LLM-аудит (git + журнал операций)
pnpm skill        # SkillOpt CLI (rollout/reflect/diff/apply)
```

См. также [`CLAUDE.md`](../CLAUDE.md) (раздел «Слои оснастки») и [`AGENTS.md`](../AGENTS.md).
