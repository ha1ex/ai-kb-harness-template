# Changelog

Все значимые изменения этого проекта документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
проект придерживается [семантического версионирования](https://semver.org/lang/ru/).

## [Unreleased]

### Added

- **Аудит-итерация A/B/C/D (2026-07-02)** — многоагентный аудит + правки по 4 блокам:
  - **A. Контур доверия.** Закрыт path-traversal в цитатах (`normCitePath`/`normPath` резолвят
    `.`/`..`, выход за корень = `path-traversal`); claim-coverage (`FACT:`/`DECISION:` без цитаты
    в абзаце = гейт `--scan`, opt-out `coverage: exempt`); `[source:]` регистронезависим;
    adversarial-сьют `scripts/semantic/test-gate.mjs` (12 векторов обхода) в CI; наблюдаемый
    fail-open хуков (`reportHookError` → журнал `hook-error`); git `scripts/git-hooks/pre-push`.
  - **B. Идентичность шаблона.** `pnpm kb:init` (параметризация клона, `--strip-demo`, `--level 0..3`);
    `probes.mjs` → композитор corpus/template/local (eval не краснеет после удаления демо-корпуса);
    отчёты демо-корпуса → `docs/examples/`; сквозной walkthrough-пример в слоях `00→05`;
    каркас `04_synthesis/_answers/`; уровни принятия L0–L3 в README.
  - **C. Переиспользуемость.** `kb.config.mjs` (единый project-owned конфиг: слои/provenance/
    frontmatter/модель); env `KB_ROOT`/`KB_DB_PATH` (несколько KB на одной оснастке);
    `indexSingleFile` — `kb_promote` индексирует карту сразу; `scripts/lib/frontmatter.mjs`
    (единый парсер вместо 4); `.template-manifest.json` + `pnpm kb:update`.
  - **D. Наблюдаемость и циклы.** Фильтр `status: stub/deprecated` в retrieval + D3-гейт в eval +
    advisory в kb-doctor; `pnpm kb:metrics` (тренды из журнала) + ротация журнала;
    Tier-2 verify из сохранённых эмбеддингов (`getChunkEmbeddings`) + семантический `--scan` +
    non-blocking `kb-advisory.yml`; `pnpm kb:digest` + `docs/automation.md` (launchd/cron);
    path-safety runId (viewer) и `case.id` (skillopt).
- **Code-as-Agent-Harness — перенос идей обзора** (синтез: `04_synthesis/code-as-agent-harness-adoption.md`):
  - **N1 — петля verify→critique→revise.** `verify.mjs` отдаёт actionable-`critique` (`buildCritique`);
    новый `scripts/kb-critic.mjs` строит revision-промпт по причине каждой битой цитаты, `--execute`
    гоняет цикл через `claude` CLI (graceful degradation на печать промпта).
  - **N3 — verify как блокирующий CI-гейт.** Шаг `verify.mjs --scan --provenance --no-semantic` в
    `kb-ci.yml`. Цитаты в HTML-комментариях и коде (fenced/инлайн) игнорируются как примеры
    (`maskExamples` в `scripts/lib/provenance.mjs`); external-corpus пропускается.
  - **N4 — layer-handoff provenance.** `scripts/lib/provenance.mjs` (dependency-free) + PreToolUse-хук
    `scripts/check-provenance.mjs`: synthesis/decisions цитируют только строго более низкий слой пирамиды.
  - **N2 — verified answer-cards.** MCP-tool `kb_promote` пишет ответ в `04_synthesis/_answers/` только
    после verify Tier-1 + provenance + dedup (cos<0.90); источники → `related:`; `kb-doctor` помечает карту
    stale при изменении источника после `verified_at`.
  - **Quick-wins:** `log.md` в семантическом индексе (`INDEXABLE_ROOT_FILES`); describe-then-index
    (`title/subtitle/description/category` в эмбеддинге чанка); scratch-hygiene `.context/inbox`
    (advisory в `kb-doctor` + счётчик в session-start); `.remember/preferences.md` (answer-policy,
    подмешивается в `kb_think`/`think.mjs`).
  - **Тесты:** офлайн-`scripts/semantic/test-control.mjs` (critique/provenance/маскирование) — гейт в CI.
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
