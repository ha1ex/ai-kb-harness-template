#!/usr/bin/env node
// eval.mjs — бенчмарк retrieval-слоя KB поверх golden-set проб (./probes.mjs).
//
// Это «Evaluate»-измерение харнесса: детерминированная батарея (vector+BM25+RRF, без LLM),
// метрики recall@3 / recall@5 / MRR + разбивка по категориям, коммитнутый baseline и детекция
// регрессий по допуску. Зеркалит идею HarnessX benchmarks/aggregate_benchmark (delta vs baseline).
//
// Использование:
//   node scripts/semantic/eval.mjs                  # прогон, diff vs baseline, exit 0/1
//   node scripts/semantic/eval.mjs --json           # машинный вывод { overall, by_category, diff }
//   node scripts/semantic/eval.mjs --update-baseline # перезаписать eval-baseline.json (после намеренных изменений)
//   node scripts/semantic/eval.mjs --report         # дополнительно записать docs/examples/eval-report.md
//
// Метрика (честно): per-file relevance = карточка в top-k, у которой И категория, И провайдер
// матчат ожидание пробы. Это СТРОЖЕ collective-вердикта в _search-quality-report.md (там категорию
// и провайдера могут покрывать разные файлы) — поэтому метрика не сатурируется в 1.0 и ловит регрессии.
//
// LLM здесь не вызывается намеренно — иначе гейт стал бы флэйки в CI.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  createEmbedder,
  openDb,
  searchHybrid,
  DB_PATH,
  REPO_ROOT,
} from './lib.mjs';
import { rerank } from './rerank.mjs';
import { PROBES, PROBE_SOURCES, primaryCategory, toAltRegex } from './probes.mjs';
import { appendJournal } from '../lib/journal.mjs';
import { parseFrontmatter } from '../lib/frontmatter.mjs';

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const updateBaseline = argv.includes('--update-baseline');
const writeReport = argv.includes('--report');
// Каналы: graph по умолчанию ВКЛ (отражает шиппинг-дефолт; на корпусе без related: — no-op,
// поэтому baseline не сдвигается). rerank — opt-in для A/B; в дефолтный baseline не входит.
const useGraph = !argv.includes('--no-graph');
const useRerank = argv.includes('--rerank');

const BASELINE_PATH = join(REPO_ROOT, 'scripts', 'semantic', 'eval-baseline.json');
const REPORT_PATH = join(REPO_ROOT, 'docs', 'examples', 'eval-report.md');
// Порог регрессии. Квантованная ONNX-модель e5-small НЕ бит-в-бит детерминирована между
// платформами (macOS ARM ↔ Linux x86 в CI): near-tie RRF-ранги могут флипнуться, сдвигая
// recall@k на 1–2 пробы из 42 (~0.024–0.048). Берём 0.05 (~2 пробы), чтобы гейт не давал
// ложных «красных» на дрейфе. Реальная регрессия (битый chunking/индекс) роняет больше.
const REGRESSION_EPS = 0.05;

// Файлы, которые не считаем «карточками» (индексы/отчёты) — не должны занимать топ-слоты.
const SKIP_SUFFIXES = [
  '/_index.md', '/_categories.md', '/_skills-index.md',
  '/_dedup-report.md', '/_search-quality-report.md', '/_eval-report.md',
];

// Единый frontmatter-парсер (C4): scripts/lib/frontmatter.mjs.
const parseFm = (text) => parseFrontmatter(text).fields;

function fileMeta(absPath) {
  try { return parseFm(readFileSync(absPath, 'utf-8')); } catch { return {}; }
}

function libraryOf(p) {
  const parts = p.split('/');
  const i = parts.indexOf('06_outputs');
  return i >= 0 && i + 1 < parts.length ? parts[i + 1] : '';
}

function round(x, d = 4) {
  const f = 10 ** d;
  return Math.round(x * f) / f;
}

if (!existsSync(DB_PATH)) {
  console.error('[eval] БД не найдена. Запусти: node scripts/semantic/index.mjs');
  process.exit(1);
}

const t0 = Date.now();
const db = openDb();
const embed = await createEmbedder();

// ---------- прогон проб ----------

