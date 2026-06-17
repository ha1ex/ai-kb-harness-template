#!/usr/bin/env node
// verify.mjs — механическая проверка цитат [source: /path] в тексте ответа/синтеза.
//
// Это «Control»-измерение харнесса: enforce контракт цитирования из AGENTS.md, защита от
// fabricated citations (та же дисциплина, что в /research passage-match, но on-device).
//
// ВАЖНО — две зоны (по итогам ревью; цитаты у нас path-only, без номера строки):
//
//   Tier-1 (gate, детерминированно, без эмбеддера):
//     • файл цитаты существует;
//     • слой допустим (INDEXABLE_LAYERS);
//     • carve-out: карточки external-corpus 06_outputs/<provider>/ цитируются через
//       frontmatter source:-URL, внутренние [source:/…] к ним неприменимы (AGENTS.md §External corpus);
//     • если в цитате есть :line — строка существует и непуста.
//     summary.passed зависит ТОЛЬКО от Tier-1. exit 0/1.
//
//   Tier-2 (advisory, НИКОГДА не гейт, только для меток FACT:):
//     • мягкий семантический балл claim↔чанки цитируемого файла → полоса strong/weak/none.
//     • INFERENCE/ASSUMPTION/RISK/RECOMMENDATION/UNKNOWN — EXEMPT (им разрешено не быть дословными).
//     Семантика не штампует галлюцинации зелёным и не бракует легитимный вывод — она лишь подсказка.
//
// Использование:
//   node scripts/semantic/verify.mjs --text "FACT: ... [source: /04_synthesis/open-questions.md]"
//   node scripts/semantic/verify.mjs --file path/to/answer.md
//   echo "..." | node scripts/semantic/verify.mjs --stdin
//   флаги: --json  --threshold 0.82  --layers 02_sources,03_wiki  --allow-corpus  --no-semantic

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createEmbedder,
  QUERY_PREFIX,
  PASSAGE_PREFIX,
  openDb,
  DB_PATH,
  REPO_ROOT,
  INDEXABLE_LAYERS,
} from './lib.mjs';
import { appendJournal } from '../lib/journal.mjs';

export const VERIFY_THRESHOLD = 0.82;          // strong, если bestScore >= threshold
const WEAK_DELTA = 0.08;                        // weak, если >= threshold - WEAK_DELTA
const LABELS = ['FACT', 'INFERENCE', 'ASSUMPTION', 'UNKNOWN', 'RISK', 'DECISION', 'RECOMMENDATION'];
// Зеркала внешних библиотек внутри 06_outputs — к ним внутренние [source:] неприменимы.
const EXTERNAL_CORPUS_DIRS = new Set([
  'anthropics-skills', 'claude-cookbooks', 'cybos-cases', 'fabric-patterns', 'mcp-catalog',
]);

const CITATION_RE = /\[source:\s*([^\]]+)\]/g;

function dot(a, b) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

function normPath(raw) {
  // "/04_synthesis/x.md:12" → { path: "04_synthesis/x.md", line: 12 }
  let s = String(raw).trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
  let line = null;
  const m = s.match(/:(\d+)\s*$/);
  if (m) { line = parseInt(m[1], 10); s = s.slice(0, m.index); }
  return { path: s, line };
}

function detectLabel(claimText) {
  // Последняя метка перед цитатой управляет режимом проверки.
  let label = null;
  const re = new RegExp(`\\b(${LABELS.join('|')})\\s*:`, 'g');
  let m;
  while ((m = re.exec(claimText)) !== null) label = m[1].toUpperCase();
  return label;
}

function claimSpanBefore(text, citStart, prevEnd) {
  // Текст-утверждение, к которому относится цитата: от конца предыдущей цитаты до текущей,
  // затем сужаем до последней строки/предложения. Используется только для Tier-2.
  let span = text.slice(prevEnd, citStart);
  const nl = span.lastIndexOf('\n');
  if (nl >= 0) span = span.slice(nl + 1);
  // Отрежем ведущую метку «FACT:» из самого claim — она не часть утверждения.
  span = span.replace(new RegExp(`^\\s*(${LABELS.join('|')})\\s*:\\s*`, 'i'), '');
  return span.trim();
}

