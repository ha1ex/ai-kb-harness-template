#!/usr/bin/env node
// mcp-server.mjs — MCP-сервер (stdio), экспонирующий поиск/синтез/backlinks
// поверх локального semantic-индекса KB.
//
// Запуск (вручную для проверки):
//   node scripts/semantic/mcp-server.mjs
//
// Подключение в Claude Desktop / Claude Code:
//   Добавить в ~/.claude/mcp.json или .mcp.json проекта:
//     {
//       "mcpServers": {
//         "kb-local": {
//           "command": "node",
//           "args": ["/absolute/path/to/scripts/semantic/mcp-server.mjs"]
//         }
//       }
//     }
//
// Экспортируемые tools:
//   • kb_search    — гибридный поиск (vector + BM25 + RRF), JSON-результат
//   • kb_think     — собрать промпт-синтез по правилам AGENTS.md
//   • kb_backlinks — кто ссылается на файл (по frontmatter related:)
//   • kb_verify    — механическая проверка цитат [source: /path] (Tier-1 gate + FACT-advisory)
//
// Реализация переиспользует ./lib.mjs — никакой дубликации логики.

import { existsSync, statSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  createEmbedder,
  QUERY_PREFIX,
  openDb,
  searchVec,
  searchBM25,
  searchHybrid,
  applyDateFilter,
  getBacklinks,
  getForwardLinks,
  DB_PATH,
  REPO_ROOT,
  INDEXABLE_LAYERS,
} from './lib.mjs';
import { rerank } from './rerank.mjs';
import { verifyText } from './verify.mjs';
import { appendJournal, compactResults } from '../lib/journal.mjs';
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';

if (!existsSync(DB_PATH)) {
  console.error(`[mcp-kb] БД не найдена: ${DB_PATH}. Запустите: node scripts/semantic/index.mjs`);
  process.exit(1);
}

// Имя сервера — basename корня репо. Замените на своё, если хочется.
const SERVER_NAME = `kb-${basename(REPO_ROOT)}`;

// Singletons. БД открывается лениво при первом вызове (sqlite-vec при загрузке требует pwd).
let _db = null;
function db() {
  if (!_db) _db = openDb();
  return _db;
}
let _embedder = null;
async function embedder() {
  if (!_embedder) _embedder = await createEmbedder();
  return _embedder;
}

// Если в корне репо есть AGENTS.md — он становится системным промптом для kb_think.
function loadSystemPrompt() {
  try {
    const text = readFileSync(join(REPO_ROOT, 'AGENTS.md'), 'utf8');
    if (text.trim()) return text;
  } catch { /* fallthrough */ }
  return [
    'Ты помогаешь по KB этого проекта. Отвечай на русском.',
    'Каждое нетривиальное утверждение помечай меткой FACT/INFERENCE/ASSUMPTION/UNKNOWN/RISK/DECISION/RECOMMENDATION',
    'и сопровождай цитатой [source: /path]. Если evidence не хватает — отвечай UNKNOWN, не выдумывай.',
  ].join('\n');
}

const server = new McpServer({
  name: SERVER_NAME,
  version: '0.1.0',
});

// ---------- kb_search ----------

const DATE_STR = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'дата в формате YYYY-MM-DD');

