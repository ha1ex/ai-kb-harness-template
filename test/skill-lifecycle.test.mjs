import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const cli = resolve('scripts/skillopt/cli.mjs');
const discoveryPath = resolve('scripts/lib/skills.mjs');
const skill = (name, body = 'GOOD') => `---\nname: ${name}\ndescription: Test the procedure when requested.\n---\n\n# Procedure\n${body}\n`;
const evalCase = (name, id = 'one', expected = '- must contain: GOOD', extra = '') => `---\ntype: eval-case\nversion: v0.1\nskill: ${name}\ngrader: contains\n${extra}---\n\n# Input\nQuestion ${id}\n\n# Expected\n${expected}\n`;
function put(root, path, text) { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text); }
function git(root, ...args) { const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout; }
function fixture(t, { name = 'project-check', body = 'OLD', legacy = false, canonical = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'skill-lifecycle-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  put(root, '.gitignore', '.context/\n');
  put(root, 'AGENTS.md', 'Read the canonical evidence rules.');
  put(root, 'harness/rules/evidence.md', 'CANONICAL_EVIDENCE: preserve uncertainty.');
  put(root, 'harness/rules/workflow.md', 'Require authorized review.');
  put(root, 'docs/human-interface.md', 'Keep the answer readable.');
  const path = canonical ? `harness/skills/${name}/SKILL.md` : legacy ? `skills/${name}.md` : `skills/${name}/SKILL.md`;
  put(root, path, skill(name, body));
  const evalDir = canonical ? `harness/skills/${name}/evals` : `skills/${name}/evals`;
  put(root, `${evalDir}/one.yaml`, evalCase(name));
  put(root, 'fake-local.cjs', `let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>{if(!s.includes('CANONICAL_EVIDENCE')){process.stderr.write('missing canonical context');process.exit(2)}if(s.includes('EMPTY'))return;if(s.includes('CRASH'))process.exit(3);process.stdout.write(s.includes('GOOD')?'GOOD':'UNKNOWN')});`);
  put(root, '.skillopt.json', JSON.stringify({ provider: 'generic-cli', model: 'deterministic-local', timeout_ms: 1000, concurrency: 1, cli: { command: process.execPath, args: [join(root, 'fake-local.cjs')], stdin_template: '{{system}}\n{{user}}' } }));
  put(root, 'proposal.md', skill(name));
  git(root, 'init', '-q'); git(root, 'add', '.'); git(root, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture');
  return { root, name, path, evalDir };
}
function command(root, ...args) { return spawnSync(process.execPath, [cli, ...args], { cwd: root, env: { ...process.env, KB_ROOT: root, SKILLOPT_PROVIDER: '', SKILLOPT_MODEL: '', SKILLOPT_BASE_URL: '', SKILLOPT_API_KEY: '' }, encoding: 'utf8', timeout: 15000 }); }
function ok(root, ...args) { const r = command(root, ...args); assert.equal(r.status, 0, r.stderr || r.stdout); return r.stdout; }
function json(root, ...args) { return JSON.parse(ok(root, ...args, '--json')); }
function propose(f, extra = []) { return json(f.root, 'propose', f.name, '--file', 'proposal.md', '--reason', 'The current procedure misses the required answer.', ...extra).runId; }
function compare(f, runId) { return json(f.root, 'compare', runId, '--execute'); }
function approve(f, runId) { return json(f.root, 'approve', runId, '--by', 'Fixture reviewer', '--note', 'Test fixture authorization, not a real human approval.'); }

test('discovery returns canonical, bundled and normalized legacy skills with one ownership contract', async (t) => {
  const f = fixture(t);
  put(f.root, 'harness/skills/canonical/SKILL.md', skill('canonical'));
  put(f.root, 'skills/legacy.md', '# Legacy procedure\nUse this when requested.\n');
  assert.ok(existsSync(discoveryPath), 'shared skill discovery is required');
  const { discoverSkills } = await import(discoveryPath);
  const result = discoverSkills(f.root);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.skills.map(s => [s.name, s.source, s.legacy, s.dir]), [
    ['canonical', 'harness', false, 'harness/skills/canonical'], ['legacy', 'project', true, null], ['project-check', 'project', false, 'skills/project-check'],
  ]);
  assert.match(result.skills.find(s => s.name === 'legacy').text, /^---\nname:.*legacy/);
});

test('discovery rejects duplicate names, unsafe links and malformed skill metadata', async (t) => {
  const f = fixture(t);
  put(f.root, `harness/skills/${f.name}/SKILL.md`, skill(f.name));
  put(f.root, 'skills/wrong/SKILL.md', skill('different-name'));
  put(f.root, 'skills/malformed/SKILL.md', '---\nname: malformed\ndescription: [broken\n---\nBody');
  symlinkSync(join(f.root, 'proposal.md'), join(f.root, 'skills', 'linked.md'));
  assert.ok(existsSync(discoveryPath), 'shared skill discovery is required');
  const { discoverSkills } = await import(discoveryPath);
  const { errors, skills } = discoverSkills(f.root);
  assert.ok(errors.some(e => /duplicate/i.test(e)));
  assert.ok(errors.some(e => /symlink|unsafe/i.test(e)));
  assert.ok(errors.some(e => /metadata|frontmatter|name/i.test(e)));
  assert.equal(skills.some(s => s.name === f.name), false, 'ambiguous skill must not remain executable');
});

test('discovery accepts folded descriptions and rejects empty block metadata', async (t) => {
  const f = fixture(t);
  put(f.root, 'skills/folded/SKILL.md', '---\nname: folded\ndescription: >\n  Use this procedure\n  when a source needs review.\n---\n\nRead the source.\n');
  const { discoverSkills } = await import(discoveryPath);
  assert.deepEqual(discoverSkills(f.root).errors, []);
  put(f.root, 'skills/folded/SKILL.md', '---\nname: folded\ndescription: >\n---\nRead the source.');
  assert.equal(discoverSkills(f.root).skills.some(s => s.name === 'folded'), false);
});

test('list and eval honor KB_ROOT and include harness bundles', (t) => {
  const f = fixture(t, { canonical: true, name: 'canonical', body: 'GOOD' });
  const list = json(f.root, 'list');
  assert.equal(list.length, 1);
  assert.equal(list[0].skill, 'canonical');
  assert.equal(list[0].source, 'harness');
  const manual = json(f.root, 'eval', f.name);
  assert.equal(manual.executed, false);
  const evaluated = json(f.root, 'eval', f.name, '--execute');
  assert.equal(evaluated.summary.passed, 1);
});

test('comparison freezes identical inputs, context and hashes, then requires recorded approval before project apply', (t) => {
  const f = fixture(t);
  const runId = propose(f);
  const manual = json(f.root, 'compare', runId);
  assert.equal(manual.executed, false);
  assert.equal(command(f.root, 'apply', runId).status, 1);
  const result = compare(f, runId);
  assert.equal(result.passed, true);
  assert.equal(result.current.total, 1);
  assert.equal(result.current.passed, 0);
  assert.equal(result.proposal.passed, 1);
  assert.equal(result.proposal.errored, 0);
  assert.equal(result.cases[0].current.input, result.cases[0].proposal.input);
  assert.equal(result.cases[0].current.context_hash, result.cases[0].proposal.context_hash);
  for (const key of ['base', 'proposal', 'cases', 'context', 'llm']) assert.match(result.hashes[key], /^[a-f0-9]{64}$/);
  assert.equal(command(f.root, 'apply', runId).status, 1);
  const approval = approve(f, runId);
  assert.equal(approval.identity_verified, false);
  ok(f.root, 'apply', runId);
  assert.equal(readFileSync(join(f.root, f.path), 'utf8'), skill(f.name));
  assert.match(readFileSync(join(f.root, '.context/skillopt', runId, 'backups', `${f.name}.md`), 'utf8'), /OLD/);
  ok(f.root, 'revert', runId);
  assert.match(readFileSync(join(f.root, f.path), 'utf8'), /OLD/);
});

test('comparison artifacts store configuration hashes without exposing adapter arguments or credentials', (t) => {
  const f = fixture(t);
  const path = join(f.root, '.skillopt.json'), config = JSON.parse(readFileSync(path, 'utf8'));
  config.api_key = 'fixture-secret-credential';
  config.cli.args.push('fixture-secret-argument');
  writeFileSync(path, JSON.stringify(config));
  const runId = propose(f); json(f.root, 'compare', runId);
  const artifact = readFileSync(join(f.root, '.context/skillopt', runId, 'comparison-plan.json'), 'utf8');
  assert.doesNotMatch(artifact, /fixture-secret/);
});

test('a new-skill proposal refuses eval sources changed after drafting', (t) => {
  const f = fixture(t); f.name = 'new-skill';
  put(f.root, 'proposal.md', skill(f.name)); put(f.root, 'new-eval.yaml', evalCase(f.name));
  const runId = propose(f, ['--evals', 'new-eval.yaml']);
  put(f.root, 'new-eval.yaml', evalCase(f.name, 'different-input'));
  const result = command(f.root, 'compare', runId, '--execute');
  assert.equal(result.status, 1); assert.match(result.stderr, /stale|changed/i);
});

test('apply preserves dirty files and revert preserves edits made after apply', (t) => {
  const f = fixture(t);
  put(f.root, f.path, skill(f.name, 'OLD dirty'));
  const runId = propose(f); compare(f, runId); approve(f, runId);
  assert.equal(command(f.root, 'apply', runId).status, 1);
  assert.match(readFileSync(join(f.root, f.path), 'utf8'), /dirty/);
  git(f.root, 'add', f.path); git(f.root, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'save current skill');
  ok(f.root, 'apply', runId);
  put(f.root, f.path, skill(f.name, 'GOOD additional work'));
  assert.equal(command(f.root, 'revert', runId).status, 1);
  assert.match(readFileSync(join(f.root, f.path), 'utf8'), /additional work/);
});

test('revert preserves staged user changes even when working-tree content matches the applied proposal', (t) => {
  const f = fixture(t), runId = propose(f); compare(f, runId); approve(f, runId); ok(f.root, 'apply', runId);
  put(f.root, f.path, skill(f.name, 'GOOD PLUS STAGED USER EDIT'));
  git(f.root, 'add', f.path);
  put(f.root, f.path, skill(f.name));
  const result = command(f.root, 'revert', runId);
  assert.equal(result.status, 1);
  assert.match(git(f.root, 'show', `:${f.path}`), /STAGED USER EDIT/);
  assert.equal(readFileSync(join(f.root, f.path), 'utf8'), skill(f.name));
});

test('a fresh comparison invalidates approval and changed comparison artifacts cannot apply', (t) => {
  const f = fixture(t), runId = propose(f); compare(f, runId); approve(f, runId);
  compare(f, runId);
  assert.equal(command(f.root, 'apply', runId).status, 1);
  approve(f, runId);
  const path = join(f.root, '.context/skillopt', runId, 'comparison.json'), record = JSON.parse(readFileSync(path, 'utf8'));
  record.cases[0].proposal.output = 'Modified result after approval'; writeFileSync(path, JSON.stringify(record));
  assert.equal(command(f.root, 'apply', runId).status, 1);
});

for (const changed of ['proposal', 'base', 'cases', 'context', 'config']) test(`apply refuses stale ${changed} after comparison and approval`, (t) => {
  const f = fixture(t); const runId = propose(f); compare(f, runId); approve(f, runId);
  const paths = { proposal: `.context/skillopt/${runId}/proposals/${f.name}.md`, base: f.path, cases: `${f.evalDir}/one.yaml`, context: 'harness/rules/evidence.md', config: '.skillopt.json' };
  const path = join(f.root, paths[changed]);
  writeFileSync(path, readFileSync(path, 'utf8') + '\n');
  const r = command(f.root, 'apply', runId);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /stale|changed|hash|dirty/i);
});

