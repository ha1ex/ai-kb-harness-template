# AI KB Harness — шаблон

> Стартовая оснастка для проектов, где **markdown-репозиторий = knowledge base**, а вы (или ваша команда) пользуетесь AI-агентами (Claude Code, Claude Desktop, Cursor, любые MCP-клиенты) как ежедневным рабочим инструментом.

**В одной фразе:** клонируешь — и через 10 минут у тебя свой проект, где Claude / GPT / Gemini / Ollama / любая нейронка работает с твоим контентом как с базой знаний, а не как с чёрным ящиком. Полностью **on-device** после установки: единственная сетевая операция — разовая загрузка модели эмбеддингов (~120 MB) при первом индексировании; дальше ничего не уходит во внешние API, нет платных эмбеддингов, не нужен Docker.

`Phase 1 ✓` `Phase 2 ✓` `Phase 3 ✓` · `Universal LLM (claude/openai/ollama/sgpt/llm/gemini)` · `MCP-ready` · `MIT`

---

## TL;DR — что вы получаете

Четыре слоя, расположены по росту сложности. Каждый работает независимо, можно остановиться на любом.

### 1. KB-слои + правила дисциплины

Базовая структура — всё знание разложено по слоям `00_context → 02_sources → 03_wiki → 04_synthesis → 05_decisions → 06_outputs`. Это иерархия от сырого до финального.

**`AGENTS.md` — это «контракт» для агента**: правило что каждое утверждение помечается меткой (`FACT:` / `INFERENCE:` / `UNKNOWN:` / `RISK:` / `DECISION:` / `RECOMMENDATION:`) и сопровождается ссылкой `[source: /02_sources/...]`. Хук `check-decisions.mjs` блокирует запись в `/05_decisions/` если правило нарушено. `check-md-frontmatter.mjs` валидирует обязательные поля frontmatter.

### 2. Семантический поиск + синтез

Локальная ONNX-модель (`multilingual-e5-small`) индексирует все ваши `.md`. Один раз построил — дальше доступны три инструмента:

- `pnpm kb:search "запрос"` — гибридный поиск (vector + BM25 + RRF), точно находит нужный файл
- `pnpm kb:think "вопрос"` — собирает промпт с цитатами и правилами AGENTS.md; вставляешь в любую модель → получаешь ответ с обязательными метками
- `pnpm kb:doctor` — health-check: что без frontmatter, какие ссылки битые, какие orphans, что устарело

Через **MCP-сервер** эти же три tool'а (`kb_search`, `kb_think`, `kb_backlinks`) доступны напрямую Claude Code / Desktop / Cursor — агент ищет в вашей KB **без копипасты**.

### 3. Веб-витрина (`tools/viewer/`)

Локальный Vite + React + Tailwind 4 сайт с дизайн-системой v2 (13 KB-блоков, callouts, типографика, light/dark). `pnpm viewer:dev` → `http://localhost:5173`:

| Страница | Что показывает |
|---|---|
| `/` | Счётчики по слоям + последние изменения |
| Sidebar | Автогенерация по структуре каталогов (никакого захардкоженного меню) |
| `/doc/<path>` | Рендер любого `.md` с дизайн-системой + backlinks внизу |
| `/search` | Тот же hybrid retrieval, но в UI |
| `/graph` | Интерактивный граф связей (Sigma + ForceAtlas2), клик → открыть документ |
| `/open-questions` | Свод `04_synthesis/open-questions.md` + `contradictions.md` |
| `/skillopt` | Дашборд экспериментов с улучшением скиллов (слой 4) |

Это для **коллег**, которые не лезут в командную строку. `pnpm viewer:build` → статический сайт, можно деплоить куда угодно.

### 4. SkillOpt — самообучение инструкций (`scripts/skillopt/`)

Если вы написали `skills/skill-ingest.md` (пошаговая процедура «как обработать новый артефакт»), как понять, что Claude её правильно следует? Раньше — никак, только глазами. Теперь:

