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
| `pnpm kb:update` | `kb-update.mjs` | обновление ядра от upstream по `.template-manifest.json` (C3) |
| — | `kb-critic.mjs` | revision-промпт по битым цитатам; `--execute` гоняет verify→revise через `claude` (N1) |
| `pnpm kb:dream` | `dream-cycle.mjs` | еженедельный LLM-аудит + fact-консолидация (пишет в `.context/`) |
| — | `suggest-links.mjs` | advisory-предложения `related:` (on-device, в `.context/`) |
| — | `parse-raw.mjs` | бинарный артефакт (PDF/docx) → черновик `02_sources` (markitdown, опц.) |
| — | `semantic/rerank.mjs` | опц. cross-encoder rerank (подключается флагом `--rerank`) |
| — | `semantic/test-retrieval.mjs` | офлайн-юнит-тесты graph/temporal (CI-гейт) |
| — | `semantic/test-control.mjs` | офлайн-тесты critique/provenance/маскирования цитат (CI-гейт) |
| — | `semantic/test-gate.mjs` | adversarial-сьют контура доверия — векторы обхода гейта (A3, CI-гейт) |
| `pnpm skill` | `skillopt/cli.mjs` | SkillOpt CLI (rollout/reflect/diff/apply) |
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
