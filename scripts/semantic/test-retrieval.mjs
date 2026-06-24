#!/usr/bin/env node
// test-retrieval.mjs — offline, детерминированные проверки graph- и temporal-каналов retrieval.
//
// НЕ грузит ONNX-модель и не ходит в сеть: строит крошечный временный индекс с синтетическими
// связанными/датированными документами и проверяет строительные блоки напрямую
// (searchGraph, fuseRRF graph-канал, applyDateFilter, applyRecencyBoost, parseFrontmatterDate).
// Поэтому быстрый и подходит для CI как регрессионный гейт логики каналов (там, где seed-корпус
// без related:/date не может их упражнять). Запуск: node scripts/semantic/test-retrieval.mjs
//
// Полноценный e2e (с эмбеддером и реальным корпусом) — это eval.mjs.

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  openDb,
  insertChunk,
  upsertLinks,
  upsertFileRow,
  searchGraph,
  fuseRRF,
  topFiles,
  applyDateFilter,
  applyRecencyBoost,
  docDateToEpochDays,
  parseFrontmatterDate,
  EMBED_DIM,
} from './lib.mjs';

let passed = 0;
function ok(name) { passed++; console.log(`  ✓ ${name}`); }

// Нулевой вектор — graph/temporal не используют vec, эмбеддинг тут не важен.
const ZERO = new Float32Array(EMBED_DIM);

function addDoc(db, file, { date = null, headings = ['Заголовок'] } = {}) {
  let line = 1;
  for (const h of headings) {
    insertChunk(db, {
      file, mtime: 0, heading: h, lineStart: line, text: `# ${h}\nтекст ${file} ${h}`,
      layer: file.split('/')[0], embedding: ZERO, docDate: date,
    });
    line += 10;
  }
  upsertFileRow(db, file, 0, headings.length);
}

const dir = mkdtempSync(join(tmpdir(), 'kb-test-'));
const dbPath = join(dir, 'test.sqlite');
const db = openDb(dbPath);

