import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync, symlinkSync, cpSync } from 'node:fs';
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

test('papercut records one durable friction line and counts repeats in the digest', (t) => {
  const root = fixture(t);
  assert.notEqual(cli(root, 'kb-findings.mjs', 'papercut', '   ').status, 0, 'empty friction text is refused');
  const first = JSON.parse(ok(cli(root, 'kb-findings.mjs', 'papercut', 'Команда kb:index нестабильна после смены ветки', '--role', 'librarian', '--json')));
  const second = JSON.parse(ok(cli(root, 'kb-findings.mjs', 'papercut', 'Команда kb:index нестабильна после смены ветки', '--role', 'librarian', '--json')));
  assert.equal(first.id, second.id, 'the same friction is one finding');
  assert.equal(second.kind, 'feedback'); assert.equal(second.code, 'papercut'); assert.equal(second.status, 'open');
  assert.equal(second.observations.length, 2, 'repeats add observations instead of new records');
  assert.equal(list(root).length, 1);
  const digest = ok(cli(root, 'kb-digest.mjs'));
  assert.match(digest, /Papercuts \(не бэклог\)/); assert.match(digest, /×2 команда kb:index нестабильна/);
  assert.match(digest, /Повторяющиеся замечания без предложения навыка/); assert.match(digest, /UNKNOWN: «команда kb:index/);
});

test('from-reviews turns reviewer corrections in task handoffs into open feedback only on --record', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, '.remember/tasks'), { recursive: true });
  writeFileSync(join(root, 'answer.md'), 'Draft answer\n');
  writeFileSync(join(root, '.remember/tasks/t1.json'), JSON.stringify({ task: 't1', owner: 'author', status: 'active', workflow: 'research', stages: [
    { id: 'synthesize', status: 'active', result: '', artifacts: [{ name: 'answer', path: 'answer.md' }], review: { mode: 'independent', status: 'changes-requested', reviewer: 'reviewer-02', contextId: 'c2', authorContextId: 'c1' }, reviewAttempt: 1 },
  ] }));
  const preview = JSON.parse(ok(cli(root, 'kb-findings.mjs', 'from-reviews', '--json')));
  assert.equal(preview.length, 1); assert.equal(preview[0].code, 'review:t1/synthesize'); assert.equal(preview[0].task, 't1'); assert.equal(preview[0].kind, 'feedback');
  assert.equal(list(root).length, 0, 'preview records nothing');
  const recorded = JSON.parse(ok(cli(root, 'kb-findings.mjs', 'from-reviews', '--record', '--json')));
  assert.equal(recorded[0].status, 'open');
  assert.equal(list(root).length, 1);
  assert.equal(JSON.parse(ok(cli(root, 'kb-findings.mjs', 'from-reviews', '--record', '--json')))[0].observations.length, 1, 'same evidence is not duplicated');
});

test('doctor freshness follows the document date, not the checkout mtime', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, '04_synthesis'), { recursive: true });
  writeFileSync(join(root, '04_synthesis/old.md'), '---\ntype: synthesis\nupdated: 2020-01-01\n---\n# Old\n\nOld synthesis text.\n');
  writeFileSync(join(root, '04_synthesis/living.md'), '---\ntype: synthesis\nstatus: living\nupdated: 2020-01-01\n---\n# Living\n\nAlways current.\n');
  writeFileSync(join(root, '04_synthesis/fresh.md'), `---\ntype: synthesis\nupdated: ${new Date().toISOString().slice(0, 10)}\n---\n# Fresh\n\nFresh text.\n`);
  let report = JSON.parse(ok(cli(root, 'kb-doctor.mjs', '--json')));
  const stale = report.issues.staleSynthesis;
  assert.ok(stale.some((i) => i.file === '04_synthesis/old.md' && i.basis === 'frontmatter' && i.age_days > 365), JSON.stringify(stale));
  assert.ok(!stale.some((i) => i.file === '04_synthesis/living.md'), 'living documents never go stale');
  assert.ok(!stale.some((i) => i.file === '04_synthesis/fresh.md'));
  writeFileSync(join(root, 'kb.config.mjs'), 'export default { doctor: { staleDays: 100000 } };\n');
  report = JSON.parse(ok(cli(root, 'kb-doctor.mjs', '--json')));
  assert.equal(report.issues.staleSynthesis.length, 0, 'project-owned threshold is honoured');
});

