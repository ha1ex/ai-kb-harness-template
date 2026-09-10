# scripts/ — оснастка и ingest-инструменты

Два класса скриптов.

## 1. Оснастка KB (ежедневная, Node)

Запускаются через `pnpm` (см. корневой `package.json`). Зависимости — в `scripts/semantic/`
и `scripts/skillopt/` (поставить: `pnpm run setup`).

| Команда | Файл | Назначение |
|---|---|---|
| `pnpm kb:init` | `kb-init.mjs` | параметризация клона: цель проекта → AGENTS.md/core.md, `--strip-demo`, `--level 0..3` |
| `pnpm kb:index` | `semantic/index.mjs` | построить/обновить гибридный индекс (+ `doc_date`, `status`) |
| `pnpm kb:search` | `semantic/search.mjs` | hybrid-поиск (vector + BM25 + RRF + graph + temporal; stub/deprecated скрыты) |
| `pnpm kb:think` | `semantic/think.mjs` | промпт-синтез с цитатами |
| `pnpm kb:eval` | `semantic/eval.mjs` | retrieval-eval (recall@k/MRR) + регрессия vs baseline + D3-гейт (stub в топах); A/B `--graph/--rerank` |
| `pnpm kb:doctor` | `kb-doctor.mjs` | health-check KB (+ advisory: stale inbox/answer-cards, stub-карточки) |
| `pnpm kb:verify` | `semantic/verify.mjs` | проверка цитат `[source:]` (Tier-1 gate: traversal/coverage + FACT-advisory + critique); `--scan --provenance` — CI-гейт (N3/N4); `--scan` без `--no-semantic` — Tier-2 из индекса (D2) |
| `pnpm kb:metrics` | `kb-metrics.mjs` | тренды качества из журнала по неделям (D1) |
| `pnpm kb:digest` | `kb-digest.mjs` | утренний дайджест состояния KB (D4; см. `../docs/automation.md`) |
| `pnpm kb:research` | `kb-research.mjs` | ограниченное исследование по ролям: ручные промпты или явный `--execute`, квоты, чеки и независимое ревью |
| `pnpm kb:approve` | `kb-approve.mjs` | подпись эффекта решения человеком: `status: accepted` + `approved_by/at/ref/hash`; `--check` показывает proposed/accepted/stale/unsigned |
| `pnpm kb:inbox` | `kb-inbox.mjs` | всё, что ждёт человека (решения, этапы, сравнения навыков, профиль, inbox, открытые находки) с командой на каждую карточку |
| `pnpm kb:invariants` | `check-invariants.mjs` | архитектурные инварианты `harness/invariants.json` с храповиком (новое нарушение — красный; вылеченная заморозка — удалить); входит в `pnpm check` |
| `pnpm kb:roster` | `kb-roster.mjs` | реестр ролей, сценариев и навыков с потребителями: что есть, что подключено, где копии у клиентов (read-only) |
| `pnpm kb:update` | `kb-update.mjs` | обновление ядра от upstream по `.template-manifest.json` (C3) |
| `pnpm kb:critic` | `kb-critic.mjs` | revision-промпт по битым цитатам; `--execute` запускает verify→revise через выбранный LLM-адаптер (N1) |
| `pnpm kb:dream` | `dream-cycle.mjs` | еженедельный LLM-аудит + fact-консолидация (пишет в `.context/`) |
| — | `suggest-links.mjs` | advisory-предложения `related:` (on-device, в `.context/`) |
| — | `parse-raw.mjs` | бинарный артефакт (PDF/docx) → черновик `02_sources` (markitdown, опц.) |
| — | `semantic/rerank.mjs` | опц. cross-encoder rerank (подключается флагом `--rerank`) |
| — | `semantic/test-retrieval.mjs` | офлайн-юнит-тесты graph/temporal (CI-гейт) |
| — | `semantic/test-control.mjs` | офлайн-тесты critique/provenance/маскирования цитат (CI-гейт) |
| — | `semantic/test-gate.mjs` | adversarial-сьют контура доверия — векторы обхода гейта (A3, CI-гейт) |
| — | `skillopt/mcp-server.mjs` | read-only MCP SkillOpt: `skill_list_runs`, `skill_get_trace`, `skill_get_proposal`, `skill_list_evals`, `skill_get_eval`, `skill_get_comparison`; мутации — только через `pnpm skill` |
| `pnpm skill` | `skillopt/cli.mjs` | SkillOpt CLI: `new` (эталон → `.context/`), `list`, `eval`/`rollout`, `reflect`, `propose`, `compare`, `approve`, `diff`, `apply`, `revert`, `runs` |
| — | `check-decisions.mjs`, `check-md-frontmatter.mjs`, `check-provenance.mjs`, `session-start-context.mjs` | hook-скрипты (`.claude/settings.json`) |
| — | `git-hooks/pre-push` | локальный гейт цитат до CI (`git config core.hooksPath scripts/git-hooks`) |
| — | `lib/kb-root.mjs`, `lib/provenance.mjs`, `lib/journal.mjs`, `lib/frontmatter.mjs` | shared dependency-free утилиты (корень/конфиг, provenance, журнал, frontmatter) |
| — | `search-quality-probes.mjs`, `dedup-skills.mjs` | проверки качества корпуса |