for (const body of ['EMPTY', 'CRASH', 'OLD']) test(`comparison cannot pass candidate ${body.toLowerCase()} output`, (t) => {
  const f = fixture(t); put(f.root, 'proposal.md', skill(f.name, body));
  const runId = propose(f); const r = command(f.root, 'compare', runId, '--execute', '--json');
  assert.equal(r.status, 1);
  assert.equal(JSON.parse(r.stdout).passed, false);
  assert.equal(command(f.root, 'approve', runId, '--by', 'Test', '--note', 'Fixture only').status, 1);
  assert.equal(command(f.root, 'apply', runId).status, 1);
});

test('new skill compares against no skill and applies into a standard directory with its evals', (t) => {
  const f = fixture(t); f.name = 'new-skill';
  put(f.root, 'proposal.md', skill(f.name)); put(f.root, 'new-eval.yaml', evalCase(f.name));
  const runId = propose(f, ['--evals', 'new-eval.yaml']);
  const diff = json(f.root, 'diff', runId);
  assert.equal(diff[0].old_size, 0);
  assert.match(diff[0].diff, /GOOD/);
  const result = compare(f, runId);
  assert.equal(result.passed, true); assert.equal(result.current.passed, 0);
  approve(f, runId); ok(f.root, 'apply', runId);
  assert.equal(readFileSync(join(f.root, 'skills/new-skill/SKILL.md'), 'utf8'), skill('new-skill'));
  assert.ok(existsSync(join(f.root, 'skills/new-skill/evals/new-eval.yaml')));
  ok(f.root, 'revert', runId);
  assert.equal(existsSync(join(f.root, 'skills/new-skill/SKILL.md')), false);
  assert.equal(existsSync(join(f.root, 'skills/new-skill')), false);
  assert.equal(json(f.root, 'list').length, 1);
});

