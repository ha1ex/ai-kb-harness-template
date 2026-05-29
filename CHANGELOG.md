# Changelog

Все значимые изменения этого проекта документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
проект придерживается [семантического версионирования](https://semver.org/lang/ru/).

## [Unreleased]

### Added
- **Онбординг.** `.nvmrc` (Node 22), поля `packageManager` (`pnpm@9.15.0`) и
  `engines` (`node >=20 <23`) во всех `package.json`, единая команда
  `pnpm run setup` вместо трёх раздельных `pnpm install`.
- **CI.** GitHub Actions (`.github/workflows/ci.yml`): matrix Node 20/22,
  corepack + pnpm-кэш, `node --check` ключевых `.mjs`, прогон `kb-doctor`.
- **Документация ingest-слоя.** `scripts/README.md` (назначение и запуск каждого
  ingest/scrape-скрипта) и `scripts/requirements.txt` (фиксирует, что Python-скрипты
  используют только stdlib).
- **Каталог базовых MCP** (`06_outputs/mcp-catalog/`) — 12 dev-core MCP-серверов
  (7 reference + Playwright, Chrome DevTools, Context7, GitHub, Brave Search): карточки
  с frontmatter, `_index.md` и готовый `baseline.mcp.json` (keyless-набор для копирования
  в `.mcp.json`). Отобрано по deep-research (май 2026) с учётом архивации reference-серверов
  Anthropic; индексируется семантическим поиском.

### Security
- **Supply chain.** Добавлен `pnpm.overrides` на `protobufjs>=7.5.8` в
  `scripts/semantic/package.json` — закрывает critical RCE в транзитивной
  ONNX-зависимости. В README — памятка про `pnpm audit`.

### Changed
- **KB-дисциплина.** Уточнены формулировки про on-device-работу: первый запуск
  `kb:index` скачивает ONNX-модель `multilingual-e5-small` (~120 MB) с HuggingFace,
  дальше всё работает локально/офлайн.

## [0.2.0] - 2026-05-29

### Added
- **Зеркало cybos.ai/cases** — 418 кейсов в 11 категориях + скрейперы
  (`scrape-cybos.py`, `cybos-manifest.py`).
- **Пилот Anthropic Agent Skills** — 12 Apache-2.0 скилов + новая категория Design.
- **Расширение KB** — +218 паттернов fabric, +84 ноутбука claude-cookbooks,
  +3 промоутнутых `SKILL.md`; итого 732 единицы из 4 источников.
- **Reference-only карточки** для source-available скилов Anthropic + дедупликация
  + search-quality-probes (сначала 18/18 PASS, затем расширено до 42/42 PASS на 14
  категориях).
- **interviewer-agent** — скил с коротким триггером «интервью» / «interview»
  для auto-trigger в `.claude/skills`.

[Unreleased]: https://github.com/ha1ex/ai-kb-harness-template/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ha1ex/ai-kb-harness-template/releases/tag/v0.2.0
