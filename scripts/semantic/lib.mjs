// lib.mjs — shared helpers для semantic-index / semantic-search.
//
// Состав:
//   • chunkMarkdown(text)        — разбивает MD-файл на чанки по заголовкам + ≤ MAX_CHUNK_CHARS.
//   • createEmbedder()           — singleton multilingual-e5-small через @xenova/transformers.
//   • passagePrefix / queryPrefix — обязательные e5-префиксы.
//   • openDb(path)               — better-sqlite3 + sqlite-vec, создаёт схему при первом вызове.
//   • insertChunk / deleteFileChunks — БД-операции для чанков (vec + FTS5 синхронно).
//   • searchVec / searchBM25 / searchHybrid — три режима поиска (RRF для гибрида).
//   • parseFrontmatterLinks / upsertLinks   — извлечение и хранение связей related: между файлами.
//   • walkMarkdown(roots)        — обход KB-слоёв.
//
// Зависимости: см. ./package.json. Запуск только через CLI-обёртки index.mjs / search.mjs.

import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { pipeline, env } from '@xenova/transformers';
import { KB_ROOT, KB_DB_PATH, loadKbConfig } from '../lib/kb-root.mjs';

// ---------- константы ----------

// Project-owned настройки (слои, модель) живут в kb.config.mjs корня KB (C1);
// здесь — только дефолты шаблона. НЕ правьте этот файл под свой проект.
const cfg = await loadKbConfig();

export const EMBED_MODEL = cfg.embedder?.model ?? 'Xenova/multilingual-e5-small';
export const EMBED_DIM = cfg.embedder?.dim ?? 384;
export const MAX_CHUNK_CHARS = 1200;
export const MIN_CHUNK_CHARS = 80;
export const PASSAGE_PREFIX = 'passage: ';
export const QUERY_PREFIX = 'query: ';

// Корень целевой KB и путь индекса: env KB_ROOT / KB_DB_PATH (мультипроектность, C2)
// или репо самой оснастки (см. scripts/lib/kb-root.mjs).
const here = fileURLToPath(new URL('.', import.meta.url));
export const REPO_ROOT = KB_ROOT;
export const DB_PATH = KB_DB_PATH;

// Слои, которые индексируем. Порядок отражает каноническую иерархию из AGENTS.md.
// Своя структура — kb.config.mjs → layers.indexable (например ['docs','adr','notes'] для L0).
// 01_raw намеренно НЕ индексируется целиком: канонический поток требует ходить через 02_sources.
export const INDEXABLE_LAYERS = cfg.layers?.indexable ?? [
  '00_context',
  '02_sources',
  '03_wiki',
  '04_synthesis',
  '05_decisions',
  '06_outputs',
];

// Файлы в КОРНЕ репо (не директории-слои), которые делаем findable через поиск.
// `log.md` — changelog проекта: дешёвый «commit-history memory» без LLM-дистилляции рационалей.
// Это НЕ слой пирамиды и НЕ цитируется как [source:] — индексируется только для обнаружения.
export const INDEXABLE_ROOT_FILES = cfg.layers?.rootFiles ?? ['log.md'];

// Кэш для @xenova/transformers — кладём рядом, чтобы не загрязнять ~/.cache.
env.cacheDir = resolve(here, '.transformers-cache');
env.allowLocalModels = true;
env.useBrowserCache = false;

// ---------- chunker ----------

/**
 * Разбивает Markdown-текст на чанки.
 * Алгоритм:
 *   1. Срезает YAML frontmatter (---...---), но добавляет его сжатый «type/owner/date/tags» в каждый чанк как hint.
 *   2. Режет по H1/H2/H3 (## и ###). Заголовок включается в чанк.
 *   3. Если секция > MAX_CHUNK_CHARS — дробит по абзацам, сохраняя заголовок в начале каждого подчанка.
 *   4. Пропускает чанки < MIN_CHUNK_CHARS (мусор).
 *
 * Возвращает массив { heading, text, charStart, charEnd, lineStart }.
 */