const perProbe = [];
let stubHits = 0; // D3-регрессия: stub/deprecated не должны появляться в выдаче вообще
for (const probe of PROBES) {
  // overK:50 сохраняет паритет с историческим baseline (vector/BM25 топ-50 → RRF).
  // graph-канал на корпусе без related: даёт [] (no-op), поэтому порядок не меняется.
  const { results } = await searchHybrid(db, embed, probe.q, { topK: 20, graph: useGraph, overK: 50 });
  const fused = useRerank ? await rerank(probe.q, results, { topN: 20 }) : results;

  // dedup по файлу, пропуская index/report-файлы; берём до 5 уникальных карточек.
  const seen = new Set();
  const top = [];
  for (const h of fused) {
    if (SKIP_SUFFIXES.some((s) => h.file.endsWith(s))) continue;
    if (seen.has(h.file)) continue;
    seen.add(h.file);
    const fm = fileMeta(join(REPO_ROOT, h.file));
    if (fm.status === 'stub' || fm.status === 'deprecated') stubHits++;
    top.push({
      file: h.file,
      library: libraryOf(h.file),
      provider: fm.provider || '',
      category: fm.category || '',
    });
    if (top.length >= 5) break;
  }

  // Два вида проб (см. probes.mjs):
  //   • expect_file — карточка релевантна, если путь матчит alt-подстроку (template/walkthrough/local);
  //   • expect_provider+expect_cat — категория И провайдер на ОДНОЙ карточке (строже collective-AND
  //     в _search-quality-report.md). Честный градиент: «нашли ИМЕННО ту карточку», а не «где-то рядом».
  let isRelevant;
  if (probe.expect_file) {
    const fileRe = toAltRegex(probe.expect_file);
    isRelevant = (t) => fileRe.test(t.file);
  } else {
    const catRe = toAltRegex(probe.expect_cat);
    const provRe = toAltRegex(probe.expect_provider);
    isRelevant = (t) => catRe.test(t.category) && (provRe.test(t.provider) || provRe.test(t.library));
  }
  let firstRank = 0;
  for (let i = 0; i < top.length; i++) {
    if (isRelevant(top[i])) { firstRank = i + 1; break; }
  }

  perProbe.push({
    category: primaryCategory(probe),
    firstRank,
    recall3: firstRank > 0 && firstRank <= 3 ? 1 : 0,
    recall5: firstRank > 0 && firstRank <= 5 ? 1 : 0,
    rr: firstRank > 0 ? 1 / firstRank : 0,
    resultCount: top.length,
  });
}
db.close();

// ---------- агрегация ----------

function aggregate(rows) {
  const n = rows.length || 1;
  return {
    recall_at_3: round(rows.reduce((s, r) => s + r.recall3, 0) / n),
    recall_at_5: round(rows.reduce((s, r) => s + r.recall5, 0) / n),
    mrr: round(rows.reduce((s, r) => s + r.rr, 0) / n),
    n: rows.length,
  };
}

const overall = aggregate(perProbe);
const byCategory = {};
for (const r of perProbe) {
  (byCategory[r.category] ||= []).push(r);
}
const by_category = {};
for (const [cat, rows] of Object.entries(byCategory)) by_category[cat] = aggregate(rows);

const current = {
  generated_at: new Date().toISOString().slice(0, 10),
  probe_count: PROBES.length,
  overall,
  by_category,
};

// ---------- baseline + diff ----------

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) return null;
  try { return JSON.parse(readFileSync(BASELINE_PATH, 'utf8')); } catch { return null; }
}

function diffAgainstBaseline(cur, base) {
  if (!base) return { hasBaseline: false, regressions: [], improvements: [], deltas: {} };
  // Состав проб изменился (демо-корпус удалён/добавлен, появились local-пробы) — baseline
  // несравним: не гейтим по нему, просим переснять. Иначе клон после --strip-demo получал бы
  // ложный «красный» за осознанное действие.
  if (base.probe_count != null && base.probe_count !== cur.probe_count) {
    return {
      hasBaseline: false, staleBaseline: true,
      baselineProbeCount: base.probe_count, regressions: [], improvements: [], deltas: {},
    };
  }
  const regressions = [];
  const improvements = [];
  const deltas = { overall: {}, by_category: {} };

  for (const k of ['recall_at_3', 'recall_at_5', 'mrr']) {
    const d = round((cur.overall[k] ?? 0) - (base.overall?.[k] ?? 0));
    deltas.overall[k] = d;
    if (d < -REGRESSION_EPS) regressions.push({ scope: 'overall', metric: k, delta: d });
    else if (d > REGRESSION_EPS) improvements.push({ scope: 'overall', metric: k, delta: d });
  }

  // Per-category дельты считаем ТОЛЬКО для отчёта/диагностики — НЕ гейтим по ним.
  // При малом n (3–9 проб) один флип ранга = 0.11–0.33, что на межплатформенном дрейфе
  // даёт постоянные ложные «красные». Гейт — только по overall (статистически устойчиво).
  for (const [cat, curMetrics] of Object.entries(cur.by_category)) {
    const baseMetrics = base.by_category?.[cat];
    if (!baseMetrics) continue;
    deltas.by_category[cat] = round((curMetrics.recall_at_3 ?? 0) - (baseMetrics.recall_at_3 ?? 0));
  }

  return { hasBaseline: true, regressions, improvements, deltas };
}

const baseline = loadBaseline();
const diff = diffAgainstBaseline(current, baseline);

// ---------- запись baseline / отчёта ----------

if (updateBaseline) {
  writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2) + '\n');
}

