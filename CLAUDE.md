# Правила проекта

> Этот файл загружается Claude Code как **operational rules**: язык, дисциплина, привычки.
> AGENTS.md описывает как работать с KB. CLAUDE.md — как работать в этом конкретном репо.

## Язык

<!-- ЗАМЕНИТЕ под свой проект.
Пример если KB и команда работают по-русски: оставьте как есть.
Если по-английски: переведите всё и удалите всю русскую обвязку. -->

Все артефакты проекта (документы, дашборды, сообщения коммитов) — на одном языке.
По умолчанию: **русский**.

Что можно на латинице в любом случае:
- ID, ключи, имена файлов, имена переменных и функций
- Технические термины-имена собственные (Kaiten, Asana, Linear, Slack)
- Аббревиатуры-методологии (RACI, KPI, NRR, MRR, SLA)
- Цифры и единицы (₽, %, GB, нед., мес.)

## Дисциплина веток

<!-- ЗАМЕНИТЕ под workflow команды. Пример: -->

- Работаем в feature-ветке, мерджим в `main` через ff-merge.
- После пуша в `main` — короткое резюме на естественном языке: что сделано + как проверить.
- Перед пушем — `node scripts/kb-doctor.mjs` (если health-check встроен в pre-push).

## Артефакты — сразу в git, не в `.context/`

`.context/` — gitignored зона для одноразовых черновиков, attachments и временных файлов обмена между параллельными агентами.

**Любой значимый артефакт** (документ с frontmatter `type:`, `version:` ≥ v0.1) — сразу копируется из `.context/` в коммитимую зону и пушится:

| Тип артефакта | Куда коммитить |
|---|---|
| Synthesis | `/04_synthesis/` |
| Decisions | `/05_decisions/` |
| Финальные артефакты (specs, презентации, talk-tracks) | `/06_outputs/` |

## Слои оснастки (AI harness)

Этот репозиторий — одновременно **knowledge base** и **AI-оснастка**, которая ведёт агента по слоям KB без коротких путей.

| Слой | Где живёт | Роль |
|---|---|---|
| **System prompt** | [`AGENTS.md`](./AGENTS.md) | Canonical reading order, метки утверждений, ingest workflow, citation style |
| **Operational rules** | [`CLAUDE.md`](./CLAUDE.md) (этот файл) | Язык, дисциплина веток, артефакты, запуск проекта |
| **Permissions + Hooks** | [`.claude/settings.json`](./.claude/settings.json) | Какие инструменты разрешены автоматически, какие хуки проверяют записи |
| **Working memory** | [`.remember/`](./.remember/) | `core.md` (semantic invariant, коммитится) + `now.md`/`today.md` (сессионные, gitignored) |
| **Skills** | [`skills/`](./skills/) | SKILL.md с триггерами для частых рабочих процессов |
| **Hook scripts** | [`scripts/`](./scripts/) | `check-decisions.mjs`, `check-md-frontmatter.mjs`, `session-start-context.mjs` |
| **Semantic search** | [`scripts/semantic/`](./scripts/semantic/) | On-device hybrid RAG: e5-small + sqlite-vec + FTS5 + RRF. `search.mjs`, `think.mjs`, `backlinks.mjs`. См. [README](./scripts/semantic/README.md) |
| **MCP-сервер KB** | [`scripts/semantic/mcp-server.mjs`](./scripts/semantic/mcp-server.mjs) | Stdio MCP-сервер, экспонирует `kb_search`, `kb_think`, `kb_backlinks` для любого MCP-клиента. Конфиг: [`.mcp.json`](./.mcp.json) |
| **KB-doctor** | [`scripts/kb-doctor.mjs`](./scripts/kb-doctor.mjs) | Health-check: missing frontmatter, broken `related:`, orphans, stale synthesis, ghost-записи в индексе |
| **Dream cycle** | [`scripts/dream-cycle.mjs`](./scripts/dream-cycle.mjs) | Еженедельный LLM-аудит KB: коммиты + open-questions + contradictions → промпт в `.context/dream-report-YYYY-MM-DD.md` |

**Когда что использовать:**
- Новая сессия → начать с [`AGENTS.md`](./AGENTS.md) → [`index.md`](./index.md) → `.remember/now.md` (если есть).
- Перед сложной задачей → `node scripts/semantic/think.mjs "вопрос"` для синтеза с цитатами.
- Перед правкой wiki/synthesis → `node scripts/semantic/backlinks.mjs <path>` для blast radius.
- Перед мержем большой ветки → `node scripts/kb-doctor.mjs`.
- Раз в неделю → `node scripts/dream-cycle.mjs` для генерации аудита.

## Запуск проекта (TODO)

<!-- ЗАМЕНИТЕ под свой проект.
Пример: «Frontend: `pnpm --filter viewer dev`, билд: `pnpm --filter viewer build`.» -->

TODO: команды запуска, сборки, тестов.