server.registerTool(
  'kb_search',
  {
    description:
      'Hybrid search в локальной KB (vector e5-small + BM25 FTS5 + RRF, по умолчанию + graph-канал по related:). ' +
      'Возвращает топ-K чанков с file, line, layer, heading, doc_date, snippet и score. ' +
      'Опц.: temporal-фильтр (since/until/asof по doc_date), recency-boost, cross-encoder rerank. ' +
      'Используй ДО ответа пользователю по любому вопросу о содержимом KB. ' +
      'Без поиска сначала — ответы будут галлюцинировать.',
    inputSchema: {
      query: z.string().min(1).describe('Поисковый запрос на русском или английском.'),
      mode: z
        .enum(['hybrid', 'vector', 'bm25'])
        .optional()
        .describe('Канал поиска. По умолчанию hybrid (RRF над vector + BM25 + graph).'),
      top: z.number().int().positive().max(50).optional().describe('Сколько результатов вернуть (default 10).'),
      layer: z.enum(INDEXABLE_LAYERS).optional().describe('Фильтр по слою KB. Опционально.'),
      graph: z.boolean().optional().describe('Граф-канал (1-hop related:). Default true; пустые links → no-op.'),
      rerank: z.boolean().optional().describe('Cross-encoder rerank топ-кандидатов (точнее, но +модель ~90 MB). Default false.'),
      recency: z.boolean().optional().describe('Мягкий boost свежих документов по doc_date. Default false.'),
      since: DATE_STR.optional().describe('Только документы с doc_date ≥ since (YYYY-MM-DD).'),
      until: DATE_STR.optional().describe('Только документы с doc_date ≤ until (YYYY-MM-DD).'),
      asof: DATE_STR.optional().describe('Срез «на дату»: документы с doc_date ≤ asof.'),
    },
  },
  async ({ query, mode = 'hybrid', top = 10, layer = null, graph = true, rerank: doRerank = false, recency = false, since = null, until = null, asof = null }) => {
    const dated = Boolean(since || until || asof);
    const wantK = doRerank ? Math.max(top, 20) : top;
    const candK = dated ? Math.max(wantK * 6, 100) : wantK;

    let results;
    if (mode === 'bm25') {
      const raw = searchBM25(db(), query, { topK: candK, layer });
      results = dated ? applyDateFilter(raw, { since, until, asof }) : raw;
    } else if (mode === 'vector') {
      const embed = await embedder();
      const [qe] = await embed([QUERY_PREFIX + query]);
      const raw = searchVec(db(), qe, { topK: candK, layer });
      results = dated ? applyDateFilter(raw, { since, until, asof }) : raw;
    } else {
      const embed = await embedder();
      const r = await searchHybrid(db(), embed, query, { topK: wantK, layer, graph, since, until, asof, recency });
      results = r.results;
    }
    if (doRerank) results = await rerank(query, results, { topN: 20 });
    results = results.slice(0, top);

    const out = results.map((r, i) => ({
      rank: i + 1,
      file: r.file,
      line: r.line_start,
      layer: r.layer,
      heading: r.heading,
      doc_date: r.doc_date ?? null,
      similarity: r.similarity != null ? Number(r.similarity.toFixed(4)) : null,
      bm25_score: r.score != null ? Number(r.score.toFixed(4)) : (r.bm25_score != null ? Number(r.bm25_score.toFixed(4)) : null),
      fused: r.fused != null ? Number(r.fused.toFixed(6)) : null,
      vec_rank: r.vec_rank ?? null,
      bm25_rank: r.bm25_rank ?? null,
      graph_rank: r.graph_rank ?? null,
      rerank_score: r.rerank_score ?? null,
      snippet: r.text.length > 400 ? r.text.slice(0, 400) + '…' : r.text,
    }));

    await appendJournal({
      kind: 'search', ts: new Date().toISOString(),
      query, mode, layer, result_count: out.length, top_results: compactResults(results),
    });

    return {
      content: [
        { type: 'text', text: `Найдено ${out.length} чанков (mode=${mode}${layer ? `, layer=${layer}` : ''}${graph && mode === 'hybrid' ? ', +graph' : ''}${dated ? ', +temporal' : ''}${doRerank ? ', +rerank' : ''}):` },
        { type: 'text', text: JSON.stringify(out, null, 2) },
      ],
    };
  },
);

// ---------- kb_think ----------

