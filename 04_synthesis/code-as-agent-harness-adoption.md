---
type: synthesis
title: Code as Agent Harness — что перенести в наш KB-харнесс
date: 2026-06-25
status: living
confidence: medium
source: https://github.com/YennNing/Awesome-Code-as-Agent-Harness-Papers
tags: [harness, retrieval, control, memory, evolve, roadmap]
---

# Code as Agent Harness → наш KB-харнесс: что забрать

> Синтез разбора обзора **«Code as Agent Harness»** (YennNing/Awesome-Code-as-Agent-Harness-Papers,
> 300+ статей 2021–2026; ссылка во frontmatter `source:`). Это **мета-документ об оснастке**, поэтому
> evidence — внешний обзор и наш собственный код (`scripts/…`), а не слои KB; внутренние `[source: /path]`
> здесь неприменимы (как и для external-corpus). Метки `RECOMMENDATION/FACT/INFERENCE` — про природу
> утверждения. Карта инструментов — `docs/architecture.md`.

## Рамка

FACT: центральный тезис обзора — «код как исполняемый/инспектируемый/stateful **харнесс**, а качество
определяет оснастка, не модель» — совпадает с нашим (`docs/architecture.md`, петля Compose→Adapt→Evolve).

INFERENCE: но обзор про агентов с интерпретатором/тестами/runtime-оракулом, а наш «мир» — markdown без
исполнения. Переносится **петля verify→revise**, где исполнительный оракул заменяется единственным
детерминированным — **разрешением цитат** (`scripts/semantic/verify.mjs`): он доказывает *существование*
источника, но не *истинность*. Поэтому eval-gated сходимость у нас слабее test-gated и остаётся
**advisory, не hard auto-merge**.

## Где мы уже впереди (не трогаем)

FACT: сильны Context (пирамида 00→06 + метки + цитаты, `AGENTS.md`), Retrieval (гибрид vec+BM25+RRF +
graph + temporal, `scripts/semantic/lib.mjs`), Tools (декларированный MCP-набор), advisory-дисциплина
(`dream-cycle`/`suggest-links`/`skillopt` предлагают, не мутируют). MemGPT-пейджинг не нужен — всё в git.

## Реальные пробелы (аудит 8 измерений)

1. INFERENCE: eval мерит только retrieval по внешнему корпусу (recall насыщен на 1.0), faithfulness
   синтеза не скорится.
2. FACT: `verify.mjs` не был enforced (ни хука, ни CI) — opt-in, не блокировал. **Закрыто (N1/N3).**
3. FACT: нет write-path обратно в KB (`kb_retain` карантинный, память пуста). **Частично (N2).**
4. INFERENCE: Evolve-петли open-loop, зависят от внешнего `claude` CLI.
5. INFERENCE: graph/temporal каналы инертны на реальном корпусе (нет `related:`/`doc_date`).
6. INFERENCE: observability outcome-blind (журнал в эфемерном `.context`).

## Adopt now — внедрено в этой итерации

- **N1 — петля verify→critique→revise.** RECOMMENDATION→DONE: `verify.mjs` отдаёт actionable-critique
  (`buildCritique`), `scripts/kb-critic.mjs` строит revision-промпт по `reason`, `--execute` гоняет
  до N раундов через `claude` (graceful degradation). Источники: CRITIC, Self-Debug, Self-RAG, AgentCoder.
- **N3 — verify как блокирующий CI-гейт.** DONE: шаг `verify.mjs --scan --provenance --no-semantic`
  в `kb-ci.yml`. Цитаты в комментариях/коде игнорируются (примеры формата), external-corpus пропускается.
- **N4 — layer-handoff provenance.** DONE: `scripts/lib/provenance.mjs` + хук `check-provenance.mjs`
  (PreToolUse) + флаг `--provenance` в CI. synthesis/decisions цитируют только более низкий слой
  пирамиды. Источник: MetaGPT (SOP-handoff).

## Adopt later (бэклог, приоритет в `docs/architecture.md`/плане)

RECOMMENDATION: L1 inbox-triage-assist; L2 `lessons.md` из journal; L6 парс `json claims[]`;
L7 synthesis-groundedness отчёт; L8 result-shaping; L9 детерминированный multi-facet retrieval.
Половина (L7/L9, importance-канал, usage-eval) имеет смысл только когда пирамида `00–05` наполнится
собственным контентом (сейчас корпус ~99.7% в `06_outputs`).

## Внедрённые quick-wins

- **L3 describe-then-index**: `title/subtitle/description/category/name` теперь попадают в эмбеддинг
  чанка (`lib.mjs` frontmatter-hint) → skill-selection по интенту для 744 карт.
- **L4 scratch-hygiene**: `kb-doctor` (advisory) + session-start флагуют залежавшуюся `.context/inbox`-память.
- **L5 answer-policy**: `.remember/preferences.md` (ручки формы ответа) подмешивается в `kb_think`/`think.mjs`.
- **salvage commit-history**: `log.md` добавлен в индекс (`INDEXABLE_ROOT_FILES`) — changelog findable без LLM-дистилляции.

## Сознательно НЕ берём

RECOMMENDATION: исполнение-зависимое (PAL/PoT/MemGPT/Voyager-self-play, test/compiler-оракулы);
multi-agent debate/role-play/reward-models (могут усиливать уверенно-неверный ответ; оркестрация —
забота Conductor); blackboard-bus и direct-commit mutation-tools (убирают review-checkpoint);
importance-RRF-канал и backtracking-retrieval (premature на плоском корпусе). Diversity берём из
retrieval-каналов, а не из N копий модели в споре.
