#!/usr/bin/env node
// Everything that waits for a human, with the command that resolves each item. Read-only, exit 0.
import { KB_ROOT, loadKbConfig } from './lib/kb-root.mjs';
import { buildInbox, inboxText } from './lib/inbox.mjs';

const args = process.argv.slice(2);
if (args.some((a) => ['--help', '-h', 'help'].includes(a))) { console.log('Usage: kb:inbox [--json] [--older-than <days>]\nLists decisions, task stages, skill comparisons, profile proposals, inbox candidates and open findings awaiting a human.'); process.exit(0); }
const idx = args.indexOf('--older-than');
const olderThanDays = idx >= 0 ? Math.max(1, parseInt(args[idx + 1], 10) || 7) : 7;
const inbox = buildInbox(KB_ROOT, { olderThanDays, config: await loadKbConfig() });
console.log(args.includes('--json') ? JSON.stringify(inbox, null, 2) : inboxText(inbox));