for (const source of ['file', 'directory']) test(`new skill freezes complete resolved input from an eval ${source}`, (t) => {
  const f = fixture(t); f.name = 'new-skill';
  put(f.root, 'proposal.md', skill(f.name));
  const input = 'BEGIN\n# Important source\nCRUCIAL FACTS\n# Expected\nThis is part of the source, not the eval rubric.';
  put(f.root, 'test-data/fixtures/sample.md', input);
  put(f.root, 'test-data/cases/one.yaml', evalCase(f.name).replace('Question one', '{{file:../fixtures/sample.md}}'));
  const runId = propose(f, ['--evals', source === 'file' ? 'test-data/cases/one.yaml' : 'test-data/cases']);
  const manual = json(f.root, 'compare', runId);
  assert.equal(manual.prompts[0].input, input);
  compare(f, runId); approve(f, runId); ok(f.root, 'apply', runId);
  const installed = json(f.root, 'eval', f.name);
  assert.equal(installed.cases[0].input, input);
});

test('new-skill revert preserves unrelated files and valid discovery by refusing before mutation', (t) => {
  const f = fixture(t); f.name = 'new-skill';
  put(f.root, 'proposal.md', skill(f.name)); put(f.root, 'new-eval.yaml', evalCase(f.name));
  const runId = propose(f, ['--evals', 'new-eval.yaml']); compare(f, runId); approve(f, runId); ok(f.root, 'apply', runId);
  put(f.root, 'skills/new-skill/user-note.txt', 'Independent user work');
  const result = command(f.root, 'revert', runId);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /additional|unrelated/i);
  assert.equal(readFileSync(join(f.root, 'skills/new-skill/user-note.txt'), 'utf8'), 'Independent user work');
  assert.equal(readFileSync(join(f.root, 'skills/new-skill/SKILL.md'), 'utf8'), skill(f.name));
  assert.equal(json(f.root, 'list').length, 2);
});

