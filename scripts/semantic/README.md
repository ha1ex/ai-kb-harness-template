# Семантический поиск + синтез по локальной markdown-KB

On-device hybrid RAG: `@xenova/transformers` (ONNX) + `sqlite-vec` + FTS5 (BM25) + RRF.
Без Docker, без сервера, без облачных API. Идеи и наименования вдохновлены [gbrain](https://github.com/garrytan/gbrain).

## Что индексирует

Слои из `INDEXABLE_LAYERS` в [`lib.mjs`](./lib.mjs). По умолчанию: `00_context`, `02_sources`, `03_wiki`, `04_synthesis`, `05_decisions`, `06_outputs`.

**Не индексирует** `01_raw` (канонический поток — через 02_sources), `node_modules/`, `scripts/`, `.context/`, `.remember/`, `.claude/`, `docs/`. Поменять состав — отредактировать `INDEXABLE_LAYERS` и `SKIP_DIRS` в `lib.mjs`.

## Установка

```bash
cd scripts/semantic
pnpm install
# при первом запуске нужны postinstall-скрипты нативных модулей; если pnpm их пропустил:
pnpm rebuild
```

## Команды

| Команда | Что делает |
|---|---|
| `node scripts/semantic/index.mjs` | Инкрементальный апдейт (по mtime файла) |
| `node scripts/semantic/index.mjs --full` | Очистить БД и переиндексировать всё |
| `node scripts/semantic/index.mjs --layer 04_synthesis` | Только один слой |
| `node scripts/semantic/search.mjs "запрос"` | Гибридный поиск (vector + BM25 + RRF + graph) |
| `node scripts/semantic/search.mjs "запрос" --mode bm25\|vector\|hybrid` | Один канал или гибрид |
| `node scripts/semantic/search.mjs "запрос" --explain` | Показать вклад каждого канала |
| `node scripts/semantic/search.mjs "запрос" --no-graph` | Выключить граф-канал (1-hop `related:`) |
| `node scripts/semantic/search.mjs "запрос" --since/--until/--asof YYYY-MM-DD` | Temporal-фильтр по `doc_date` |
| `node scripts/semantic/search.mjs "запрос" --recency` | Мягкий boost свежих документов |
| `node scripts/semantic/search.mjs "запрос" --rerank` | Cross-encoder rerank (opt-in, см. ниже) |
| `node scripts/semantic/think.mjs "вопрос"` | Собрать промпт под синтез (системная инструкция = AGENTS.md, если есть) |
| `node scripts/semantic/think.mjs "вопрос" --execute` | Прогнать промпт через `claude` CLI (если в PATH) |
| `node scripts/semantic/backlinks.mjs <path>` | Кто ссылается на файл (по frontmatter `related:`) |
| `node scripts/semantic/backlinks.mjs <path> --forward` | На что ссылается сам файл |
| `node scripts/semantic/eval.mjs [--graph\|--no-graph] [--rerank]` | Retrieval-eval (recall@k/MRR) + A/B каналов |
| `node scripts/semantic/test-retrieval.mjs` | Офлайн-юнит-тесты graph/temporal (без модели) |
| `node scripts/suggest-links.mjs` | Advisory-предложения `related:` (on-device, в `.context/`) |
| `node scripts/parse-raw.mjs <file> --draft` | Бинарный артефакт → md-черновик `02_sources` (markitdown, опц.) |
| `node scripts/semantic/mcp-server.mjs` | Запустить MCP-сервер (stdio) |

Все CLI принимают `--json` для машинной обработки в pipe/hook.

## Режимы поиска

```bash
# vector — старое поведение, эмбеддинг multilingual-e5-small
node scripts/semantic/search.mjs "недомонетизированный сегмент" --mode vector

# bm25 — точные термины (NRR, ARR, аббревиатуры)
node scripts/semantic/search.mjs "NRR" --mode bm25

# hybrid (default) — RRF над двумя списками
node scripts/semantic/search.mjs "NRR" --explain
```

На терминологических аббревиатурах BM25 обычно выигрывает (точное совпадение по словарю), на перифразах — vector ловит синонимы. Гибрид (RRF, k=60) объединяет оба сигнала и стабильно лучше каждого по отдельности.

## Граф-канал (1-hop `related:`)

В гибридном режиме по умолчанию подключён третий канал: по топ-файлам текущей выдачи берутся их
1-hop соседи через `related:` (таблица `links`, в обе стороны) и подмешиваются в RRF
(`graphWeight=0.5`, слабее основных каналов). Это поднимает документы, структурно связанные с
сильным попаданием, но сами по теме отстающие — выигрыш на multi-hop вопросах. На KB без
`related:`-связей канал возвращает пусто и **не влияет** на результат (проверено eval: Δ=0).
Выключение — `--no-graph`. Предложить недостающие связи: `node scripts/suggest-links.mjs`.

## Temporal-канал (`doc_date`)

При индексации в `chunks.doc_date` кладётся дата документа из frontmatter (`date` → `ingested` →
`updated`, иначе дата mtime-файла). Это даёт:

```bash
node scripts/semantic/search.mjs "решение по тарифам" --asof 2026-03-01   # срез «на дату»: doc_date ≤ asof
node scripts/semantic/search.mjs "..." --since 2026-01-01 --until 2026-03-31  # окно
node scripts/semantic/search.mjs "..." --recency                          # мягкий boost свежих (0.5^(age/180д))
```

Документы без даты при активном `--since/--until/--asof` отбрасываются (нельзя гарантировать окно).

## Cross-encoder rerank (opt-in)

`--rerank` (или `KB_RERANK=1`) добавляет стадию cross-encoder (`Xenova/ms-marco-MiniLM-L-6-v2`,
~90 MB) поверх RRF-выдачи: пара (запрос, чанк) оценивается целиком — точнее bi-encoder + RRF.

**Почему opt-in, а не дефолт:** на встроенном смешанном RU/EN skills-корпусе `eval.mjs --rerank`
показал **регрессию** (MRR −0.08) — ms-marco-энкодер обучен на англоязычном MS-MARCO и не
подходит этому корпусу. Включайте в дефолт (`KB_RERANK=1` глобально), **только если** ваш
`eval.mjs --rerank` даёт рост. Модель грузится лениво; нет сети — стадия мягко пропускается.

## think — синтез вместо списка ссылок

`think.mjs` берёт топ-K чанков и собирает промпт, где **системная часть = содержимое `AGENTS.md`** из корня репо (если файл есть). Если `AGENTS.md` нет, используется generic-дефолт с метками `FACT/INFERENCE/ASSUMPTION/UNKNOWN/RISK/DECISION/RECOMMENDATION`.

Также промпт включает:
- топ-K чанков с указанием layer, heading и **возраста файла** в днях;
- gap-сигналы — если все источники старше 90 дней, добавляется предупреждение «stale evidence»;
- ссылки на `04_synthesis/open-questions.md` и `contradictions.md`, если они попали в топ.

По умолчанию печатает промпт в stdout — скопировать в любой LLM. С флагом `--execute` пытается прогнать через `claude` CLI, если найден в PATH.

## Backlinks

```bash
node scripts/semantic/backlinks.mjs 05_decisions/some-decision.md
```

Источник — поле `related:` в frontmatter других файлов. Обновляется при каждом reindex. Полезно перед редактированием wiki/synthesis: видишь, кто на этот файл опирается, чтобы не сломать связи.

## MCP-сервер

```bash
node scripts/semantic/mcp-server.mjs   # stdio
```

Экспонирует tool'ы для любого MCP-клиента (Claude Code, Claude Desktop, Cursor, Windsurf):

- `kb_search(query, mode?, top?, layer?, graph?, rerank?, recency?, since?, until?, asof?)` — hybrid retrieval (+graph/temporal/rerank) с JSON-результатом
- `kb_think(question, top?, layer?)` — собрать промпт-контекст под вопрос (как `think.mjs`, но через MCP)
- `kb_backlinks(path, forward?)` — кто ссылается на файл
- `kb_verify(text, threshold?, allow_corpus?)` — механическая проверка цитат `[source: /path]`
- `kb_retain(content, title?, tags?, source?)` — **write-path**: сохранить кандидат-заметку в `.context/inbox/` (status `needs-review`, НЕ коммитит, НЕ в слоях KB). Разбор — через `skill-ingest`.

Подключение в проекте — `.mcp.json` в корне (Claude Code подхватит автоматически):

```json
{
  "mcpServers": {
    "kb-local": {
      "command": "node",
      "args": ["scripts/semantic/mcp-server.mjs"]
    }
  }
}
```

Глобально для Claude Desktop: то же самое в `~/.claude/mcp.json`, но с **абсолютным путём** к `mcp-server.mjs`.

## Архитектура

| Файл | Что делает |
|---|---|
| `lib.mjs` | Чанкер (по H1/H2/H3, ≤1200 символов), эмбеддер (singleton `multilingual-e5-small`), обёртка над БД, walker по слоям, `searchVec`/`searchBM25`/`fuseRRF`/`searchGraph`/`searchHybrid`, temporal-helpers (`applyDateFilter`/`applyRecencyBoost`), парсер `related:`/`date:`, links-helpers |
| `index.mjs` | CLI индексатора. Заполняет `chunks` (+`doc_date`) + `vec_chunks` + `fts_chunks` + `links` |
| `search.mjs` | CLI поисковика. `--mode`, `--explain`, `--no-graph`, `--since/--until/--asof`, `--recency`, `--rerank`, `--layer`, `--top`, `--json` |
| `rerank.mjs` | Опц. cross-encoder rerank (`ms-marco-MiniLM`), ленивая загрузка, мягкая деградация |
| `think.mjs` | Сборка промпта-синтеза с цитатами и gap-analysis (системная инструкция из AGENTS.md) |
| `backlinks.mjs` | Обратные / прямые связи между файлами |
| `eval.mjs` | Retrieval-eval (recall@k/MRR) + регрессия vs baseline; флаги `--graph/--no-graph/--rerank` |
| `test-retrieval.mjs` | Офлайн-юнит-тесты graph/temporal на фикстурах (без модели/сети) |
| `mcp-server.mjs` | MCP-сервер (stdio): `kb_search`/`kb_think`/`kb_backlinks`/`kb_verify`/`kb_retain` |
| `package.json` | Зависимости (изолированы от корня репо) |

### Модель и префиксы

`multilingual-e5-small` (384-dim) требует обязательных префиксов:
- `passage: <текст>` — при индексации документов;
- `query: <текст>` — при поиске.

См. константы `PASSAGE_PREFIX` / `QUERY_PREFIX` в `lib.mjs`.

### Чанкование

1. Срезается YAML frontmatter (`type/owner/date/tags/...` сохраняются как сжатый hint в начале каждого чанка — модель видит «о чём документ»).
2. Текст режется по H1/H2/H3 — заголовок включается в чанк.
3. Длинные секции (>1200 символов) дробятся по абзацам.
4. Чанки <80 символов пропускаются (мусор).

### Хранение

- `chunks`: `id, file, mtime, heading, line_start, text, layer, doc_date` (`doc_date` — для temporal-канала; идемпотентная миграция добавляет колонку в старые индексы)
- `vec_chunks` (виртуальная sqlite-vec): `embedding float[384]`, связана с `chunks` по `rowid`
- `fts_chunks` (виртуальная FTS5, `unicode61 remove_diacritics 1`): копия текста для BM25
- `files`: `path, mtime, chunks` для инкремента
- `links`: `src, dst, type` — связи из frontmatter `related:` (питают backlinks И graph-канал)

БД: `.semantic-index.sqlite` в корне репо (gitignored).

### RRF (Reciprocal Rank Fusion)

```
score(doc) = Σ_i weight_i / (k + rank_i)
k = 60   (Cormack et al. 2009)
weights = [vector=1.0, bm25=1.0]
```

Документы, отсутствующие в одном из списков, не получают вклад этого канала. При включённом
графе добавляется третий член `graphWeight / (k + graph_rank)` для 1-hop соседей (см. § Граф-канал).

## Ограничения

- **Качество для русского**: e5-small даёт similarity ~0.73-0.76 для хороших попаданий. Если нужно качество выше — замените `EMBED_MODEL` в `lib.mjs` на `Xenova/multilingual-e5-base` (~280 MB, ×2 медленнее).
- **Cross-encoder rerank — opt-in**: доступен флагом `--rerank`, но по умолчанию выключен (на встроенном корпусе даёт регрессию; см. § Cross-encoder rerank). Для prose-Q&A KB может помочь — проверяйте через `eval.mjs --rerank`.
- **FTS5 без стеммера**: токенизатор `unicode61` нормализует диакритику, но не приводит к нормальной форме («сегменты» ≠ «сегмент» по BM25). Vector-канал это компенсирует.
- **Singleton embedder**: первый запрос — ~0.7 сек (загрузка модели в память), последующие — миллисекунды.

## Когда индексировать

Сейчас — **ручной** запуск. Варианты автоматизации:

1. **Cron / launchd** — раз в час `node scripts/semantic/index.mjs`.
2. **PostToolUse hook** в Claude Code — после правки `*.md` запускать reindex.
3. **Git pre-push hook** — индексировать перед пушем, чтобы коммитить актуальную «версию знания».

## Совместимость

- Node ≥18 (тестировано на 22.14)
- macOS / Linux. На Windows нативный binding `better-sqlite3` собирается, но не тестировался
- pnpm ≥10 — `onlyBuiltDependencies` для native postinstall (уже прописано в `package.json`)
