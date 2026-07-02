// journal.mjs — единый append-only журнал операций KB (.context/kb-journal.jsonl).
//
// Зачем: дать слою retrieval/synthesis наблюдаемость (Observe-измерение), как у skillopt
// (scripts/skillopt/storage/metrics.mjs ведёт .context/skillopt/runs.jsonl). Схема записи
// НАМЕРЕННО та же (written_at + kind + поля), чтобы оба журнала читались единообразно.
//
// Дисциплина (из ревью):
//   • Записи КОМПАКТНЫЕ — только пути/скоры/тайминги, без прозы чанков и без полного текста ответа.
//     Это снимает рост файла и privacy-leak (запросы остаются, но не контент KB).
//   • Файл живёт в .context/ — уже gitignored. Никогда не коммитим.
//   • Opt-out: KB_JOURNAL=0 полностью отключает запись (для тестов/CI).
//   • appendJournal никогда не бросает — журналирование не должно ломать саму операцию.
//
// Потребитель: scripts/dream-cycle.mjs (секция «журнал операций» + аудит-вопрос про пробелы).

import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// scripts/lib/journal.mjs → два уровня вверх = корень репо.
export const REPO_ROOT = resolve(__dirname, '..', '..');
const JOURNAL_DIR = join(REPO_ROOT, '.context');
const JOURNAL_FILE = join(JOURNAL_DIR, 'kb-journal.jsonl');

function journalDisabled() {
  return process.env.KB_JOURNAL === '0';
}

/**
 * Append одну запись об операции. Never throws.
 * @param {object} entry
 *   { kind: "search"|"think"|"eval"|"verify"|"doctor", ts?, query?, layer?, mode?,
 *     top_results?: [{file, fused?, vec_rank?, bm25_rank?}], result_count?, timing_ms?,
 *     verify?: {citations_total, citations_ok, passed, ...}, summary?: {...} }
 */
export async function appendJournal(entry) {
  if (journalDisabled()) return;
  if (!entry || typeof entry !== 'object') return;
  try {
    await mkdir(JOURNAL_DIR, { recursive: true });
    const line = JSON.stringify({
      written_at: new Date().toISOString(),
      ...entry,
    });
    await appendFile(JOURNAL_FILE, line + '\n', 'utf8');
  } catch {
    /* журнал не критичен — глотаем любую ошибку записи */
  }
}

/**
 * A4: наблюдаемый fail-open для PreToolUse-хуков. Хук, упавший на битом payload, обязан
 * остаться allow (не блокировать работу из-за инфраструктурной ошибки), но НЕ молчать:
 * событие уходит в журнал (kind: hook-error) и предупреждение — в stderr.
 * Never throws (как и appendJournal).
 */
export async function reportHookError(hook, err) {
  const message = String((err && err.message) || err || 'unknown').slice(0, 200);
  try {
    process.stderr.write(`[${hook}] ⚠ hook-error (fail-open, запись разрешена): ${message}\n`);
  } catch { /* stderr недоступен — не критично */ }
  await appendJournal({ kind: 'hook-error', hook, error: message });
}

/**
 * Компактная проекция результатов поиска для журнала (без текста чанков).
 * Принимает массив из search.mjs / fuseRRF и обрезает до topN путей + скоров.
 */
export function compactResults(results, topN = 5) {
  if (!Array.isArray(results)) return [];
  return results.slice(0, topN).map((r) => ({
    file: r.file,
    fused: r.fused != null ? Number(r.fused.toFixed(6)) : null,
    vec_rank: r.vec_rank ?? null,
    bm25_rank: r.bm25_rank ?? null,
  }));
}

/**
 * Прочитать последние N записей (reverse-chron), опц. фильтр по kind и по дате since (ISO).
 * @param {object} opts
 * @param {number} [opts.limit=200]
 * @param {string} [opts.kind]
 * @param {string} [opts.since]  ISO-дата/таймстамп; берём записи с written_at >= since
 */
export async function readJournal({ limit = 200, kind = null, since = null } = {}) {
  if (!existsSync(JOURNAL_FILE)) return [];
  let raw;
  try { raw = await readFile(JOURNAL_FILE, 'utf8'); } catch { return []; }
  const lines = raw.split('\n').filter(Boolean);
  const out = [];
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
    try {
      const obj = JSON.parse(lines[i]);
      if (kind && obj.kind !== kind) continue;
      if (since && String(obj.written_at || obj.ts || '') < since) continue;
      out.push(obj);
    } catch { /* skip битые строки */ }
  }
  return out;
}

/**
 * Свести журнал в аналитику для dream-cycle:
 *   • by_kind: { kind → {count, avg_timing_ms} }
 *   • top_queries: самые частые запросы (search/think)
 *   • empty_queries: запросы с пустой выдачей (result_count === 0) — пробелы KB
 *   • failed_verify: операции verify, где passed === false
 */
export function summarizeJournal(records) {
  const byKind = {};
  const queryCount = new Map();
  const empty = new Map();
  const failedVerify = [];

  for (const r of records) {
    const k = r.kind || 'unknown';
    if (!byKind[k]) byKind[k] = { count: 0, _timingSum: 0, _timingN: 0 };
    byKind[k].count++;
    if (typeof r.timing_ms === 'number') {
      byKind[k]._timingSum += r.timing_ms;
      byKind[k]._timingN++;
    }

    if ((k === 'search' || k === 'think') && r.query) {
      queryCount.set(r.query, (queryCount.get(r.query) || 0) + 1);
      if (r.result_count === 0) empty.set(r.query, (empty.get(r.query) || 0) + 1);
    }

    if (k === 'verify' && r.verify && r.verify.passed === false) {
      failedVerify.push({
        query: r.query || null,
        citations_total: r.verify.citations_total ?? null,
        citations_ok: r.verify.citations_ok ?? null,
        ts: r.written_at || r.ts || null,
      });
    }
  }

  for (const v of Object.values(byKind)) {
    v.avg_timing_ms = v._timingN ? Math.round(v._timingSum / v._timingN) : null;
    delete v._timingSum;
    delete v._timingN;
  }

  const top_queries = Array.from(queryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([query, count]) => ({ query, count }));

  const empty_queries = Array.from(empty.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([query, count]) => ({ query, count }));

  return {
    total: records.length,
    by_kind: byKind,
    top_queries,
    empty_queries,
    failed_verify: failedVerify.slice(0, 20),
  };
}
