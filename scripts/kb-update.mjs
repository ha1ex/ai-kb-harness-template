#!/usr/bin/env node
// kb-update.mjs — обновление форка от upstream-шаблона БЕЗ merge-ада (C3).
//
// GitHub-шаблоны не обновляют клоны. Этот скрипт делает файловый 3-way-lite строго
// по границе из .template-manifest.json:
//   • смотрит ТОЛЬКО template-owned пути (ядро оснастки);
//   • файл изменился в upstream и НЕ тронут локально → безопасно взять upstream-версию;
//   • файл изменился и там, и там → пропустить с предупреждением (ручной merge);
//   • project-owned (kb.config.mjs, AGENTS.md, слои 00–06…) НИКОГДА не трогается.
//
// Использование:
//   node scripts/kb-update.mjs                # dry-run: что изменилось, что конфликтует
//   node scripts/kb-update.mjs --apply        # применить безопасные обновления (чистый tree!)
//   node scripts/kb-update.mjs --remote NAME  # имя remote (default: upstream; создаст из манифеста)
//
// После --apply: pnpm run setup (если менялись package.json) и pnpm kb:doctor.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { KB_ROOT } from './lib/kb-root.mjs';

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const remoteIdx = argv.indexOf('--remote');
const remote = remoteIdx >= 0 ? argv[remoteIdx + 1] : 'upstream';

const git = (...args) => execFileSync('git', args, { cwd: KB_ROOT, encoding: 'utf8' }).trim();

const manifestPath = join(KB_ROOT, '.template-manifest.json');
if (!existsSync(manifestPath)) {
  console.error('[kb-update] .template-manifest.json не найден — обновляйтесь вручную (README § Как обновляться).');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const templateOwned = manifest.templateOwned || [];
if (!templateOwned.length) {
  console.error('[kb-update] templateOwned пуст в манифесте — нечего обновлять.');
  process.exit(1);
}

// ---------- remote ----------

let hasRemote = false;
try { git('remote', 'get-url', remote); hasRemote = true; } catch { /* нет remote */ }
if (!hasRemote) {
  if (!manifest.upstream) {
    console.error(`[kb-update] remote «${remote}» отсутствует и upstream в манифесте не задан.`);
    process.exit(1);
  }
  console.log(`[kb-update] добавляю remote ${remote} → ${manifest.upstream}`);
  git('remote', 'add', remote, manifest.upstream);
}
console.log(`[kb-update] git fetch ${remote} …`);
execFileSync('git', ['fetch', remote], { cwd: KB_ROOT, stdio: 'inherit' });

const upstreamRef = `${remote}/main`;
let mergeBase;
try {
  mergeBase = git('merge-base', 'HEAD', upstreamRef);
} catch {
  console.error(`[kb-update] нет общей истории с ${upstreamRef} (клон не из этого шаблона?) — обновляйтесь вручную.`);
  process.exit(1);
}

// ---------- классификация файлов ----------

const nameOnly = (a, b) => {
  const out = git('diff', '--name-only', a, b, '--', ...templateOwned);
  return new Set(out ? out.split('\n') : []);
};

const upstreamChanged = nameOnly(mergeBase, upstreamRef); // изменено в upstream с точки развилки
const locallyChanged = nameOnly(mergeBase, 'HEAD');       // изменено локально с точки развилки

const safe = [...upstreamChanged].filter((f) => !locallyChanged.has(f)).sort();
const conflicted = [...upstreamChanged].filter((f) => locallyChanged.has(f)).sort();

if (!upstreamChanged.size) {
  console.log(`[kb-update] template-owned файлы актуальны (upstream ${upstreamRef} не приносит изменений).`);
  process.exit(0);
}

console.log(`\n[kb-update] upstream ${upstreamRef} (merge-base ${mergeBase.slice(0, 7)}):`);
console.log(`\n  Безопасно обновить (${safe.length}) — изменены только в upstream:`);
for (const f of safe) console.log(`    ✓ ${f}`);
if (conflicted.length) {
  console.log(`\n  ⚠ Конфликтуют (${conflicted.length}) — изменены и в upstream, и локально (ручной merge):`);
  for (const f of conflicted) console.log(`    ✗ ${f}   (git diff ${mergeBase.slice(0, 7)}..${upstreamRef} -- ${f})`);
}

if (!apply) {
  console.log('\n[kb-update] dry-run. Применить безопасные обновления: node scripts/kb-update.mjs --apply');
  process.exit(0);
}

// ---------- apply ----------

if (git('status', '--porcelain')) {
  console.error('\n[kb-update] рабочее дерево не чистое — закоммить/stash перед --apply.');
  process.exit(1);
}
if (!safe.length) {
  console.log('\n[kb-update] безопасных обновлений нет (всё конфликтует) — только ручной merge.');
  process.exit(0);
}
git('checkout', upstreamRef, '--', ...safe);
console.log(`\n[kb-update] применено ${safe.length} файлов (staged). Дальше:`);
console.log('  1. git diff --cached           # просмотреть');
console.log('  2. pnpm run setup && pnpm kb:doctor && node scripts/semantic/test-gate.mjs');
console.log('  3. git commit -m "chore: update harness from upstream"');
if (conflicted.length) console.log(`  4. Разобрать ${conflicted.length} конфликтующих файлов вручную (список выше).`);
