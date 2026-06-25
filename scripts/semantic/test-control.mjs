#!/usr/bin/env node
// test-control.mjs — offline, детерминированные проверки Control-логики:
//   • маскирование HTML-комментариев в цитатах (verify/ provenance),
//   • извлечение живых цитат,
//   • provenance-порядок пирамиды (N4),
//   • buildCritique (N1).
//
// НЕ грузит ONNX-модель и не открывает БД — чистые функции над строками. Быстрый CI-гейт.
// Запуск: node scripts/semantic/test-control.mjs

import assert from 'node:assert/strict';
import { buildCritique } from './verify.mjs';
import {
  maskHtmlComments,
  maskExamples,
  extractCitations,
  provenanceReason,
  checkProvenance,
  isExternalCorpus,
} from '../lib/provenance.mjs';

let passed = 0;
function ok(name) { passed++; console.log(`  ✓ ${name}`); }

// ---------- 1. maskHtmlComments сохраняет длину и переносы ----------
{
  const src = 'a [source: /x.md]\n<!-- b [source: /y.md] -->\nc';
  const masked = maskHtmlComments(src);
  assert.equal(masked.length, src.length, 'длина сохранена (позиции валидны)');
  assert.equal((masked.match(/\n/g) || []).length, (src.match(/\n/g) || []).length, 'переносы сохранены');
  assert.ok(masked.includes('[source: /x.md]'), 'живая цитата не тронута');
  assert.ok(!masked.includes('/y.md'), 'цитата в комментарии замаскирована');
  ok('maskHtmlComments: длина/переносы сохранены, комментарий вычищен');
}

// ---------- 2. extractCitations игнорирует комментарии и код ----------
{
  const cites = extractCitations('FACT: a [source: /02_sources/s.md]\n<!-- пример: [source: /02_sources/ghost.md] -->');
  assert.equal(cites.length, 1, 'только живая цитата');
  assert.equal(cites[0].path, '02_sources/s.md');
  assert.equal(cites[0].layer, '02_sources');
  // нормализация :line и ведущего слэша
  assert.equal(extractCitations('[source: /04_synthesis/x.md:12]')[0].path, '04_synthesis/x.md');
  ok('extractCitations: живые цитаты, нормализация пути, комментарии вне игры');
}

// ---------- 2b. maskExamples: код-спаны и fenced-блоки — это примеры, не цитаты ----------
{
  // инлайн-код (как в 06_outputs/_audit-report: `[source:/0..]`)
  assert.equal(extractCitations('Описание синтаксиса `[source:/0..]` в тексте.').length, 0, 'инлайн-код не цитата');
  // fenced-блок
  const fenced = 'Пример:\n```\nУтверждение. [source: /02_sources/example.md]\n```\nКонец.';
  assert.equal(extractCitations(fenced).length, 0, 'fenced-пример не цитата');
  // живая цитата рядом с кодом всё ещё видна
  const mix = 'FACT: x [source: /02_sources/real.md] (см. `[source:/0..]`)';
  const m = extractCitations(mix);
  assert.equal(m.length, 1, 'живая цитата извлекается, пример в бэктиках — нет');
  assert.equal(m[0].path, '02_sources/real.md');
  // длина сохраняется
  assert.equal(maskExamples(mix).length, mix.length);
  ok('maskExamples: инлайн-код и fenced-блоки маскируются, живые цитаты целы');
}

// ---------- 3. provenanceReason: строго ниже ----------
{
  assert.equal(provenanceReason('04_synthesis', '02_sources'), null, '04→02 ок');
  assert.equal(provenanceReason('04_synthesis', '03_wiki'), null, '04→03 ок');
  assert.ok(provenanceReason('04_synthesis', '04_synthesis'), '04→04 нарушение (same layer)');
  assert.ok(provenanceReason('04_synthesis', '05_decisions'), '04→05 нарушение (higher)');
  assert.equal(provenanceReason('05_decisions', '04_synthesis'), null, '05→04 ок');
  assert.ok(provenanceReason('05_decisions', '05_decisions'), '05→05 нарушение');
  assert.equal(provenanceReason('06_outputs', '04_synthesis'), null, '06 свободно цитирует ниже');
  assert.equal(provenanceReason('unknown', '02_sources'), null, 'незнакомый слой — не наша зона');
  ok('provenanceReason: разрешён только строго более низкий ранг');
}

// ---------- 4. checkProvenance: enforced только для 04/05, carve-out external ----------
{
  const v1 = checkProvenance('04_synthesis/a.md', 'INFERENCE: x [source: /05_decisions/d.md]');
  assert.equal(v1.enforced, true);
  assert.equal(v1.violations.length, 1, '04 цитирует 05 → нарушение');

  const v2 = checkProvenance('04_synthesis/a.md', 'FACT: x [source: /02_sources/s.md]');
  assert.equal(v2.violations.length, 0, '04 цитирует 02 → ок');

  const v3 = checkProvenance('02_sources/s.md', 'что угодно [source: /05_decisions/d.md]');
  assert.equal(v3.enforced, false, '02_sources не enforced');

  // external-corpus карточка из synthesis — provenance НЕ ругается (это carve-out verify Tier-1)
  const v4 = checkProvenance('04_synthesis/a.md', 'FACT: x [source: /06_outputs/anthropics-skills/ANT-001.md]');
  assert.equal(v4.violations.length, 0, 'external-corpus пропускается provenance-проверкой');
  assert.ok(isExternalCorpus('06_outputs/anthropics-skills/ANT-001.md'));
  assert.ok(!isExternalCorpus('06_outputs/_audit-report.md'), 'собственный 06_outputs — не external');

  // комментарии не считаются
  const v5 = checkProvenance('04_synthesis/a.md', '<!-- [source: /05_decisions/d.md] -->');
  assert.equal(v5.violations.length, 0, 'нарушение в комментарии не считается');
  ok('checkProvenance: enforced 04/05, external carve-out, комментарии вне игры');
}

// ---------- 5. buildCritique: errors из Tier-1, warns из advisory ----------
{
  const cits = [
    { tier1_ok: false, reason: 'missing-file', label: 'FACT', line: null, path: '04_synthesis/nope.md', claim: 'рост' },
    { tier1_ok: true, reason: 'ok', label: 'FACT', path: '02_sources/s.md', claim: 'факт', advisory: { band: 'none', bestScore: 0.4 } },
    { tier1_ok: true, reason: 'ok', label: 'FACT', path: '02_sources/t.md', claim: 'факт2', advisory: { band: 'strong', bestScore: 0.9 } },
    { tier1_ok: true, reason: 'ok', label: 'INFERENCE', path: '02_sources/u.md', claim: 'вывод', advisory: null },
  ];
  const cr = buildCritique(cits);
  assert.equal(cr.errors, 1, 'один Tier-1 error');
  assert.equal(cr.warns, 1, 'один advisory-warn (FACT band none); strong и INFERENCE не считаются');
  assert.equal(cr.needsRevision, true, 'needsRevision только из errors');
  assert.equal(cr.items.find((i) => i.severity === 'error').action, 're-cite');

  // чистый случай — без ревизии
  const clean = buildCritique([{ tier1_ok: true, reason: 'ok', label: 'INFERENCE', path: '02_sources/x.md', claim: 'y', advisory: null }]);
  assert.equal(clean.needsRevision, false);
  assert.equal(clean.items.length, 0);
  ok('buildCritique: errors→needsRevision, advisory band none/weak→warn (не гейт)');
}

console.log(`\n[test-control] OK — ${passed} проверок пройдено.`);