test('kb:inbox lists everything waiting for a human with one command per card, and the digest shows it', (t) => {
  const root = fixture(t);
  cpSync(join(repo, 'harness'), join(root, 'harness'), { recursive: true });
  assert.deepEqual(JSON.parse(ok(cli(root, 'kb-inbox.mjs', '--json'))).cards, [], 'a clean project waits for nothing');
  mkdirSync(join(root, '05_decisions')); writeFileSync(join(root, '05_decisions/p.md'), '---\ntype: decision\nstatus: proposed\ndate: 2026-01-01\n---\nDECISION: draft. [source: /02_sources/review.md]\n');
  mkdirSync(join(root, '.remember/tasks'), { recursive: true });
  writeFileSync(join(root, '.remember/tasks/t2.json'), JSON.stringify({ task: 't2', owner: 'a', status: 'active', workflow: 'decision', updatedAt: '2026-01-01T00:00:00Z', stages: ['options', 'review', 'propose'].map((id) => ({ id, status: 'complete', result: 'done', artifacts: [] })) }));
  mkdirSync(join(root, '.context/skillopt/run-1'), { recursive: true }); writeFileSync(join(root, '.context/skillopt/run-1/comparison.json'), JSON.stringify({ passed: true, skill: 'demo' })); writeFileSync(join(root, '.context/skillopt/run-1/proposal.json'), JSON.stringify({ skill: 'demo' }));
  mkdirSync(join(root, '.context/work-system'), { recursive: true }); writeFileSync(join(root, '.context/work-system/proposal.json'), JSON.stringify({ profile: { purpose: 'Study' }, createdAt: '2026-01-01T00:00:00Z' }));
  mkdirSync(join(root, '.context/inbox'), { recursive: true }); writeFileSync(join(root, '.context/inbox/c.md'), '---\ntitle: Candidate\n---\nnote\n');
  add(root, input(root));
  const inbox = JSON.parse(ok(cli(root, 'kb-inbox.mjs', '--json')));
  const kinds = new Set(inbox.cards.map((c) => c.kind));
  for (const kind of ['decision-proposed', 'task-awaiting-approval', 'skill-awaiting-approval', 'profile-awaiting-apply', 'inbox-candidate', 'finding-open']) assert.ok(kinds.has(kind), `missing card ${kind}: ${[...kinds]}`);
  assert.ok(inbox.cards.every((c) => c.action && c.where), 'every card names a place and a command');
  assert.ok(inbox.summary.olderThan >= 2, 'old items are counted as overdue');
  assert.match(inbox.cards.find((c) => c.kind === 'decision-proposed').action, /pnpm kb:approve --file 05_decisions\/p\.md/);
  const digest = ok(cli(root, 'kb-digest.mjs'));
  assert.match(digest, /\[decision-proposed\]/); assert.match(digest, /ждут дольше 7 дней/); assert.match(digest, /локальные предложения/);
  assert.match(ok(cli(root, 'kb-metrics.mjs')), /Ждут человека: \d+/);
});

test('silence is not success: the digest shows a failed doctor, the night loop and --strict turns warnings into exit 1', (t) => {
  const root = fixture(t);
  const r = spawnSync(process.execPath, [join(repo, 'scripts/kb-digest.mjs')], { cwd: root, env: { ...env(root), KB_DIGEST_DOCTOR_TIMEOUT_MS: '1' }, encoding: 'utf8', timeout: 60_000 });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /## Ночной контур/); assert.match(r.stdout, /тренды неизвестны: журнал отключён/);
  assert.match(r.stdout, /## Health \(kb-doctor\)/); assert.match(r.stdout, /⚠ kb-doctor не запустился/);
  const strict = spawnSync(process.execPath, [join(repo, 'scripts/kb-digest.mjs'), '--strict'], { cwd: root, env: { ...env(root), KB_DIGEST_DOCTOR_TIMEOUT_MS: '1' }, encoding: 'utf8', timeout: 60_000 });
  assert.equal(strict.status, 1, 'strict mode refuses to stay green with a failed doctor');
});

test('a manual dream run and a zero-file verify scan leave visible traces instead of green silence', (t) => {
  const root = fixture(t);
  const live = { ...env(root), KB_JOURNAL: '1' };
  const dream = spawnSync(process.execPath, [join(repo, 'scripts/dream-cycle.mjs'), '--execute'], { cwd: root, env: live, encoding: 'utf8', timeout: 60_000 });
  assert.equal(dream.status, 0, dream.stderr);
  const journal = readFileSync(join(root, '.context/kb-journal.jsonl'), 'utf8');
  assert.match(journal, /"kind":"run","step":"dream","status":"skipped","reason":"manual-provider"/);
  const digest = spawnSync(process.execPath, [join(repo, 'scripts/kb-digest.mjs')], { cwd: root, env: live, encoding: 'utf8', timeout: 60_000 });
  assert.match(digest.stdout, /- dream: .* ручной режим \(manual-provider\)/);
  const scan = cli(root, 'semantic/verify.mjs', '--scan', '--no-semantic', '--layers', '03_wiki');
  assert.equal(scan.status, 0, scan.stdout + scan.stderr); assert.match(scan.stdout, /⚠ скан проверил 0 файлов/);
  assert.equal(cli(root, 'semantic/verify.mjs', '--scan', '--no-semantic', '--layers', '03_wiki', '--require-files').status, 1);
});

test('freshness exclusions are explicit and leave ordinary stale synthesis visible', t=>{
 const root=fixture(t);mkdirSync(join(root,'04_synthesis'));
 for(const name of ['example','actual'])writeFileSync(join(root,'04_synthesis',name+'.md'),'---\ntype: synthesis\ndate: 2020-01-01\n---\n# A document\n\nText.\n');
 writeFileSync(join(root,'kb.config.mjs'),"export default {doctor:{excludePaths:['04_synthesis/example.md']}};");
 const report=JSON.parse(ok(cli(root,'kb-doctor.mjs','--json')));
 assert.deepEqual(report.issues.staleSynthesis.map(item=>item.file),['04_synthesis/actual.md']);
 assert.equal(report.summary.broken_related,0);
});
