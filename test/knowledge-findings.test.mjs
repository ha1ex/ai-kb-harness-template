import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync, spawn } from 'node:child_process';

const repo = resolve(import.meta.dirname, '..');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'knowledge-findings-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, '02_sources'));
  writeFileSync(join(root, '02_sources/review.md'), '---\ntype: source\n---\nUser asked for a source alongside each conclusion.\n');
  return root;
}
const env = (root) => ({ ...process.env, KB_ROOT: root, KB_DB_PATH: join(root, '.semantic-index.sqlite'), KB_JOURNAL: '0', KB_DIGEST_WEBHOOK: '' });
function cli(root, script, ...args) {
  return spawnSync(process.execPath, [join(repo, 'scripts', script), ...args], { encoding: 'utf8', cwd: root, env: env(root), timeout: 30_000 });
}
function ok(result) {
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}
function input(root, overrides = {}, name = 'finding.json') {
  const path = join(root, name);
  writeFileSync(path, JSON.stringify({ kind: 'feedback', title: 'Cite conclusions', problem: 'A conclusion lacked its source.', paths: ['02_sources/review.md'], evidence: [{ source: '02_sources/review.md', observation: 'User requested a source alongside each conclusion.' }], suggestedAction: 'Put a source citation alongside each conclusion.', role: 'researcher', ...overrides }));
  return path;
}
const add = (root, path) => JSON.parse(ok(cli(root, 'kb-findings.mjs', 'add', '--file', path, '--json')));
const list = (root) => JSON.parse(ok(cli(root, 'kb-findings.mjs', 'list', '--json')));

test('list is read-only and returns an empty queue in a fresh project', (t) => {
  const root = fixture(t);
  assert.deepEqual(list(root), []);
  assert.equal(existsSync(join(root, '.remember')), false);
});

test('repeated observations keep one durable finding and preserve accepted feedback', (t) => {
  const root = fixture(t);
  const path = input(root);
  const first = add(root, path);
  assert.equal(first.status, 'open');
  const accepted = JSON.parse(ok(cli(root, 'kb-findings.mjs', 'transition', '--id', first.id, '--status', 'accepted', '--by', 'user', '--note', 'Confirmed after reading the review.', '--json')));
  assert.equal(accepted.history.at(-1).by, 'user');
  const repeated = add(root, input(root, { suggestedAction: 'An unreviewed replacement instruction.' }));
  assert.equal(repeated.id, first.id);
  assert.equal(repeated.status, 'accepted');
  assert.equal(repeated.suggestedAction, first.suggestedAction);
  assert.equal(list(root).length, 1);
  assert.equal(readFileSync(join(root, '.remember/findings', `${first.id}.json`), 'utf8').includes('Confirmed after reading'), true);
});

test('add cannot bypass explicit disposition and transition requires an actor and note', (t) => {
  const root = fixture(t);
  const finding = add(root, input(root, { status: 'accepted' }));
  assert.equal(finding.status, 'open');
  assert.notEqual(cli(root, 'kb-findings.mjs', 'transition', '--id', finding.id, '--status', 'accepted').status, 0);
  assert.equal(list(root)[0].status, 'open');
  for (const status of ['dismissed', 'resolved']) {
    ok(cli(root, 'kb-findings.mjs', 'transition', '--id', finding.id, '--status', status, '--by', 'user', '--note', 'Reviewed.'));
    assert.equal(add(root, input(root)).status, status);
  }
});

test('findings require evidence and refuse path escapes or symlink targets', (t) => {
  const root = fixture(t);
  const outside = fixture(t);
  for (const overrides of [{ evidence: [] }, { paths: ['../outside.md'] }, { evidence: [{ source: '../outside.md', observation: 'Unsafe reference' }] }]) {
    assert.notEqual(cli(root, 'kb-findings.mjs', 'add', '--file', input(root, overrides)).status, 0);
  }
  mkdirSync(join(root, '.remember'), { recursive: true });
  symlinkSync(outside, join(root, '.remember/findings'));
  assert.notEqual(cli(root, 'kb-findings.mjs', 'add', '--file', input(root)).status, 0);
  assert.notEqual(cli(root, 'kb-findings.mjs', 'list', '--json').status, 0);
  assert.deepEqual(readdirSync(outside), ['02_sources']);
});

