// A local, reviewable proposal -> comparison -> recorded approval lifecycle.
// Local records are not cryptographic identity or proof of human authorization.
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync, lstatSync } from 'node:fs';
import { join, basename, dirname, relative } from 'node:path';
import { REPO_ROOT, requireSkills, discoverEvals, loadEvalDirectory, parseEvalCase } from '../evals/loader.mjs';
import { assertSafePath, assertSkillName, validateSkillText } from '../../lib/skills.mjs';
import { hash, makeRunId, runDirectory, readJson, readText, snapshotFiles, canonicalContext, configFingerprint, systemPrompt } from './snapshot.mjs';
import { runCase, summarize } from './rollout.mjs';
import { loadConfig } from '../config.mjs';
import { createAdapter } from '../llm/adapter.mjs';
import { appendRun, estimateCost } from '../storage/metrics.mjs';
import { readFindings } from '../../lib/findings.mjs';

export async function writeJson(path, value) {
  assertSafePath(REPO_ROOT, path);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + '\n');
}

export function skillBase(name) {
  const skill = requireSkills().find(s => s.name === name);
  if (!skill) return { exists: false, path: `skills/${name}/SKILL.md`, text: '', files: [] };
  const files = snapshotFiles(REPO_ROOT, [...new Set([skill.path, ...(skill.dir ? [skill.dir] : [])])], { exclude: path => /\/evals(?:\/|$)/.test(path) });
  return { exists: true, path: skill.path, source: skill.source, legacy: skill.legacy, text: skill.text, files };
}

export function readProposal(runId) {
  const dir = runDirectory(runId), path = join(dir, 'proposal.json');
  if (!existsSync(path)) throw Error('Unverified legacy run: create a proposal with skill propose, then compare and approve before apply.');
  const proposal = readJson(path);
  if (proposal.version !== 1) throw Error('Unsupported proposal version');
  assertSkillName(proposal.skill);
  if (proposal.target !== (proposal.base?.path ?? `skills/${proposal.skill}/SKILL.md`)) throw Error('Invalid proposal target');
  if (!proposal.target.startsWith('skills/') && !proposal.target.startsWith('harness/skills/')) throw Error('Invalid skill target');
  assertSafePath(REPO_ROOT, proposal.target);
  return { ...proposal, dir };
}

export async function runPropose({ skill, file, text, reason, evals, findings = [], runId = makeRunId(), allowHarness = false } = {}) {
  assertSkillName(skill);
  if (!reason?.trim()) throw Error('A concrete reason for the proposed change is required');
  // Only lessons a human accepted may justify a skill change; open observations are not confirmed.
  const linked = [];
  if (findings.length) {
    const all = readFindings(REPO_ROOT);
    for (const id of findings) {
      const finding = all.find((f) => f.id === id);
      if (!finding) throw Error(`Unknown finding: ${id}`);
      if (finding.kind !== 'feedback' || finding.status !== 'accepted') throw Error(`Lesson not confirmed by a human: ${id} [${finding.kind}/${finding.status}]; accept it first with kb:findings transition --status accepted`);
      if (finding.skill && finding.skill !== skill) throw Error(`Finding ${id} is scoped to skill ${finding.skill}, not ${skill}`);
      const acceptedBy = finding.history.filter((h) => h.to === 'accepted').at(-1)?.by ?? 'unknown';
      linked.push({ id, status: finding.status, updatedAt: finding.updatedAt, acceptedBy, title: finding.title, problem: finding.problem });
    }
  }
  const base = skillBase(skill);
  if (base.exists && base.source !== 'project' && !allowHarness) throw Error('Harness skills can be evaluated and reflected on; apply is limited to project-owned skills.');
  const proposalText = validateSkillText(text ?? readText(assertSafePath(REPO_ROOT, file)), { name: skill });
  const dir = runDirectory(runId);
  if (existsSync(join(dir, 'proposal.json'))) throw Error('Proposal already exists; create a new run to replace it');
  let evalFiles = [], evalSource = null, evalSourceHash = null;
  if (evals) {
    if (base.exists) throw Error('Existing skills use their current eval cases; --evals is for new skills');
    const source = assertSafePath(REPO_ROOT, evals);
    evalSource = relative(REPO_ROOT, source);
    const cases = lstatSync(source).isDirectory() ? await loadEvalDirectory(source, { skill }) : [await parseEvalCase(source, { skill })];
    validateCases(cases);
    evalSourceHash = hash({ files: snapshotFiles(REPO_ROOT, [evalSource]), cases });
    // Interpolate once at the source location, then retain the exact resolved input
    // in a fixture. Embedding it directly in YAML sections would reinterpret headings.
    for (const c of cases) {
      const inputTarget = `_skillopt_inputs/${c.id}.txt`;
      evalFiles.push({ target: basename(c.path), text: Buffer.from(await resolvedCaseFile(c, inputTarget)).toString('base64') });
      evalFiles.push({ target: inputTarget, text: Buffer.from(c.input).toString('base64') });
    }
  }
  if (!base.exists && !evals) throw Error('New project skills require --evals <file-or-directory> with nonempty cases');
  await mkdir(join(dir, 'proposals'), { recursive: true });
  await writeFile(assertSafePath(REPO_ROOT, join(dir, 'proposals', `${skill}.md`)), proposalText);
  const rationale = reason.trim() + '\n' + (linked.length ? `\n## Принятые уроки\n\n${linked.map((l) => `FACT: ${l.title} — ${l.problem} [finding: ${l.id}, accepted by ${l.acceptedBy}]`).join('\n')}\n` : '');
  await writeFile(assertSafePath(REPO_ROOT, join(dir, 'proposals', `${skill}.rationale.md`)), rationale);
  for (const f of evalFiles) {
    const target = assertSafePath(REPO_ROOT, join(dir, 'evals', f.target));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(f.text, 'base64'));
  }
  const record = { version: 1, runId, skill, created_at: new Date().toISOString(), target: base.path, reason: reason.trim(), findings: linked.map(({ id, status, updatedAt }) => ({ id, status, updatedAt })), base, base_hash: hash(base), eval_source: evalSource, eval_source_hash: evalSourceHash };
  await writeJson(join(dir, 'proposal.json'), record);
  await appendRun({ kind: 'propose', run_id: runId, skill, started_at: record.created_at });
  return { runId, runDir: dir, skill, target: base.path, status: 'proposed', reason: record.reason, findings: record.findings };
}