test('canonical reflection can be compared but cannot apply into harness-owned files', (t) => {
  const f = fixture(t, { canonical: true, name: 'canonical' });
  put(f.root, 'fake-local.cjs', `let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>{if(s.includes('===PROPOSED-SKILL-START==='))process.stdout.write('FACT: Failed case.\\nRECOMMENDATION: Improve it.\\n===PROPOSED-SKILL-START===\\n'+${JSON.stringify(skill(f.name))}+'===PROPOSED-SKILL-END===');else process.stdout.write(s.includes('GOOD')?'GOOD':'UNKNOWN')});`);
  const run = json(f.root, 'eval', f.name, '--execute');
  json(f.root, 'reflect', run.runId, '--force', '--execute');
  compare(f, run.runId); approve(f, run.runId);
  const apply = command(f.root, 'apply', run.runId);
  assert.equal(apply.status, 1); assert.match(apply.stderr, /project-owned/);
  assert.match(readFileSync(join(f.root, f.path), 'utf8'), /OLD/);
});

test('read-only MCP reads comparison from KB_ROOT and refuses traversal', async (t) => {
  const f = fixture(t), runId = propose(f); compare(f, runId);
  const require = createRequire(resolve('scripts/skillopt/package.json'));
  const { Client } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/index.js')));
  const { StdioClientTransport } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/stdio.js')));
  const client = new Client({ name: 'local-test', version: '1' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('scripts/skillopt/mcp-server.mjs')], env: { ...process.env, KB_ROOT: f.root }, cwd: f.root, stderr: 'pipe' });
  t.after(() => client.close());
  await client.connect(transport);
  const result = await client.callTool({ name: 'skill_get_comparison', arguments: { run_id: runId } });
  assert.equal(result.isError, undefined);
  assert.equal(JSON.parse(result.content[0].text).passed, true);
  const tools = await client.listTools();
  assert.equal(tools.tools.some(tool => /apply|approve/.test(tool.name)), false);
  const unsafe = await client.callTool({ name: 'skill_get_trace', arguments: { run_id: '..' } });
  assert.equal(unsafe.isError, true);
});

