import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { scanDocsDrift } from '../scripts/lib/docs-drift.mjs';

const repo = resolve(import.meta.dirname, '..');
const upstream = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).name === 'ai-kb-harness-template';
function put(root, rel, text) { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), text); }

// Documentation that agents execute (commands, paths, tool names) must not drift from the code it describes.
test('template-owned documentation matches package scripts, existing paths and registered MCP tools', () => {
  const result = scanDocsDrift(repo);
  assert.deepEqual(result.errors, []);
  assert.ok(result.files.includes('scripts/README.md'));
});

test('documentation drift is detected, not silently accepted', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'docs-drift-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  put(root, 'package.json', JSON.stringify({ name: 'ai-kb-harness-template', scripts: { 'kb:one': 'node scripts/one.mjs' } }));
  put(root, '.template-manifest.json', JSON.stringify({ managedJson: { 'package.json': ['/scripts/kb:one', '/scripts/kb:two'] } }));
  put(root, 'scripts/README.md', 'Run `pnpm kb:nope`, see `scripts/missing.mjs` and `pnpm kb:one`. Placeholders like `scripts/<name>.mjs` are fine.\n');
  put(root, 'scripts/one.mjs', '// ok\n');
  const codes = [...new Set(scanDocsDrift(root).errors.map(e => e.code))].sort();
  assert.deepEqual(codes, ['missing-path', 'undocumented-script', 'unknown-pnpm-script']);
});

test('the control-layers table covers every gate wired into hooks, pre-push and CI', { skip: !upstream }, () => {
  const doc = readFileSync(join(repo, 'docs/architecture.md'), 'utf8');
  const table = doc.split('## Слои контроля')[1]?.split('\n## ')[0] ?? '';
  assert.ok(table.trim(), 'docs/architecture.md needs a «Слои контроля» section');
  const wired = new Set();
  const grab = (text) => { for (const m of text.matchAll(/scripts\/[\w./-]+\.mjs/g)) wired.add(m[0]); };
  grab(readFileSync(join(repo, 'scripts/git-hooks/check.mjs'), 'utf8'));
  const settings = JSON.parse(readFileSync(join(repo, '.claude/settings.json'), 'utf8'));
  for (const group of settings.hooks?.PreToolUse ?? []) for (const hook of group.hooks) grab(hook.command.replace(/\$CLAUDE_PROJECT_DIR\//g, ''));
  for (const workflow of ['ci.yml', 'kb-ci.yml']) {
    for (const line of readFileSync(join(repo, '.github/workflows', workflow), 'utf8').split('\n')) {
      if (!/^\s*(?:run: )?\s*(?:node|pnpm) /.test(line) || /node --check|semantic\/index\.mjs/.test(line)) continue;
      grab(line);
    }
  }
  assert.ok(wired.size >= 10, `expected the wired gate list to be populated, got ${[...wired].join(', ')}`);
  for (const path of wired) assert.ok(table.includes(path), `gate not described in «Слои контроля»: ${path}`);
  for (const m of table.matchAll(/`((?:scripts|harness|docs)\/[\w./-]+)`/g)) assert.ok(existsSync(join(repo, m[1])), `table references a missing path: ${m[1]}`);
});