async function resolvedCaseFile(c, inputPath) {
  // js-yaml is already the eval reader dependency; stringify parsed frontmatter.
  const { default: yaml } = await import('js-yaml');
  return `---\n${yaml.dump(c.frontmatter)}---\n\n# Input\n{{file:${inputPath}}}\n\n# Expected\n${c.expected}\n`;
}

function validateCases(cases) {
  if (!cases.length) throw Error('No eval cases; empty samples cannot pass');
  const errors = cases.filter(c => c.error);
  if (errors.length) throw Error(errors.map(c => c.error).join('\n'));
  if (!cases.some(c => c.frontmatter.mandatory !== false)) throw Error('At least one mandatory eval case is required');
}

export async function captureComparison(runId, config) {
  const proposal = readProposal(runId), base = skillBase(proposal.skill);
  if (hash(base) !== proposal.base_hash) throw Error('Stale base skill: changed since proposal; create a new proposal');
  const text = validateSkillText(readText(join(proposal.dir, 'proposals', `${proposal.skill}.md`)), { name: proposal.skill });
  const rationale = readText(join(proposal.dir, 'proposals', `${proposal.skill}.rationale.md`));
  const cases = base.exists ? await discoverEvals({ skillFilter: proposal.skill }) : await loadEvalDirectory(join(proposal.dir, 'evals'), { skill: proposal.skill });
  validateCases(cases);
  const sourceCases = proposal.eval_source ? (lstatSync(assertSafePath(REPO_ROOT, proposal.eval_source)).isDirectory()
    ? await loadEvalDirectory(join(REPO_ROOT, proposal.eval_source), { skill: proposal.skill })
    : [await parseEvalCase(join(REPO_ROOT, proposal.eval_source), { skill: proposal.skill })]) : [];
  if (sourceCases.length) validateCases(sourceCases);
  if (proposal.eval_source && hash({ files: snapshotFiles(REPO_ROOT, [proposal.eval_source]), cases: sourceCases }) !== proposal.eval_source_hash) throw Error('Stale eval source: changed since proposal; draft a new proposal');
  const evalDir = base.exists ? requireSkills().find(s => s.name === proposal.skill)?.dir : relative(REPO_ROOT, proposal.dir);
  const caseFiles = snapshotFiles(REPO_ROOT, [`${evalDir}/evals`, ...(proposal.eval_source ? [proposal.eval_source] : [])]);
  const context = canonicalContext(), llm = configFingerprint(config);
  const hashes = { base: hash(base), proposal: hash({ text, rationale, target: proposal.target }), cases: hash({ cases, caseFiles, sourceCases }), context: context.hash, llm: hash(llm) };
  return { version: 1, runId, skill: proposal.skill, target: proposal.target, base, text, rationale, cases, caseFiles, sourceCases, context, llm, hashes };
}

export function assessComparison(cases) {
  const current = summarize(cases.map(c => c.current)), proposal = summarize(cases.map(c => c.proposal));
  const mandatory = cases.filter(c => c.mandatory !== false);
  const regressions = cases.filter(c => (c.current.passed && !c.proposal.passed) || c.proposal.score < c.current.score).map(c => c.id);
  const passed = cases.length > 0 && mandatory.length > 0 && current.errored === 0 && proposal.errored === 0 && mandatory.every(c => c.proposal.passed) && regressions.length === 0;
  return { passed, current, proposal, mandatory_total: mandatory.length, mandatory_passed: mandatory.filter(c => c.proposal.passed).length, regressions };
}