## 2. Ingest/scrape-инструменты (разовые, Python)

Использовались для первичной загрузки корпуса в `06_outputs/`. **Не часть ежедневной оснастки** —
нужны только при повторном импорте/обновлении источников. Все на stdlib Python 3.9+
(внешних зависимостей нет — см. `requirements.txt`).

| Скрипт | Что делает |
|---|---|
| `import-anthropics-skills.py` | импорт github.com/anthropics/skills |
| `import-anthropics-source-available.py` | source-available карточки Anthropic (reference-стабы) |
| `import-claude-cookbooks.py` | импорт github.com/anthropics/claude-cookbooks |
| `import-fabric.py` | импорт паттернов github.com/danielmiessler/fabric |
| `scrape-cybos.py` | скрейп cybos.ai/cases (urllib, timeout 30s) |
| `cybos-manifest.py`, `skills-manifest.py` | генерация манифестов/индексов источников |

Запуск:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r scripts/requirements.txt   # сейчас no-op (только stdlib)
python3 scripts/import-fabric.py --help
```


## Harness 0.6.0: проекты, клиенты и выпуски

| Команда | Назначение |
|---|---|
| `pnpm harness:setup --client codex` | Создать управляемые файлы выбранного клиента; чужие правки сохраняются |
| `pnpm harness:check` | Проверить настройки без исправлений и без запуска модели |
| `pnpm kb:context --task ID [--workflow ID] [--role ID]` | Пакет контекста, следующий этап, источники и принятые уроки |
| `pnpm kb:profile show/propose/apply` | Предложить и подтвердить профиль работы проекта |
| `pnpm kb:findings list/add/scan/transition` | Общая очередь проблем знаний и обратной связи |
| `pnpm kb:research help` | Планирование, сбор доказательств, синтез и ревью с раздельными моделями и возобновляемой историей |
| `pnpm kb:session --help` | Создание и передача handoff-записей |
| `pnpm kb:spaces` | Проверка разделов и ссылок на документы |
| `pnpm kb:portability` | Проверка переносимости путей |
| `pnpm kb:readability` | Редакторские замечания к собственным документам |
| `pnpm check` | Общий набор проверок независимо от клиента: все проверки выполняются до конца и печатается сводка; `--fail-fast` останавливает на первом провале |
| `pnpm kb:release:baseline` | Автор шаблона: подготовить исходные хеши выпуска |
| `pnpm kb:release:check` | Автор шаблона: проверить версию и хеши |

`kb-update.mjs` теперь сравнивает baseline файлов, а не `git merge-base`. Полный порядок и
явное принятие старой базы — [обновления](../docs/upgrades.md). `template-state.mjs` содержит
проверку владения путями, сравнение полей JSON и запись результата; данные проекта не
становятся исходной upstream-базой автоматически.

`lib/llm.mjs` объединяет выполнение `think`, `critic`, `dream` через существующие адаптеры
SkillOpt. Ручной режим по умолчанию возвращает запрос без сетевого вызова. Общие правила
добавляет `lib/agent-context.mjs`. Ограничения клиентских проверок —
[совместимость](../docs/compatibility.md).

`lib/research-runner.mjs`, `lib/research-policy.mjs` и `lib/research-evidence.mjs` ведут отдельную
историю исследования: роли и лимиты, неизменяемые чеки попыток, точные цитаты, неизвестный расход,
пересмотр и независимую проверку. Начните с [руководства по исследованию](../docs/research.md);
без проектной политики `kb:research` только готовит ручные запросы.

Сценарии, передача этапов и проверяемое развитие скиллов: [руководство](../docs/work-system.md).