export function chunkMarkdown(text) {
  const { body, hint, headerOffset } = stripFrontmatter(text);
  const lines = body.split('\n');

  // Соберём индексы строк с заголовками H1/H2/H3.
  const headingIdx = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,3}\s+\S/.test(lines[i])) headingIdx.push(i);
  }

  // Секции: от заголовка до следующего того же или старшего уровня, либо до конца файла.
  // Упрощение: режем просто между ЛЮБЫМИ заголовками, без иерархии.
  const sections = [];
  if (headingIdx.length === 0) {
    sections.push({ heading: '(no-heading)', lineStart: 0, body: body });
  } else {
    if (headingIdx[0] > 0) {
      const preamble = lines.slice(0, headingIdx[0]).join('\n').trim();
      if (preamble) sections.push({ heading: '(preamble)', lineStart: 0, body: preamble });
    }
    for (let h = 0; h < headingIdx.length; h++) {
      const from = headingIdx[h];
      const to = headingIdx[h + 1] ?? lines.length;
      const heading = lines[from].replace(/^#{1,3}\s+/, '').trim();
      const body = lines.slice(from, to).join('\n').trim();
      sections.push({ heading, lineStart: from, body });
    }
  }

  // Внутри каждой секции дробим, если слишком большая.
  const chunks = [];
  let charCursor = 0;
  for (const section of sections) {
    const pieces = splitLong(section.body, MAX_CHUNK_CHARS);
    for (const piece of pieces) {
      const trimmed = piece.trim();
      if (trimmed.length < MIN_CHUNK_CHARS) continue;
      chunks.push({
        heading: section.heading,
        text: hint ? `${hint}\n\n${trimmed}` : trimmed,
        rawText: trimmed,
        charStart: charCursor,
        charEnd: charCursor + trimmed.length,
        lineStart: section.lineStart + headerOffset + 1, // 1-based для удобства
      });
      charCursor += trimmed.length;
    }
  }

  return chunks;
}

function stripFrontmatter(text) {
  if (!text.startsWith('---')) return { body: text, hint: '', headerOffset: 0 };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { body: text, hint: '', headerOffset: 0 };
  const fm = text.slice(3, end);
  const body = text.slice(end + 4).replace(/^\n/, '');
  const headerOffset = text.slice(0, end + 4).split('\n').length - 1;

  // Из frontmatter берём семантические hint'ы. Кроме служебных (type/owner/date/…) включаем
  // applicability-текст — title/subtitle/description/category/name (L3 «describe-then-index»):
  // у 744 external-карт это «когда применять», раньше выбрасывалось до эмбеддинга. Теперь оно
  // попадает в вектор чанка и улучшает skill-selection по интенту. В verify Tier-2 [meta:…] всё
  // равно срезается, так что на проверку цитат не влияет.
  const want = [
    'type', 'owner', 'date', 'tags', 'status', 'domain', 'segment', 'confidence',
    'title', 'subtitle', 'description', 'category', 'name',
  ];
  const found = [];
  for (const line of fm.split('\n')) {
    const m = line.match(/^([a-z_]+):\s*(.+)$/i);
    if (m && want.includes(m[1])) {
      found.push(`${m[1]}=${m[2].trim()}`);
    }
  }
  const hint = found.length ? `[meta: ${found.join('; ')}]` : '';
  return { body, hint, headerOffset };
}