export async function runCompare({ runId, execute = false } = {}) {
  const { config, extraAdapters } = await loadConfig();
  const frozen = await captureComparison(runId, config), dir = runDirectory(runId);
  await writeJson(join(dir, 'comparison-plan.json'), frozen);
  // Every fresh comparison invalidates a previous approval, including a dry run.
  await rm(assertSafePath(REPO_ROOT, join(dir, 'approval.json')), { force: true });
  await rm(assertSafePath(REPO_ROOT, join(dir, 'comparison.json')), { force: true });
  if (!execute) return { executed: false, runId, hashes: frozen.hashes, sample_size: frozen.cases.length, prompts: frozen.cases.map(c => ({ id: c.id, input: c.input, current: systemPrompt(frozen.context, frozen.base.text), proposal: systemPrompt(frozen.context, frozen.text) })), notice: 'Review frozen comparison-plan.json; pass --execute to call the configured provider.' };
  if (!config.provider || config.provider === 'manual' || config.provider === 'auto') throw Error('Choose an explicit LLM provider to execute comparison');
  const adapter = createAdapter(config.provider, config, extraAdapters);
  const judgeAdapter = config.graders?.judge_model ? createAdapter(config.provider, { ...config, model: config.graders.judge_model }, extraAdapters) : adapter;
  const cases = [];
  for (const c of frozen.cases) {
    const current = await runCase({ c, adapter, judgeAdapter, context: frozen.context, skillText: frozen.base.text });
    const proposal = await runCase({ c, adapter, judgeAdapter, context: frozen.context, skillText: frozen.text });
    cases.push({ id: c.id, mandatory: c.frontmatter.mandatory !== false, current, proposal });
  }
  const assessment = assessComparison(cases);
  let cost = estimateCost({ model: config.model, input_tokens: assessment.current.tokens_in + assessment.proposal.tokens_in, output_tokens: assessment.current.tokens_out + assessment.proposal.tokens_out, pricing: config.pricing });
  for (const trace of cases.flatMap(c => [c.current, c.proposal])) {
    if (trace.grader_details?.judge_usage) cost += estimateCost({ model: config.graders?.judge_model ?? config.model, ...trace.grader_details.judge_usage, pricing: config.pricing });
  }
  const comparison = { version: 1, executed: true, runId, skill: frozen.skill, compared_at: new Date().toISOString(), hashes: frozen.hashes, ...assessment, cases, cost_usd: cost, cost_notice: 'Approximate estimate using configured pricing; the existing estimator returns zero for unknown models.', rationale: `CURRENT ${assessment.current.passed}/${assessment.current.total}; PROPOSAL ${assessment.proposal.passed}/${assessment.proposal.total}; mandatory ${assessment.mandatory_passed}/${assessment.mandatory_total}; errors ${assessment.current.errored + assessment.proposal.errored}; regressions ${assessment.regressions.length}. ${frozen.rationale.trim()}` };
  // A file/config change during execution cannot certify the stale result.
  const latestConfig = await loadConfig();
  const latest = await captureComparison(runId, latestConfig.config);
  if (hash(latest.hashes) !== hash(frozen.hashes)) throw Error('Comparison inputs changed during execution; run compare again');
  await writeJson(join(dir, 'comparison.json'), comparison);
  await appendRun({ kind: 'compare', run_id: runId, skill: frozen.skill, started_at: comparison.compared_at, adapter: adapter.name, model: config.model ?? null, summary: assessment, cost_usd: cost });
  return comparison;
}

export async function verifiedComparison(runId, { approval = false } = {}) {
  const proposal = readProposal(runId), path = join(proposal.dir, 'comparison.json');
  if (!existsSync(path)) throw Error('A passing executed comparison is required before approve/apply');
  const comparison = readJson(path), result = assessComparison(comparison.cases ?? []);
  if (comparison.executed !== true || comparison.passed !== true || !result.passed) throw Error('Comparison did not pass; fix errors/regressions and compare again');
  const { config } = await loadConfig(), latest = await captureComparison(runId, config);
  if (hash(latest.hashes) !== hash(comparison.hashes)) throw Error('Stale comparison: proposal, cases, context or LLM config changed');
  if (comparison.cases.length !== latest.cases.length) throw Error('Comparison sample size changed');
  if (approval) {
    const approvalPath = join(proposal.dir, 'approval.json');
    if (!existsSync(approvalPath)) throw Error('Recorded explicit approval required: skill approve <run-id> --by <human> --note <authorization reference>');
    const record = readJson(approvalPath);
    if (!record.by?.trim() || !record.note?.trim() || record.comparison_hash !== hash(comparison) || hash(record.hashes) !== hash(latest.hashes)) throw Error('Approval does not match the exact comparison hashes');
  }
  return { proposal, comparison, frozen: latest };
}

export async function runApprove({ runId, by, note } = {}) {
  if (!by?.trim() || !note?.trim()) throw Error('Approval requires --by <human> and --note <authorization reference>; do not infer approval from model output');
  const { comparison, proposal } = await verifiedComparison(runId);
  const record = { version: 1, runId, by: by.trim(), note: note.trim(), recorded_at: new Date().toISOString(), hashes: comparison.hashes, comparison_hash: hash(comparison), identity_verified: false, notice: 'Local record of stated human authorization. Identity and authority are not cryptographically verified. Agents must not invent human approval.' };
  await writeJson(join(proposal.dir, 'approval.json'), record);
  return record;
}
