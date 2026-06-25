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
| **Memory** | Рабочая память, непрерывность сессий, answer-policy, verified answer-cards | `.remember/core.md` (semantic invariant), `.remember/preferences.md` (answer-policy, L5), `scripts/session-start-context.mjs` (+ inbox-счётчик), `04_synthesis/_answers/` (gated write-path через `kb_promote`, N2) |
| **Retrieval** | On-device hybrid RAG (e5-small + sqlite-vec + FTS5 + RRF) + graph-канал (1-hop `related:`) + temporal (`doc_date`) + опц. cross-encoder rerank | `scripts/semantic/lib.mjs` (`searchVec`/`searchBM25`/`searchGraph`/`fuseRRF`/`searchHybrid`/`applyDateFilter`), `rerank.mjs`, `index.mjs`, `search.mjs`, `think.mjs` |
| **Tools** | MCP-поверхность для любого клиента | `scripts/semantic/mcp-server.mjs` (`kb_search`/`kb_think`/`kb_backlinks`/`kb_verify`/`kb_retain`/`kb_promote`), `scripts/skillopt/mcp-server.mjs` |
| **Evaluate** | Бенчмарки + health-check + офлайн-тесты логики | `scripts/semantic/eval.mjs` (+ `eval-baseline.json`), `scripts/semantic/test-retrieval.mjs`, `scripts/semantic/test-control.mjs` (critique/provenance), `scripts/search-quality-probes.mjs`, `scripts/kb-doctor.mjs`, `scripts/skillopt/evals/` |
| **Control** | Guardrails / проверка цитат + provenance | хуки `.claude/settings.json` (`check-decisions`, `check-md-frontmatter`, `check-provenance` N4), `scripts/semantic/verify.mjs` (Tier-1/Tier-2 + `--scan`/`--provenance` гейт, critique), `scripts/lib/provenance.mjs` |
| **Observe** | Журнал операций / телеметрия | `scripts/lib/journal.mjs` → `.context/kb-journal.jsonl` (+ `verify-scan`/`critic`/`promote` kinds), `scripts/skillopt/storage/metrics.mjs` |
| **Evolve** | Петли самоулучшения | `scripts/skillopt/` (rollout→reflect→diff→apply), `scripts/kb-critic.mjs` (verify→critique→revise→re-verify, N1), `scripts/dream-cycle.mjs` (+ fact-консолидация), `scripts/suggest-links.mjs` (advisory `related:`), `kb_retain` → `.context/inbox/`, `kb_promote` → `04_synthesis/_answers/` |

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

- **Retrieval-каналы:** к vector+BM25+RRF добавлены (1) **graph** — 1-hop соседи по `related:`
  (TEMPR-стиль, дефолт вкл; пустые links → no-op, eval Δ=0), (2) **temporal** — фильтр/boost по
  `doc_date` (`--since/--until/--asof/--recency`), (3) опц. **cross-encoder rerank** (`--rerank`,
  по умолчанию выкл — на этом корпусе eval показал регрессию, поэтому только opt-in). Логика
  graph/temporal покрыта офлайн-тестами `scripts/semantic/test-retrieval.mjs` (гейт в CI).
- **Evaluate:** `node scripts/semantic/eval.mjs` — recall@3/@5, MRR, разбивка по категориям,
  детекция регрессий vs `eval-baseline.json` (гейт по overall-метрикам, порог 0.05 — поглощает
  межплатформенный дрейф квантованной ONNX; per-category — только диагностика), exit 1 при
  регрессии. Флаги `--graph/--no-graph/--rerank` для A/B каналов. Гейт в `kb-ci.yml`.
- **Control:** `node scripts/semantic/verify.mjs` — Tier-1 (файл существует, слой допустим,
  carve-out для external-corpus) гейтит; Tier-2 (мягкий семантический балл, только для меток
  `FACT:`) — advisory, никогда не блокирует. Цитаты у нас path-only, поэтому семантика — подсказка,
  а не вердикт: не штампует галлюцинации и не бракует легитимный `INFERENCE:`.