server.registerTool(
  'kb_think',
  {
    description:
      'Собрать структурированный промпт-контекст под вопрос по KB. ' +
      'Возвращает системную инструкцию (метки FACT/INFERENCE/UNKNOWN/RISK/DECISION по AGENTS.md), ' +
      'топ-K релевантных чанков с цитатами и возрастом, gap-сигналы (stale evidence). ' +
      'Используй когда нужен синтез, а не просто список ссылок.',
    inputSchema: {
      question: z.string().min(1).describe('Вопрос пользователя на русском или английском.'),
      top: z
        .number()
        .int()
        .positive()
        .max(30)
        .optional()
        .describe('Сколько чанков включить в контекст (default 12).'),
      layer: z
        .enum(INDEXABLE_LAYERS)
        .optional()
        .describe('Фильтр по слою KB.'),
    },
  },
  async ({ question, top = 12, layer = null }) => {
    const embed = await embedder();
    const { results: fused } = await searchHybrid(db(), embed, question, { topK: top, layer, graph: true });

    const uniqueFiles = Array.from(new Set(fused.map((r) => r.file)));
    const now = Date.now();
    const STALE_DAYS = 90;
    const fileMeta = new Map();
    let allStale = uniqueFiles.length > 0;
    for (const f of uniqueFiles) {
      let mtimeMs = 0;
      try { mtimeMs = statSync(join(REPO_ROOT, f)).mtimeMs; } catch { mtimeMs = 0; }
      const ageDays = mtimeMs ? Math.floor((now - mtimeMs) / 86_400_000) : null;
      if (ageDays !== null && ageDays < STALE_DAYS) allStale = false;
      fileMeta.set(f, { mtimeMs, ageDays });
    }

    const lines = [];
    lines.push('# Системная инструкция (источник: AGENTS.md, при наличии)');
    lines.push('');
    lines.push(loadSystemPrompt());
    lines.push('');
    if (allStale) {
      lines.push(`> ⚠️ Все источники старше ${STALE_DAYS} дней — пометь RISK: stale evidence.`);
      lines.push('');
    }
    lines.push(`# Вопрос\n${question}\n`);
    lines.push('# Контекст (топ чанков, hybrid retrieval)');
    for (let i = 0; i < fused.length; i++) {
      const c = fused[i];
      const meta = fileMeta.get(c.file);
      const age = meta?.ageDays != null ? `${meta.ageDays}д` : '?';
      lines.push(`\n## [${i + 1}] /${c.file}:${c.line_start}  layer=${c.layer}  heading=«${c.heading || '—'}»  age=${age}\n`);
      lines.push(c.text);
    }
    lines.push('\n# Используй ровно эти пути в [source: ...]:');
    for (const f of uniqueFiles) lines.push(`- /${f}`);

    await appendJournal({
      kind: 'think', ts: new Date().toISOString(),
      query: question, layer, result_count: fused.length, top_results: compactResults(fused),
    });

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  },
);

// ---------- kb_backlinks ----------

server.registerTool(
  'kb_backlinks',
  {
    description:
      'Кто ссылается на файл (по frontmatter related:). ' +
      'Полезно ПЕРЕД редактированием wiki/synthesis: видишь blast radius. ' +
      'С forward=true — наоборот, на что ссылается сам файл.',
    inputSchema: {
      path: z.string().min(1).describe('Относительный путь к файлу, например 05_decisions/some-decision.md'),
      forward: z.boolean().optional().describe('Если true — forward links (этот → ...). Default false (backlinks).'),
    },
  },
  async ({ path, forward = false }) => {
    const rows = forward ? getForwardLinks(db(), path) : getBacklinks(db(), path);
    const direction = forward ? 'forward (этот файл → ...)' : 'backlinks (... → этот файл)';
    if (rows.length === 0) {
      return { content: [{ type: 'text', text: `${path}  ${direction}\n(связей не найдено)` }] };
    }
    const out = rows.map((r) => ({ file: forward ? r.dst : r.src, type: r.type }));
    return {
      content: [
        { type: 'text', text: `${path}  ${direction}` },
        { type: 'text', text: JSON.stringify(out, null, 2) },
      ],
    };
  },
);

// ---------- kb_verify ----------

