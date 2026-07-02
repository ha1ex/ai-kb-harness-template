#!/usr/bin/env node
// test-gate.mjs — adversarial-сьют контура доверия (A3): известные векторы ОБХОДА гейта,
// каждый обязан ФЕЙЛИТЬСЯ. Контур verify/provenance — security boundary шаблона: любой
// рефакторинг verify.mjs / provenance.mjs может тихо открыть закрытую дыру; этот сьют
// превращает найденные обходы в вечные регрессии.
//
// Offline и детерминированно: без ONNX-модели и без БД (verifyText c semantic:false).
// Запуск: node scripts/semantic/test-gate.mjs   (гейт в kb-ci.yml)

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyText } from './verify.mjs';
import {
  checkProvenance,
  extractCitations,
  cleanCitePath,
  resolveSegments,
  EXTERNAL_CORPUS_DIRS,
} from '../lib/provenance.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
// Стабильный существующий файл шаблона для позитивных фикстур (living-документ).
const REAL_FILE = '04_synthesis/open-questions.md';

let passed = 0;
function ok(name) { passed++; console.log(`  ✓ ${name}`); }
const vt = (text, opts = {}) => verifyText(text, { semantic: false, ...opts });

// ═══════════ ВЕКТОРЫ ОБХОДА — каждый обязан фейлиться ═══════════

// ---------- 1. path-traversal: `..` маскирует слой ----------
{
  const r = await vt(`FACT: x. [source: /02_sources/../${REAL_FILE}]`);
  assert.equal(r.summary.passed, false, 'traversal-цитата обязана фейлиться');
  assert.equal(r.citations[0].reason, 'path-traversal');
  ok('обход: [source: /02_sources/../04_synthesis/…] → path-traversal (не layer=02_sources)');
}

// ---------- 2. path-traversal: выход за корень KB ----------
{
  const r = await vt('FACT: x. [source: /../../etc/passwd]');
  assert.equal(r.summary.passed, false);
  assert.equal(r.citations[0].reason, 'path-traversal');
  ok('обход: [source: /../../etc/passwd] → path-traversal (не missing-file вне корня)');
}

// ---------- 3. path-traversal: `.`-сегмент как обфускация ----------
{
  const r = await vt(`FACT: x. [source: /04_synthesis/./open-questions.md]`);
  assert.equal(r.citations[0].reason, 'path-traversal');
  ok('обход: `.`-сегмент внутри пути → path-traversal');
}

// ---------- 4. регистр: [Source: …] — та же цитата, а не невидимка ----------
{
  const r = await vt('FACT: x. [Source: /04_synthesis/no-such-file-xyz.md]');
  assert.equal(r.summary.citations_total, 1, '[Source:] распознан как цитата');
  assert.equal(r.citations[0].reason, 'missing-file', 'битый [Source:] фейлится, а не игнорируется');
  const rr = await vt('FACT: x. [SOURCE: /' + REAL_FILE + ']');
  assert.equal(rr.summary.passed, true, 'валидный [SOURCE:] проходит');
  ok('обход: [Source:]/[SOURCE:] видимы для гейта (регистронезависимо)');
}

// ---------- 5. claim-coverage: «просто не ставить цитату» ----------
{
  const r = await vt('FACT: галлюцинация без единой цитаты.', { requireCoverage: true });
  assert.equal(r.summary.passed, false, 'FACT без цитаты обязан фейлиться при requireCoverage');
  assert.equal(r.uncited_claims.length, 1);
  assert.equal(r.critique.items[0].reason, 'uncited-claim');

  const d = await vt('DECISION: решение без evidence.', { requireCoverage: true });
  assert.equal(d.summary.passed, false, 'DECISION без цитаты — тоже гейт');

  // INFERENCE/ASSUMPTION покрытия не требуют (им разрешено не цитировать дословно).
  const inf = await vt('INFERENCE: вывод без цитаты — легально.', { requireCoverage: true });
  assert.equal(inf.summary.passed, true, 'INFERENCE без цитаты проходит');
  ok('обход: FACT/DECISION без цитаты → uncited-claim; INFERENCE — легален');
}

// ---------- 6. coverage: цитата в том же абзаце покрывает метку ----------
{
  const covered = await vt(
    `FACT: тезис из двух строк,\nпродолжение мысли. [source: /${REAL_FILE}]`,
    { requireCoverage: true },
  );
  assert.equal(covered.summary.passed, true, 'цитата в абзаце покрывает FACT');
  // метки в примерах кода не считаются claims
  const masked = await vt('Пример:\n```\nFACT: пример в коде без цитаты\n```\n', { requireCoverage: true });
  assert.equal(masked.summary.passed, true, 'FACT внутри fenced-кода — пример, не claim');
  ok('coverage: абзацная цитата покрывает; примеры в коде не считаются');
}