test('a symlinked record cannot be read or overwritten', (t) => {
  const root = fixture(t);
  const finding = add(root, input(root));
  const path = join(root, '.remember/findings', `${finding.id}.json`);
  const other = join(root, 'other.json');
  writeFileSync(other, readFileSync(path));
  rmSync(path);
  symlinkSync(other, path);
  assert.notEqual(cli(root, 'kb-findings.mjs', 'list', '--json').status, 0);
  assert.notEqual(cli(root, 'kb-findings.mjs', 'add', '--file', input(root)).status, 0);
  assert.equal(JSON.parse(readFileSync(other)).status, 'open');
});

test('concurrent writers retain distinct evidence without corrupting the record', async (t) => {
  const root = fixture(t);
  const paths = Array.from({ length: 6 }, (_, i) => input(root, { evidence: [{ source: '02_sources/review.md', observation: `Review occurrence ${i}.` }] }, `input-${i}.json`));
  const results = await Promise.all(paths.map((path) => new Promise((resolveResult) => {
    const child = spawn(process.execPath, [join(repo, 'scripts/kb-findings.mjs'), 'add', '--file', path, '--json'], { env: env(root), cwd: root });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => resolveResult({ status, stderr }));
  })));
  for (const result of results) assert.equal(result.status, 0, result.stderr);
  const records = list(root);
  assert.equal(records.length, 1);
  assert.equal(records[0].observations.length, 6);
  assert.equal(readdirSync(join(root, '.remember/findings')).filter((path) => path.endsWith('.lock') || path.endsWith('.tmp')).length, 0);
});

test('doctor remains read-only while explicit scan records evidence without duplicate issues', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, '03_wiki'));
  writeFileSync(join(root, '03_wiki/broken.md'), '---\ntype: wiki\nrelated: [/02_sources/missing.md]\n---\nA broken reference.\n');
  const report = JSON.parse(ok(spawnSync(process.execPath, [join(repo, 'scripts/kb-doctor.mjs'), '--json'], { encoding: 'utf8', cwd: root, env: { ...env(root), KB_JOURNAL: '1' } })));
  assert.equal(report.summary.broken_related, 1);
  assert.equal(existsSync(join(root, '.remember')), false);
  assert.equal(existsSync(join(root, '.context')), false);
  ok(cli(root, 'kb-findings.mjs', 'scan', '--json'));
  const findings = list(root);
  assert.equal(findings.some((record) => record.kind === 'knowledge' && record.paths.includes('03_wiki/broken.md') && record.problem.includes('missing.md')), true);
  ok(cli(root, 'kb-doctor.mjs', '--record-findings', '--json'));
  assert.equal(list(root).length, findings.length);
});

test('dream dry-run includes the queue but never records a completed audit', (t) => {
  const root = fixture(t);
  const finding = add(root, input(root));
  const output = ok(cli(root, 'dream-cycle.mjs', '--dry-run'));
  assert.equal(output.includes(finding.id), true);
  assert.equal(list(root).length, 1);
  assert.equal(existsSync(join(root, '.context')), false);
});

test('manual dream execution produces only a prompt and no audit finding', (t) => {
  const root = fixture(t);
  ok(cli(root, 'dream-cycle.mjs', '--execute'));
  assert.deepEqual(list(root), []);
});

test('dream refuses a symlinked output directory before writing outside the project', (t) => {
  const root = fixture(t);
  const outside = fixture(t);
  symlinkSync(outside, join(root, '.context'));
  assert.notEqual(cli(root, 'dream-cycle.mjs').status, 0);
  assert.deepEqual(readdirSync(outside), ['02_sources']);
});

test('executed dream records a candidate report with real output evidence', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'kb.config.mjs'), `export default {llm:{provider:'generic-cli',cli:{command:${JSON.stringify(process.execPath)},args:['-e', 'process.stdin.resume();process.stdin.on("end",()=>process.stdout.write("UNKNOWN: Review the source dates."));']},timeout_ms:10000,max_retries:0}};\n`);
  ok(cli(root, 'dream-cycle.mjs', '--execute'));
  const findings = list(root);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'knowledge');
  assert.equal(findings[0].status, 'open');
  assert.equal(findings[0].evidence[0].observation.includes('UNKNOWN: Review the source dates.'), true);
  assert.equal(existsSync(join(root, findings[0].evidence[0].source)), true);
});

