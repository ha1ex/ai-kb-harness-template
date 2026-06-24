#!/usr/bin/env node
// search.mjs — гибридный поиск по индексу KB вашего проекта (vector + BM25 + RRF).
//
// Использование:
//   node scripts/semantic/search.mjs "ваш запрос"
//   node scripts/semantic/search.mjs "ваш запрос" --top 15
//   node scripts/semantic/search.mjs "ваш запрос" --layer 04_synthesis
//   node scripts/semantic/search.mjs "ваш запрос" --mode bm25     # только BM25
//   node scripts/semantic/search.mjs "ваш запрос" --mode vector   # только vector (старое поведение)
//   node scripts/semantic/search.mjs "ваш запрос" --mode hybrid   # default: RRF(vec, bm25)
//   node scripts/semantic/search.mjs "ваш запрос" --explain       # показать вклад каналов
//   node scripts/semantic/search.mjs "ваш запрос" --json           # для использования в pipe / hook
//
// Возвращает топ-K чанков. По умолчанию — гибридный режим: vector ловит синонимы и
// перефразирования, BM25 ловит точные термины (NRR, ARR, аббревиатуры). RRF объединяет.

import { existsSync } from 'node:fs';
import {
  createEmbedder,
  QUERY_PREFIX,
  openDb,
  searchVec,
  searchBM25,
  searchHybrid,
  applyDateFilter,
  DB_PATH,
  INDEXABLE_LAYERS,
} from './lib.mjs';
import { rerank } from './rerank.mjs';
import { appendJournal, compactResults } from '../lib/journal.mjs';

const argv = process.argv.slice(2);
if (argv.length === 0) {
  console.error('Использование: node scripts/semantic/search.mjs "ваш запрос" [--top N] [--layer X] [--mode hybrid|vector|bm25] [--explain] [--json]');
  process.exit(1);
}

let topK = 10;
let layer = null;
let mode = 'hybrid';
let asJson = false;
let explain = false;
let graph = true;          // граф-канал по умолчанию вкл; пустые related: → no-op
let doRerank = process.env.KB_RERANK === '1';
let recency = false;
let since = null;
let until = null;
let asof = null;
const queryParts = [];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function takeDate(flag, raw) {
  if (!DATE_RE.test(raw || '')) {
    console.error(`${flag} ожидает дату в формате YYYY-MM-DD`);
    process.exit(1);
  }
  return raw;
}

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--top') {
    topK = parseInt(argv[++i], 10);
    if (!Number.isFinite(topK) || topK <= 0) {
      console.error('--top должно быть положительным числом');
      process.exit(1);
    }
  } else if (a === '--layer') {
    layer = argv[++i];
    if (!INDEXABLE_LAYERS.includes(layer)) {
      console.error(`--layer должен быть одним из: ${INDEXABLE_LAYERS.join(', ')}`);
      process.exit(1);
    }
  } else if (a === '--mode') {
    mode = argv[++i];
    if (!['hybrid', 'vector', 'bm25'].includes(mode)) {
      console.error('--mode должен быть hybrid | vector | bm25');
      process.exit(1);
    }
  } else if (a === '--no-graph') {
    graph = false;
  } else if (a === '--rerank') {
    doRerank = true;
  } else if (a === '--recency') {
    recency = true;
  } else if (a === '--since') {
    since = takeDate('--since', argv[++i]);
  } else if (a === '--until') {
    until = takeDate('--until', argv[++i]);
  } else if (a === '--asof') {
    asof = takeDate('--asof', argv[++i]);
  } else if (a === '--json') {
    asJson = true;
  } else if (a === '--explain') {
    explain = true;
  } else {
    queryParts.push(a);
  }
}

const query = queryParts.join(' ').trim();
if (!query) {
  console.error('Пустой запрос.');
  process.exit(1);
}

if (!existsSync(DB_PATH)) {
  console.error(`[search] БД не найдена: ${DB_PATH}.\nЗапустите: node scripts/semantic/index.mjs`);
  process.exit(1);
}

const db = openDb();

const dateOpts = { since, until, asof };
const dated = Boolean(since || until || asof);
// Глубина кандидатов: для rerank нужен запас (≥20), для date-фильтра — большой (много отсеется).
const wantK = doRerank ? Math.max(topK, 20) : topK;
const candK = dated ? Math.max(wantK * 6, 100) : wantK;