```bash
pnpm skill rollout skill-ingest    # прогоняет тест-кейсы через LLM
pnpm skill reflect <run-id>        # LLM смотрит провалы, предлагает улучшения skill.md
pnpm skill diff <run-id>           # показывает unified diff
pnpm skill apply <run-id>          # копирует улучшенную версию + git add (НЕ commit)
git diff --staged && git commit    # вы ревьюите и фиксируете (или pnpm skill revert)
```

**Работает с любой нейронкой** — auto-detect: если есть `claude` CLI — берёт его, если есть `OPENAI_API_KEY` — идёт по HTTP, через `--base-url http://localhost:11434/v1` подключается к локальной Ollama. Adapter `generic-cli` покрывает sgpt / llm Simon Willison / gemini / codex / любой CLI.

**Защита от ошибок**: `reflect` отказывается работать при <5 кейсах (overfit prevention) или 100% pass-rate (нет повода); `apply` отказывается если working tree грязный (защита ручных правок); backup в `.context/skillopt/<run>/backups/` + `pnpm skill revert <run-id>`.

Идея вдохновлена [microsoft/SkillOpt](https://microsoft.github.io/SkillOpt/), но реализация **без привязки к Azure OpenAI** — работает с любой LLM.

---

## Четыре типичных сценария

**A. Начинаю новый проект.**
```bash
gh repo create my-research --template ha1ex/ai-kb-harness-template --public --clone
cd my-research
# Поправь AGENTS.md (TODO: цель проекта), CLAUDE.md (язык, workflow)
# Положи первый файл в 01_raw/research/
cd scripts/semantic && pnpm install && cd ../..
node scripts/semantic/index.mjs     # построить индекс (~3 минуты для ~200 файлов)
```

**B. Я задал агенту вопрос по KB.**
Claude в IDE видит MCP-tools (`.mcp.json` подхвачен). Сначала вызывает `kb_search` — находит топ-10 чанков. Потом `kb_think` — собирает промпт с цитатами и правилами AGENTS.md. Отвечает уже с метками: `FACT: ARR в Q1 = 12М ₽ [source: /02_sources/2026-04-finance.md]. UNKNOWN: retention за 12 месяцев — нет источника`. Никаких выдумок.

**C. Я правлю важный wiki-файл.**
```bash
pnpm kb:search "тема" --explain                   # точно ли я правлю нужный файл?
node scripts/semantic/backlinks.mjs 03_wiki/foo.md  # кто на меня ссылается (5 файлов)
# меняю аккуратно, понимая blast radius
node scripts/semantic/index.mjs                   # инкрементальная переиндексация (~1 сек)
```

**D. AI плохо следует моему скиллу.**
```bash
pnpm skill rollout skill-ingest        # 2 из 3 кейсов провалились
pnpm skill reflect <run-id>            # модель смотрит провалы, предлагает правку skill.md
pnpm skill diff <run-id>               # вижу что добавилась секция «всегда проверяй frontmatter»
pnpm skill apply <run-id>              # копирует + git add (НЕ commit)
pnpm skill rollout skill-ingest        # 3 из 3 ✓
git commit -m "skill-ingest v0.2"
```

---

## Что шаблон **не** делает за вас

- **Не пишет KB вместо вас** — это ваше содержание, шаблон только наводит порядок.
- **Не платит за LLM** — токены OpenAI/Anthropic из вашего кармана. Можно вообще без LLM: `kb:search` локальный, `kb:doctor` локальный, eval-suites работают как regression-тесты (`pnpm skill score <run-id>` офлайн).
- **Не коммитит за вас** — `skill apply` только `git add`, человек смотрит diff и решает commit/revert.
- **Не лезет в облако** — embedder, БД, поиск, граф, MCP — всё на вашей машине.

---

## Зачем это нужно

Когда вы работаете с AI-агентом по живому проекту больше пары недель, появляются три повторяющиеся боли:

1. **Агент галлюцинирует** про содержимое вашего проекта. Он не знает, что в `04_synthesis/migration-risks.md` уже есть ответ — потому что вы не положили этот файл в контекст. И сам он его не найдёт без явных инструментов.
2. **Дисциплина рассуждений плывёт**. Агент путает факты, гипотезы и решения. Через месяц у вас в репозитории `RECOMMENDATION`-ы, выданные за `FACT`, и никто уже не помнит, какой был source.
3. **KB накапливает скрытый долг**. Файлы без frontmatter, ссылки `related:` указывают в никуда, orphan-страницы, на которые никто не ссылается. Найти руками — никто не будет.

Этот шаблон закрывает эти три боли пятью независимыми инструментами, которые работают вместе.

---

## Что внутри

```
ai-kb-harness-template/
├── AGENTS.md                  ← системный промпт для агентов (метки, citation, ingest workflow)
├── CLAUDE.md                  ← operational rules (язык, дисциплина, артефакты)
├── .mcp.json                  ← конфиг MCP-сервера, подхватывается Claude Code
├── .claude/settings.json      ← permissions + pre/post-tool-use hooks
├── .remember/core.md          ← semantic invariant проекта (коммитится)
├── skills/                    ← рабочие процедуры с триггерами
│   ├── skill-ingest.md
│   └── skill-decision-log.md
├── scripts/
│   ├── semantic/              ← гибридный поиск + синтез + MCP-сервер
│   │   ├── index.mjs          ← индексатор (e5-small + sqlite-vec + FTS5)
│   │   ├── search.mjs         ← hybrid search (vector + BM25 + RRF)
│   │   ├── think.mjs          ← синтез-промпт с системной частью из AGENTS.md
│   │   ├── backlinks.mjs      ← кто ссылается на файл
│   │   ├── mcp-server.mjs     ← stdio MCP с tools kb_search/kb_think/kb_backlinks
│   │   └── lib.mjs            ← всё ядро
│   ├── kb-doctor.mjs          ← health-check KB (missing fm, broken related, orphans, stale)
│   ├── dream-cycle.mjs        ← еженедельный LLM-аудит (drop-zone в .context/)
│   ├── check-decisions.mjs    ← PreToolUse hook для /05_decisions/
│   ├── check-md-frontmatter.mjs  ← PreToolUse hook на frontmatter в значимых слоях
│   └── session-start-context.mjs ← SessionStart hook с git/.remember-выдержкой
├── tools/viewer/              ← локальный веб-интерфейс KB (Vite + React)
│   ├── server.ts              ← минимальный API (tree, doc, graph, search)
│   ├── src/v2/styles/v2.css   ← дизайн-система: токены + 13 KB-блоков + callouts
│   ├── src/v2/components/MarkdownDoc.tsx  ← рендер любого .md со всеми KB-блоками
│   ├── src/components/Sidebar.tsx  ← data-driven навигация по структуре каталогов
│   ├── src/routes/Index, KbLayer, DocumentView, Search, Graph, OpenQuestions
│   └── package.json           ← React 19 + Tailwind 4 + Sigma 3 + radix-ui
└── 00_context..06_outputs/    ← слои KB (см. AGENTS.md)
```

### Семь ключевых инструментов

| Инструмент | Зачем | Закрытая боль |
|---|---|---|
| **Hybrid search** (`scripts/semantic/search.mjs`) | Vector + BM25 + RRF, локально через ONNX-модель `multilingual-e5-small` | Агент не находил нужный файл (vector промахивался на аббревиатурах, BM25 — на перифразах) |
| **`think`** (`scripts/semantic/think.mjs`) | Собирает промпт-контекст с **системной частью из `AGENTS.md`** + цитатами + возрастом источников | Агент путал FACT/INFERENCE/UNKNOWN; ответы без ссылок |
| **`backlinks`** (`scripts/semantic/backlinks.mjs`) | Кто ссылается на файл (через frontmatter `related:`) — видишь blast radius перед правкой | Правка wiki ломала связи в /04_synthesis/ и /05_decisions/, никто не замечал |
| **MCP-сервер** (`scripts/semantic/mcp-server.mjs`) | Tools `kb_search`, `kb_think`, `kb_backlinks` доступны любому MCP-клиенту | Чтобы агент в другой сессии работал с KB — приходилось пересылать файлы вручную |
| **kb-doctor** (`scripts/kb-doctor.mjs`) | Health-check: missing frontmatter, broken `related:`, orphans, stale synthesis | KB накапливала скрытый долг; никто не замечал |
| **Dream cycle** (`scripts/dream-cycle.mjs`) | Еженедельный LLM-аудит: что устарело, новые противоречия, что синтезировать. Никогда не пишет в KB сам — только дроп-зона | Open questions месяцами висели закрытыми, никто не проверял |
| **Viewer** (`tools/viewer/`) | Локальное веб-приложение: главная с обзором слоёв, рендер любого `.md` со всей дизайн-системой, страница поиска, интерактивный граф связей, страница open-questions/contradictions. `pnpm dev` → `localhost:5173` | KB видна только через текстовый редактор; коллегам тяжело ориентироваться; нет единого UI для поиска/графа |

Плюс **дисциплина утверждений**: каждое нетривиальное высказывание помечается `FACT/INFERENCE/ASSUMPTION/UNKNOWN/RISK/DECISION/RECOMMENDATION` с цитатой `[source: /path]`. Эти правила живут в `AGENTS.md` и проверяются хуками `check-decisions.mjs` / `check-md-frontmatter.mjs`.

---

## Кому полезно

**Подходит, если у вас:**
- Содержательный проект, где знание копится: исследование, продуктовое решение, due diligence, миграция, расследование инцидента, написание книги/статьи.
- Markdown — основной формат (или вы готовы конвертировать в него).
- Используете AI-агента не для одноразовых задач, а как ежедневный инструмент.

**Конкретные сценарии:**
- **Продуктовый ресёрч** (наш исходный кейс — pricing redesign). Десятки источников, противоречия, evidence в постоянной ревизии.
- **M&A / Due diligence**. Куча документов, нужна дисциплина «факт vs гипотеза», структура «источник → wiki → synthesis → decision».
- **Архитектурные decisions**. ADR-формат с явной дисциплиной evidence, поиском по истории решений, backlinks от decision к источникам.
- **Расследования / постмортемы**. Хронология + противоречивые показания + явное выделение `UNKNOWN`.

**Не подходит, если:**
- Знание живёт в коде, не в документах.
- Нужна real-time коллаборация (Notion/Confluence-стиль). Этот шаблон — про solo или small-team с git-workflow.
- Объём KB > 50K страниц. SQLite + on-device embedder упрётся в потолок; нужен Postgres+pgvector.

---

## Quick start (5 шагов, ~5 минут)

### 1. Создать проект из шаблона

В GitHub UI: кнопка **«Use this template»** → новый репозиторий.
Или через CLI:

```bash
gh repo create my-project --template ha1ex/ai-kb-harness-template --public --clone
cd my-project
```

### 2. Поставить зависимости

Требования: **Node 22** (в репо есть `.nvmrc` — `nvm use` подхватит), **pnpm** через `corepack enable`.

Одной командой (ставит все три под-пакета — semantic, skillopt, viewer):

```bash
pnpm run setup
```

Или только семантик-индекс:

```bash
cd scripts/semantic && pnpm install && cd ../..
```

(При первом запуске индексатора качается ONNX-модель `multilingual-e5-small` ~120 MB в `scripts/semantic/.transformers-cache/`, gitignored — единственная сетевая операция, дальше всё локально.)

> **Supply chain:** запускайте `pnpm audit`. В шаблоне применён `pnpm.overrides` на `protobufjs>=7.5.8` (закрывает critical-RCE из транзитивной ONNX-зависимости). Viewer-API по умолчанию слушает только `127.0.0.1` (для доступа из сети — `VIEWER_HOST=0.0.0.0`).

### 3. Заполнить персонализированные плейсхолдеры

Откройте и поправьте:

- `AGENTS.md` — заменить блок `Project purpose` (TODO внутри).
- `CLAUDE.md` — поправить язык / workflow / запуск проекта (TODO внутри).
- `.remember/core.md` — заполнить «Цель проекта», «Контекст», «Hard rules».

Лицензия: `LICENSE` (MIT). Замените copyright-holder при необходимости.

### 4. Положить первый артефакт

Простейший сценарий — кладёте свой первый источник:

```bash
mkdir -p 01_raw/research
cp ~/your-document.md 01_raw/research/2026-XX-XX-first-source.md
```

Потом просите Claude обработать его по skill-ingest (этот скилл создан в `skills/skill-ingest.md`):

```
Привет. Обработай новый артефакт /01_raw/research/2026-XX-XX-first-source.md по skill-ingest.
```

Claude пройдёт по 11 шагам и создаст файлы в `/02_sources/`, `/03_wiki/`, `/04_synthesis/`.

### 5. Запустить индекс и убедиться, что всё работает

```bash
node scripts/semantic/index.mjs           # построить hybrid-индекс (vector + BM25 + links)
node scripts/semantic/search.mjs "тема"   # проверить поиск
node scripts/kb-doctor.mjs                # health-check
```

### MCP — для подключения в Claude Code

`.mcp.json` в корне уже настроен. Перезапустите Claude Code в этом проекте — появятся tools `kb_search` / `kb_think` / `kb_backlinks`. Дальше агент будет вызывать их сам, без передачи файлов вручную.

### 6. Поднять веб-приложение для коллег

Для людей, которые не лазят в командную строку — есть локальный веб-интерфейс KB (`tools/viewer/`):

```bash
cd tools/viewer
pnpm install     # ~15 секунд
pnpm dev         # API на :3001 + клиент на :5173
```

Открыть `http://localhost:5173` — будет:
- **Главная** — обзор всех слоёв KB с счётчиками и последними изменениями.
- **Sidebar** — data-driven дерево по структуре каталогов (читает `/api/tree`).
- **Любой документ** — `/doc/<path>` рендерит markdown через единый компонент с дизайн-системой v2 (13 KB-блоков, callouts, типографика). Внизу — backlinks (кто ссылается).
- **Поиск** — `/search` вызывает hybrid retrieval из `scripts/semantic/`. Режимы: hybrid / vector / bm25.
- **Граф связей** — `/graph` рисует интерактивный граф (Sigma + ForceAtlas2): ноды = файлы, рёбра = `related:` из frontmatter. Клик по ноде → открыть документ.
- **Открытые вопросы** — `/open-questions` показывает `04_synthesis/open-questions.md` + `contradictions.md` в едином виде.

Для деплоя коллегам — `pnpm build`, выложить `dist/` куда угодно (Vercel, Netlify, S3, любой статик-хостинг). Для прода с динамическими данными — поднять `server.ts` рядом.

### 7. SkillOpt — регрессионные тесты и оптимизация SKILL.md (опционально)

Превращает скиллы из статических `SKILL.md` в эволюционирующие документы с метриками. Идея вдохновлена [microsoft/SkillOpt](https://microsoft.github.io/SkillOpt/) — `rollout → reflect → edit → gate` — но реализована **без привязки к конкретной нейронке**: claude CLI, OpenAI HTTP API, Ollama, LiteLLM, любой OpenAI-compatible endpoint.

**Установка:**

```bash
cd scripts/skillopt
pnpm install        # cosmiconfig + p-queue + zod + js-yaml
cd ../..
```

**Phase 1 (уже работает) — regression-тесты скиллов:**

```bash
pnpm skill list                              # обзор: какие скиллы, сколько eval'ов
pnpm skill rollout skill-ingest              # прогнать все eval'ы скилла через LLM
pnpm skill rollout skill-ingest --case happy-path
pnpm skill score <run-id>                    # офлайн: пересчитать graders без LLM
pnpm skill rollout skill-ingest --ci         # exit 1 если pass-rate < 100%
```

Результат каждого прогона — в `.context/skillopt/<run-id>/`:
- `summary.json` — pass/fail/score, токены, по-скильному breakdown
- `traces/<skill>__<case>.json` — полный trace (prompt, response, grader details)

**Подключение нейронки.** По умолчанию `provider=auto`: пробует `claude` CLI → fallback на `openai-http` если `OPENAI_API_KEY` задан → иначе actionable error. Явно:

```bash
# OpenAI
export OPENAI_API_KEY=sk-...
pnpm skill rollout skill-ingest --provider openai-http --model gpt-4o-mini

# Локальный Ollama (OpenAI-совместимый)
ollama serve &
pnpm skill rollout skill-ingest \
  --provider openai-http \
  --base-url http://localhost:11434/v1 \
  --model llama3

# Или через .skillopt.json в корне репо
cat > .skillopt.json <<EOF
{
  "provider": "openai-http",
  "model": "gpt-4o-mini",
  "concurrency": 2
}
EOF
```

**Формат eval-кейса** (`skills/<skill-name>/evals/<case-id>.yaml`):

```yaml
---
type: eval-case
version: v0.1
skill: skill-ingest
grader: label-presence       # contains | label-presence (phase 2: + llm-judge + json-schema)
tags: [regression, happy-path]
---
# Input
Текст промпта. Поддержка {{file:fixture.md}} для подгрузки фикстур
из skills/<name>/evals/_fixtures/.

# Expected
- required labels: FACT, INFERENCE
- at least: 2 distinct
```

Готовые примеры — `skills/skill-ingest/evals/happy-path.yaml` (label-presence), `skills/skill-ingest/evals/no-fabrication.yaml` (contains, проверка что модель отвечает `UNKNOWN:` а не выдумывает retention rate), `skills/skill-decision-log/evals/decision-with-source.yaml`.

**Phase 2** (в разработке): `reflect` (LLM анализирует traces и предлагает правки в `proposals/<skill>.md` с метками AGENTS.md), `diff`/`apply` (human-in-the-loop коммит), llm-judge и json-schema graders, `generic-cli` adapter (sgpt, llm Simon Willison, gemini).

**Phase 2** (готово): полный цикл оптимизации:

```bash
pnpm skill rollout skill-foo            # собрать traces (Phase 1)
pnpm skill reflect <run-id>             # 2-й LLM-pass предлагает правки
pnpm skill diff <run-id>                # unified diff proposal vs current
pnpm skill apply <run-id>               # overwrite skills/, git add, backup
git diff --staged skills/               # человек смотрит и решает
git commit -m "skill-foo: optimized [run <id>]"
# или откат:
pnpm skill revert <run-id>
pnpm skill runs                         # последние runs из metrics
```

Защита от ошибок: `reflect` отказывается работать если <5 кейсов (overfit) или pass_rate=100%. `apply` отказывается если working tree грязный — не теряет ручные правки. Backup в `.context/skillopt/<run>/backups/`. Новые graders: `llm-judge` (рубрика + LLM в качестве судьи) и `json-schema` (валидация JSON output). Adapter `generic-cli` — для sgpt/llm/gemini/любого CLI с config-driven argv + stdin.

**Phase 3** (готово):

- **MCP-сервер** `scripts/skillopt/mcp-server.mjs` (зарегистрирован в `.mcp.json` рядом с `kb-local`). Read-only tools: `skill_list_runs`, `skill_get_trace`, `skill_get_proposal`, `skill_list_evals`, `skill_get_eval`. Агент в Claude Code/Desktop может смотреть историю оптимизации, но **мутации** (`rollout`/`reflect`/`apply`) остаются за CLI — human pulls the trigger.
- **Страница `/skillopt` в viewer**: список runs с pass-rate и стоимостью, drill-down в traces, ссылки на `pnpm skill diff/apply <run-id>`. Видна по `pnpm viewer:dev` → `http://localhost:5173/skillopt`.

---

## Архитектура (как куски связаны)

```
┌────────────────────────────────────────────────────────────────┐
│                  AI-агент (Claude Code, Desktop, ...)          │
└──────────┬─────────────────────────────────────┬───────────────┘
           │                                     │
   читает прямо файлы                  вызывает через MCP
           │                                     │
           ▼                                     ▼
   ┌─────────────────┐              ┌─────────────────────────┐
   │ markdown KB     │              │ scripts/semantic/       │
   │ 00..06_*/       │              │  mcp-server.mjs         │
   │ AGENTS.md       │              │  └─ kb_search           │
   │ CLAUDE.md       │              │  └─ kb_think            │
   │ .remember/      │              │  └─ kb_backlinks        │
   └────────┬────────┘              └────────┬────────────────┘
            │                                │
            │ индексируется ───────────────▶ │
            │                                ▼
            │                       ┌──────────────────────┐
            │                       │ .semantic-index      │
            │                       │   .sqlite            │
            │                       │ ├─ chunks (text)     │
            │                       │ ├─ vec_chunks (e5)   │
            │                       │ ├─ fts_chunks (BM25) │
            │                       │ ├─ files (mtime)     │
            │                       │ └─ links (related:)  │
            │                       └──────────────────────┘
            │
   правка в KB ──▶ hooks из .claude/settings.json:
                    • SessionStart: session-start-context.mjs (контекст)
                    • PreToolUse:   check-decisions.mjs       (dec-карточки)
                                    check-md-frontmatter.mjs  (frontmatter)
```

**Ключевые abstractions:**
- **Слои KB** (`00..06_*`) — каноническая иерархия `evidence → summary → wiki → synthesis → decision → output`. Определяется в `AGENTS.md`, проверяется хуками, индексируется семантик-поиском.
- **Метки утверждений** — `FACT/INFERENCE/ASSUMPTION/UNKNOWN/RISK/DECISION/RECOMMENDATION`. Жёсткое правило в `AGENTS.md`, инжектится в системный промпт `think` / `kb_think`, проверяется `check-decisions.mjs`.
- **Frontmatter `related:`** — единственный источник связей между файлами. Парсится в `index.mjs`, питает `backlinks.mjs`, валидируется `kb-doctor.mjs`.
- **MCP как мост** — `scripts/semantic/mcp-server.mjs` экспонирует те же три операции (`search`, `think`, `backlinks`), что CLI, но через JSON-RPC. Один индекс — несколько клиентов.

---

## Параметризация под свой проект

Большинство кода — generic. Что обычно надо подкрутить:

| Файл | Что менять |
|---|---|
| `AGENTS.md` § Project purpose | Цель и контекст проекта (TODO внутри) |
| `CLAUDE.md` § Язык | Если у вас English-команда — переведите |
| `CLAUDE.md` § Дисциплина веток | Workflow вашей команды (rebase / squash / ff-merge) |
| `CLAUDE.md` § Запуск проекта | Команды разработки, если репозиторий не чисто-KB |
| `.remember/core.md` | Hard rules, инвариант проекта |
| `scripts/semantic/lib.mjs` → `INDEXABLE_LAYERS` | Если у вас другая структура слоёв (например, добавили `07_phase3/` или `08_launch/`) |
| `scripts/semantic/lib.mjs` → `SKIP_DIRS` | Если внутри слоёв есть подкаталоги, которые не нужно индексировать |
| `scripts/kb-doctor.mjs` → `LAYERS` | Обязательные frontmatter-поля для каждого слоя |
| `scripts/check-md-frontmatter.mjs` → `LAYER_RULES` | То же — для блокирующего hook'а |
| `.mcp.json` → имя сервера | Опционально — переименовать с `kb-local` на что-то проектное |
| `LICENSE` | Copyright holder |

Что **не нужно** менять:
- Алгоритмы поиска (`searchVec`, `searchBM25`, `fuseRRF` в `lib.mjs`).
- MCP-handler'ы в `mcp-server.mjs`.
- Логику kb-doctor.

---

## Как обновляться от upstream

Шаблон-репо не обновляет ваши клоны автоматически — это сознательное ограничение GitHub templates.

Чтобы догонять улучшения:

```bash
git remote add upstream https://github.com/ha1ex/ai-kb-harness-template.git
git fetch upstream
git diff upstream/main -- scripts/   # посмотреть что изменилось в скриптах
git checkout upstream/main -- scripts/semantic/lib.mjs   # цеплять конкретные файлы
```

Чтобы получить уведомление о новых релизах — Watch → Custom → Releases на странице репо.

---

## FAQ

**Зачем on-device, а не OpenAI/Anthropic embeddings?**
Нулевая стоимость, нулевая задержка после первого запуска, никаких leak'ов вашей KB в чужие сервисы. `multilingual-e5-small` (384-dim) для русского/английского достаточен — на enterprise-объёмах (~10K страниц) разница с топовыми моделями в качестве retrieval незначима, а стоимость 0 vs $300/мес.

**Почему sqlite-vec, а не Qdrant/Chroma/Postgres+pgvector?**
Один файл, нет процесса, нет порта, нет миграций. До ~50K чанков работает молниеносно. Если упрётесь — `lib.mjs` написан так, что миграция на другой бекенд = переписать `openDb` и три функции поиска.

**Почему MCP-сервер, а не CLI с Bash-allowlist?**
MCP-tools видны агенту как first-class инструменты с типизированной схемой. Bash-allowlist менее надёжен (escaping, прав доступа, агенту проще ошибиться с флагами). MCP — стандарт, поддерживается Claude Code, Claude Desktop, Cursor, Windsurf, ChatGPT.

**Это работает с GPT-5 / Gemini / open-source LLM?**
Шаблон не привязан к Claude. CLI-команды (`search`, `think`, `backlinks`, `kb-doctor`) работают везде — выводят stdout/JSON. MCP — открытый стандарт, его поддерживают многие клиенты. Хуки `.claude/settings.json` специфичны для Claude Code, но их можно адаптировать (Cursor использует `.cursor/`, Windsurf — свой формат).

**Можно ли использовать без AI-агента, как обычный поиск по markdown?**
Да — `search.mjs` работает сам по себе как CLI hybrid-поиск с цитатами. Это уже полезнее `grep -r`.

---

## Происхождение и кредиты

- Идея «brain = markdown-репо + структурированный AI-доступ» вдохновлена [gbrain](https://github.com/garrytan/gbrain) Garry Tan. Этот шаблон — другая реализация той же идеи: без платных embeddings, без миграции на Postgres, без BunSDK — только Node + sqlite-vec + on-device ONNX.
- Концепция AI harness как 7 building blocks (System Prompt, Tools, Context, Skills, Hooks, Permissions, Memory) — см. [статью «AI Harness, Skills, Context: Orchestration Guide»](https://www.youngju.dev/blog/culture/2026-03-23-ai-harness-skills-context-orchestration-guide.en).
- `multilingual-e5-small` (Microsoft, MIT) для эмбеддингов; `sqlite-vec` (Alex Garcia, MIT) для vector storage; MCP SDK от Anthropic.

---

## Лицензия

MIT — см. [LICENSE](./LICENSE).
