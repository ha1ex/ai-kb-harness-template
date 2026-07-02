#!/usr/bin/env node
// kb-metrics.mjs — тренды качества KB из журнала операций (D1, Observe-измерение).
//
// Отвечает на вопрос «не деградирует ли база со временем», на который не отвечает никто:
// журнал всё пишет, dream-cycle читает последние 200 записей, а трендов не видит никто.
// Агрегация по ISO-неделям: verify pass-rate, ошибки критики, пустые выдачи (пробелы KB),
// тайминги search/think, hook-error (наблюдаемый fail-open), retain/promote.
//
// Использование:
//   node scripts/kb-metrics.mjs               # таблица по последним неделям
//   node scripts/kb-metrics.mjs --json        # машинный вывод
//   node scripts/kb-metrics.mjs --snapshot    # дописать снапшот в .context/kb-metrics-history.jsonl
//   node scripts/kb-metrics.mjs --weeks 12    # горизонт (default 8)

import { existsSync } from 'node:fs';
import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readJournal } from './lib/journal.mjs';
import { KB_ROOT } from './lib/kb-root.mjs';

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const snapshot = argv.includes('--snapshot');
const weeksIdx = argv.indexOf('--weeks');
const horizon = weeksIdx >= 0 ? Math.max(1, parseInt(argv[weeksIdx + 1], 10) || 8) : 8;

const HISTORY = join(KB_ROOT, '.context', 'kb-metrics-history.jsonl');

// ISO-неделя 'YYYY-Wnn' из ISO-таймстампа.
function isoWeek(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const records = await readJournal({ limit: 1_000_000 });
if (records.length === 0) {
  console.log('[kb-metrics] журнал пуст (.context/kb-journal.jsonl) — нечего агрегировать.');
  process.exit(0);
}

const byWeek = new Map();
function week(ts) {
  const w = isoWeek(ts);
  if (!w) return null;
  if (!byWeek.has(w)) {
    byWeek.set(w, {
      ops: 0, searches: 0, empty_searches: 0,
      verifies: 0, verify_passed: 0, critique_errors: 0, critique_warns: 0,
      scan_files: 0, scan_failed: 0,
      hook_errors: 0, retains: 0, promotes: 0,
      _timingSum: 0, _timingN: 0,
    });
  }
  return byWeek.get(w);
}

for (const r of records) {
  const w = week(r.written_at || r.ts);
  if (!w) continue;
  w.ops++;
  if (typeof r.timing_ms === 'number') { w._timingSum += r.timing_ms; w._timingN++; }
  switch (r.kind) {
    case 'search': case 'think':
      w.searches++;
      if (r.result_count === 0) w.empty_searches++;
      break;
    case 'verify':
      w.verifies++;
      if (r.verify?.passed) w.verify_passed++;
      w.critique_errors += r.verify?.critique_errors ?? 0;
      w.critique_warns += r.verify?.critique_warns ?? 0;
      break;
    case 'verify-scan':
      w.scan_files += r.scan?.files ?? 0;
      w.scan_failed += r.scan?.failed ?? 0;
      break;
    case 'hook-error': w.hook_errors++; break;
    case 'retain': w.retains++; break;
    case 'promote': w.promotes++; break;
    default: break;
  }
}

const weeks = [...byWeek.keys()].sort().slice(-horizon);
const rows = weeks.map((k) => {
  const w = byWeek.get(k);
  return {
    week: k,
    ops: w.ops,
    verify_pass_rate: w.verifies ? Number((w.verify_passed / w.verifies).toFixed(3)) : null,
    critique_errors: w.critique_errors,
    empty_search_rate: w.searches ? Number((w.empty_searches / w.searches).toFixed(3)) : null,
    scan_failed: w.scan_failed,
    hook_errors: w.hook_errors,
    retains: w.retains,
    promotes: w.promotes,
    avg_timing_ms: w._timingN ? Math.round(w._timingSum / w._timingN) : null,
  };
});

const out = { generated_at: new Date().toISOString(), total_records: records.length, weeks: rows };

if (snapshot) {
  await mkdir(join(KB_ROOT, '.context'), { recursive: true });
  await appendFile(HISTORY, JSON.stringify(out) + '\n', 'utf8');
}

if (asJson) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log('');
  console.log('  Тренды качества KB (из .context/kb-journal.jsonl)');
  console.log('  ' + '─'.repeat(96));
  console.log('  неделя    | ops  | verify-pass | crit-err | empty-search | scan-fail | hook-err | retain/promote | avg-ms');
  for (const r of rows) {
    console.log(
      `  ${r.week} | ${String(r.ops).padStart(4)} | ${r.verify_pass_rate == null ? '     —     ' : String(r.verify_pass_rate).padStart(11)} | ` +
      `${String(r.critique_errors).padStart(8)} | ${r.empty_search_rate == null ? '      —     ' : String(r.empty_search_rate).padStart(12)} | ` +
      `${String(r.scan_failed).padStart(9)} | ${String(r.hook_errors).padStart(8)} | ${String(r.retains + '/' + r.promotes).padStart(14)} | ${r.avg_timing_ms ?? '—'}`,
    );
  }
  console.log('');
  console.log('  Читать так: падение verify-pass или рост empty-search/critique-errors из недели в неделю =');
  console.log('  деградация базы (пробелы KB, битые цитаты). Разбор: pnpm kb:dream и node scripts/kb-critic.mjs.');
  if (snapshot) console.log(`  Снапшот дописан → ${HISTORY}`);
  console.log('');
}
