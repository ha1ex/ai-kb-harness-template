#!/usr/bin/env node
// think.mjs — собирает контекст под вопрос и формирует промпт для синтеза.
//
// Использование:
//   node scripts/semantic/think.mjs "какие вопросы остаются открытыми"
//   node scripts/semantic/think.mjs "..." --top 15 --layer 04_synthesis
//   node scripts/semantic/think.mjs "..." --execute      # вызвать настроенного провайдера
//   node scripts/semantic/think.mjs "..." --json         # машинный вывод (context + prompt)
//
// Что делает:
//   1. Hybrid search (vector + BM25 + RRF) — топ-K чанков.
//   2. Для каждого чанка считает «возраст» источника (mtime). Если все источники старше
//      порога (90 дней по умолчанию) — добавляет предупреждение «контекст не обновлялся».
//   3. Формирует промпт по правилам AGENTS.md: метки FACT/INFERENCE/ASSUMPTION/UNKNOWN,
//      цитаты [source: /path], запрет на recommendations без evidence.
//   4. По умолчанию печатает промпт в stdout (копируешь и вставляешь в Claude / любой LLM).
//      С флагом --execute вызывает явно настроенного провайдера из kb.config.mjs llm.
//
// Не пишет в БД и не модифицирует KB.

import { loadAgentContext } from '../lib/agent-context.mjs';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { completePrompt } from '../lib/llm.mjs';
import { join } from 'node:path';
import {
  createEmbedder,
  openDb,
  searchHybrid,
  DB_PATH,
  REPO_ROOT,
  INDEXABLE_LAYERS,
} from './lib.mjs';
import { appendJournal, compactResults } from '../lib/journal.mjs';

const argv = process.argv.slice(2);
if (argv.length === 0) {
  console.error('Использование: node scripts/semantic/think.mjs "вопрос" [--top N] [--layer X] [--execute] [--json]');
  process.exit(1);
}

let topK = 12;
let layer = null;
let asJson = false;
let execute = false;
let graph = true;        // граф-канал (1-hop related:) по умолчанию вкл
const queryParts = [];

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
  } else if (a === '--no-graph') {
    graph = false;
  } else if (a === '--json') {
    asJson = true;
  } else if (a === '--execute') {
    execute = true;
  } else {
    queryParts.push(a);
  }
}

const question = queryParts.join(' ').trim();
if (!question) {
  console.error('Пустой вопрос.');
  process.exit(1);
}

if (!existsSync(DB_PATH)) {
  console.error(`[think] БД не найдена: ${DB_PATH}.\nЗапустите: node scripts/semantic/index.mjs`);
  process.exit(1);
}

const db = openDb();

const embed = await createEmbedder();
const { results: fused } = await searchHybrid(db, embed, question, { topK, layer, graph });

// Свежесть источников: уникальные файлы → их mtime из таблицы files (это секунды UNIX*1000).
const uniqueFiles = Array.from(new Set(fused.map((r) => r.file)));
const fileMeta = new Map();
const now = Date.now();
const STALE_DAYS = 90;
let allStale = uniqueFiles.length > 0;
for (const f of uniqueFiles) {
  let mtimeMs = 0;
  const abs = join(REPO_ROOT, f);
  try { mtimeMs = statSync(abs).mtimeMs; } catch { mtimeMs = 0; }
  const ageDays = mtimeMs ? Math.floor((now - mtimeMs) / 86_400_000) : null;
  if (ageDays !== null && ageDays < STALE_DAYS) allStale = false;
  fileMeta.set(f, { mtimeMs, ageDays });
}
db.close();

// open-questions.md и contradictions.md — отдельно подсветим, если они попали в топ.
const openQuestionsHit = fused.find((r) => r.file === '04_synthesis/open-questions.md');
const contradictionsHit = fused.find((r) => r.file === '04_synthesis/contradictions.md');