function splitLong(text, maxChars) {
  if (text.length <= maxChars) return [text];
  // Режем по двойному переносу (абзацы). Если абзац всё ещё длинный — по одному переносу.
  const paragraphs = text.split(/\n\s*\n/);
  const out = [];
  let buf = '';
  for (const p of paragraphs) {
    if (p.length > maxChars) {
      // Длиннющий абзац — режем по строкам.
      if (buf) { out.push(buf); buf = ''; }
      const lines = p.split('\n');
      let lbuf = '';
      for (const line of lines) {
        if ((lbuf + '\n' + line).length > maxChars && lbuf) {
          out.push(lbuf);
          lbuf = line;
        } else {
          lbuf = lbuf ? `${lbuf}\n${line}` : line;
        }
      }
      if (lbuf) out.push(lbuf);
      continue;
    }
    if ((buf + '\n\n' + p).length > maxChars && buf) {
      out.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf) out.push(buf);
  // Жёсткий резорт: кусок без переносов длиннее лимита (напр. одно слово/URL) — режем по символам,
  // иначе модель молча обрежет хвост на 512 токенах при индексации.
  const hard = [];
  for (const piece of out) {
    if (piece.length <= maxChars) { hard.push(piece); continue; }
    for (let i = 0; i < piece.length; i += maxChars) hard.push(piece.slice(i, i + maxChars));
  }
  return hard;
}

// ---------- embedder ----------

let _embedder = null;

export async function createEmbedder() {
  if (_embedder) return _embedder;
  // feature-extraction pipeline для предложений; e5 ожидает префикс.
  const pipe = await pipeline('feature-extraction', EMBED_MODEL, { quantized: true });
  _embedder = async (texts) => {
    const arr = Array.isArray(texts) ? texts : [texts];
    const out = await pipe(arr, { pooling: 'mean', normalize: true });
    // out — Tensor [N, dim]; возвращаем массив Float32Array длиной dim.
    const result = [];
    const data = out.data;
    const dim = out.dims[out.dims.length - 1];
    if (dim !== EMBED_DIM) {
      throw new Error(`Unexpected embed dim ${dim}, expected ${EMBED_DIM}`);
    }
    for (let i = 0; i < arr.length; i++) {
      result.push(new Float32Array(data.slice(i * dim, (i + 1) * dim)));
    }
    return result;
  };
  return _embedder;
}

// ---------- db ----------

export function openDb(path = DB_PATH) {
  const db = new Database(path);
  sqliteVec.load(db);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file TEXT NOT NULL,
      mtime INTEGER NOT NULL,
      heading TEXT,
      line_start INTEGER,
      text TEXT NOT NULL,
      layer TEXT,
      doc_date TEXT              -- 'YYYY-MM-DD' из frontmatter (date|ingested|updated) или mtime-дата. Для temporal-канала.
    );
    CREATE INDEX IF NOT EXISTS idx_chunks_file ON chunks(file);
    CREATE INDEX IF NOT EXISTS idx_chunks_layer ON chunks(layer);
    CREATE INDEX IF NOT EXISTS idx_chunks_doc_date ON chunks(doc_date);

    CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks USING vec0(
      embedding float[${EMBED_DIM}]
    );

    -- FTS5 для BM25-канала гибридного поиска.
    -- Contentless нельзя: нам нужны snippet и фильтр по layer — храним текст копией.
    -- unicode61 + remove_diacritics 1 = базовая нормализация (ё→е, regis). Без стеммера —
    -- для русского лучше работает дополнение vector-каналом (см. searchHybrid).
    CREATE VIRTUAL TABLE IF NOT EXISTS fts_chunks USING fts5(
      text,
      tokenize='unicode61 remove_diacritics 1'
    );

    CREATE TABLE IF NOT EXISTS files (
      path TEXT PRIMARY KEY,
      mtime INTEGER NOT NULL,
      chunks INTEGER NOT NULL
    );

    -- Связи между документами. Заполняется при reindex из frontmatter related: и из
    -- inline [[путь]] (если введём в P2.6). Используется для backlinks и потенциально
    -- как граф-сигнал в hybrid retrieval.
    CREATE TABLE IF NOT EXISTS links (
      src TEXT NOT NULL,         -- нормализованный путь файла-источника
      dst TEXT NOT NULL,         -- нормализованный путь файла-цели
      type TEXT NOT NULL,        -- 'related' (frontmatter) | 'wiki' (inline [[]])
      PRIMARY KEY (src, dst, type)
    );
    CREATE INDEX IF NOT EXISTS idx_links_dst ON links(dst);
    CREATE INDEX IF NOT EXISTS idx_links_src ON links(src);
  `);

  // Идемпотентная миграция: для индексов, созданных до появления doc_date, добавляем колонку.
  // Старые чанки получат doc_date=NULL до ближайшей переиндексации файла (incremental по mtime).
  const hasDocDate = db.prepare("PRAGMA table_info(chunks)").all().some((c) => c.name === 'doc_date');
  if (!hasDocDate) {
    db.exec('ALTER TABLE chunks ADD COLUMN doc_date TEXT');
    db.exec('CREATE INDEX IF NOT EXISTS idx_chunks_doc_date ON chunks(doc_date)');
  }

  return db;
}

export function deleteFileChunks(db, file) {
  const ids = db.prepare('SELECT id FROM chunks WHERE file = ?').all(file).map((r) => r.id);
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(',');
  // sqlite-vec требует BigInt для rowid-параметров (см. insertChunk).
  const bigIds = ids.map((x) => BigInt(x));
  db.prepare(`DELETE FROM vec_chunks WHERE rowid IN (${placeholders})`).run(...bigIds);
  db.prepare(`DELETE FROM fts_chunks WHERE rowid IN (${placeholders})`).run(...ids);
  db.prepare(`DELETE FROM chunks WHERE id IN (${placeholders})`).run(...ids);
  return ids.length;
}

export function insertChunk(db, { file, mtime, heading, lineStart, text, layer, embedding, docDate = null }) {
  const info = db.prepare(
    'INSERT INTO chunks (file, mtime, heading, line_start, text, layer, doc_date) VALUES (?,?,?,?,?,?,?)',
  ).run(file, mtime, heading, lineStart, text, layer, docDate);
  // sqlite-vec 0.1.x требует rowid именно как BigInt при параметризованном INSERT (Number → ошибка).
  const rowid = BigInt(info.lastInsertRowid);
  const json = floatArrayToJson(embedding);
  db.prepare('INSERT INTO vec_chunks (rowid, embedding) VALUES (?, vec_f32(?))').run(rowid, json);
  // FTS5: rowid = chunks.id (обычное число — FTS5 принимает Number).
  db.prepare('INSERT INTO fts_chunks (rowid, text) VALUES (?, ?)').run(Number(rowid), text);
  return Number(rowid);
}

function floatArrayToJson(arr) {
  // Аналогично JSON.stringify(Array.from(arr)), но без overhead создания обычного массива.
  let s = '[';
  for (let i = 0; i < arr.length; i++) {
    if (i > 0) s += ',';
    s += arr[i].toString();
  }
  s += ']';
  return s;
}

export function upsertFileRow(db, path, mtime, chunkCount) {
  db.prepare('INSERT OR REPLACE INTO files (path, mtime, chunks) VALUES (?,?,?)').run(path, mtime, chunkCount);
}

/**
 * Инкрементально проиндексировать ОДИН файл (C5). Для write-path (kb_retain/kb_promote):
 * записанная агентом карточка становится видимой поиску сразу, без ручного `kb:index`.
 * @param {object} db       открытая БД (openDb)
 * @param {function} embed  эмбеддер (createEmbedder)
 * @param {string} relPath  путь относительно REPO_ROOT (напр. '04_synthesis/_answers/x.md')
 * @param {string} [layer]  слой; по умолчанию — первый сегмент relPath
 * @returns {number} записанных чанков
 */
export async function indexSingleFile(db, embed, relPath, layer = null) {
  const abs = join(REPO_ROOT, relPath);
  const st = statSync(abs);
  const text = readFileSync(abs, 'utf8');
  const chunks = chunkMarkdown(text);
  const links = parseFrontmatterLinks(text);
  const docDate = parseFrontmatterDate(text) || new Date(st.mtimeMs).toISOString().slice(0, 10);
  const lay = layer ?? (relPath.split('/')[0] || '');

  const embeddings = [];
  const BATCH = 16;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH).map((c) => PASSAGE_PREFIX + c.text);
    embeddings.push(...await embed(batch));
  }

  const tx = db.transaction(() => {
    deleteFileChunks(db, relPath);
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      insertChunk(db, {
        file: relPath, mtime: st.mtimeMs, heading: c.heading, lineStart: c.lineStart,
        text: c.rawText, layer: lay, embedding: embeddings[i], docDate,
      });
    }
    upsertFileRow(db, relPath, st.mtimeMs, chunks.length);
    upsertLinks(db, relPath, links);
  });
  tx();
  return chunks.length;
}

export function getFileMtime(db, path) {
  const r = db.prepare('SELECT mtime FROM files WHERE path = ?').get(path);
  return r ? r.mtime : 0;
}

export function searchVec(db, queryEmbedding, { topK = 10, layer = null } = {}) {
  // Кандидаты — top-K по vec, потом join с chunks для текста и фильтрации по layer.
  // sqlite-vec не умеет JOIN в одном запросе с WHERE по другой таблице,
  // поэтому берём с запасом и фильтруем в JS.
  const overhead = layer ? Math.max(topK * 5, 50) : topK;
  const matches = db.prepare(
    'SELECT rowid, distance FROM vec_chunks WHERE embedding MATCH vec_f32(?) ORDER BY distance LIMIT ?',
  ).all(floatArrayToJson(queryEmbedding), overhead);
  if (matches.length === 0) return [];

  const ids = matches.map((m) => Number(m.rowid));
  const placeholders = ids.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT id, file, heading, line_start, text, layer, doc_date FROM chunks WHERE id IN (${placeholders})`,
  ).all(...ids);
  const byId = new Map(rows.map((r) => [r.id, r]));

  const results = [];
  for (const m of matches) {
    const row = byId.get(Number(m.rowid));
    if (!row) continue;
    if (layer && row.layer !== layer) continue;
    results.push({ ...row, distance: m.distance, similarity: 1 - m.distance / 2 });
    if (results.length >= topK) break;
  }
  return results;
}

