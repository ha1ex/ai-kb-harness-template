# Index — карта KB

> Этот файл — навигационная карта проекта. Обновляется по мере роста KB.
> При добавлении нового артефакта — добавьте ссылку сюда (это шаг 8 из ingest workflow в AGENTS.md).

## Контекст

- [Цель проекта](./00_context/) — собственный контекст проекта (`product.md`, `glossary.md` по мере наполнения)
- [Semantic invariant](./.remember/core.md) — цель, контекст, hard rules

## Walkthrough-пример (удаляется `kb:init --strip-demo`)

Сквозной вымышленный мини-проект «пилот AI-ассистента поддержки» — дисциплина слоёв на живом контенте:

- [00_context: контекст](./00_context/walkthrough-product.md) →
  [01_raw: стенограмма (immutable)](./01_raw/walkthrough/2026-06-30-interview-cto.md) →
  [02_sources: саммари](./02_sources/2026-06-30-walkthrough-interview-cto.md) →
  [03_wiki: deflection rate](./03_wiki/walkthrough-deflection-rate.md) →
  [04_synthesis: гипотезы](./04_synthesis/walkthrough-pilot-hypotheses.md) →
  [05_decisions: решение](./05_decisions/walkthrough-decision-pilot-scope.md)

## Источники

- [Все source summaries](./02_sources/)

## Wiki (концепты)

- [Все wiki-страницы](./03_wiki/)

## Synthesis

- [Open questions](./04_synthesis/open-questions.md) — известные пробелы, требующие закрытия
- [Contradictions](./04_synthesis/contradictions.md) — конфликты в источниках, зафиксированные дословно

## Decisions

- [Все принятые решения](./05_decisions/)

## Outputs

- [Финальные артефакты](./06_outputs/)
- [Каталог навыков — external corpus, 736 карточек](./06_outputs/_skills-index.md)
- [Каталог базовых MCP — 12 серверов](./06_outputs/mcp-catalog/_index.md)
- [Отчёты на демо-корпусе (аудит/eval/dedup/качество поиска)](./docs/examples/README.md)
- [CHANGELOG](./CHANGELOG.md)

---

## Оснастка (harness)

- [Карта архитектуры харнесса](./docs/architecture.md) — ортогональные измерения и петля Compose → Adapt → Evolve

## Журнал

См. [`log.md`](./log.md) — хронология ingest-операций и больших правок.