const promptText = buildPrompt(question, fused, fileMeta, { allStale, openQuestionsHit, contradictionsHit });

await appendJournal({
  kind: 'think', ts: new Date().toISOString(),
  query: question, layer, result_count: fused.length, top_results: compactResults(fused),
});

if (asJson) {
  console.log(JSON.stringify({
    question,
    topK,
    layer,
    allStale,
    sources: uniqueFiles.map((f) => ({
      file: f,
      age_days: fileMeta.get(f).ageDays,
    })),
    chunks: fused.map((r) => ({
      file: r.file,
      line: r.line_start,
      layer: r.layer,
      heading: r.heading,
      vec_rank: r.vec_rank,
      bm25_rank: r.bm25_rank,
      fused: Number(r.fused.toFixed(6)),
      text: r.text,
    })),
    prompt: promptText,
  }, null, 2));
  process.exit(0);
}

if (execute) {
  try {
    const response = await completePrompt(promptText, { execute });
    if (!response.executed) console.error(`[think] ${response.reason}`);
    console.log(response.executed ? response.text : promptText);
  } catch (error) {
    console.error(`[think] ${error.message}; prompt follows for manual use.`);
    console.log(promptText);
    process.exitCode = 1;
  }
} else
console.log(promptText);

// --------- prompt-builder ----------

// Если в корне репо есть AGENTS.md — он становится системным промптом (это и есть
// канонический контракт «как агент должен работать с KB»). Если нет — используем generic
// дефолт с метками FACT/INFERENCE/UNKNOWN.
function loadSystemPrompt() { return loadAgentContext(REPO_ROOT); }

// Answer-policy (L5): .remember/preferences.md — ручки формы ответа, которых нет в AGENTS.md.
function loadPreferences() {
  try {
    const text = readFileSync(join(REPO_ROOT, '.remember', 'preferences.md'), 'utf8');
    if (text.trim()) return text;
  } catch { /* нет файла — no-op */ }
  return '';
}

function buildPrompt(question, chunks, fileMeta, { allStale, openQuestionsHit, contradictionsHit }) {
  const lines = [];
  lines.push('# Системная инструкция (источник: AGENTS.md, при наличии)');
  lines.push('');
  lines.push(loadSystemPrompt());
  lines.push('');
  const prefs = loadPreferences();
  if (prefs) {
    lines.push('# Answer policy (источник: .remember/preferences.md)');
    lines.push('');
    lines.push(prefs);
    lines.push('');
  }
  if (allStale) {
    lines.push(`> ⚠️ Все цитируемые источники старше ${90} дней. Указывай это в ответе как RISK: stale evidence.`);
    lines.push('');
  }
  if (openQuestionsHit) {
    lines.push(`> Вопрос частично уже в /04_synthesis/open-questions.md (chunk ${openQuestionsHit.line_start}). Сошлись.`);
    lines.push('');
  }
  if (contradictionsHit) {
    lines.push(`> Есть зафиксированные противоречия в /04_synthesis/contradictions.md (chunk ${contradictionsHit.line_start}). Не сглаживай.`);
    lines.push('');
  }
  lines.push('# Вопрос пользователя');
  lines.push('');
  lines.push(question);
  lines.push('');
  lines.push('# Контекст из KB (топ чанков, hybrid retrieval)');
  lines.push('');
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const meta = fileMeta.get(c.file);
    const age = meta?.ageDays != null ? `${meta.ageDays}д` : '?';
    lines.push(`## [${i + 1}] /${c.file}:${c.line_start}   layer=${c.layer}   heading=«${c.heading || '—'}»   age=${age}`);
    lines.push('');
    lines.push(c.text);
    lines.push('');
  }
  lines.push('# Список источников (используй ровно эти пути в [source: ...])');
  lines.push('');
  for (const f of Array.from(new Set(chunks.map((c) => `/${c.file}`)))) {
    lines.push(`- ${f}`);
  }
  lines.push('');
  return lines.join('\n');
}
