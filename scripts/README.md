# scripts/ — оснастка и ingest-инструменты

Два класса скриптов.

## 1. Оснастка KB (ежедневная, Node)

Запускаются через `pnpm` (см. корневой `package.json`). Зависимости — в `scripts/semantic/`
и `scripts/skillopt/` (поставить: `pnpm run setup`).

| Команда | Файл | Назначение |
|---|---|---|
| `pnpm kb:index` | `semantic/index.mjs` | построить/обновить гибридный индекс |
| `pnpm kb:search` | `semantic/search.mjs` | hybrid-поиск (vector + BM25 + RRF) |
| `pnpm kb:think` | `semantic/think.mjs` | промпт-синтез с цитатами |
| `pnpm kb:doctor` | `kb-doctor.mjs` | health-check KB |
| `pnpm kb:dream` | `dream-cycle.mjs` | еженедельный LLM-аудит (пишет в `.context/`) |
| `pnpm skill` | `skillopt/cli.mjs` | SkillOpt CLI (rollout/reflect/diff/apply) |
| — | `check-decisions.mjs`, `check-md-frontmatter.mjs`, `session-start-context.mjs` | hook-скрипты (`.claude/settings.json`) |
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
