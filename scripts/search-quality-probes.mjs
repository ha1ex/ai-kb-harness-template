#!/usr/bin/env node
// search-quality-probes.mjs — batch a curated set of search queries to gauge
// whether the KB finds the right skills across all 4 sources / 14 categories.
// Writes docs/examples/search-quality-report.md and prints a TL;DR.
//
// NB (метрика): PASS = релевантное в top-3 по OR-логике (expected_category ИЛИ
// provider). Это recall@3, НЕ precision@1 — top-1 не всегда самый релевантный.
//
// Набор проб вынесен в ./semantic/probes.mjs (единый источник для этого отчёта и для
// node scripts/semantic/eval.mjs, который считает recall@k / MRR / by_category + регрессию).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { relative, join } from 'node:path';
import {
  createEmbedder,
  QUERY_PREFIX,
  openDb,
  searchVec,
  searchBM25,
  fuseRRF,
  DB_PATH,
  REPO_ROOT,
} from './semantic/lib.mjs';
import { PROBES, toAltRegex } from './semantic/probes.mjs';

// Этот отчёт — про качество ранжирования ДЕМО-КОРПУСА (category/provider во frontmatter карточек).
// Template/local-пробы со схемой expect_file здесь неприменимы — их гоняет eval.mjs.
const CORPUS_ONLY_PROBES = PROBES.filter((p) => p.expect_provider && p.expect_cat);

function parseFm(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split('\n')) {
    const km = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (km) {
      let v = km[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      fm[km[1]] = v;
    }
  }
  return fm;
}

function fileMeta(filePath) {
  try {
    return parseFm(readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

function libraryOf(p) {
  // 06_outputs/<library>/...
  const parts = p.split('/');
  const i = parts.indexOf('06_outputs');
  return i >= 0 && i + 1 < parts.length ? parts[i + 1] : '';
}

if (!existsSync(DB_PATH)) {
  console.error('БД не найдена. Запусти node scripts/semantic/index.mjs');
  process.exit(1);
}

const db = openDb();
const embed = await createEmbedder();

const reportRows = [];
const sumLines = [];

for (const probe of CORPUS_ONLY_PROBES) {
  const [emb] = await embed([QUERY_PREFIX + probe.q]);
  const vec = searchVec(db, emb, { topK: 50 });
  const bm = searchBM25(db, probe.q, { topK: 50 });
  const fused = fuseRRF(vec, bm, { topK: 10 });

  // unique by file
  const seen = new Set();
  const top = [];
  for (const h of fused) {
    if (h.file.endsWith('/_index.md') || h.file.endsWith('/_categories.md')) continue;
    if (h.file.endsWith('/_skills-index.md')) continue;
    if (h.file.endsWith('/_dedup-report.md')) continue;
    if (h.file.endsWith('/_search-quality-report.md')) continue;
    if (seen.has(h.file)) continue;
    seen.add(h.file);
    const fm = fileMeta(h.file);
    top.push({
      file: relative(REPO_ROOT, h.file),
      library: libraryOf(h.file),
      provider: fm.provider || '',
      id: fm.id || '',
      title: fm.title || '',
      category: fm.category || '',
      heading: h.heading || '',
    });
    if (top.length >= 5) break;
  }

  // Evaluate: is top-3 in expected categories?
  const expectedCatRe = toAltRegex(probe.expect_cat);
  const expectedProvRe = toAltRegex(probe.expect_provider);
  const top3 = top.slice(0, 3);
  const catHit = top3.some((t) => expectedCatRe.test(t.category));
  const provHit = top3.some((t) => expectedProvRe.test(t.provider) || expectedProvRe.test(t.library));
  const verdict = catHit && provHit ? '✅ PASS' : catHit ? '⚠️ cat-OK, provider-miss' : provHit ? '⚠️ provider-OK, cat-miss' : '❌ MISS';
  sumLines.push(`  ${verdict}  «${probe.q}»  top-1: ${top[0]?.id || '-'} ${top[0]?.title?.slice(0, 50) || ''}`);
  reportRows.push({ probe, top, verdict });
}

// --- write markdown
const passCount = reportRows.filter((r) => r.verdict.startsWith('✅')).length;
const warnCount = reportRows.filter((r) => r.verdict.startsWith('⚠️')).length;
const missCount = reportRows.filter((r) => r.verdict.startsWith('❌')).length;

const today = new Date().toISOString().slice(0, 10);
const lines = [
  '---',
  'type: report',
  'title: Skills search — quality probes',
  `ingested: ${today}`,
  'version: v0.1',
  '---',
  '',
  '# Skills search — quality probes',
  '',
  `> Батарея из ${CORPUS_ONLY_PROBES.length} тестовых запросов через гибридный поиск (vector + BM25 + RRF) ` +
    `по объединённой KB из 4 источников. Для каждого запроса проверяется, попадает ли top-3 ` +
    `в ожидаемую категорию и провайдер.`,
  '',
  `**Итог:** ✅ ${passCount} pass · ⚠️ ${warnCount} partial · ❌ ${missCount} miss из ${CORPUS_ONLY_PROBES.length}.`,
  '',
  '> **Метрика (честно):** PASS = релевантное в **top-3** по OR-логике (категория ИЛИ провайдер) — ' +
    'это **recall@3**, а не **precision@1**.',
  '> Для recall@5 / MRR / разбивки по категориям и детекции регрессий — `node scripts/semantic/eval.mjs`.',
  '',
  '## Probes',
  '',
];
for (const { probe, top, verdict } of reportRows) {
  lines.push(`### ${verdict} — \`${probe.q}\``);
  lines.push('');
  lines.push(`Expected: provider ∈ {${probe.expect_provider}}, category ∈ {${probe.expect_cat}}`);
  lines.push('');
  lines.push('| # | ID | Provider | Category | Title | Heading |');
  lines.push('| - | - | - | - | - | - |');
  for (let i = 0; i < top.length; i++) {
    const t = top[i];
    const titleShort = (t.title || '').slice(0, 60);
    const headingShort = (t.heading || '').slice(0, 40);
    lines.push(`| ${i + 1} | \`${t.id}\` | ${t.provider || t.library} | ${t.category} | ${titleShort} | ${headingShort} |`);
  }
  lines.push('');
}

writeFileSync(join(REPO_ROOT, 'docs', 'examples', 'search-quality-report.md'), lines.join('\n') + '\n');

console.log('--- summary ---');
for (const l of sumLines) console.log(l);
console.log(`\n✅ ${passCount} pass · ⚠️ ${warnCount} partial · ❌ ${missCount} miss out of ${CORPUS_ONLY_PROBES.length}`);
console.log('report: docs/examples/search-quality-report.md');
