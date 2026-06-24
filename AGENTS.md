# AGENTS.md

> Этот файл — **системный промпт** для AI-агентов, работающих с этой KB.
> Скрипты `scripts/semantic/think.mjs` и `scripts/semantic/mcp-server.mjs` подмешивают его как
> системную инструкцию при синтезе. Меняйте под свой проект — он обязателен к чтению.

## Project purpose

Двойной артефакт: (1) переиспользуемый шаблон AI-оснастки для markdown-репозитория-как-KB и
(2) загруженная библиотека из 736 AI-навыков/паттернов/кейсов (4 источника: anthropics-skills,
claude-cookbooks, cybos-cases, fabric-patterns). On-device hybrid RAG (e5-small + sqlite-vec +
FTS5 + RRF) + MCP-сервер дают агенту поиск и синтез по KB без копипаста.

> Внутреннее устройство оснастки (измерения харнесса, петля Compose → Adapt → Evolve) —
> `docs/architecture.md`. Это карта инструментов, не входит в порядок чтения контента ниже.

## Canonical reading order

Перед ответом на любой содержательный вопрос:
1. `/README.md`
2. `/index.md`
3. `/00_context/` (immutable контекст: что за продукт, кто стейкхолдеры, базовые ограничения)
4. `/04_synthesis/open-questions.md` (известные пробелы — не выдумывать ответы поверх них)
5. Релевантные файлы из `/03_wiki/` и `/04_synthesis/` (находятся через `kb_search` / `node scripts/semantic/search.mjs`)
6. Точка входа во внешний корпус навыков — `/06_outputs/_skills-index.md` (см. § External corpus ниже)

Не отвечать прямо из `/01_raw/`, если в `/02_sources/` есть саммари.

## Source hierarchy

1. Сырые артефакты в `/01_raw/` — immutable evidence.
2. Файлы в `/02_sources/` — короткие summary отдельных артефактов.
3. Файлы в `/03_wiki/` — концепты, агрегированные из нескольких источников.
4. Файлы в `/04_synthesis/` — интерпретация.
5. Файлы в `/05_decisions/` — принятые решения с rationale.
6. Файлы в `/06_outputs/` — финальные артефакты для людей (specs, презентации, talk-tracks).

Никогда не смешивайте факты, интерпретацию и решения без меток.

## External corpus (`06_outputs/<provider>/`)

Подпапки `06_outputs/{anthropics-skills,claude-cookbooks,cybos-cases,fabric-patterns}` — это
**зеркало внешних библиотек** (загруженный корпус, 736 карточек), а не собственный синтез проекта.
Это особый слой **вне** пирамиды `01→05`. Для карточек корпуса:

- **Цитата** = поле `source:` во frontmatter (URL первоисточника); внутренние `[source: /0..]` неприменимы.
- **Метки** `FACT/INFERENCE/…` неприменимы — это дословные upstream-артефакты, а не наши утверждения.
- **`related:`** опционально (граф по корпусу не обязателен; обнаружение — через `kb_search`).
- **Лицензия** фиксируется во frontmatter (`license`; для cybos — `license: source-available`).

Сюда же относится `06_outputs/mcp-catalog/` — курируемый каталог базовых MCP-серверов (dev-core)
с теми же правилами (источник = `source:`-URL, метки неприменимы). См. `06_outputs/mcp-catalog/_index.md`
и готовый `baseline.mcp.json`.

Пирамида слоёв (`01_raw → 05_decisions`), метки и обязательные внутренние цитаты распространяются
только на **собственный** контент проекта, который вы создаёте поверх корпуса.

## Required citation style

Каждое нетривиальное утверждение должно быть подкреплено цитатой:

```
Утверждение. [source: /02_sources/some-summary.md]
```

## Required labels

При рассуждении, синтезе или ответе каждое утверждение получает одну из меток:

- `FACT:` — прямо подтверждено в цитируемом источнике.
- `INFERENCE:` — вывод из источников через явное рассуждение.
- `ASSUMPTION:` — принятая гипотеза без evidence.
- `UNKNOWN:` — пробел; назовите артефакт, который его закрыл бы.
- `RISK:` — стратегический / операционный / финансовый риск.
- `DECISION:` — явное решение из `/05_decisions/`.
- `RECOMMENDATION:` — предложение, **никогда** не выдаваемое за факт.

Смешение этих категорий без меток — lint failure.

### Confidence на уровне утверждения

Метка говорит про *природу* утверждения (факт/вывод/гипотеза), confidence — про *уверенность* в нём.
Два уровня, второй переопределяет первый:

- **Документный дефолт** — поле `confidence: high | medium | low` во frontmatter (вся уверенность файла).
- **На уровне утверждения** — маркер `[conf: high|medium|low]` сразу после цитаты; переопределяет дефолт
  для конкретного тезиса. Пример:

  ```
  FACT: NRR удержания вырос до 118%. [source: /02_sources/2026-05-q1-metrics.md] [conf: high]
  INFERENCE: рост обеспечен сегментом enterprise. [source: /04_synthesis/retention.md] [conf: low]
  ```

`INFERENCE/ASSUMPTION/RISK` с `[conf: low]` — нормально и желательно; `FACT [conf: low]` — сигнал, что
источник слабый (пометь это). **Эволюция уверенности** (как менялся confidence тезиса по мере поступления
evidence) видна через `git log -p` файла synthesis/decision — отдельный реестр вести не нужно.

## Contradictions

Если источники противоречат друг другу:
- сохраняйте обе версии дословно;
- явно называйте конфликт;
- проставляйте confidence для каждой стороны;
- не подгоняйте под единое мнение.

Логируйте в `/04_synthesis/contradictions.md`.

## Naming conventions

- Raw артефакты: `YYYY-MM-DD-short-title.ext` (дата, тире, краткое название).
- Source summaries: `YYYY-MM-DD-short-title.md` зеркалом raw-файла.
- Wiki pages: концепт-ориентированные, без дат и версий (`feature-gates.md`, не `analysis-v2-final.md`).
- Decisions и synthesis: описательные имена концептов, даты — внутри файла во frontmatter.

## Ingest workflow

При появлении нового артефакта:
1. Файл в `/01_raw/<domain>/`.
2. Создать или обновить summary в `/02_sources/`.
3. Извлечь сущности (термины, акторы, обязательства).
4. Обновить релевантные страницы в `/03_wiki/`.
5. Обновить файлы в `/04_synthesis/`.
6. Обновить `/04_synthesis/open-questions.md` новыми пробелами.
7. Обновить `/04_synthesis/contradictions.md` если источники конфликтуют.
8. Обновить `/index.md`.
9. Добавить запись в `/log.md`.

## Frontmatter requirements

Минимальные обязательные поля по слоям (проверяет `scripts/check-md-frontmatter.mjs`):

| Слой | Обязательно |
|---|---|
| `02_sources/` | `type` |
| `03_wiki/` | `type` |
| `04_synthesis/` | `type` |
| `05_decisions/` | `type` |
| `06_outputs/` | `type`, `version` |

Дополнительные поля по желанию: `owner`, `date`, `confidence` (только `high|medium|low` — проверяет
`check-md-frontmatter.mjs`), `tags`, `related` (массив путей к связанным файлам — питает backlinks- и
graph-канал retrieval). Поле `date` (или `ingested`/`updated`) питает temporal-канал (`--since/--until/--asof`).

## Что делать НЕ нужно

- Отвечать «recommendation» из expert recall без цитат — это RECOMMENDATION без evidence.
- Сжимать / переформулировать противоречия в один тезис.
- Удалять `01_raw/*` — это immutable.
- Писать в `/03_wiki/` / `/04_synthesis/` / `/05_decisions/` без обновления `/log.md`.