test('legacy proposals and canonical skills cannot bypass the project apply lifecycle', (t) => {
  const f = fixture(t, { legacy: true });
  put(f.root, '.context/skillopt/old-run/proposals/project-check.md', skill(f.name));
  const old = command(f.root, 'apply', 'old-run');
  assert.equal(old.status, 1); assert.match(old.stderr, /legacy|propose|comparison/i);
  const legacyRun = propose(f);
  compare(f, legacyRun); approve(f, legacyRun); ok(f.root, 'apply', legacyRun);
  assert.equal(readFileSync(join(f.root, f.path), 'utf8'), skill(f.name));
  assert.equal(existsSync(join(f.root, 'skills/project-check/SKILL.md')), false);
  put(f.root, 'harness/skills/core-skill/SKILL.md', skill('core-skill'));
  put(f.root, 'proposal.md', skill('core-skill'));
  const canonical = command(f.root, 'propose', 'core-skill', '--file', 'proposal.md', '--reason', 'test');
  assert.equal(canonical.status, 1); assert.match(canonical.stderr, /project|harness/i);
});

test('reflect is manual by default and feeds project proposals through comparison and approval', (t) => {
  const f = fixture(t);
  put(f.root, 'fake-local.cjs', `let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>{if(!s.includes('CANONICAL_EVIDENCE'))process.exit(2);if(s.includes('===PROPOSED-SKILL-START==='))process.stdout.write('FACT: One observed failed case.\\nRECOMMENDATION: Clarify the procedure.\\n===PROPOSED-SKILL-START===\\n'+${JSON.stringify(skill(f.name))}+'===PROPOSED-SKILL-END===');else process.stdout.write(s.includes('GOOD')?'GOOD':'UNKNOWN')});`);
  const rollout = json(f.root, 'eval', f.name, '--execute');
  const manual = json(f.root, 'reflect', rollout.runId, '--force');
  assert.equal(manual.executed, false);
  assert.equal(existsSync(join(f.root, '.context/skillopt', rollout.runId, 'proposals')), false);
  const reflected = json(f.root, 'reflect', rollout.runId, '--force', '--execute');
  assert.equal(reflected.results.length, 1);
  assert.ok(reflected.results[0].proposed_path);
  assert.equal(command(f.root, 'apply', rollout.runId).status, 1);
  compare(f, rollout.runId); approve(f, rollout.runId); ok(f.root, 'apply', rollout.runId);
});

test('multi-skill reflection returns independent proposal runs that can each be compared', (t) => {
  const f = fixture(t);
  put(f.root, 'skills/second-skill/SKILL.md', skill('second-skill', 'OLD'));
  put(f.root, 'skills/second-skill/evals/one.yaml', evalCase('second-skill'));
  put(f.root, 'fake-local.cjs', `let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>{if(s.includes('===PROPOSED-SKILL-START===')){const name=s.match(/^name: ([a-z-]+)/m)[1];process.stdout.write('FACT: Failed case.\\nRECOMMENDATION: Improve it.\\n===PROPOSED-SKILL-START===\\n---\\nname: '+name+'\\ndescription: Use for the requested procedure.\\n---\\n\\nGOOD\\n===PROPOSED-SKILL-END===')}else process.stdout.write(s.includes('GOOD')?'GOOD':'UNKNOWN')});`);
  const imports = ['runner/rollout.mjs', 'config.mjs', 'llm/adapter.mjs'].map(path => pathToFileURL(resolve('scripts/skillopt', path)).href);
  const script = `import {runRollout} from ${JSON.stringify(imports[0])};import {loadConfig} from ${JSON.stringify(imports[1])};import {createAdapter} from ${JSON.stringify(imports[2])};const {config}=await loadConfig();const result=await runRollout({adapter:createAdapter(config.provider,config),config,execute:true});console.log(JSON.stringify(result));`;
  const rollout = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: f.root, env: { ...process.env, KB_ROOT: f.root }, encoding: 'utf8' });
  assert.equal(rollout.status, 0, rollout.stderr);
  const sourceRun = JSON.parse(rollout.stdout).runId;
  const reflection = json(f.root, 'reflect', sourceRun, '--force', '--execute');
  assert.equal(reflection.results.length, 2);
  assert.equal(new Set(reflection.results.map(r => r.runId)).size, 2);
  for (const result of reflection.results) {
    assert.ok(result.runId);
    assert.match(result.compare_command, new RegExp(result.runId));
    assert.equal(compare(f, result.runId).passed, true);
  }
});