server.registerTool(
  'kb_verify',
  {
    description:
      'Механическая проверка цитат [source: /path] в готовом ответе. ' +
      'Запусти ПОСЛЕ составления ответа с цитатами: подтверждает, что каждый путь существует, ' +
      'лежит в допустимом слое KB и не указывает на external-corpus (где цитата = source:-URL во frontmatter). ' +
      'Для FACT-меток добавляет advisory-балл семантического совпадения (НЕ блокирует, не entailment). ' +
      'Возвращает summary + per-citation JSON. passed зависит только от Tier-1 (существование/слой).',
    inputSchema: {
      text: z.string().min(1).describe('Текст ответа/синтеза с цитатами [source: /path].'),
      threshold: z.number().min(0).max(1).optional().describe('Порог advisory strong-band (default 0.82).'),
      allow_corpus: z.boolean().optional().describe('Разрешить цитаты на external-corpus карточки (default false).'),
    },
  },
  async ({ text, threshold, allow_corpus = false }) => {
    const result = await verifyText(text, {
      db: db(), embed: await embedder(), threshold, allowCorpus: allow_corpus,
    });
    const s = result.summary;
    await appendJournal({
      kind: 'verify', ts: new Date().toISOString(),
      verify: { citations_total: s.citations_total, citations_ok: s.citations_ok, passed: s.passed },
    });
    return {
      content: [
        {
          type: 'text',
          text: `Цитат: ${s.citations_total} · Tier-1 ok: ${s.citations_ok} · ${s.passed ? 'PASSED' : 'FAILED'} ` +
            `(advisory FACT: strong=${s.advisory.strong} weak=${s.advisory.weak} none=${s.advisory.none})`,
        },
        { type: 'text', text: JSON.stringify(result, null, 2) },
      ],
    };
  },
);

// ---------- kb_retain ----------

const INBOX_DIR = join(REPO_ROOT, '.context', 'inbox');

function slugify(s) {
  return (s || 'note')
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/giu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'note';
}

function nextInboxSeq() {
  let max = 0;
  try {
    for (const name of readdirSync(INBOX_DIR)) {
      const m = /^(\d{4})-/.exec(name);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
  } catch { /* dir absent yet */ }
  return String(max + 1).padStart(4, '0');
}

server.registerTool(
  'kb_retain',
  {
    description:
      'Сохранить КАНДИДАТ-заметку (наблюдение/факт/находку) в очередь на ревью .context/inbox/ — ' +
      'НЕ коммитит и НЕ пишет в слои KB. Это контролируемый write-path агента: память, которую ' +
      'агент хочет зафиксировать, попадает в ingest-ревью (skill-ingest), а человек решает, ' +
      'куда её разложить (02_sources/03_wiki/04_synthesis) и коммитить ли. Используй, когда в ходе ' +
      'работы всплыл факт/инсайт, которого ещё нет в KB. Помечай claims как FACT/INFERENCE/ASSUMPTION.',
    inputSchema: {
      content: z.string().min(1).describe('Тело заметки в Markdown. Размечай утверждения метками AGENTS.md.'),
      title: z.string().optional().describe('Короткий заголовок (станет слагом имени файла).'),
      tags: z.array(z.string()).optional().describe('Теги для будущей классификации.'),
      source: z.string().optional().describe('Откуда взято: URL, путь, «диалог с пользователем» и т.п.'),
    },
  },
  async ({ content, title = '', tags = [], source = '' }) => {
    mkdirSync(INBOX_DIR, { recursive: true });
    const seq = nextInboxSeq();
    const today = new Date().toISOString().slice(0, 10);
    const slug = slugify(title || content.split('\n')[0]);
    const fname = `${seq}-${slug}.md`;
    const abs = join(INBOX_DIR, fname);
    const fm = [
      '---',
      'type: inbox-candidate',
      `title: ${(title || slug).replace(/\n/g, ' ')}`,
      `created: ${today}`,
      'status: needs-review',
      source ? `source: ${source.replace(/\n/g, ' ')}` : null,
      tags.length ? `tags: [${tags.map((t) => String(t).trim()).filter(Boolean).join(', ')}]` : null,
      '---',
      '',
    ].filter((l) => l !== null).join('\n');
    writeFileSync(abs, fm + content.trimEnd() + '\n');

    await appendJournal({
      kind: 'retain', ts: new Date().toISOString(),
      retain: { file: `.context/inbox/${fname}`, title: title || slug, source: source || null },
    });

    return {
      content: [
        {
          type: 'text',
          text:
            `Кандидат сохранён в .context/inbox/${fname} (status: needs-review).\n` +
            'НЕ закоммичено и НЕ в слоях KB. Разбор — через skill-ingest: человек решает, ' +
            'куда разложить (02_sources/03_wiki/04_synthesis) и коммитить ли.',
        },
      ],
    };
  },
);

// ---------- start ----------

const transport = new StdioServerTransport();
await server.connect(transport);
// Лог уходит в stderr — stdout зарезервирован под JSON-RPC.
console.error('[mcp-kb] started, awaiting requests on stdio');
