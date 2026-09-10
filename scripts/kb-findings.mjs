#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { KB_ROOT } from './lib/kb-root.mjs';
import { readFindings, upsertFinding, transitionFinding } from './lib/findings.mjs';
import { reviewCorrections } from './lib/lessons.mjs';
import { appendJournal } from './lib/journal.mjs';

const help = `Usage:
  node scripts/kb-findings.mjs add --file <finding.json> [--json]
  node scripts/kb-findings.mjs list [--kind knowledge|feedback] [--status open|accepted|resolved|dismissed] [--json]
  node scripts/kb-findings.mjs transition --id <id> --status <status> --by <person> --note <confirmation> [--json]
  node scripts/kb-findings.mjs scan [--json]
  node scripts/kb-findings.mjs papercut "<friction text>" [--path <file>] [--role <id>] [--skill <name>] [--task <id>] [--json]
  node scripts/kb-findings.mjs from-reviews [--record] [--json]

Add always records an open observation. Accept only after the user confirms the lesson;
--by and --note record that confirmation and do not provide authentication.
Scan explicitly records local doctor findings; it makes no model or network calls.
Papercut records one line of friction as open feedback (not a backlog): repeats add observations.
from-reviews lists reviewer corrections from task handoffs; --record stores them as open feedback.`;

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    file: { type: 'string' }, id: { type: 'string' }, status: { type: 'string' }, by: { type: 'string' }, note: { type: 'string' }, kind: { type: 'string' }, json: { type: 'boolean' }, help: { type: 'boolean' },
    path: { type: 'string' }, role: { type: 'string' }, skill: { type: 'string' }, task: { type: 'string' }, record: { type: 'boolean' },
  } });
  if (values.help || positionals.length === 0) { console.log(help); process.exit(0); }
  if (positionals.length !== 1 && !(positionals[0] === 'papercut' && positionals.length === 2)) throw Error('Specify one command');
  let result;
  switch (positionals[0]) {
    case 'add':
      if (!values.file) throw Error('add requires --file <finding.json>');
      result = upsertFinding(KB_ROOT, JSON.parse(readFileSync(values.file, 'utf8')));
      break;
    case 'list':
      result = readFindings(KB_ROOT).filter((finding) => (!values.kind || finding.kind === values.kind) && (!values.status || finding.status === values.status));
      break;
    case 'transition':
      result = transitionFinding(KB_ROOT, values);
      break;
    case 'papercut': {
      const text = String(positionals[1] ?? '').trim();
      if (!text) throw Error('papercut requires the friction text: kb:findings papercut "<text>" [--path <file>] [--role <id>] [--skill <name>] [--task <id>]');
      const title = text.toLowerCase().replace(/\s+/g, ' ').slice(0, 160);
      result = upsertFinding(KB_ROOT, {
        kind: 'feedback', code: 'papercut', title, problem: text, paths: values.path ? [values.path] : [],
        evidence: [{ source: values.path ?? 'log.md', observation: `${text} · ${new Date().toISOString()}${values.task ? ` · task ${values.task}` : ''}` }],
        suggestedAction: 'Не бэклог: разобрать, когда повторится три и более раз',
        ...(values.role ? { role: values.role } : {}), ...(values.skill ? { skill: values.skill } : {}), ...(values.task ? { task: values.task } : {}),
      });
      break;
    }
    case 'from-reviews': {
      const candidates = reviewCorrections(KB_ROOT);
      result = values.record ? candidates.map((candidate) => upsertFinding(KB_ROOT, candidate)) : candidates;
      if (!values.json) { console.log(result.length ? result.map((c) => `${c.id ? `${c.id} ` : ''}[${c.kind}/${c.status ?? 'candidate'}] ${c.title}\n  ${c.evidence[0].observation}`).join('\n') : 'No reviewer corrections found in task handoffs.'); result = undefined; }
      break;
    }
    case 'scan': {
      const doctor = spawnSync(process.execPath, [fileURLToPath(new URL('./kb-doctor.mjs', import.meta.url)), '--record-findings', '--json'], { cwd: KB_ROOT, encoding: 'utf8', timeout: 120_000, env: process.env });
      if (doctor.status !== 0) {
        await appendJournal({ kind: 'run', step: 'findings-scan', status: 'failed', exit_code: doctor.status, error: String(doctor.stderr || doctor.error?.message || '').slice(0, 300) });
        throw Error(doctor.stderr || doctor.error?.message || 'Doctor scan failed');
      }
      result = JSON.parse(doctor.stdout);
      break;
    }
    default: throw Error(`Unknown command: ${positionals[0]}`);
  }
  if (result === undefined) { /* printed above */ }
  else if (values.json) console.log(JSON.stringify(result, null, 2));
  else if (Array.isArray(result)) {
    console.log(result.length ? result.map((finding) => `${finding.id} [${finding.kind}/${finding.status}] ${finding.title}\n  ${finding.suggestedAction}`).join('\n') : 'No findings recorded.');
  } else if (result.id) console.log(`${result.id} [${result.kind}/${result.status}] ${result.title}`);
  else console.log(`Recorded ${result.recordedFindings?.length ?? 0} doctor observations. Review: pnpm kb:findings list`);
} catch (error) {
  console.error(`[kb-findings] ${error.message}`);
  process.exitCode = 1;
}