test('comparison journals its configured cost estimate and runs filters explicit skill ownership', (t) => {
  const f = fixture(t);
  rmSync(join(f.root, '.skillopt.json'));
  put(f.root, '.skillopt.js', `module.exports={provider:'local-test',model:'gpt-4o-mini',adapters:{'local-test':()=>({name:'local-test',complete:async({system})=>({text:system.includes('GOOD')?'GOOD':'UNKNOWN',usage:{input_tokens:1000000,output_tokens:1000000}})})}}`);
  const runId = propose(f), result = compare(f, runId);
  assert.equal(result.cost_usd, 1.5);
  const comparisonRun = json(f.root, 'runs', '--skill', f.name).find(r => r.kind === 'compare');
  assert.equal(comparisonRun.cost_usd, 1.5);
  const metrics = pathToFileURL(resolve('scripts/skillopt/storage/metrics.mjs')).href;
  const monthly = spawnSync(process.execPath, ['--input-type=module', '-e', `import {monthlyCost} from ${JSON.stringify(metrics)};console.log(JSON.stringify(await monthlyCost()));`], { cwd: f.root, env: { ...process.env, KB_ROOT: f.root }, encoding: 'utf8' });
  assert.equal(monthly.status, 0, monthly.stderr); assert.equal(JSON.parse(monthly.stdout).total_usd, 1.5);
  f.name = 'other-skill';
  put(f.root, 'proposal.md', skill(f.name)); put(f.root, 'other-eval.yaml', evalCase(f.name));
  propose(f, ['--evals', 'other-eval.yaml']);
  const filtered = json(f.root, 'runs', '--skill', f.name);
  assert.equal(filtered.length, 1); assert.equal(filtered[0].skill, f.name);
});

test('optional-case regression blocks comparison even when every mandatory case passes', (t) => {
  const f = fixture(t, { body: 'GOOD' });
  put(f.root, 'proposal.md', skill(f.name, 'GOOD CANDIDATE'));
  put(f.root, `${f.evalDir}/optional.yaml`, evalCase(f.name, 'optional', '- must contain: GOOD', 'mandatory: false\n'));
  put(f.root, 'fake-local.cjs', `let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>process.stdout.write(s.includes('CANDIDATE')&&s.includes('Question optional')?'UNKNOWN':'GOOD'));`);
  const runId = propose(f), result = command(f.root, 'compare', runId, '--execute');
  assert.equal(result.status, 1);
  const comparison = JSON.parse(result.stdout);
  assert.equal(comparison.mandatory_passed, 1);
  assert.deepEqual(comparison.regressions, ['optional']);
});

test('grader errors and negative-only checks with empty output cannot pass eval', (t) => {
  const f = fixture(t, { body: 'EMPTY' });
  put(f.root, `${f.evalDir}/one.yaml`, evalCase(f.name, 'one', '- must not contain: forbidden'));
  const empty = command(f.root, 'eval', f.name, '--execute');
  assert.equal(empty.status, 1); assert.equal(JSON.parse(empty.stdout).summary.errored, 1);
  put(f.root, f.path, skill(f.name, 'GOOD'));
  put(f.root, `${f.evalDir}/one.yaml`, evalCase(f.name, 'one', '- regex: /[/'));
  const invalid = command(f.root, 'eval', f.name, '--execute');
  assert.equal(invalid.status, 1); assert.equal(JSON.parse(invalid.stdout).summary.errored, 1);
});

test('unsafe run paths and symlinked proposal targets are refused without writes', (t) => {
  const f = fixture(t);
  assert.equal(command(f.root, 'compare', '../escape').status, 1);
  const runId = propose(f); compare(f, runId); approve(f, runId);
  rmSync(join(f.root, f.path)); symlinkSync(join(f.root, 'proposal.md'), join(f.root, f.path));
  assert.equal(command(f.root, 'apply', runId).status, 1);
});

test('missing, duplicate and mismatched eval cases cannot create a passing comparison', (t) => {
  const f = fixture(t); const runId = propose(f);
  rmSync(join(f.root, f.evalDir), { recursive: true });
  assert.equal(command(f.root, 'compare', runId, '--execute').status, 1);
  put(f.root, `${f.evalDir}/one.yaml`, evalCase('wrong-skill'));
  assert.equal(command(f.root, 'compare', runId, '--execute').status, 1);
  put(f.root, `${f.evalDir}/one.yaml`, evalCase(f.name));
  put(f.root, `${f.evalDir}/one.yml`, evalCase(f.name));
  assert.equal(command(f.root, 'compare', runId, '--execute').status, 1);
});