test('digest shows queue states and review actions', (t) => {
  const root = fixture(t);
  const finding = add(root, input(root));
  const output = ok(cli(root, 'kb-digest.mjs'));
  assert.equal(output.includes(finding.id), true);
  assert.equal(output.includes('open'), true);
  assert.equal(output.includes('transition'), true);
});

test('digest and metrics snapshots refuse symlinked output directories', (t) => {
  const root = fixture(t);
  const outside = fixture(t);
  symlinkSync(outside, join(root, '.context'));
  assert.notEqual(cli(root, 'kb-digest.mjs').status, 0);
  assert.notEqual(cli(root, 'kb-metrics.mjs', '--snapshot', '--json').status, 0);
  assert.deepEqual(readdirSync(outside), ['02_sources']);
});

test('metrics retain unknown values when no feedback or first-pass samples exist', (t) => {
  const root = fixture(t);
  const metrics = JSON.parse(ok(cli(root, 'kb-metrics.mjs', '--json')));
  assert.equal(metrics.findings.total, 0);
  for (const name of ['repeatedFeedback', 'firstPassCompletion']) {
    assert.equal(metrics[name].status, 'insufficient-data');
    assert.equal(metrics[name].value, null);
    assert.equal(metrics[name].sampleSize, 0);
  }
});

test('metrics count observed feedback occurrences without treating repeat scans as new feedback', (t) => {
  const root = fixture(t);
  add(root, input(root));
  add(root, input(root));
  add(root, input(root, { evidence: [{ source: '02_sources/review.md', observation: 'User repeated the correction on a second answer.' }] }));
  const metrics = JSON.parse(ok(cli(root, 'kb-metrics.mjs', '--json')));
  assert.equal(metrics.findings.byKind.feedback, 1);
  assert.equal(metrics.repeatedFeedback.sampleSize, 2);
  assert.equal(metrics.repeatedFeedback.repeated, 1);
  assert.equal(metrics.repeatedFeedback.value, 0.5);
});

test('first-pass metrics use explicit first reviews and exclude retries and generic verify runs', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, '.context'));
  const entries = [
    { kind: 'task-review', task: 'one', attempt: 1, passed: false },
    { kind: 'task-review', task: 'one', attempt: 2, passed: true },
    { kind: 'task-review', task: 'two', attempt: 1, passed: true },
    { kind: 'verify', verify: { passed: true } },
  ];
  writeFileSync(join(root, '.context/kb-journal.jsonl'), entries.map((entry) => JSON.stringify({ written_at: '2026-09-09T10:00:00Z', ...entry })).join('\n'));
  const metrics = JSON.parse(ok(cli(root, 'kb-metrics.mjs', '--json')));
  assert.equal(metrics.firstPassCompletion.sampleSize, 2);
  assert.equal(metrics.firstPassCompletion.passed, 1);
  assert.equal(metrics.firstPassCompletion.value, 0.5);
});

test('first-pass reviews count each stage separately and never credit a successful retry', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, '.context'));
  const path = join(root, '.context/kb-journal.jsonl');
  const entries = [
    { kind: 'task-review', task: 'research', stage: 'synthesis', attempt: 1, passed: false },
    { kind: 'task-review', task: 'research', stage: 'synthesis', attempt: 2, passed: true },
  ];
  const save = () => writeFileSync(path, entries.map((entry) => JSON.stringify({ written_at: '2026-09-09T10:00:00Z', ...entry })).join('\n'));
  save();
  let metric = JSON.parse(ok(cli(root, 'kb-metrics.mjs', '--json'))).firstPassCompletion;
  assert.equal(metric.sampleSize, 1);
  assert.equal(metric.value, 0);
  entries.push({ kind: 'task-review', task: 'research', stage: 'deliverable', attempt: 1, passed: true });
  save();
  metric = JSON.parse(ok(cli(root, 'kb-metrics.mjs', '--json'))).firstPassCompletion;
  assert.equal(metric.sampleSize, 2);
  assert.equal(metric.passed, 1);
  assert.equal(metric.value, 0.5);
});