try {
  // ---------- fixtures ----------
  addDoc(db, '03_wiki/a.md', { date: '2026-06-01', headings: ['A-lead', 'A-detail'] });
  addDoc(db, '03_wiki/b.md', { date: '2026-01-01', headings: ['B-lead', 'B-detail'] });
  addDoc(db, '03_wiki/c.md', { date: '2025-06-01', headings: ['C-lead'] });
  addDoc(db, '04_synthesis/d.md', { date: '2024-01-01', headings: ['D-lead'] });
  // a → b (related forward); d → a (so a имеет backlink от d)
  upsertLinks(db, '03_wiki/a.md', ['03_wiki/b.md']);
  upsertLinks(db, '04_synthesis/d.md', ['03_wiki/a.md']);

  // ---------- 1. parseFrontmatterDate ----------
  assert.equal(parseFrontmatterDate('---\ntype: wiki\ndate: 2026-06-24\n---\nbody'), '2026-06-24');
  assert.equal(parseFrontmatterDate('---\ntype: x\ningested: 2026-05-27\n---\n'), '2026-05-27', 'ingested-фолбэк');
  assert.equal(parseFrontmatterDate('---\ndate: 2026-06-24\ningested: 2020-01-01\n---\n'), '2026-06-24', 'date приоритетнее ingested');
  assert.equal(parseFrontmatterDate('no frontmatter'), '');
  ok('parseFrontmatterDate: date|ingested|updated с приоритетом');

  // ---------- 2. docDateToEpochDays ----------
  assert.equal(docDateToEpochDays('1970-01-01'), 0);
  assert.equal(docDateToEpochDays('1970-01-02'), 1);
  assert.equal(docDateToEpochDays(null), null);
  assert.ok(docDateToEpochDays('2026-06-01') > docDateToEpochDays('2026-01-01'));
  ok('docDateToEpochDays: монотонность и null-устойчивость');

  // ---------- 3. searchGraph: seed=A → подтягивает соседа B (forward) ----------
  const g1 = searchGraph(db, ['03_wiki/a.md'], { topK: 10 });
  const g1files = g1.map((r) => r.file);
  assert.ok(g1files.includes('03_wiki/b.md'), 'B (forward-сосед A) должен попасть');
  assert.ok(g1files.includes('04_synthesis/d.md'), 'D (backlink на A) должен попасть');
  assert.ok(!g1files.includes('03_wiki/a.md'), 'сам seed не возвращается');
  assert.ok(!g1files.includes('03_wiki/c.md'), 'несвязанный C не должен попасть');
  // представитель файла = чанк с минимальным line_start (лид-секция)
  const bRep = g1.find((r) => r.file === '03_wiki/b.md');
  assert.equal(bRep.heading, 'B-lead', 'представитель B — его лид-чанк');
  ok('searchGraph: 1-hop соседи (forward+backlink), seed исключён, лид-чанк');

  // ---------- 4. searchGraph: пустой граф → [] ----------
  assert.deepEqual(searchGraph(db, ['03_wiki/c.md'], { topK: 10 }), [], 'C без связей → []');
  assert.deepEqual(searchGraph(db, [], { topK: 10 }), [], 'нет seed → []');
  ok('searchGraph: нет связей → пустой массив (канал не вредит)');

  // ---------- 5. fuseRRF: graph-only чанк попадает в выдачу ----------
  const vec = [{ id: 999, file: '03_wiki/a.md', heading: 'A-lead', line_start: 1, text: 't', layer: '03_wiki', similarity: 0.9, doc_date: '2026-06-01' }];
  const fused = fuseRRF(vec, [], { topK: 10, graphResults: searchGraph(db, ['03_wiki/a.md'], { topK: 10 }) });
  const fusedFiles = fused.map((r) => r.file);
  assert.ok(fusedFiles.includes('03_wiki/b.md'), 'graph-only чанк B должен войти в fused');
  const bFused = fused.find((r) => r.file === '03_wiki/b.md');
  assert.ok(bFused.graph_rank != null && bFused.vec_rank == null, 'B пришёл только из graph-канала');
  assert.ok(fused.find((r) => r.file === '03_wiki/a.md').vec_rank === 1, 'A сохранил vec_rank');
  ok('fuseRRF: граф-канал реинтегрируется, не ломая vec/bm25-члены');

  // ---------- 6. topFiles ----------
  assert.deepEqual(topFiles([{ file: 'x' }, { file: 'x' }, { file: 'y' }, { file: 'z' }], 2), ['x', 'y']);
  ok('topFiles: уникальные с сохранением порядка');

  // ---------- 7. applyDateFilter: since/until/asof ----------
  const rows = [
    { file: 'a', doc_date: '2026-06-01' },
    { file: 'b', doc_date: '2026-01-01' },
    { file: 'c', doc_date: '2025-06-01' },
    { file: 'n', doc_date: null },
  ];
  assert.deepEqual(applyDateFilter(rows, { since: '2026-01-01' }).map((r) => r.file), ['a', 'b'], 'since включительно, null отброшен');
  assert.deepEqual(applyDateFilter(rows, { asof: '2026-01-01' }).map((r) => r.file), ['b', 'c'], 'asof = верхняя граница включительно');
  assert.deepEqual(applyDateFilter(rows, { since: '2025-12-01', until: '2026-02-01' }).map((r) => r.file), ['b'], 'окно since+until');
  assert.deepEqual(applyDateFilter(rows, {}).map((r) => r.file), ['a', 'b', 'c', 'n'], 'без границ — без изменений');
  ok('applyDateFilter: since/until/asof, null-даты отбрасываются при фильтре');

  // ---------- 8. applyRecencyBoost: свежий поднимается ----------
  const ranked = [
    { file: 'old', fused: 0.010, doc_date: '2024-01-01' },
    { file: 'fresh', fused: 0.009, doc_date: '2026-06-20' },
  ];
  applyRecencyBoost(ranked, { halfLifeDays: 180, asof: '2026-06-24', weight: 0.5 });
  assert.equal(ranked[0].file, 'fresh', 'свежий обгоняет старый при близких fused');
  assert.ok(ranked.find((r) => r.file === 'fresh').recency > ranked.find((r) => r.file === 'old').recency);
  // recency не трогает не-fused выдачу
  const noFused = [{ file: 'x', doc_date: '2026-06-20' }];
  assert.deepEqual(applyRecencyBoost(noFused, {}), noFused, 'без fused — no-op');
  ok('applyRecencyBoost: recency-приоритизация, no-op без fused');

  console.log(`\n[test-retrieval] OK — ${passed} проверок пройдено.`);
} finally {
  db.close();
  rmSync(dir, { recursive: true, force: true });
}