test('skill new scaffolds only into .context from the template and chains into propose', (t) => {
  const f = fixture(t);
  cpSync(resolve('harness/templates/skill'), join(f.root, 'harness/templates/skill'), { recursive: true });
  git(f.root, 'add', '.'); git(f.root, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'template');
  const created = json(f.root, 'new', 'demo-summary');
  assert.equal(created.dir, '.context/skills/demo-summary');
  for (const p of ['SKILL.md', 'evals/happy-path.yaml', 'evals/no-fabrication.yaml', 'evals/_fixtures/sample-source.md']) assert.ok(existsSync(join(f.root, created.dir, p)), p);
  const text = readFileSync(join(f.root, created.dir, 'SKILL.md'), 'utf8');
  assert.match(text, /^---\nname: demo-summary\n/); assert.match(text, /\nstatus: draft\n/); assert.doesNotMatch(text, /__SKILL_NAME__/);
  for (const y of ['happy-path.yaml', 'no-fabrication.yaml']) assert.match(readFileSync(join(f.root, created.dir, 'evals', y), 'utf8'), /\nskill: demo-summary\n/);
  // Nothing outside gitignored .context changes: the scaffold is advisory until propose/compare/approve/apply.
  assert.equal(git(f.root, 'status', '--porcelain').trim(), '');
  assert.ok(created.nextSteps.some(s => /skill propose demo-summary/.test(s)));
  assert.ok(created.nextSteps.some(s => /profile\.skills/.test(s)));
  const run = json(f.root, 'propose', 'demo-summary', '--file', join(created.dir, 'SKILL.md'), '--evals', join(created.dir, 'evals'), '--reason', 'New procedure drafted from the template.');
  assert.equal(run.status, 'proposed');
  assert.notEqual(command(f.root, 'new', 'demo-summary').status, 0, 'existing scaffold directory must not be overwritten');
  assert.notEqual(command(f.root, 'new', f.name).status, 0, 'an existing skill name must be refused');
});

test('skill status and version are discovered; deprecated skills are unreachable and not copied', async (t) => {
  const f = fixture(t);
  const { discoverSkills } = await import(discoveryPath);
  put(f.root, 'skills/verified-one/SKILL.md', `---\nname: verified-one\ndescription: Verified procedure.\nstatus: verified\nversion: 2\n---\n\n# Procedure\nGOOD\n`);
  put(f.root, 'skills/old-one/SKILL.md', `---\nname: old-one\ndescription: Retired procedure.\nstatus: deprecated\n---\n\n# Procedure\nOLD\n`);
  let result = discoverSkills(f.root);
  assert.deepEqual(result.errors, []);
  const byName = Object.fromEntries(result.skills.map(s => [s.name, s]));
  assert.equal(byName['verified-one'].status, 'verified'); assert.equal(byName['verified-one'].version, 2);
  assert.equal(byName['old-one'].status, 'deprecated'); assert.equal(byName['project-check'].status, null); assert.equal(byName['project-check'].version, null);
  const listed = json(f.root, 'list');
  assert.equal(listed.find(s => s.skill === 'verified-one').status, 'verified');
  assert.equal(listed.find(s => s.skill === 'verified-one').version, 2);
  put(f.root, 'skills/bogus-one/SKILL.md', `---\nname: bogus-one\ndescription: Bad status.\nstatus: shipped\n---\n\n# Procedure\nX\n`);
  result = discoverSkills(f.root);
  assert.ok(result.errors.some(e => /status/.test(e) && /bogus-one/.test(e)), result.errors.join('\n'));
  rmSync(join(f.root, 'skills/bogus-one'), { recursive: true });
  // A role that depends on a deprecated skill fails to load instead of silently dropping the procedure.
  const role = (skills) => JSON.stringify({ version: 1, id: 'researcher', title: 'Researcher', purpose: 'Collect evidence', inputs: ['Question'], outputs: ['Findings'], skills, requiredContext: [], optionalContext: [], boundaries: [], qualityCriteria: ['Sources cited'] });
  put(f.root, 'harness/roles/researcher.json', role(['old-one']));
  const { loadWorkSystem } = await import(resolve('scripts/lib/work-system.mjs'));
  assert.throws(() => loadWorkSystem(f.root), /deprecated skill: old-one/);
  put(f.root, 'harness/roles/researcher.json', role(['verified-one']));
  assert.doesNotThrow(() => loadWorkSystem(f.root));
  // Clients receive only live procedures; deprecated copies fall into the existing retired cleanup.
  const setup = spawnSync(process.execPath, [resolve('scripts/check-harness.mjs'), '--setup', '--client', 'codex'], { cwd: f.root, env: { ...process.env, KB_ROOT: f.root }, encoding: 'utf8' });
  assert.equal(setup.status, 0, setup.stderr + setup.stdout);
  assert.ok(existsSync(join(f.root, '.agents/skills/verified-one/SKILL.md')));
  assert.ok(!existsSync(join(f.root, '.agents/skills/old-one/SKILL.md')));
});

