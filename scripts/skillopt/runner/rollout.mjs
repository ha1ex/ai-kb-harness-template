// Eval execution is explicit. Cases, context and outputs are persisted for review.
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { discoverEvals, readSkillFile } from '../evals/loader.mjs';
import { getGrader } from '../evals/graders/index.mjs';
import { appendRun, estimateCost } from '../storage/metrics.mjs';
import { canonicalContext, systemPrompt, makeRunId, runDirectory, readJson, hash } from './snapshot.mjs';
import { assertSafePath } from '../../lib/skills.mjs';
import { REPO_ROOT } from '../evals/loader.mjs';

export function summarize(traces) {
  const total = traces.length, passed = traces.filter(t => t.passed && !t.error).length;
  const by_skill = {};
  for (const t of traces) {
    by_skill[t.skill] ??= { total: 0, passed: 0 };
    by_skill[t.skill].total++;
    if (t.passed && !t.error) by_skill[t.skill].passed++;
  }
  return { total, passed, failed: traces.filter(t => !t.passed && !t.error).length, errored: traces.filter(t => t.error).length, pass_rate: total ? passed / total : 0, tokens_in: traces.reduce((s,t) => s + (t.usage?.input_tokens ?? 0), 0), tokens_out: traces.reduce((s,t) => s + (t.usage?.output_tokens ?? 0), 0), by_skill };
}

function gradeError(result) {
  return result?.details?.error ?? result?.details?.checks?.find(c => c.error)?.error ?? null;
}

export async function runCase({ c, adapter, judgeAdapter = adapter, context, skillText }) {
  const started = Date.now();
  const trace = { case_id: c.id, skill: c.skill, path: c.path, input: c.input, expected: c.expected, mandatory: c.frontmatter?.mandatory !== false, context_hash: context.hash, grader: c.frontmatter?.grader ?? null, tags: c.frontmatter?.tags ?? [], passed: false, score: 0, error: c.error ?? null, latency_ms: 0 };
  if (trace.error) return trace;
  const system = systemPrompt(context, skillText);
  trace.prompt = { system, user: c.input, system_chars: system.length, user_chars: c.input.length };
  try {
    const result = await adapter.complete({ system, user: c.input, max_tokens: c.frontmatter.budget?.max_tokens });
    if (typeof result?.text !== 'string' || !result.text.trim()) throw Error('Provider returned empty output');
    trace.output = result.text;
    trace.usage = result.usage;
    const grader = getGrader(c.frontmatter.grader, { judgeAdapter });
    const grade = await grader.grade(result.text, c.expected, { input: c.input, frontmatter: c.frontmatter });
    trace.grader_details = grade.details;
    if (gradeError(grade)) throw Error(`Grader error: ${gradeError(grade)}`);
    if (!Number.isFinite(grade.score) || grade.score < 0 || grade.score > 1) throw Error('Invalid grader score');
    trace.score = grade.score;
    trace.passed = grade.passed === true;
  } catch (error) { trace.error = error.message; trace.passed = false; trace.score = 0; }
  trace.latency_ms = Date.now() - started;
  return trace;
}

export async function runRollout({ adapter, config = {}, skillFilter = null, caseFilter = null, judgeAdapter = null, execute = false } = {}) {
  const cases = await discoverEvals({ skillFilter, caseFilter });
  if (!cases.length) throw Error('No eval cases found; an empty sample cannot pass');
  const context = canonicalContext();
  const skills = new Map();
  for (const c of cases) if (!skills.has(c.skill)) skills.set(c.skill, await readSkillFile(c.skill));
  if (!execute) return { executed: false, cases: cases.map(c => ({ ...c, system: systemPrompt(context, skills.get(c.skill).text) })), notice: 'Review prompts; pass --execute with an explicit provider to run.' };
  if (!adapter) throw Error('Explicit LLM adapter required');
  const runId = makeRunId(), runDir = runDirectory(runId), tracesDir = join(runDir, 'traces');
  await mkdir(tracesDir, { recursive: true });
  await writeFile(join(runDir, 'cases.json'), JSON.stringify(cases, null, 2));
  await writeFile(join(runDir, 'context.json'), JSON.stringify(context, null, 2));
  const traces = [];
  for (const c of cases) {
    const trace = await runCase({ c, adapter, judgeAdapter: judgeAdapter ?? adapter, context, skillText: skills.get(c.skill).text });
    traces.push(trace);
    const file = assertSafePath(REPO_ROOT, join(tracesDir, `${c.skill}__${c.id}.json`));
    await writeFile(file, JSON.stringify(trace, null, 2));
  }
  const summary = { ...summarize(traces), run_id: runId, adapter: adapter.name, model: config.model ?? null, started_at: new Date().toISOString(), cases_hash: hash(cases), context_hash: context.hash };
  summary.cost_usd = estimateCost({ model: config.model, input_tokens: summary.tokens_in, output_tokens: summary.tokens_out, pricing: config.pricing });
  await writeFile(join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));
  await appendRun({ kind: 'rollout', run_id: runId, started_at: summary.started_at, adapter: adapter.name, model: config.model ?? null, summary, cost_usd: summary.cost_usd });
  return { executed: true, runId, summary, traces, runDir };
}

export async function runScore(runId) {
  const runDir = runDirectory(runId), summaryPath = join(runDir, 'summary.json');
  if (!existsSync(summaryPath)) throw Error(`Run not found: ${runId}`);
  const cases = existsSync(join(runDir, 'cases.json')) ? readJson(join(runDir, 'cases.json')) : await discoverEvals();
  const byId = new Map(cases.map(c => [`${c.skill}__${c.id}`, c]));
  const traces = [];
  for (const file of await readdir(assertSafePath(REPO_ROOT, join(runDir, 'traces')))) {
    if (!file.endsWith('.json')) continue;
    const path = join(runDir, 'traces', file), t = readJson(path), c = byId.get(`${t.skill}__${t.case_id}`);
    try {
      if (!c || c.error) throw Error(c?.error ?? 'Missing eval case');
      if (!t.output?.trim()) throw Error('Missing or empty output');
      if (t.error) throw Error(t.error);
      if (c.frontmatter.grader !== 'llm-judge') {
        const r = await getGrader(c.frontmatter.grader).grade(t.output, c.expected, { input: c.input, frontmatter: c.frontmatter });
        if (gradeError(r)) throw Error(gradeError(r));
        t.passed = r.passed === true; t.score = r.score; t.grader_details = r.details;
      }
    } catch (e) { t.passed = false; t.score = 0; t.error = e.message; }
    await writeFile(path, JSON.stringify(t, null, 2)); traces.push(t);
  }
  const previous = readJson(summaryPath), summary = { ...previous, ...summarize(traces), rescored_at: new Date().toISOString() };
  await writeFile(summaryPath, JSON.stringify(summary, null, 2));
  return summary;
}