// ---------- 7. external-corpus через [source:] ----------
{
  // Демо-корпус опционален (kb:init --strip-demo) — ищем живую карточку динамически.
  let card = null;
  for (const provider of EXTERNAL_CORPUS_DIRS) {
    const dir = join(REPO_ROOT, '06_outputs', provider);
    if (!existsSync(dir)) continue;
    const stack = [dir];
    while (stack.length && !card) {
      const d = stack.pop();
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) stack.push(join(d, e.name));
        else if (e.name.endsWith('.md')) { card = join(d, e.name).slice(REPO_ROOT.length + 1); break; }
      }
    }
    if (card) break;
  }
  if (card) {
    const r = await vt(`FACT: x. [source: /${card}]`);
    assert.equal(r.summary.passed, false);
    assert.equal(r.citations[0].reason, 'external-corpus-not-citable');
    const allowed = await vt(`FACT: x. [source: /${card}]`, { allowCorpus: true });
    assert.equal(allowed.summary.passed, true, '--allow-corpus явно разрешает');
    ok('обход: external-corpus через [source:] → external-corpus-not-citable');
  } else {
    console.log('  – external-corpus фикстура пропущена (демо-корпус удалён) — carve-out покрыт test-control');
  }
}

// ---------- 8. :line вне диапазона ----------
{
  const r = await vt(`FACT: x. [source: /${REAL_FILE}:99999]`);
  assert.equal(r.citations[0].reason, 'line-empty-or-out-of-range');
  ok('обход: :line вне диапазона → line-empty-or-out-of-range');
}

// ---------- 9. незакрытый fenced-блок НЕ прячет хвост документа (fail-closed) ----------
{
  const cites = extractCitations('```\nFACT: x [source: /04_synthesis/hidden.md]');
  assert.equal(cites.length, 1, 'незакрытый fence не маскирует цитату — гейт её видит');
  ok('пиннинг: незакрытый ``` не превращает хвост документа в «пример»');
}

// ---------- 10. provenance: traversal и same-layer ----------
{
  const trav = checkProvenance('04_synthesis/a.md', `INFERENCE: x [source: /02_sources/../${REAL_FILE}]`);
  assert.equal(trav.violations.length, 1, 'traversal-цитата — provenance-нарушение');
  assert.ok(trav.violations[0].reason.includes('path-traversal'));

  const same = checkProvenance('04_synthesis/a.md', `INFERENCE: x [Source: /${REAL_FILE}]`);
  assert.equal(same.violations.length, 1, 'same-layer через [Source:] (регистр) тоже ловится');

  const legit = checkProvenance('05_decisions/d.md', `DECISION: x [source: /${REAL_FILE}]`);
  assert.equal(legit.violations.length, 0, '05→04 легален');
  ok('provenance: traversal-violation + регистронезависимый same-layer');
}

// ---------- 11. resolveSegments / cleanCitePath: юнит-пиннинг ----------
{
  assert.deepEqual(resolveSegments('02_sources/../04_synthesis/x.md'),
    { path: '04_synthesis/x.md', traversal: true, escapes: false });
  assert.deepEqual(resolveSegments('../x.md'),
    { path: 'x.md', traversal: true, escapes: true });
  assert.deepEqual(resolveSegments('04_synthesis/x.md'),
    { path: '04_synthesis/x.md', traversal: false, escapes: false });
  const c = cleanCitePath('/04_synthesis/x.md:12');
  assert.deepEqual({ path: c.path, line: c.line }, { path: '04_synthesis/x.md', line: 12 });
  assert.equal(cleanCitePath('./04_synthesis/x.md').traversal, false, 'ведущий ./ — конвенция, не traversal');
  ok('resolveSegments/cleanCitePath: traversal/escapes детектятся, ./ — легален');
}

// ---------- 12. PreToolUse-хук: блокирует запись, fail-open наблюдаем ----------
{
  const hook = join(REPO_ROOT, 'scripts', 'check-provenance.mjs');
  const run = (input) => spawnSync('node', [hook], {
    input, encoding: 'utf8', timeout: 10_000,
    env: { ...process.env, KB_JOURNAL: '0' },
  });

  const block = run(JSON.stringify({
    tool_name: 'Write',
    tool_input: { file_path: '04_synthesis/evil.md', content: `INFERENCE: x [source: /02_sources/../${REAL_FILE}]` },
  }));
  assert.equal(block.status, 2, 'хук блокирует traversal-цитату (exit 2)');

  const allow = run(JSON.stringify({
    tool_name: 'Write',
    tool_input: { file_path: '04_synthesis/good.md', content: 'INFERENCE: x [source: /02_sources/s.md]' },
  }));
  assert.equal(allow.status, 0, 'хук пропускает легальную цитату нижнего слоя');

  const broken = run('{не json');
  assert.equal(broken.status, 0, 'битый payload → fail-open (allow)');
  assert.ok(broken.stderr.includes('hook-error'), 'fail-open наблюдаем: предупреждение в stderr (A4)');
  ok('хук check-provenance: block/allow/наблюдаемый fail-open');
}

console.log(`\n[test-gate] OK — ${passed} adversarial-проверок пройдено.`);
