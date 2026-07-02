# Примеры артефактов на демо-корпусе

> Эти отчёты — **боевые артефакты демо-корпуса** (736 карточек в `06_outputs/<provider>/`),
> а не часть оснастки. Лежат в `docs/` (вне семантического индекса и вне проверок `kb-doctor`),
> чтобы клон шаблона не путал их со своими собственными артефактами.
>
> Свежие версии генерируются командами ниже и пишутся сюда же.

| Файл | Что показывает | Как перегенерировать |
|---|---|---|
| [`audit-report-2026-05-29.md`](./audit-report-2026-05-29.md) | Всесторонний аудит репо (двойная оптика «шаблон / реальная KB»), scorecard + backlog | ручной аудит (снапшот) |
| [`eval-report.md`](./eval-report.md) | Retrieval-метрики recall@k / MRR по golden-set пробам | `node scripts/semantic/eval.mjs --report` |
| [`search-quality-report.md`](./search-quality-report.md) | Качественная батарея проб по категориям корпуса | `node scripts/search-quality-probes.mjs` |
| [`dedup-report.md`](./dedup-report.md) | Near-duplicate пары карточек корпуса | `node scripts/dedup-skills.mjs --report` |

Если вы удалили демо-корпус (`pnpm kb:init --strip-demo`) — эти отчёты можно удалить вместе с ним;
walkthrough-пример и template-пробы (`scripts/semantic/probes-template.mjs`) их не используют.