// ---------- BM25 (FTS5) ----------

/**
 * BM25-поиск по FTS5. Возвращает массив { id, file, heading, line_start, text, layer, score, rank }.
 * Запрос конвертируем в OR-форму: «NRR ARR» → «"NRR" OR "ARR"». Это повышает recall на
 * терминологических запросах с несколькими словами (иначе FTS5-AND даёт пусто).
 *
 * FTS5 bm25() возвращает отрицательное число (чем меньше, тем релевантнее). Превращаем в
 * положительный score = -rank для удобства сортировки и логов.
 */
export function searchBM25(db, queryText, { topK = 10, layer = null } = {}) {
  const ftsQuery = buildFtsOrQuery(queryText);
  if (!ftsQuery) return [];
  const overhead = layer ? Math.max(topK * 5, 50) : topK;
  let matches;
  try {
    matches = db.prepare(
      'SELECT rowid, bm25(fts_chunks) AS rank FROM fts_chunks WHERE fts_chunks MATCH ? ORDER BY rank LIMIT ?',
    ).all(ftsQuery, overhead);
  } catch (e) {
    // Невалидный FTS-запрос (спецсимвол) ожидаем → []; прочие ошибки (повреждённый индекс,
    // ошибка схемы) логируем в stderr, чтобы деградация hybrid→vector не была невидимой.
    if (!/fts5|syntax|match|malformed|near /i.test(String(e && e.message))) {
      console.error(`[bm25] FTS5 error: ${e && e.message}`);
    }
    return [];
  }
  if (matches.length === 0) return [];

  const ids = matches.map((m) => Number(m.rowid));
  const placeholders = ids.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT id, file, heading, line_start, text, layer, doc_date FROM chunks WHERE id IN (${placeholders})`,
  ).all(...ids);
  const byId = new Map(rows.map((r) => [r.id, r]));

  const results = [];
  for (const m of matches) {
    const row = byId.get(Number(m.rowid));
    if (!row) continue;
    if (layer && row.layer !== layer) continue;
    results.push({ ...row, rank: m.rank, score: -m.rank });
    if (results.length >= topK) break;
  }
  return results;
}

// Превращает «NRR ARR-cohort» → «"NRR" OR "ARR-cohort"».
// Каждый токен оборачиваем в "..." — это в FTS5 значит «литеральная фраза», что снимает
// проблемы со спецсимволами (-, /, : etc.). Длина < 2 символов отбрасывается (стоп-шум).
function buildFtsOrQuery(text) {
  const clean = text
    .split(/\s+/)
    .map((t) => t.replace(/^["'`]+|["'`]+$/g, '').trim())
    .filter(Boolean);
  // Обычно отбрасываем 1-символьный шум; но если ВЕСЬ запрос состоит из коротких
  // токенов (RU-буква, аббревиатура) — не теряем BM25-канал целиком.
  let tokens = clean.filter((t) => t.length >= 2);
  if (tokens.length === 0) tokens = clean;
  if (tokens.length === 0) return '';
  return tokens.map((t) => `"${t.replace(/"/g, '""')}"`).join(' OR ');
}

