#!/usr/bin/env node
import { loadConfig } from './config.mjs';
import { createAdapter } from './llm/adapter.mjs';
import { runRollout, runScore } from './runner/rollout.mjs';
import { runReflect } from './runner/reflect.mjs';
import { runDiff } from './runner/diff.mjs';
import { runApply, runRevert } from './runner/edit.mjs';
import { runPropose, runCompare, runApprove } from './runner/lifecycle.mjs';
import { runNew } from './runner/scaffold.mjs';
import { listSkillsWithEvals } from './evals/loader.mjs';
import { listRuns } from './storage/metrics.mjs';

const [verb, ...args] = process.argv.slice(2);
const booleanFlags = new Set(['execute', 'json', 'ci', 'force', 'yes']);
function parseArgs(args) {
  const out = { positional: [], flags: {} };
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) { out.positional.push(args[i]); continue; }
    const key = args[i].slice(2);
    if (booleanFlags.has(key)) out.flags[key] = true;
    else {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw Error(`Missing value for --${key}`);
      out.flags[key] = args[++i];
    }
  }
  return out;
}
function output(result) { process.stdout.write(JSON.stringify(result, null, 2) + '\n'); }
async function executionConfig(flags) {
  const overrides = {};
  for (const [flag, key] of [['provider','provider'], ['model','model'], ['base-url','base_url'], ['api-key','api_key']]) if (flags[flag]) overrides[key] = flags[flag];
  const { config, extraAdapters } = await loadConfig({ overrides });
  if (!config.provider || ['manual', 'auto'].includes(config.provider)) throw Error('Configure an explicit LLM provider before --execute');
  const adapter = createAdapter(config.provider, config, extraAdapters);
  const judgeAdapter = config.graders?.judge_model ? createAdapter(config.provider, { ...config, model: config.graders.judge_model }, extraAdapters) : adapter;
  return { config, adapter, judgeAdapter };
}

try {
  const opts = parseArgs(args), first = opts.positional[0], flags = opts.flags;
  switch (verb) {
    case 'list': {
      const skills = await listSkillsWithEvals();
      if (flags.json) output(skills);
      else for (const skill of skills) {
        const consumers = skill.usedBy ? [...skill.usedBy.roles, ...skill.usedBy.stages, ...(skill.usedBy.profile ? [`profile:${skill.usedBy.profile}`] : [])] : null;
        const usedBy = !skill.usedBy ? 'unknown (contract errors; see pnpm kb:roster)' : skill.unreferenced ? 'none (not in kb:context; clients may still load by description)' : consumers.length ? consumers.join(';') : '—';
        console.log(`${skill.skill}  ${skill.source}  status=${skill.status ?? 'unset'}${skill.version ? ` v${skill.version}` : ''}  evals=${skill.caseCount}  used-by=${usedBy}  ${skill.path}${skill.status === 'verified' && !skill.caseCount ? '  WARN: verified without evals' : ''}${skill.errors.length ? `  ERRORS: ${skill.errors.join('; ')}` : ''}`);
      }
      break;
    }
    case 'eval':
    case 'rollout': {
      if (!first) throw Error('Usage: skill eval <skill> [--execute] [--case <id>]');
      const runtime = flags.execute ? await executionConfig(flags) : {};
      const result = await runRollout({ ...runtime, skillFilter: first, caseFilter: flags.case, execute: flags.execute });
      output(result);
      if (result.executed && (result.summary.errored || (flags.ci && result.summary.pass_rate < 1))) process.exitCode = 1;
      break;
    }
    case 'score': output(await runScore(first)); break;
    case 'reflect': {
      const runtime = flags.execute ? await executionConfig(flags) : {};
      const result = await runReflect({ ...runtime, runId: first, execute: flags.execute, force: flags.force });
      output(result);
      if (result.results?.some(r => r.error)) process.exitCode = 1;
      break;
    }
    case 'new': {
      if (!first) throw Error('Usage: skill new <name> [--to <dir>]');
      output(await runNew({ name: first, to: flags.to }));
      break;
    }
    case 'propose': output(await runPropose({ skill: first, file: flags.file, reason: flags.reason, evals: flags.evals })); break;
    case 'compare': {
      const result = await runCompare({ runId: first, execute: flags.execute });
      output(result);
      if (result.executed && !result.passed) process.exitCode = 1;
      break;
    }
    case 'approve': output(await runApprove({ runId: first, by: flags.by, note: flags.note })); break;
    case 'diff': {
      const diffs = await runDiff({ runId: first });
      if (flags.json) output(diffs); else for (const d of diffs) console.log(d.error ?? d.diff);
      break;
    }
    case 'apply': output(await runApply({ runId: first, skillFilter: flags.skill?.split(',') })); break;
    case 'revert': output(await runRevert({ runId: first, skillFilter: flags.skill?.split(',') })); break;
    case 'runs': output(await listRuns({ limit: Number(flags.limit ?? 20), skill: flags.skill, kind: flags.kind })); break;
    case undefined: case 'help': case '--help': case '-h':
      console.log(`SkillOpt: reviewable skill evaluation and improvement

  pnpm skill list [--json]
  pnpm skill eval <skill> [--execute] [--case <id>] [--ci]
  pnpm skill rollout <skill> [--execute]       Alias for eval
  pnpm skill score <run-id>                   Offline rescoring
  pnpm skill reflect <run-id> [--execute] [--force]
  pnpm skill new <name> [--to <dir>]           Scaffold a project skill draft from harness/templates/skill into .context/
  pnpm skill propose <skill> --file <SKILL.md> --reason <text> [--evals <file|directory>]
  pnpm skill diff <run-id>
  pnpm skill compare <run-id> [--execute]
  pnpm skill approve <run-id> --by <human> --note <authorization-reference>
  pnpm skill apply <run-id> [--skill <name>]
  pnpm skill revert <run-id>
  pnpm skill runs [--limit 20]

No LLM calls without --execute. Configure an explicit provider in .skillopt.json.
New skills require --evals; existing skills use their current eval directory.
Optional frontmatter status: draft | verified | deprecated (deprecated skills are unreachable and not copied to clients).
Comparison uses identical frozen cases and canonical context, and reports sample sizes.
Apply requires zero errors, all mandatory cases passing, no regression and exact-hash approval.
Approval records stated authorization locally; it does not verify identity or authority.
Apply affects only project skills, saves a backup and stages changes without committing.
Artifacts: .context/skillopt/<run-id>/ (comparison-plan.json, comparison.json, approval.json).
`);
      break;
    default: throw Error(`Unknown SkillOpt command: ${verb}`);
  }
} catch (e) { console.error(e.message || String(e)); process.exitCode = 1; }