let results;
if (mode === 'bm25') {
  const raw = searchBM25(db, query, { topK: candK, layer });
  results = (dated ? applyDateFilter(raw, dateOpts) : raw).map((r) => ({ ...r, similarity: null, fused: null }));
} else if (mode === 'vector') {
  const embed = await createEmbedder();
  const [queryEmbedding] = await embed([QUERY_PREFIX + query]);
  const raw = searchVec(db, queryEmbedding, { topK: candK, layer });
  results = dated ? applyDateFilter(raw, dateOpts) : raw;
} else {
  // hybrid: vector + BM25 + RRF + опц. graph/temporal — единый orchestrator из lib.mjs.
  const embed = await createEmbedder();
  const r = await searchHybrid(db, embed, query, { topK: wantK, layer, graph, since, until, asof, recency });
  results = r.results;
}

// Опц. cross-encoder rerank (есть текст у всех режимов; деградирует если модель не грузится).
let reranked = false;
if (doRerank) {
  results = await rerank(query, results, { topN: 20 });
  reranked = results.some((r) => r.rerank_score != null);
}
results = results.slice(0, topK);

db.close();

await appendJournal({
  kind: 'search', ts: new Date().toISOString(),
  query, mode, layer, result_count: results.length, top_results: compactResults(results),
});

if (asJson) {
  console.log(JSON.stringify(
    results.map((r) => ({
      file: r.file,
      line: r.line_start,
      heading: r.heading,
      layer: r.layer,
      doc_date: r.doc_date ?? null,
      similarity: r.similarity != null ? Number(r.similarity.toFixed(4)) : null,
      bm25_score: r.bm25_score != null ? Number(r.bm25_score.toFixed(4)) : null,
      fused: r.fused != null ? Number(r.fused.toFixed(6)) : null,
      vec_rank: r.vec_rank ?? null,
      bm25_rank: r.bm25_rank ?? null,
      graph_rank: r.graph_rank ?? null,
      recency: r.recency ?? null,
      rerank_score: r.rerank_score ?? null,
      text: r.text,
    })),
    null,
    2,
  ));
  process.exit(0);
}

if (results.length === 0) {
  console.log('Ничего не найдено.');
  process.exit(0);
}

const flags = [
  graph ? null : 'no-graph',
  reranked ? 'rerank' : (doRerank ? 'rerank(skipped)' : null),
  recency ? 'recency' : null,
  since ? `since=${since}` : null,
  until ? `until=${until}` : null,
  asof ? `asof=${asof}` : null,
].filter(Boolean).join(' ');
console.log(`\n[search] запрос: «${query}»   mode=${mode}${layer ? `   layer=${layer}` : ''}   top=${topK}${flags ? `   ${flags}` : ''}\n`);

for (let i = 0; i < results.length; i++) {
  const r = results[i];
  const snippet = r.text.replace(/\s+/g, ' ').slice(0, 240);
  const dateTag = r.doc_date ? `   ${r.doc_date}` : '';
  console.log(`${String(i + 1).padStart(2)}. ${r.file}:${r.line_start}   [${r.layer}]${dateTag}   ${r.heading || ''}`);
  let scoreLine = '    ';
  if (reranked && r.rerank_score != null) {
    scoreLine += `rerank=${r.rerank_score.toFixed(3)}`;
    if (explain && r.fused != null) scoreLine += `   (fused=${r.fused.toFixed(5)})`;
  } else if (mode === 'vector') {
    scoreLine += `similarity=${r.similarity.toFixed(3)}`;
  } else if (mode === 'bm25') {
    scoreLine += `bm25_score=${r.score.toFixed(3)}`;
  } else {
    scoreLine += `fused=${r.fused.toFixed(5)}`;
    if (explain) {
      const v = r.vec_rank ? `vec#${r.vec_rank} sim=${r.vec_sim.toFixed(3)}` : 'vec—';
      const b = r.bm25_rank ? `bm25#${r.bm25_rank} score=${r.bm25_score.toFixed(2)}` : 'bm25—';
      const g = r.graph_rank ? `graph#${r.graph_rank}` : 'graph—';
      scoreLine += `   (${v}; ${b}; ${g}${recency && r.recency != null ? `; rec=${r.recency}` : ''})`;
    }
  }
  console.log(scoreLine);
  console.log(`    ${snippet}${r.text.length > 240 ? '…' : ''}`);
  console.log('');
}
