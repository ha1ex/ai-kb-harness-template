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
import { resolve, sep } from 'node:path';
import {
  createEmbedder,
  QUERY_PREFIX,
  PASSAGE_PREFIX,
  openDb,
  DB_PATH,
  REPO_ROOT,
  INDEXABLE_LAYERS,
  walkMarkdown,
} from './lib.mjs';
import { appendJournal } from '../lib/journal.mjs';
import { maskExamples, cleanCitePath, checkProvenance, EXTERNAL_CORPUS_DIRS as PROV_EXTERNAL_DIRS } from '../lib/provenance.mjs';

export const VERIFY_THRESHOLD = 0.82;          // strong, если bestScore >= threshold
const WEAK_DELTA = 0.08;                        // weak, если >= threshold - WEAK_DELTA
const LABELS = ['FACT', 'INFERENCE', 'ASSUMPTION', 'UNKNOWN', 'RISK', 'DECISION', 'RECOMMENDATION'];
// Зеркала внешних библиотек внутри 06_outputs — к ним внутренние [source:] неприменимы.
const EXTERNAL_CORPUS_DIRS = new Set([
  'anthropics-skills', 'claude-cookbooks', 'cybos-cases', 'fabric-patterns', 'mcp-catalog',
]);

// Регистронезависимо: `[Source: …]` — та же цитата, а не способ спрятаться от гейта.
const CITATION_RE = /\[source:\s*([^\]]+)\]/gi;

// Слои, в которых метки FACT:/DECISION: обязаны иметь живую цитату в своём абзаце
// (claim-coverage). Совпадает с PROVENANCE_ENFORCED_LAYERS: это несущие слои пирамиды.
export const COVERAGE_LAYERS = new Set(['04_synthesis', '05_decisions']);
const COVERED_LABELS_RE = /^\s*(?:[-*+>]\s+|\d+[.)]\s+)?(?:\*\*)?(FACT|DECISION)(?:\*\*)?\s*:/;