test('list reports consumers of each skill and flags unreferenced project skills', (t) => {
  const f = fixture(t);
  put(f.root, 'harness/skills/canonical/SKILL.md', skill('canonical'));
  const role = JSON.stringify({ version: 1, id: 'researcher', title: 'Researcher', purpose: 'Collect evidence', inputs: ['Question'], outputs: ['Findings'], skills: ['canonical'], requiredContext: [], optionalContext: [], boundaries: [], qualityCriteria: ['Sources cited'] });
  put(f.root, 'harness/roles/researcher.json', role);
  put(f.root, 'harness/workflows/research.json', JSON.stringify({ version: 1, id: 'research', title: 'Research', stages: [{ id: 'gather', title: 'Gather', role: 'researcher', skills: [], requiredArtifacts: ['findings'], requiresReview: false, requiresApproval: false }] }));
  let listed = json(f.root, 'list');
  const canonical = listed.find(s => s.skill === 'canonical'), project = listed.find(s => s.skill === f.name);
  assert.deepEqual(canonical.usedBy, { roles: ['researcher'], stages: [], profile: null }); assert.equal(canonical.unreferenced, false);
  assert.deepEqual(project.usedBy, { roles: [], stages: [], profile: null }); assert.equal(project.unreferenced, true, 'a project skill nobody references is built but not connected');
  assert.match(ok(f.root, 'list'), /project-check .*used-by=none \(not in kb:context/);
  put(f.root, '00_context/work-system.json', JSON.stringify({ version: 1, status: 'active', purpose: 'Study', roles: ['researcher'], workflows: ['research'], skills: [f.name], customRoles: {}, customWorkflows: {} }));
  listed = json(f.root, 'list');
  assert.equal(listed.find(s => s.skill === f.name).usedBy.profile, 'active');
  assert.equal(listed.find(s => s.skill === f.name).unreferenced, false);
});

test('propose --from-findings links only human-accepted lessons of the same skill', async (t) => {
  const f = fixture(t);
  const findingsCli = (...args) => spawnSync(process.execPath, [resolve('scripts/kb-findings.mjs'), ...args], { cwd: f.root, env: { ...process.env, KB_ROOT: f.root, KB_JOURNAL: '0' }, encoding: 'utf8' });
  const mk = (name, extra = {}) => { put(f.root, name, JSON.stringify({ kind: 'feedback', title: `Lesson ${name}`, problem: 'The procedure skipped the source date.', paths: ['proposal.md'], evidence: [{ source: 'proposal.md', observation: 'Reviewer asked for the date.' }], suggestedAction: 'Keep the source date.', ...extra })); return JSON.parse(findingsCli('add', '--file', name, '--json').stdout); };
  const open = mk('open.json');
  const attempt = command(f.root, 'propose', f.name, '--file', 'proposal.md', '--reason', 'Fix the date handling.', '--from-findings', open.id);
  assert.notEqual(attempt.status, 0); assert.match(attempt.stderr, /not confirmed|accept/i);
  assert.equal(findingsCli('transition', '--id', open.id, '--status', 'accepted', '--by', 'owner', '--note', 'confirmed').status, 0);
  const run = json(f.root, 'propose', f.name, '--file', 'proposal.md', '--reason', 'Fix the date handling.', '--from-findings', open.id);
  assert.equal(run.findings[0].id, open.id);
  assert.match(readFileSync(join(f.root, '.context/skillopt', run.runId, 'proposals', `${f.name}.rationale.md`), 'utf8'), new RegExp(`finding: ${open.id}`));
  assert.equal(JSON.parse(readFileSync(join(f.root, '.context/skillopt', run.runId, 'proposal.json'), 'utf8')).findings[0].id, open.id);
  const other = mk('other.json', { skill: 'other-skill' });
  assert.equal(findingsCli('transition', '--id', other.id, '--status', 'accepted', '--by', 'owner', '--note', 'confirmed').status, 0);
  assert.notEqual(command(f.root, 'propose', f.name, '--file', 'proposal.md', '--reason', 'Wrong scope.', '--from-findings', other.id).status, 0);
  const { selectLessons, lessonsSection } = await import(resolve('scripts/lib/lessons.mjs'));
  assert.deepEqual(selectLessons(f.root, { skill: f.name }).map((l) => l.id), [open.id]);
  assert.match(lessonsSection(selectLessons(f.root, { skill: f.name })), /KNOWN-ERRORS-CHECK/);
});
