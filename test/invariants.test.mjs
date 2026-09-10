import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = resolve(import.meta.dirname, '..');
const run = (root, ...args) => spawnSync(process.execPath, [join(repo, 'scripts/check-invariants.mjs'), ...args], { cwd: root, env: { ...process.env, KB_ROOT: root }, encoding: 'utf8' });
function put(root, rel, text) { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), text); }
const spec = (frozen) => JSON.stringify({ version: 1, invariants: [{ id: 'no-todo', title: 'No TODO in sources', kind: 'grep', pattern: '\\bTODO\\b', include: ['src/**/*.mjs'], exclude: [], frozen }] });

test('the shipped invariants hold on the template itself', () => {
  const r = run(repo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /храповик не сдвинулся/);
});

test('the ratchet fails on new violations and on frozen entries that healed; projects can disable an id', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'kb-invariants-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  put(root, 'src/a.mjs', '// TODO later\n'); put(root, 'src/b.mjs', '// clean\n');
  put(root, 'harness/invariants.json', spec([]));
  let r = run(root); assert.equal(r.status, 1); assert.match(r.stdout, /NEW: src\/a\.mjs/);
  put(root, 'harness/invariants.json', spec(['src/a.mjs']));
  r = run(root); assert.equal(r.status, 0, r.stdout);
  put(root, 'src/a.mjs', '// done\n');
  r = run(root); assert.equal(r.status, 1); assert.match(r.stdout, /HEALED: src\/a\.mjs/);
  put(root, 'kb.config.mjs', 'export default { invariants: { disabled: ["no-todo"] } };\n');
  r = run(root); assert.equal(r.status, 0, r.stdout); assert.match(r.stdout, /disabled/);
  rmSync(join(root, 'harness'), { recursive: true });
  r = run(root); assert.equal(r.status, 0); assert.match(r.stdout, /nothing to check/);
});
