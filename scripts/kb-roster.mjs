#!/usr/bin/env node
// Read-only registry: roles, workflows, skills and who uses them. No model calls; exit 0 even with contract errors.
import { KB_ROOT } from './lib/kb-root.mjs';
import { buildRoster, rosterMarkdown } from './lib/roster.mjs';

const args = process.argv.slice(2);
if (args.some(a => ['--help', '-h', 'help'].includes(a))) {
  console.log('Usage: kb:roster [--json|--md]\nRead-only registry of roles, workflows, skills and their consumers. Contract errors are listed, not thrown.');
  process.exit(0);
}
const unknown = args.filter(a => !['--json', '--md'].includes(a));
if (unknown.length) { console.error(`Unknown argument: ${unknown.join(' ')}`); process.exit(1); }
const roster = buildRoster(KB_ROOT);
console.log(args.includes('--json') ? JSON.stringify(roster, null, 2) : rosterMarkdown(roster));