/**
 * Проверить текст с цитатами.
 * @param {string} text
 * @param {object} opts
 *   { db?, embed?, threshold?, allowedLayers?, allowCorpus?, semantic? }
 *   db/embed нужны только для Tier-2 (advisory). Без них Tier-1 работает полностью.
 */
export async function verifyText(text, {
  db = null,
  embed = null,
  threshold = VERIFY_THRESHOLD,
  allowedLayers = INDEXABLE_LAYERS,
  allowCorpus = false,
  semantic = true,
} = {}) {
  const allowed = new Set(allowedLayers);
  const citations = [];

  // Сбор всех цитат с позициями.
  const raws = [];
  let mm;
  CITATION_RE.lastIndex = 0;
  while ((mm = CITATION_RE.exec(text)) !== null) {
    raws.push({ raw: mm[1], start: mm.index, end: mm.index + mm[0].length });
  }

  let prevEnd = 0;
  for (const c of raws) {
    const { path, line } = normPath(c.raw);
    const layer = path.split('/')[0] || '';
    const abs = join(REPO_ROOT, path);
    const exists = existsSync(abs);
    const layerAllowed = allowed.has(layer);

    // external-corpus carve-out
    let externalCorpus = false;
    if (layer === '06_outputs') {
      const second = path.split('/')[1] || '';
      if (EXTERNAL_CORPUS_DIRS.has(second)) externalCorpus = true;
    }

    let tier1_ok = true;
    let reason = 'ok';
    if (!exists) { tier1_ok = false; reason = 'missing-file'; }
    else if (!layerAllowed) { tier1_ok = false; reason = 'layer-not-allowed'; }
    else if (externalCorpus && !allowCorpus) { tier1_ok = false; reason = 'external-corpus-not-citable'; }
    else if (line != null) {
      const fileLines = (() => { try { return readFileSync(abs, 'utf8').split('\n'); } catch { return []; } })();
      if (line < 1 || line > fileLines.length || !fileLines[line - 1] || !fileLines[line - 1].trim()) {
        tier1_ok = false; reason = 'line-empty-or-out-of-range';
      }
    }

    const claim = claimSpanBefore(text, c.start, prevEnd);
    const label = detectLabel(text.slice(prevEnd, c.start));
    prevEnd = c.end;

    citations.push({
      raw: c.raw.trim(), path, line, layer,
      exists, layerAllowed, externalCorpus,
      tier1_ok, reason, label,
      claim: claim.slice(0, 200),
      advisory: null, // заполняется ниже для FACT
    });
  }

  // ---------- Tier-2 (advisory, только FACT, только если есть db+embed) ----------
  let factStrong = 0, factWeak = 0, factNone = 0;
  if (semantic && db && embed) {
    for (const cit of citations) {
      if (cit.label !== 'FACT' || !cit.tier1_ok || cit.externalCorpus) continue;
      if (!cit.claim) continue;
      const rows = db.prepare('SELECT line_start, text FROM chunks WHERE file = ?').all(cit.path);
      if (rows.length === 0) { cit.advisory = { band: 'none', bestScore: null, note: 'no-chunks' }; factNone++; continue; }
      const [claimEmb] = await embed([QUERY_PREFIX + cit.claim]);
      const chunkTexts = rows.map((r) => PASSAGE_PREFIX + String(r.text).replace(/^\[meta:[^\]]*\]\s*/, ''));
      const chunkEmbs = await embed(chunkTexts);
      let best = -1, bestLine = null;
      for (let i = 0; i < chunkEmbs.length; i++) {
        const score = dot(claimEmb, chunkEmbs[i]);
        if (score > best) { best = score; bestLine = rows[i].line_start; }
      }
      const band = best >= threshold ? 'strong' : best >= threshold - WEAK_DELTA ? 'weak' : 'none';
      cit.advisory = { band, bestScore: Number(best.toFixed(4)), bestChunkLine: bestLine };
      if (band === 'strong') factStrong++; else if (band === 'weak') factWeak++; else factNone++;
    }
  }

  const citations_ok = citations.filter((c) => c.tier1_ok).length;
  const summary = {
    citations_total: citations.length,
    citations_ok,
    passed: citations.length === 0 ? true : citations.every((c) => c.tier1_ok),
    advisory: { fact_claims: factStrong + factWeak + factNone, strong: factStrong, weak: factWeak, none: factNone },
  };
  return { citations, summary };
}