function dot(a, b) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
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
  requireCoverage = false,
} = {}) {
  const allowed = new Set(allowedLayers);
  const citations = [];

  // Сбор всех цитат с позициями. Цитаты внутри HTML-комментариев <!-- ... --> игнорируем
  // (это примеры формата, а не живые утверждения) — маскируем их пробелами той же длины,
  // чтобы позиции остальных цитат остались валидны для claim-span ниже.
  const scan = maskExamples(text);
  const raws = [];
  let mm;
  CITATION_RE.lastIndex = 0;
  while ((mm = CITATION_RE.exec(scan)) !== null) {
    raws.push({ raw: mm[1], start: mm.index, end: mm.index + mm[0].length });
  }

  let prevEnd = 0;
  for (const c of raws) {
    const { path, line, traversal, escapes } = cleanCitePath(c.raw);
    const layer = path.split('/')[0] || '';
    const abs = resolve(REPO_ROOT, path);
    // Даже после резолва сегментов путь обязан оставаться внутри корня KB.
    const insideRepo = abs.startsWith(REPO_ROOT + sep);
    const exists = insideRepo && existsSync(abs);
    const layerAllowed = allowed.has(layer);

    // external-corpus carve-out
    let externalCorpus = false;
    if (layer === '06_outputs') {
      const second = path.split('/')[1] || '';
      if (EXTERNAL_CORPUS_DIRS.has(second)) externalCorpus = true;
    }

    let tier1_ok = true;
    let reason = 'ok';
    if (traversal || escapes || !insideRepo) { tier1_ok = false; reason = 'path-traversal'; }
    else if (!exists) { tier1_ok = false; reason = 'missing-file'; }
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

  // ---------- claim-coverage (A2): FACT:/DECISION: без живой цитаты в своём абзаце ----------
  // Работает по masked-тексту: метки и цитаты в примерах (код/комментарии) не считаются.
  const uncited_claims = [];
  if (requireCoverage) {
    const lines = scan.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const lm = lines[i].match(COVERED_LABELS_RE);
      if (!lm) continue;
      let a = i, b = i;
      while (a > 0 && lines[a - 1].trim() !== '') a--;
      while (b < lines.length - 1 && lines[b + 1].trim() !== '') b++;
      const para = lines.slice(a, b + 1).join('\n');
      if (!/\[source:/i.test(para)) {
        uncited_claims.push({ line: i + 1, label: lm[1].toUpperCase(), text: lines[i].trim().slice(0, 200) });
      }
    }
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
    // Текст без цитат сам по себе валиден, но при requireCoverage непокрытые
    // FACT:/DECISION: — это гейт: «просто не поставить цитату» больше не лазейка.
    passed: citations.every((c) => c.tier1_ok) && uncited_claims.length === 0,
    uncited_claims: uncited_claims.length,
    advisory: { fact_claims: factStrong + factWeak + factNone, strong: factStrong, weak: factWeak, none: factNone },
  };
  return { citations, uncited_claims, summary, critique: buildCritique(citations, uncited_claims) };
}

// ---------- critique (N1: verify → critique → revise) ----------

// reason → конкретное действие правки и человекочитаемая подсказка.
const REASON_FIX = {
  'missing-file': {
    action: 're-cite',
    suggestion: 'Файл не существует. Найди верный путь (kb_search) и замени цитату, либо удали утверждение.',
  },
  'layer-not-allowed': {
    action: 're-cite',
    suggestion: 'Слой не индексируется/не цитируется. Сошлись на 00_context/02_sources/03_wiki/04_synthesis/05_decisions.',
  },
  'external-corpus-not-citable': {
    action: 're-cite',
    suggestion: 'External-corpus карточка цитируется через её frontmatter source:-URL, а не через [source: /…].',
  },
  'line-empty-or-out-of-range': {
    action: 'fix-line',
    suggestion: 'Номер строки пуст/вне диапазона. Убери :line или укажи непустую строку файла.',
  },
  'path-traversal': {
    action: 're-cite',
    suggestion: 'Путь содержит `.`/`..`-сегменты или выходит за корень KB. Укажи канонический путь от корня: [source: /слой/файл.md].',
  },
};

/**
 * Превращает результат проверки в actionable-критику (N1). Чистая функция над citations.
 *   • Tier-1 fail  → severity:error, needsRevision=true (это и есть гейт);
 *   • uncited FACT:/DECISION: (claim-coverage) → severity:error;
 *   • FACT с advisory band none/weak → severity:warn (advisory, НИКОГДА не форсит revision).
 * @param {Array} citations  citations из verifyText
 * @param {Array} [uncitedClaims]  uncited_claims из verifyText (requireCoverage)
 * @returns {{ needsRevision:boolean, errors:number, warns:number, items:Array }}
 */
export function buildCritique(citations, uncitedClaims = []) {
  const items = [];
  for (const u of uncitedClaims) {
    items.push({
      severity: 'error', path: null, line: u.line ?? null, label: u.label,
      reason: 'uncited-claim', action: 'add-citation',
      suggestion: 'Метка FACT/DECISION без живой цитаты в абзаце — добавь [source: /слой/файл.md] или понизь метку до INFERENCE/ASSUMPTION.',
      claim: u.text,
    });
  }
  for (const c of citations) {
    if (!c.tier1_ok) {
      const fix = REASON_FIX[c.reason] || { action: 're-cite', suggestion: 'Цитата не прошла Tier-1 — исправь путь/слой или удали утверждение.' };
      items.push({
        severity: 'error', path: c.path, line: c.line ?? null, label: c.label,
        reason: c.reason, action: fix.action, suggestion: fix.suggestion, claim: c.claim,
      });
    } else if (c.label === 'FACT' && c.advisory && (c.advisory.band === 'none' || c.advisory.band === 'weak')) {
      items.push({
        severity: 'warn', path: c.path, label: 'FACT', reason: `weak-support-${c.advisory.band}`,
        band: c.advisory.band, bestScore: c.advisory.bestScore ?? null, action: 'downgrade-or-recite',
        suggestion: 'Семантически источник слабо подтверждает FACT — понизь до INFERENCE/ASSUMPTION, перецитируй точный фрагмент или удали.',
        claim: c.claim,
      });
    }
  }
  const errors = items.filter((i) => i.severity === 'error').length;
  const warns = items.filter((i) => i.severity === 'warn').length;
  return { needsRevision: errors > 0, errors, warns, items };
}

/**
 * Сканировать слои KB и проверить Tier-1 (+ опц. provenance) по каждому .md-файлу.
 * Используется CI-гейтом (N3/N4). Не грузит модель (semantic=false): детерминированно.
 * @returns {{ files:number, failedFiles:number, problems:Array, exempted:number }}
 */
export async function scanLayers(layers, { provenance = false, allowCorpus = false } = {}) {
  const problems = [];
  let files = 0, failedFiles = 0, exempted = 0, coverageExempted = 0;
  for (const f of walkMarkdown(REPO_ROOT, layers)) {
    // external-corpus карточки в 06_outputs не несут внутренних цитат — пропускаем их явно
    // (логируем счётчик, не молчим).
    const second = f.relPath.split('/')[1] || '';
    if (f.layer === '06_outputs' && PROV_EXTERNAL_DIRS.has(second)) { exempted++; continue; }
    files++;
    let text = '';
    try { text = readFileSync(f.absPath, 'utf8'); } catch { continue; }
    // Явный opt-out от claim-coverage: frontmatter `coverage: exempt` — для мета-документов,
    // чей evidence живёт во frontmatter `source:`-URL (см. AGENTS.md § External corpus).
    // Видимый и greppable: скан считает такие файлы, а не молчит.
    let requireCoverage = COVERAGE_LAYERS.has(f.layer);
    if (requireCoverage) {
      const fmEnd = text.startsWith('---') ? text.indexOf('\n---', 3) : -1;
      const fm = fmEnd > 0 ? text.slice(0, fmEnd) : '';
      if (/^coverage:\s*exempt\s*$/m.test(fm)) { requireCoverage = false; coverageExempted++; }
    }
    const { summary } = await verifyText(text, {
      semantic: false,
      allowCorpus,
      requireCoverage,
    });
    const prov = provenance ? checkProvenance(f.relPath, text) : { violations: [] };
    if (!summary.passed || prov.violations.length) {
      failedFiles++;
      problems.push({
        file: f.relPath,
        tier1_failed: summary.citations_total - summary.citations_ok,
        uncited_claims: summary.uncited_claims,
        provenance_violations: prov.violations,
      });
    }
  }
  return { files, failedFiles, problems, exempted, coverageExempted };
}

// ───────────────────────── CLI ─────────────────────────

function isMain() {
  return import.meta.url === `file://${process.argv[1]}`;
}

if (isMain()) {
  const argv = process.argv.slice(2);
  let threshold = VERIFY_THRESHOLD;
  let asJson = false, allowCorpus = false, semantic = true, requireCoverage = false;
  let fromStdin = false, file = null, layersArg = null;
  let scan = false, provenance = false;
  const textParts = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') asJson = true;
    else if (a === '--allow-corpus') allowCorpus = true;
    else if (a === '--no-semantic') semantic = false;
    else if (a === '--require-coverage') requireCoverage = true;
    else if (a === '--stdin') fromStdin = true;
    else if (a === '--scan') scan = true;
    else if (a === '--provenance') provenance = true;
    else if (a === '--threshold') threshold = parseFloat(argv[++i]);
    else if (a === '--file') file = argv[++i];
    else if (a === '--layers') layersArg = argv[++i];
    else if (a === '--text') textParts.push(argv[++i]);
    else textParts.push(a);
  }

  // ── режим --scan: гейт по слоям (N3/N4). Детерминированный Tier-1 (+ опц. provenance),
  //    без модели. Дефолтные слои = свои (не external) синтез/решения/аутпуты.
  if (scan) {
    const scanLayersList = layersArg
      ? layersArg.split(',').map((s) => s.trim()).filter(Boolean)
      : ['04_synthesis', '05_decisions', '06_outputs'];
    const t0 = Date.now();
    const res = await scanLayers(scanLayersList, { provenance, allowCorpus });
    await appendJournal({
      kind: 'verify-scan', ts: new Date(t0).toISOString(), timing_ms: Date.now() - t0,
      scan: { layers: scanLayersList, provenance, files: res.files, failed: res.failedFiles },
    });
    if (asJson) {
      console.log(JSON.stringify(res, null, 2));
    } else {
      console.log('');
      console.log(`Скан слоёв [${scanLayersList.join(', ')}]${provenance ? ' +provenance' : ''}: ` +
        `${res.files} файлов · external-пропущено ${res.exempted}` +
        `${res.coverageExempted ? ` · coverage-exempt ${res.coverageExempted}` : ''} · ` +
        `${res.failedFiles ? `❌ ${res.failedFiles} с проблемами` : '✅ чисто'}`);
      for (const p of res.problems) {
        console.log(`  ❌ ${p.file}`);
        if (p.tier1_failed) console.log(`       Tier-1: ${p.tier1_failed} битых цитат (запусти: verify.mjs --file ${p.file})`);
        if (p.uncited_claims) console.log(`       coverage: ${p.uncited_claims} меток FACT/DECISION без цитаты (запусти: verify.mjs --require-coverage --file ${p.file})`);
        for (const v of p.provenance_violations) console.log(`       provenance: [source: /${v.path}] — ${v.reason}`);
      }
      console.log('');
    }
    process.exit(res.failedFiles ? 1 : 0);
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
  const result = await verifyText(text, { db, embed, threshold, allowedLayers, allowCorpus, semantic, requireCoverage });
  if (db) db.close();

  await appendJournal({
    kind: 'verify',
    ts: new Date(t0).toISOString(),
    timing_ms: Date.now() - t0,
    verify: {
      citations_total: result.summary.citations_total,
      citations_ok: result.summary.citations_ok,
      passed: result.summary.passed,
      critique_errors: result.critique.errors,
      critique_warns: result.critique.warns,
    },
  });

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const s = result.summary;
    console.log('');
    console.log(`Цитат: ${s.citations_total} · Tier-1 ok: ${s.citations_ok}` +
      `${requireCoverage ? ` · непокрытых меток: ${s.uncited_claims}` : ''} · ${s.passed ? '✅ PASSED' : '❌ FAILED'}`);
    for (const u of result.uncited_claims) {
      console.log(`  ✗ строка ${u.line}: ${u.label}: без цитаты — «${u.text.slice(0, 80)}…»`);
    }
    for (const c of result.citations) {
      const mark = c.tier1_ok ? '✅' : '❌';
      let adv = '';
      if (c.advisory) adv = `   · advisory[FACT]: ${c.advisory.band}${c.advisory.bestScore != null ? ` (${c.advisory.bestScore})` : ''} — не entailment`;
      console.log(`  ${mark} [source: /${c.path}${c.line ? `:${c.line}` : ''}]  ${c.tier1_ok ? '' : '← ' + c.reason}${c.label ? `  {${c.label}}` : ''}${adv}`);
    }
    if (s.advisory.fact_claims > 0) {
      console.log(`\n  advisory (FACT-метки, НЕ гейт): strong=${s.advisory.strong} weak=${s.advisory.weak} none=${s.advisory.none}`);
    }
    if (result.critique.items.length) {
      console.log(`\n  Критика (errors=${result.critique.errors} warns=${result.critique.warns}) — действия:`);
      for (const it of result.critique.items) {
        const icon = it.severity === 'error' ? '✗' : '⚠';
        const where = it.path ? `[/${it.path}${it.line ? `:${it.line}` : ''}]` : `[строка ${it.line ?? '?'}]`;
        console.log(`    ${icon} ${where} ${it.action}: ${it.suggestion}`);
      }
      console.log('    → revision-промпт: node scripts/kb-critic.mjs --file <ответ>.md');
    }
    console.log('');
  }

  process.exit(result.summary.passed ? 0 : 1);
}