- **Observe:** `scripts/lib/journal.mjs` пишет компактные записи (пути/скоры/тайминги, без прозы)
  в gitignored `.context/kb-journal.jsonl`; opt-out `KB_JOURNAL=0`.
- **Evolve:** `dream-cycle` сводит журнал (`summarizeJournal`) в раздел аудита — пустые выдачи
  (пробелы KB) и проваленные verify становятся пунктами open-questions. Плюс **fact-консолидация**:
  on-device находит near-duplicate пары чанков из разных файлов (+freshness-конфликты по `doc_date`)
  как кандидаты на дедуп/`contradictions.md`. `suggest-links.mjs` предлагает недостающие `related:`
  (vector-similarity, advisory). `kb_retain` даёт агенту write-path в `.context/inbox/` (не коммит).

## Дополнения из обзора «Code as Agent Harness»

Разбор обзора (`04_synthesis/code-as-agent-harness-adoption.md`) дал перенос идей petли
verify→revise в KB-харнесс, где исполнительный оракул заменён **разрешением цитат**:

- **N1 — verify→critique→revise** (Control+Evaluate): `verify.mjs` отдаёт actionable-`critique`
  (`buildCritique`); `scripts/kb-critic.mjs` строит revision-промпт по `reason` каждой битой цитаты,
  `--execute` гоняет до N раундов через `claude` CLI (graceful degradation на печать). Источники:
  CRITIC, Self-Debug, Self-RAG, AgentCoder.
- **N3 — verify как блокирующий гейт** (Control): шаг `verify.mjs --scan --provenance --no-semantic`
  в `kb-ci.yml`. Цитаты в HTML-комментариях и коде (` ``` `, инлайн-`` ` ``) игнорируются как примеры
  (`maskExamples` в `provenance.mjs`); external-corpus пропускается.
- **N4 — layer-handoff provenance** (Control): `scripts/lib/provenance.mjs` + PreToolUse-хук
  `check-provenance.mjs` + флаг `--provenance`. synthesis/decisions цитируют только строго более низкий
  слой пирамиды. Источник: MetaGPT (SOP-handoff). Покрыто `test-control.mjs`.
- **N2 — verified answer-cards** (Memory+Evolve): `kb_promote` пишет ответ в `04_synthesis/_answers/`
  ТОЛЬКО если он прошёл verify Tier-1 + provenance + dedup (cos<0.90); источники → `related:`;
  `kb-doctor` помечает карту stale, если источник изменился после `verified_at`. Источник: Voyager
  (verify-before-add-to-library). DROP question-embedding cache.
- **Quick-wins:** `log.md` в индексе (`INDEXABLE_ROOT_FILES`); describe-then-index
  (`title/subtitle/description/category` в эмбеддинге чанка, L3); scratch-hygiene (`kb-doctor` +
  session-start флагуют залежавшийся `.context/inbox`, L4); `.remember/preferences.md` answer-policy (L5).

## Команды

```bash
pnpm kb:index     # построить семантический индекс
pnpm kb:search    # гибридный поиск
pnpm kb:think     # промпт-синтез с цитатами
pnpm kb:eval      # retrieval-бенчмарк + регрессия vs baseline
pnpm kb:verify    # проверка цитат [source: /path] (+ --scan/--provenance гейт, critique)
node scripts/kb-critic.mjs --file ans.md   # revision-промпт по битым цитатам (N1; --execute для авто-цикла)
node scripts/semantic/test-control.mjs     # офлайн-тесты critique/provenance/маскирования
pnpm kb:doctor    # health-check KB (+ advisory: stale inbox/answers)
pnpm kb:dream     # еженедельный LLM-аудит (git + журнал операций)
pnpm skill        # SkillOpt CLI (rollout/reflect/diff/apply)
```

См. также [`CLAUDE.md`](../CLAUDE.md) (раздел «Слои оснастки») и [`AGENTS.md`](../AGENTS.md).