// ---------- Hybrid (RRF) ----------

/**
 * Reciprocal Rank Fusion над vector + BM25 списками.
 *   score(doc) = Σ_i weight_i / (k + rank_i)
 * Канонический k=60 (Cormack et al. 2009). Веса 1.0 / 1.0 — нейтральные, можно тюнить
 * через опции, но дефолт хорошо работает для смешанных русско/английских запросов в KB.
 *
 * Принимает уже посчитанные списки vecResults и bm25Results (для переиспользования
 * embedder в одном вызове). Возвращает топ-K объединённых результатов с полем `fused`
 * (RRF score) и breakdown { vec_rank, bm25_rank, vec_sim, bm25_score }.
 */
export function fuseRRF(
  vecResults,
  bm25Results,
  { topK = 10, k = 60, vecWeight = 1.0, bm25Weight = 1.0, graphResults = [], graphWeight = 0.5 } = {},
) {
  const byId = new Map();
  vecResults.forEach((r, i) => {
    byId.set(r.id, {
      ...r,
      _vec_rank: i + 1,
      _vec_sim: r.similarity,
      _bm25_rank: null,
      _bm25_score: null,
      _graph_rank: null,
      _graph_weight: null,
    });
  });
  bm25Results.forEach((r, i) => {
    const existing = byId.get(r.id);
    if (existing) {
      existing._bm25_rank = i + 1;
      existing._bm25_score = r.score;
    } else {
      byId.set(r.id, {
        ...r,
        _vec_rank: null,
        _vec_sim: null,
        _bm25_rank: i + 1,
        _bm25_score: r.score,
        _graph_rank: null,
        _graph_weight: null,
      });
    }
  });
  // Граф-канал: 1-hop соседи по related:. Чанк, уже найденный vector/BM25, лишь усиливается
  // (добавляется graph-член); чанк только из графа — попадает в кандидаты со своим рангом.
  graphResults.forEach((r, i) => {
    const existing = byId.get(r.id);
    if (existing) {
      existing._graph_rank = i + 1;
      existing._graph_weight = r._graph_weight ?? null;
    } else {
      byId.set(r.id, {
        ...r,
        _vec_rank: null,
        _vec_sim: null,
        _bm25_rank: null,
        _bm25_score: null,
        _graph_rank: i + 1,
        _graph_weight: r._graph_weight ?? null,
      });
    }
  });

  const fused = [];
  for (const r of byId.values()) {
    let score = 0;
    if (r._vec_rank !== null) score += vecWeight / (k + r._vec_rank);
    if (r._bm25_rank !== null) score += bm25Weight / (k + r._bm25_rank);
    if (r._graph_rank !== null) score += graphWeight / (k + r._graph_rank);
    fused.push({
      id: r.id,
      file: r.file,
      heading: r.heading,
      line_start: r.line_start,
      text: r.text,
      layer: r.layer,
      doc_date: r.doc_date ?? null,
      fused: score,
      vec_rank: r._vec_rank,
      vec_sim: r._vec_sim,
      bm25_rank: r._bm25_rank,
      bm25_score: r._bm25_score,
      graph_rank: r._graph_rank,
      graph_weight: r._graph_weight,
    });
  }
  fused.sort((a, b) => b.fused - a.fused);
  return fused.slice(0, topK);
}

