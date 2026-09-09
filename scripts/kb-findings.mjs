#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { KB_ROOT } from './lib/kb-root.mjs';
import { readFindings, upsertFinding, transitionFinding } from './lib/findings.mjs';

const help = `Usage:
  node scripts/kb-findings.mjs add --file <finding.json> [--json]
  node scripts/kb-findings.mjs list [--kind knowledge|feedback] [--status open|accepted|resolved|dismissed] [--json]
  node scripts/kb-findings.mjs transition --id <id> --status <status> --by <person> --note <confirmation> [--json]
  node scripts/kb-findings.mjs scan [--json]

Add always records an open observation. Accept only after the user confirms the lesson;
--by and --note record that confirmation and do not provide authentication.
Scan explicitly records local doctor findings; it makes no model or network calls.`;

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    file: { type: 'string' }, id: { type: 'string' }, status: { type: 'string' }, by: { type: 'string' }, note: { type: 'string' }, kind: { type: 'string' }, json: { type: 'boolean' }, help: { type: 'boolean' },
  } });
  if (values.help || positionals.length === 0) { console.log(help); process.exit(0); }
  if (positionals.length !== 1) throw Error('Specify one command');
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
    case 'scan': {
      const doctor = spawnSync(process.execPath, [fileURLToPath(new URL('./kb-doctor.mjs', import.meta.url)), '--record-findings', '--json'], { cwd: KB_ROOT, encoding: 'utf8', timeout: 120_000, env: process.env });
      if (doctor.status !== 0) throw Error(doctor.stderr || doctor.error?.message || 'Doctor scan failed');
      result = JSON.parse(doctor.stdout);
      break;
    }
    default: throw Error(`Unknown command: ${positionals[0]}`);
  }
  if (values.json) console.log(JSON.stringify(result, null, 2));
  else if (Array.isArray(result)) {
    console.log(result.length ? result.map((finding) => `${finding.id} [${finding.kind}/${finding.status}] ${finding.title}\n  ${finding.suggestedAction}`).join('\n') : 'No findings recorded.');
  } else if (result.id) console.log(`${result.id} [${result.kind}/${result.status}] ${result.title}`);
  else console.log(`Recorded ${result.recordedFindings?.length ?? 0} doctor observations. Review: pnpm kb:findings list`);
} catch (error) {
  console.error(`[kb-findings] ${error.message}`);
  process.exitCode = 1;
}