// ───────────────────────── CLI ─────────────────────────

function isMain() {
  return import.meta.url === `file://${process.argv[1]}`;
}

if (isMain()) {
  const argv = process.argv.slice(2);
  let threshold = VERIFY_THRESHOLD;
  let asJson = false, allowCorpus = false, semantic = true;
  let fromStdin = false, file = null, layersArg = null;
  const textParts = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') asJson = true;
    else if (a === '--allow-corpus') allowCorpus = true;
    else if (a === '--no-semantic') semantic = false;
    else if (a === '--stdin') fromStdin = true;
    else if (a === '--threshold') threshold = parseFloat(argv[++i]);
    else if (a === '--file') file = argv[++i];
    else if (a === '--layers') layersArg = argv[++i];
    else if (a === '--text') textParts.push(argv[++i]);
    else textParts.push(a);
  }

  let text = '';
  if (fromStdin) text = readFileSync(0, 'utf8');
  else if (file) text = readFileSync(file, 'utf8');
  else text = textParts.join(' ');

  if (!text.trim()) {
    console.error('Использование: verify.mjs --text "... [source: /path]" | --file f.md | --stdin');
    process.exit(2);
  }

  const allowedLayers = layersArg ? layersArg.split(',').map((s) => s.trim()).filter(Boolean) : INDEXABLE_LAYERS;

  // Tier-2 нужен индекс; без него молча работаем только Tier-1.
  let db = null, embed = null;
  if (semantic && existsSync(DB_PATH)) {
    db = openDb();
    embed = await createEmbedder();
  } else if (semantic) {
    semantic = false; // нет БД — пропустим advisory
  }

  const t0 = Date.now();
  const result = await verifyText(text, { db, embed, threshold, allowedLayers, allowCorpus, semantic });
  if (db) db.close();

  await appendJournal({
    kind: 'verify',
    ts: new Date(t0).toISOString(),
    timing_ms: Date.now() - t0,
    verify: {
      citations_total: result.summary.citations_total,
      citations_ok: result.summary.citations_ok,
      passed: result.summary.passed,
    },
  });

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const s = result.summary;
    console.log('');
    console.log(`Цитат: ${s.citations_total} · Tier-1 ok: ${s.citations_ok} · ${s.passed ? '✅ PASSED' : '❌ FAILED'}`);
    for (const c of result.citations) {
      const mark = c.tier1_ok ? '✅' : '❌';
      let adv = '';
      if (c.advisory) adv = `   · advisory[FACT]: ${c.advisory.band}${c.advisory.bestScore != null ? ` (${c.advisory.bestScore})` : ''} — не entailment`;
      console.log(`  ${mark} [source: /${c.path}${c.line ? `:${c.line}` : ''}]  ${c.tier1_ok ? '' : '← ' + c.reason}${c.label ? `  {${c.label}}` : ''}${adv}`);
    }
    if (s.advisory.fact_claims > 0) {
      console.log(`\n  advisory (FACT-метки, НЕ гейт): strong=${s.advisory.strong} weak=${s.advisory.weak} none=${s.advisory.none}`);
    }
    console.log('');
  }

  process.exit(result.summary.passed ? 0 : 1);
}
