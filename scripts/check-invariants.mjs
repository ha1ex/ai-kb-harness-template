#!/usr/bin/env node
// Architectural invariants with a ratchet: existing violations are frozen by path, new ones fail, and a frozen
// entry that no longer violates must be removed (the list only shrinks). «Архитектура держится, только если её
// можно grep-нуть». Runs against KB_ROOT (the harness root in a project is the project root).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { KB_ROOT, loadKbConfig } from './lib/kb-root.mjs';

const root = KB_ROOT;
const specPath = join(root, 'harness/invariants.json');
const asJson = process.argv.includes('--json');
if (!existsSync(specPath)) { console.log('[invariants] harness/invariants.json not found; nothing to check'); process.exit(0); }
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const overlay = (await loadKbConfig()).invariants ?? {};
const disabled = new Set(Array.isArray(overlay.disabled) ? overlay.disabled : []);

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\//g, '\u0000').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\u0000/g, '(?:.*/)?');
  return new RegExp(`^${escaped}$`);
}
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { if (!['node_modules', '.git'].includes(entry.name)) walk(path, out); }
    else out.push(path);
  }
  return out;
}
const allFiles = walk(root).map((p) => relative(root, p).split('\\').join('/'));
const select = (inv) => { const inc = (inv.include ?? []).map(globToRegExp), exc = (inv.exclude ?? []).map(globToRegExp); return allFiles.filter((f) => inc.some((r) => r.test(f)) && !exc.some((r) => r.test(f))); };
const read = (f) => readFileSync(join(root, f), 'utf8');

function violations(inv) {
  const files = select(inv);
  if (inv.kind === 'grep') {
    const re = new RegExp(inv.pattern), unless = inv.unless ? new RegExp(inv.unless) : null;
    return files.filter((f) => read(f).split('\n').some((line) => re.test(line) && !(unless && unless.test(line))));
  }
  if (inv.kind === 'file-length') return files.filter((f) => read(f).split('\n').length > inv.max);
  if (inv.kind === 'reachable') {
    const hay = (inv.referencedIn ?? []).map(globToRegExp);
    const refs = allFiles.filter((f) => hay.some((r) => r.test(f))).map((f) => ({ f, text: read(f) }));
    return files.filter((f) => { const base = f.split('/').pop(); return !refs.some((r) => r.f !== f && r.text.includes(base)); });
  }
  throw Error(`Unknown invariant kind: ${inv.kind} (${inv.id})`);
}

const report = [];
for (const inv of spec.invariants ?? []) {
  if (disabled.has(inv.id)) { report.push({ id: inv.id, title: inv.title, status: 'disabled', fresh: [], healed: [] }); continue; }
  const frozen = new Set([...(inv.frozen ?? []), ...(overlay.frozen?.[inv.id] ?? [])]);
  const found = new Set(violations(inv));
  const fresh = [...found].filter((f) => !frozen.has(f)).sort();
  const healed = [...frozen].filter((f) => !found.has(f)).sort();
  report.push({ id: inv.id, title: inv.title, status: fresh.length || healed.length ? 'failed' : 'ok', violations: found.size, frozen: frozen.size, fresh, healed, rationale: inv.rationale });
}
const failed = report.filter((r) => r.status === 'failed');
if (asJson) console.log(JSON.stringify({ root, report }, null, 2));
else {
  for (const r of report) {
    console.log(`${r.status === 'ok' ? '✓' : r.status === 'disabled' ? '–' : '✗'} ${r.id}${r.title ? ` — ${r.title}` : ''}${r.status === 'disabled' ? ' (disabled in kb.config.mjs)' : ` · нарушений ${r.violations}, заморожено ${r.frozen}`}`);
    for (const f of r.fresh) console.log(`    NEW: ${f}  — исправьте или осознанно добавьте в frozen с датой`);
    for (const f of r.healed) console.log(`    HEALED: ${f}  — больше не нарушает; удалите из frozen (список только уменьшается)`);
  }
  console.log(failed.length ? `[invariants] ${failed.length} инвариантов требуют внимания` : `[invariants] ${report.length} инвариантов: храповик не сдвинулся`);
}
process.exit(failed.length ? 1 : 0);
