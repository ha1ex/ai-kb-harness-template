# Changelog

Все значимые изменения этого проекта документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
проект придерживается [семантического версионирования](https://semver.org/lang/ru/).

## [Unreleased]

### Added

- Эталон проектного навыка `harness/templates/skill/` (SKILL.md из пяти секций и два проверочных случая) и команда `pnpm skill new <name>`: черновик создаётся только из шаблона и только в `.context/`, дальше — обычный `propose → compare → approve → apply`.
- Необязательные поля `status: draft|verified|deprecated` и `version` во frontmatter навыка; `pnpm skill list` и пакет `kb:context` показывают их. Навык со статусом `deprecated` нельзя назначить роли, этапу или профилю, и он не копируется клиентам.
- Реестр `pnpm kb:roster` (`--json|--md`): роли, этапы сценариев, навыки, их потребители, проверки и копии у клиентов; `pnpm skill list` показывает `used-by`; `pnpm harness:check` предупреждает о проектных навыках без потребителя при активном профиле; строка реестра в дайджесте.
- Подпись эффекта решений: `pnpm kb:approve --file … --by … --reference …` ставит `status: accepted` и `approved_by/approved_at/approved_ref/approved_hash`; хук `check-decisions` блокирует агентскую запись `accepted` без действующей подписи; `verify --scan` краснеет на устаревшей подписи (отсутствие подписи — advisory, гейт при `approval.required`); `kb-doctor` показывает такие решения; настройка `approval` в `kb.config.mjs`.
- Единый инбокс «ждут человека»: `pnpm kb:inbox` и карточки в дайджесте (решения, этапы задач, сравнения навыков, предложение профиля, кандидаты inbox, открытые находки, подготовленные запросы исследования) с командой на каждую; `kb:metrics` считает ожидающие решения и просроченные дольше 7 дней.
- Однострочный `pnpm kb:findings papercut "<текст>"` (не бэклог: повторы копятся как observations), `pnpm kb:findings from-reviews [--record]` (замечания рецензента из handoff → открытые находки), `pnpm skill propose --from-findings <id,…>` (только принятые человеком уроки; связка попадает в rationale и хеш предложения), принятые уроки в промпте `reflect` с обязательной строкой `KNOWN-ERRORS-CHECK:`, раздел дайджеста «Повторяющиеся замечания без предложения навыка».
- Свежесть synthesis считается по дате документа (`updated`/`date`/`ingested`), затем по последнему коммиту, затем по mtime; `status: living` не стареет; порог `doctor.staleDays` в `kb.config.mjs` (дефолт 60) общий для `kb-doctor` и `think`.
- «Тишина не успех»: шаги ночного контура пишут записи `run` в журнал; дайджест открывается секцией «Ночной контур» (последний запуск и статус каждого шага), печатает Health даже при упавшем doctor, записывает доставку webhook и завершается кодом 1 при недоставке; `--strict` превращает любое ⚠ в exit 1; `verify --scan` предупреждает о нуле проверенных файлов (`--require-files` — гейт); `pnpm check` прогоняет все проверки до конца и печатает сводку (`--fail-fast` — прежнее поведение).
- Архитектурные инварианты с храповиком: `harness/invariants.json` + `pnpm kb:invariants` (в `pnpm check`): один резолвер `KB_ROOT`, один парсер frontmatter, имена моделей только в конфиге, тесты без живой сети, длина файла ≤ 900 строк, достижимость скриптов; существующие нарушения заморожены по путям, новое — красный, вылеченная заморозка обязана быть удалена; проектный overlay `invariants` в `kb.config.mjs`.
- Тест `test/docs-drift.test.mjs`: команды `pnpm`, пути и имена MCP-инструментов в template-owned документации сверяются с `package.json`, файлами и `registerTool`; таблица «Слои контроля» в `docs/architecture.md` покрывает все гейты из pre-push, хуков и CI. Исправлены найденные расхождения (`kb:critic`, `kb_promote`, инструменты `skill_*`, плейсхолдер в `docs/upgrades.md`).
- Источник и синтез по статье «Агенты PartyStation: как устроена система»: `02_sources/2026-09-09-pstv-agents-system.md`, `04_synthesis/pstv-agents-adoption.md` — что перенести в шаблон поверх 0.5.0/0.6.0.

### Changed

- Отпечаток контракта этапа учитывает только поля роли, меняющие требования (`id`, `version`, `skills`, `requiredContext`, `optionalContext`, `boundaries`, `qualityCriteria`, `inputs`, `outputs`); дополнительные поля роли не переоткрывают завершённые этапы.
- Сообщение хука `check-decisions` больше не ссылается на несуществующий `99_templates/decision-template.md`.

### Migration

- `stale_synthesis` теперь считается по дате документа, а не по mtime: старые проекты могут впервые увидеть красный `kb-doctor` в CI. Выход — обновить документ, поставить `status: living` для живых реестров или поднять `doctor.staleDays`.
- Решения со `status: accepted` без полей `approved_*` показываются как unsigned (advisory). Подтвердите их `pnpm kb:approve` или верните `status: proposed`; гейт на отсутствие подписи включается `approval.required: true`.
- `pnpm kb:digest` с заданным `KB_DIGEST_WEBHOOK` теперь завершается кодом 1 при недоставке — cron-лог покраснеет вместо тихого пропуска.
- Завершённые этапы задач, сохранённые до обновления, один раз покажутся устаревшими по контракту (`staleArtifacts`): переоткройте и перепроверьте их.
- Неизвестное значение `status:` во frontmatter навыка теперь ошибка обнаружения; используйте `draft`, `verified`, `deprecated` или удалите поле.

## [0.6.0] - 2026-09-09

### Added

- `kb:research`: планирование сильной моделью, задания экономичным исполнителям, обобщение и независимая проверка сильной моделью.
- Необязательная проектная политика моделей и лимитов; ручная работа через текущие клиенты по умолчанию, явный запуск через существующие адаптеры.
- История попыток и расходов, неизменяемые записи результатов, точные цитаты, сохранение неопределённости и противоречий, проверка каждого итогового утверждения.
- Лимиты вызовов, исполнителей и повторов, резерв на ревью, явный учёт неизвестного расхода и его восстановление по журналу клиента.
- Переносимый навык `economical-research` и [руководство](docs/research.md).

### Changed

- `kb:context` показывает модели, бюджет, незавершённые вызовы и изменения источников или политики исследования.
- `kb:session` защищает историю исследования и проверяет актуальность записи перед сохранением; параллельные исполнители сохраняют результаты без перезаписи чужого состояния.
- `harness:check` проверяет необязательную политику исследования. Смена модели или источника после проверки требует нового исследования либо пересмотра результатов.

### Migration

- `kb:update --ref v0.6.0 --apply` переносит компоненты и новую команду, сохраняя профиль, собственные скиллы, политику моделей и историю проекта.
- Старые проекты и задачи работают без новой политики. Для настройки скопируйте `harness/templates/research-policy.json` в `00_context/research-policy.json`; не перезаписывайте существующий файл.
- После обновления выполните `pnpm harness:setup`. Подробности и границы проверок: [выпуск 0.6.0](docs/releases/0.6.0.md).

## [0.5.0] - 2026-09-09

### Added

- Пять контрактов ролей, четыре сквозных сценария и проектный профиль с явным подтверждением.
- Пакеты контекста по роли и этапу, проверяемые артефакты и независимое ревью в передаче задач.
- Общая очередь находок и принятых уроков; аудит, дайджест и измерения используют одни записи.
- Предложения новых скиллов и сравнение версий на одинаковых примерах перед подтверждением и применением.

### Changed

- Клиенты и SkillOpt используют общее обнаружение стандартных и существующих плоских скиллов.
- SkillOpt учитывает `KB_ROOT`; старые предложения без сравнения и подтверждения больше не применяются.
- `kb:doctor` читает состояние без записи по умолчанию; сохранение находок включается `--record-findings` или `kb:findings scan`.
- Ручной запуск SkillOpt готовит запросы; вызов модели в `rollout`, `reflect`, `compare` требует `--execute`.

### Migration

- Проекты без профиля и задачи без сценария продолжают работать. Проектные роли, процедуры и принятый опыт защищены при обновлении.
- После обновления выполните `pnpm harness:setup`, чтобы синхронизировать навыки выбранных клиентов; изменённые локально копии требуют разбора конфликта.
- Для прежних предложений SkillOpt подготовьте новое сравнение и подтверждение. Изменение навыка, примеров или контекста после оценки требует новой проверки.
- Если аудит должен сохранять находки, используйте `pnpm kb:findings scan`. Обычный `kb:doctor` теперь только читает состояние.
- Проверки выпуска и порядок перехода: [0.5.0](docs/releases/0.5.0.md).


## [0.4.0] - 2026-09-06

### Added

- Общие правила, переносимые навыки и роли в `harness/`; адаптеры Codex, Claude Code, OpenCode, Gemini и MCP-клиентов.
- Проверка и настройка подключений с сохранением пользовательских файлов; отдельные handoff-файлы задач.
- Тематическая веб-витрина, библиотека, быстрый переход, паспорт документа, оглавление и раскрываемые источники; статическая сборка.
- Правила человеческого интерфейса, проверки пространств, читаемости и переносимости; изолированный нейтральный пример.
- Формат манифеста v2, распространяемый baseline, установленная база проекта и тесты обновления независимых Git-историй.

### Changed

- `kb:update` сравнивает версии файлов и управляемые поля JSON, сохраняет локальные изменения и отмечает незавершённые конфликты.
- `kb:init` работает с `KB_ROOT`, сохраняет исходную базу до персонализации и удаляет только неизменённые известные демо-файлы.
- `think`, `critic` и `dream` используют общий выбор LLM-провайдера. Ручной режим по умолчанию не делает модельных запросов.
- README описывает назначение, быстрый старт, совместимость и миграции; уточнены границы локальной работы и формальных проверок источников.
- Версии корневого пакета и манифеста приведены к `0.4.0`; предыдущий манифест `0.3.0` не обозначал отдельный опубликованный выпуск.

### Migration

- Новые проекты сохраняют `.harness/lock.json` после `kb:init`. Проекты без lock явно принимают подтверждённую исходную ревизию: [инструкция](docs/upgrades.md).
- Собственные AGENTS/CLAUDE/config и данные не перезаписываются при обновлении; подключение нового канона выполняется отдельно.

## До выпуска 0.4.0 — изменения, ранее находившиеся в Unreleased

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

[Unreleased]: https://github.com/ha1ex/ai-kb-harness-template/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/ha1ex/ai-kb-harness-template/releases/tag/v0.4.0
[0.2.0]: https://github.com/ha1ex/ai-kb-harness-template/releases/tag/v0.2.0
