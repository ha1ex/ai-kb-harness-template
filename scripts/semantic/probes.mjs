// probes.mjs — КОМПОЗИТОР golden-set проб для eval.mjs / search-quality-probes.mjs.
//
// Развязывает eval от демо-корпуса (B2): шаблон не наказывает красным CI за удаление демо.
// Состав PROBES определяется тем, что реально лежит в клоне:
//   • probes-corpus.mjs    — 42 пробы по демо-корпусу; включаются, только если 06_outputs/<provider>/ существует;
//   • probes-template.mjs  — smoke-пробы по living-файлам шаблона; walkthrough-пробы включаются,
//                            только если walkthrough-файлы не вычищены (`kb:init --strip-demo`);
//   • probes.local.mjs     — ВАШИ пробы (project-owned, шаблон его не поставляет): создайте файл
//                            рядом, экспортируйте `export const LOCAL_PROBES = [...]` в любой из
//                            двух схем (expect_provider/expect_cat или expect_file).
//
// После изменения состава проб пересними baseline: node scripts/semantic/eval.mjs --update-baseline
// (eval сам заметит несовпадение probe_count и не будет гейтить по несравнимому baseline).

import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORPUS_PROBES } from './probes-corpus.mjs';
import { TEMPLATE_PROBES } from './probes-template.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '..', '..');

// Именно 4 библиотеки навыков — мишени corpus-проб. mcp-catalog сюда не входит:
// он полезен любому проекту и переживает kb:init --strip-demo.
const SKILL_LIBRARY_DIRS = ['anthropics-skills', 'claude-cookbooks', 'cybos-cases', 'fabric-patterns'];
const corpusPresent = SKILL_LIBRARY_DIRS.some((p) => existsSync(join(REPO_ROOT, '06_outputs', p)));
const walkthroughPresent = existsSync(join(REPO_ROOT, '03_wiki', 'walkthrough-deflection-rate.md'));

let localProbes = [];
try {
  const mod = await import('./probes.local.mjs');
  localProbes = mod.LOCAL_PROBES || mod.PROBES || [];
} catch { /* probes.local.mjs не создан — норма для свежего клона */ }

export const PROBES = [
  ...(corpusPresent ? CORPUS_PROBES : []),
  ...TEMPLATE_PROBES.filter((p) => !p.walkthrough || walkthroughPresent),
  ...localProbes,
];

export const PROBE_SOURCES = {
  corpus: corpusPresent ? CORPUS_PROBES.length : 0,
  template: TEMPLATE_PROBES.filter((p) => !p.walkthrough || walkthroughPresent).length,
  local: localProbes.length,
  corpusPresent,
  walkthroughPresent,
};

/** Первичная категория пробы — ключ группировки в by_category. */
export function primaryCategory(probe) {
  if (probe.category) return probe.category;
  return (probe.expect_cat || 'Other').split('|')[0].trim();
}

/** Скомпилировать OR-regex из `a|b|c` с экранированием спецсимволов. */
export function toAltRegex(spec) {
  const alts = String(spec).split('|').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(alts.join('|'), 'i');
}
