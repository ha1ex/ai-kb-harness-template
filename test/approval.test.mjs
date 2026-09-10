import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { effectHash, checkApproval, stampApproval } from '../scripts/lib/approval.mjs';

const repo = resolve(import.meta.dirname, '..');
const decision = (status = 'proposed', body = 'DECISION: run the pilot for one team. [source: /02_sources/review.md]\n\nRationale follows.\n') => `---\ntype: decision\nstatus: ${status}\ndate: 2026-09-01\n---\n\n# Pilot scope\n\n${body}`;
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'kb-approval-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, '02_sources')); writeFileSync(join(root, '02_sources/review.md'), '---\ntype: source\n---\nReview notes.\n');
  mkdirSync(join(root, '05_decisions'));
  return root;
}
const env = (root) => ({ ...process.env, KB_ROOT: root, KB_DB_PATH: join(root, '.semantic-index.sqlite'), KB_JOURNAL: '0' });
const cli = (root, script, ...args) => spawnSync(process.execPath, [join(repo, 'scripts', script), ...args], { cwd: root, env: env(root), encoding: 'utf8', timeout: 60_000 });
const hook = (root, payload) => spawnSync(process.execPath, [join(repo, 'scripts/check-decisions.mjs')], { cwd: root, env: env(root), encoding: 'utf8', input: JSON.stringify(payload) });

test('the effect hash ignores line endings, trailing whitespace and frontmatter, but not body edits', () => {
  const stamped = stampApproval(decision('proposed'), { by: 'owner', reference: 'meeting 2026-09-01' });
  assert.equal(checkApproval(stamped).status, 'accepted');
  assert.equal(checkApproval(stamped.replace(/\n/g, '\r\n')).status, 'accepted', 'CRLF does not break the signature');
  assert.equal(checkApproval(stamped.replace('date: 2026-09-01', 'date: 2026-09-01\ntags: [pilot]')).status, 'accepted', 'frontmatter-only edits keep the signature');
  assert.equal(checkApproval(stamped.replace('one team', 'two teams')).status, 'stale');
  assert.equal(checkApproval(decision('accepted')).status, 'unsigned');
  assert.equal(checkApproval(decision('proposed')).status, 'proposed');
  assert.equal(checkApproval(decision('shipped')).status, 'other');
  assert.equal(effectHash('a  \nb\r\n'), effectHash('a\nb'));
});

test('kb:approve stamps, checks and re-approves decisions as one all-or-nothing set', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, '05_decisions/x.md'), decision('proposed'));
  writeFileSync(join(root, '05_decisions/y.md'), decision('shipped'));
  let r = cli(root, 'kb-approve.mjs', '--file', '05_decisions/x.md', '--file', '05_decisions/y.md', '--by', 'owner', '--reference', 'ref-1');
  assert.equal(r.status, 1, 'a file outside the vocabulary refuses the whole set');
  assert.match(readFileSync(join(root, '05_decisions/x.md'), 'utf8'), /status: proposed/);
  r = cli(root, 'kb-approve.mjs', '--file', '05_decisions/x.md', '--by', 'owner', '--reference', 'ref-1', '--json');
  assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout)[0].action, 'approved');
  const text = readFileSync(join(root, '05_decisions/x.md'), 'utf8');
  assert.match(text, /status: accepted\napproved_by: "owner"\napproved_at: .*\napproved_ref: "ref-1"\napproved_hash: [a-f0-9]{64}/);
  assert.equal(JSON.parse(cli(root, 'kb-approve.mjs', '--check', '--file', '05_decisions/x.md', '--json').stdout)[0].status, 'accepted');
  assert.equal(JSON.parse(cli(root, 'kb-approve.mjs', '--file', '05_decisions/x.md', '--by', 'owner', '--reference', 'ref-2', '--json').stdout)[0].action, 'unchanged');
  writeFileSync(join(root, '05_decisions/x.md'), text.replace('one team', 'two teams'));
  r = cli(root, 'kb-approve.mjs', '--check', '--file', '05_decisions/x.md', '--json');
  assert.equal(r.status, 1); assert.equal(JSON.parse(r.stdout)[0].status, 'stale');
  assert.equal(JSON.parse(cli(root, 'kb-approve.mjs', '--file', '05_decisions/x.md', '--by', 'owner', '--reference', 'ref-3', '--json').stdout)[0].action, 're-approved');
  assert.equal(cli(root, 'kb-approve.mjs', '--check', '--file', '05_decisions/x.md').status, 0);
});

test('the decisions hook blocks agent writes that claim acceptance without a valid signature', (t) => {
  const root = fixture(t);
  const path = join(root, '05_decisions/z.md');
  let r = hook(root, { tool_name: 'Write', tool_input: { file_path: path, content: decision('accepted') } });
  assert.equal(r.status, 2); assert.match(r.stderr, /kb:approve/);
  r = hook(root, { tool_name: 'Write', tool_input: { file_path: path, content: decision('proposed') } });
  assert.equal(r.status, 0, r.stderr);
  const stamped = stampApproval(decision('proposed'), { by: 'owner', reference: 'ref' });
  r = hook(root, { tool_name: 'Write', tool_input: { file_path: path, content: stamped } });
  assert.equal(r.status, 0, r.stderr);
  writeFileSync(path, stamped);
  r = hook(root, { tool_name: 'Edit', tool_input: { file_path: path, old_string: 'one team', new_string: 'two teams' } });
  assert.equal(r.status, 2, 'editing an approved body removes the approval');
  r = hook(root, { tool_name: 'Edit', tool_input: { file_path: path, old_string: 'status: accepted', new_string: 'status: proposed' } });
  assert.equal(r.status, 0, 'returning the document to proposed is allowed');
});

test('verify --scan gates stale signatures and reports unsigned acceptance as advisory by default', (t) => {
  const root = fixture(t);
  const stamped = stampApproval(decision('proposed'), { by: 'owner', reference: 'ref' });
  writeFileSync(join(root, '05_decisions/ok.md'), stamped);
  let r = cli(root, 'semantic/verify.mjs', '--scan', '--no-semantic', '--layers', '05_decisions');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  writeFileSync(join(root, '05_decisions/unsigned.md'), decision('accepted'));
  r = cli(root, 'semantic/verify.mjs', '--scan', '--no-semantic', '--layers', '05_decisions');
  assert.equal(r.status, 0, 'unsigned acceptance stays advisory unless approval.required'); assert.match(r.stdout, /⚠ 05_decisions\/unsigned\.md/);
  writeFileSync(join(root, 'kb.config.mjs'), 'export default { approval: { required: true } };\n');
  assert.equal(cli(root, 'semantic/verify.mjs', '--scan', '--no-semantic', '--layers', '05_decisions').status, 1, 'required makes unsigned acceptance a gate');
  rmSync(join(root, 'kb.config.mjs')); rmSync(join(root, '05_decisions/unsigned.md'));
  writeFileSync(join(root, '05_decisions/ok.md'), stamped.replace('one team', 'two teams'));
  r = cli(root, 'semantic/verify.mjs', '--scan', '--no-semantic', '--layers', '05_decisions');
  assert.equal(r.status, 1); assert.match(r.stdout, /approval: body changed after approval/);
  const doctor = JSON.parse(cli(root, 'kb-doctor.mjs', '--json').stdout);
  assert.equal(doctor.issues.approvalIssues.length, 1); assert.equal(doctor.issues.approvalIssues[0].status, 'stale');
});