if (writeReport) {
  const lines = [
    '---',
    'type: report',
    'title: Retrieval eval — recall@k / MRR / regression',
    `ingested: ${current.generated_at}`,
    'version: v0.1',
    '---',
    '',
    '# Retrieval eval — recall@k / MRR',
    '',
    `> ${current.probe_count} проб (golden-set \`scripts/semantic/probes.mjs\`), гибридный поиск ` +
      'vector+BM25+RRF, без LLM. Метрика — карточка в top-k, у которой И категория, И провайдер совпали.',
    '',
    `**Overall:** recall@3 = **${overall.recall_at_3}** · recall@5 = **${overall.recall_at_5}** · MRR = **${overall.mrr}** (n=${overall.n}).`,
    '',
    diff.hasBaseline
      ? `**Δ vs baseline:** recall@3 ${fmtDelta(diff.deltas.overall.recall_at_3)} · recall@5 ${fmtDelta(diff.deltas.overall.recall_at_5)} · MRR ${fmtDelta(diff.deltas.overall.mrr)}.`
      : '_(baseline отсутствует — зафиксируйте через `--update-baseline`)_',
    '',
    diff.regressions.length
      ? `⚠️ **Регрессии (> ${REGRESSION_EPS}):** ` + diff.regressions.map((r) => `${r.scope}/${r.metric} ${fmtDelta(r.delta)}`).join('; ')
      : 'FACT: регрессий выше порога не обнаружено.',
    '',
    '## По категориям',
    '',
    '| Категория | recall@3 | recall@5 | MRR | n | Δ recall@3 |',
    '| - | - | - | - | - | - |',
  ];
  for (const [cat, m] of Object.entries(by_category).sort()) {
    const d = diff.deltas.by_category?.[cat];
    lines.push(`| ${cat} | ${m.recall_at_3} | ${m.recall_at_5} | ${m.mrr} | ${m.n} | ${d != null ? fmtDelta(d) : '—'} |`);
  }
  lines.push('');
  writeFileSync(REPORT_PATH, lines.join('\n') + '\n');
}

function fmtDelta(d) {
  if (d == null) return '—';
  if (d === 0) return '±0';
  return (d > 0 ? '+' : '') + d.toFixed(4);
}

// ---------- журнал ----------

await appendJournal({
  kind: 'eval',
  ts: new Date(t0).toISOString(),
  timing_ms: Date.now() - t0,
  summary: {
    overall,
    probe_count: current.probe_count,
    regressions: diff.regressions.length,
    improvements: diff.improvements.length,
  },
});

// ---------- вывод ----------

if (asJson) {
  console.log(JSON.stringify({ overall, by_category, diff, config: { graph: useGraph, rerank: useRerank } }, null, 2));
} else {
  console.log('');
  console.log('─'.repeat(60));
  console.log('  Retrieval eval — recall@k / MRR');
  console.log('─'.repeat(60));
  console.log(`  Каналы:      graph=${useGraph ? 'on' : 'off'} rerank=${useRerank ? 'on' : 'off'}`);
  console.log(`  Проб:        ${current.probe_count} (corpus=${PROBE_SOURCES.corpus} template=${PROBE_SOURCES.template} local=${PROBE_SOURCES.local})`);
  console.log(`  recall@3:    ${overall.recall_at_3}`);
  console.log(`  recall@5:    ${overall.recall_at_5}`);
  console.log(`  MRR:         ${overall.mrr}`);
  if (diff.hasBaseline) {
    console.log('');
    console.log(`  Δ vs baseline: recall@3 ${fmtDelta(diff.deltas.overall.recall_at_3)} · recall@5 ${fmtDelta(diff.deltas.overall.recall_at_5)} · MRR ${fmtDelta(diff.deltas.overall.mrr)}`);
    if (diff.improvements.length) {
      console.log(`  ✓ улучшения: ${diff.improvements.map((r) => `${r.scope}/${r.metric} ${fmtDelta(r.delta)}`).join('; ')}`);
    }
    if (diff.regressions.length) {
      console.log(`  ⚠ РЕГРЕССИИ (> ${REGRESSION_EPS}): ${diff.regressions.map((r) => `${r.scope}/${r.metric} ${fmtDelta(r.delta)}`).join('; ')}`);
    }
  } else if (diff.staleBaseline) {
    console.log('');
    console.log(`  ⚠ baseline снят на другом составе проб (${diff.baselineProbeCount} vs ${current.probe_count}) — гейт пропущен.`);
    console.log('    Пересними: node scripts/semantic/eval.mjs --update-baseline');
  } else {
    console.log('');
    console.log('  ⚠ baseline отсутствует. Зафиксируйте: node scripts/semantic/eval.mjs --update-baseline');
  }
  if (updateBaseline) console.log(`\n  baseline записан → ${relative(REPO_ROOT, BASELINE_PATH)}`);
  if (writeReport) console.log(`  отчёт записан → ${relative(REPO_ROOT, REPORT_PATH)}`);
  console.log('');
}

// D3-гейт: stub/deprecated в топах = фильтр retrieval сломан (регрессия), красный билд.
if (stubHits > 0) {
  console.error(`\n  ✗ D3-РЕГРЕССИЯ: ${stubHits} stub/deprecated-карточек в топ-5 выдачи — фильтр статусов не работает (пересобери индекс: pnpm kb:index).`);
  process.exit(1);
}

// Гейт: регрессии без --update-baseline → exit 1 (для CI). На первом запуске без baseline — exit 0.
process.exit(!updateBaseline && diff.hasBaseline && diff.regressions.length > 0 ? 1 : 0);