/**
 * Граф-канал retrieval (TEMPR «graph»): по списку seed-файлов (обычно топ текущей выдачи)
 * собирает их 1-hop соседей через таблицу links (related: в обе стороны) и возвращает по одному
 * представительному чанку на файл-сосед. Вес соседа = число seed-файлов, связанных с ним.
 *
 * Представитель файла = чанк с минимальным line_start (лид-секция: заголовок H1 + meta-hint),
 * этого достаточно, чтобы поднять файл в выдачу (метрика recall@k — файловая). Возвращает строки
 * вида searchVec/searchBM25 (+ поле _graph_weight) для подачи в fuseRRF({ graphResults }).
 *
 * Если related:-связей нет (типично для свежего/корпусного KB) — возвращает []. Канал не вредит.
 */
export function searchGraph(db, seedFiles, { topK = 20, layer = null } = {}) {
  if (!seedFiles || seedFiles.length === 0) return [];
  const seeds = new Set(seedFiles.map(normalizeRelPath).filter(Boolean));
  if (seeds.size === 0) return [];

  const fwd = db.prepare('SELECT dst FROM links WHERE src = ?');
  const back = db.prepare('SELECT src FROM links WHERE dst = ?');
  const weight = new Map(); // file → число seed-связей
  for (const s of seeds) {
    for (const r of fwd.all(s)) if (!seeds.has(r.dst)) weight.set(r.dst, (weight.get(r.dst) || 0) + 1);
    for (const r of back.all(s)) if (!seeds.has(r.src)) weight.set(r.src, (weight.get(r.src) || 0) + 1);
  }
  if (weight.size === 0) return [];

  // Сортировка: по весу убыв., затем стабильно по имени (детерминизм для CI).
  const ranked = [...weight.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const rep = db.prepare(
    'SELECT id, file, heading, line_start, text, layer, doc_date FROM chunks WHERE file = ? ORDER BY line_start ASC LIMIT 1',
  );
  const out = [];
  for (const [file, w] of ranked) {
    const row = rep.get(file);
    if (!row) continue;                       // dst указывает на несуществующий файл (kb-doctor словит)
    if (layer && row.layer !== layer) continue;
    out.push({ ...row, _graph_weight: w });
    if (out.length >= topK) break;
  }
  return out;
}

/** Топ-N уникальных файлов из выдачи (seed для граф-канала). Сохраняет порядок. */
export function topFiles(results, n = 5) {
  const out = [];
  const seen = new Set();
  for (const r of results) {
    if (seen.has(r.file)) continue;
    seen.add(r.file);
    out.push(r.file);
    if (out.length >= n) break;
  }
  return out;
}

/**
 * Полный гибридный retrieval: vector + BM25 + RRF, с опциональными graph- и temporal-каналами.
 * Единая точка правды — переиспользуется search.mjs / think.mjs / eval.mjs / mcp-server.mjs,
 * чтобы все каналы вели себя одинаково.
 *
 * Опции:
 *   topK            — сколько результатов вернуть.
 *   layer           — фильтр по слою KB.
 *   graph           — включить граф-канал (1-hop related:). Default true; пустые links → no-op.
 *   graphWeight     — вес граф-члена в RRF (default 0.5, слабее основных каналов).
 *   since/until/asof— temporal-фильтр по doc_date ('YYYY-MM-DD'); asof = верхняя граница «на дату».
 *   recency         — мягкий recency-boost поверх fused (по убыванию свежести). Default false.
 *   recencyWeight / recencyHalfLife — параметры затухания (default 0.3 / 180 дней).
 *
 * Возвращает { results, queryEmbedding, vec, bm, graphResults } — queryEmbedding отдаём, чтобы
 * rerank-стадия не эмбедила запрос повторно.
 */
export async function searchHybrid(db, embed, query, {
  topK = 10, layer = null,
  graph = true, graphWeight = 0.5,
  since = null, until = null, asof = null,
  recency = false, recencyWeight = 0.3, recencyHalfLife = 180,
  overK = null,
} = {}) {
  const over = overK ?? Math.max(topK * 3, 20);
  const dated = Boolean(since || until || asof);
  // При активном date-фильтре кандидатов отсеивается много — берём с большим запасом.
  const candK = dated ? Math.max(over * 4, 100) : over;

  const [queryEmbedding] = await embed([QUERY_PREFIX + query]);
  let vec = searchVec(db, queryEmbedding, { topK: candK, layer });
  let bm = searchBM25(db, query, { topK: candK, layer });
  if (dated) {
    vec = applyDateFilter(vec, { since, until, asof });
    bm = applyDateFilter(bm, { since, until, asof });
  }

  let graphResults = [];
  if (graph) {
    const prelim = fuseRRF(vec, bm, { topK: Math.max(over, 20) });
    const seeds = topFiles(prelim, 5);
    graphResults = searchGraph(db, seeds, { topK: over, layer });
    if (dated) graphResults = applyDateFilter(graphResults, { since, until, asof });
  }

  const fuseTopK = recency ? Math.max(topK * 3, over) : topK;
  let results = fuseRRF(vec, bm, { topK: fuseTopK, graphResults, graphWeight });
  if (recency) {
    applyRecencyBoost(results, { halfLifeDays: recencyHalfLife, asof, weight: recencyWeight });
    results = results.slice(0, topK);
  }
  return { results, queryEmbedding, vec, bm, graphResults };
}

// ---------- links / backlinks ----------

/**
 * Парсит frontmatter и возвращает список путей из поля related:.
 * Поддерживает два YAML-синтаксиса:
 *   related: [a.md, b.md]
 *   related:
 *     - a.md
 *     - b.md
 * Пути нормализуются: убирается ведущий слэш, обратные слэши → прямые.
 * Несуществующие файлы НЕ фильтруются (это работа kb-doctor).
 */
export function parseFrontmatterLinks(text) {
  if (!text.startsWith('---')) return [];
  const end = text.indexOf('\n---', 3);
  if (end < 0) return [];
  const fm = text.slice(3, end);
  const lines = fm.split('\n');

  const out = [];
  let inRelatedBlock = false;
  for (const line of lines) {
    // Inline-форма: related: [a, b, "c"]
    const inline = line.match(/^related:\s*\[(.*)\]\s*$/);
    if (inline) {
      for (const raw of inline[1].split(',')) {
        const cleaned = raw.replace(/^["'\s]+|["'\s]+$/g, '');
        const norm = normalizeRelPath(cleaned);
        if (norm) out.push(norm);
      }
      inRelatedBlock = false;
      continue;
    }
    // Block-form начало
    if (/^related:\s*$/.test(line)) {
      inRelatedBlock = true;
      continue;
    }
    if (inRelatedBlock) {
      const item = line.match(/^\s*-\s*(.+)$/);
      if (item) {
        const cleaned = item[1].replace(/^["'\s]+|["'\s]+$/g, '');
        const norm = normalizeRelPath(cleaned);
        if (norm) out.push(norm);
      } else if (/^\S/.test(line)) {
        // Следующее frontmatter-поле — конец related-блока
        inRelatedBlock = false;
      }
    }
  }
  return Array.from(new Set(out));
}

function normalizeRelPath(p) {
  if (!p) return '';
  let s = p.replace(/\\/g, '/').trim();
  s = s.replace(/^\.\//, '');
  s = s.replace(/^\/+/, '');
  return s;
}

// Поля frontmatter, из которых берём дату документа (в порядке приоритета).
// `date` — каноническое; `ingested` использует external-corpus (когда карточка попала в KB);
// `updated` — если автор ведёт явную дату правки.
const DATE_FM_KEYS = ['date', 'ingested', 'updated'];

/**
 * Достаёт дату документа из frontmatter в формате 'YYYY-MM-DD'.
 * Возвращает строку 'YYYY-MM-DD' или '' если ни одного из DATE_FM_KEYS нет / формат не распознан.
 * Используется индексатором для колонки chunks.doc_date (temporal-канал retrieval).
 */
export function parseFrontmatterDate(text) {
  if (!text.startsWith('---')) return '';
  const end = text.indexOf('\n---', 3);
  if (end < 0) return '';
  const fm = text.slice(3, end);
  const map = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^([a-z_]+):\s*(.+)$/i);
    if (m && DATE_FM_KEYS.includes(m[1].toLowerCase())) {
      map[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  for (const key of DATE_FM_KEYS) {
    const v = map[key];
    if (!v) continue;
    const dm = /(\d{4})-(\d{2})-(\d{2})/.exec(v);
    if (dm) return `${dm[1]}-${dm[2]}-${dm[3]}`;
  }
  return '';
}

// ---------- temporal helpers ----------

/** 'YYYY-MM-DD' → число дней с эпохи (UTC), или null. Для фильтров и recency-затухания. */
export function docDateToEpochDays(d) {
  if (!d) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return null;
  return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86_400_000);
}

/**
 * Фильтр результатов по дате документа (doc_date). Границы — 'YYYY-MM-DD'.
 *   since — нижняя (включительно), until/asof — верхняя (включительно).
 * Документы без doc_date при активном фильтре отбрасываются (мы не знаем их дату → не можем гарантировать окно).
 * Если ни одной границы нет — возвращает исходный массив без изменений.
 */
export function applyDateFilter(results, { since = null, until = null, asof = null } = {}) {
  const lo = since ? docDateToEpochDays(since) : null;
  const hi = (asof || until) ? docDateToEpochDays(asof || until) : null;
  if (lo == null && hi == null) return results;
  return results.filter((r) => {
    const e = docDateToEpochDays(r.doc_date);
    if (e == null) return false;
    if (lo != null && e < lo) return false;
    if (hi != null && e > hi) return false;
    return true;
  });
}

/**
 * Мягкий recency-boost поверх RRF-score (поле `fused`). Свежесть = экспоненциальное затухание
 * по возрасту относительно `asof` (или сегодня): score *= 1 + weight·0.5^(age/halfLife).
 * Свежий документ получает максимум, документ возрастом в один период полураспада — половину.
 * Документы без doc_date не штрафуются (recency=0, множитель=1). Пересортировывает по fused.
 * Применять только к гибридным результатам (где есть fused); для vector/bm25 — no-op.
 */
export function applyRecencyBoost(results, { halfLifeDays = 180, asof = null, weight = 0.3 } = {}) {
  if (!results.length || results[0].fused == null) return results;
  const ref = asof ? docDateToEpochDays(asof) : Math.floor(Date.now() / 86_400_000);
  for (const r of results) {
    const e = docDateToEpochDays(r.doc_date);
    let recency = 0;
    if (e != null && ref != null) {
      const age = Math.max(0, ref - e);
      recency = Math.pow(0.5, age / halfLifeDays);
    }
    r.recency = Number(recency.toFixed(4));
    r.fused = r.fused * (1 + weight * recency);
  }
  results.sort((a, b) => b.fused - a.fused);
  return results;
}

/**
 * Полностью переписывает связи файла-источника: удаляет существующие и вставляет новые.
 * Вызывается из index.mjs после успешной индексации файла.
 */
export function upsertLinks(db, src, links) {
  db.prepare('DELETE FROM links WHERE src = ?').run(src);
  if (!links || links.length === 0) return 0;
  const stmt = db.prepare('INSERT OR IGNORE INTO links (src, dst, type) VALUES (?, ?, ?)');
  let n = 0;
  for (const link of links) {
    const dst = typeof link === 'string' ? link : link.dst;
    const type = typeof link === 'string' ? 'related' : (link.type || 'related');
    if (!dst) continue;
    const r = stmt.run(src, dst, type);
    n += r.changes;
  }
  return n;
}

export function getBacklinks(db, path) {
  const norm = normalizeRelPath(path);
  return db.prepare('SELECT src, type FROM links WHERE dst = ? ORDER BY src').all(norm);
}

export function getForwardLinks(db, path) {
  const norm = normalizeRelPath(path);
  return db.prepare('SELECT dst, type FROM links WHERE src = ? ORDER BY dst').all(norm);
}

// ---------- walker ----------

// Директории, в которые walker не заходит — внутри INDEXABLE_LAYERS.
// Свои спецдиректории — kb.config.mjs → layers.skipDirs.
const SKIP_DIRS = new Set(cfg.layers?.skipDirs ?? [
  'node_modules',
  '.git',
  '.context',     // рабочая зона, gitignored
  '.remember',    // working memory
  '.claude',      // конфиги Claude Code
  'scripts',      // сам инструментарий не индексируем
  'docs',         // обычно служебная документация
]);

const ALLOWED_EXT = new Set(['.md']);

export function* walkMarkdown(rootDir = REPO_ROOT, layers = INDEXABLE_LAYERS, { rootFiles = [] } = {}) {
  for (const layer of layers) {
    const layerRoot = join(rootDir, layer);
    let st;
    try { st = statSync(layerRoot); } catch { continue; }
    if (!st.isDirectory()) continue;
    yield* walkDir(layerRoot, layer, rootDir);
  }
  // Корневые файлы (например log.md) — псевдо-слой по basename без расширения ('log.md' → 'log').
  for (const name of rootFiles) {
    if (!ALLOWED_EXT.has(extname(name))) continue;
    const full = join(rootDir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (!st.isFile()) continue;
    yield {
      absPath: full,
      relPath: relative(rootDir, full),
      layer: name.replace(/\.[^.]+$/, ''),
      mtime: Math.floor(st.mtimeMs),
    };
  }
}

function* walkDir(dir, layer, rootDir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(full, layer, rootDir);
    } else if (entry.isFile() && ALLOWED_EXT.has(extname(entry.name))) {
      const st = statSync(full);
      yield {
        absPath: full,
        relPath: relative(rootDir, full),
        layer,
        mtime: Math.floor(st.mtimeMs),
      };
    }
  }
}

export function readFileSafe(absPath) {
  try { return readFileSync(absPath, 'utf8'); } catch { return ''; }
}
