#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { KB_ROOT, loadKbConfig } from './lib/kb-root.mjs';

const root = resolve(KB_ROOT);
const cfg = await loadKbConfig();
const files = [];
const errors = [];

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
}

for (const layer of cfg.layers?.indexable ?? ['00_context', '02_sources', '03_wiki', '04_synthesis', '05_decisions', '06_outputs']) walk(join(root, layer));
for (const rel of cfg.layers?.rootFiles ?? ['README.md', 'index.md', 'log.md']) {
  const full = join(root, rel);
  if (existsSync(full)) files.push(full);
}

for (const file of [...new Set(files)]) {
  const text = readFileSync(file, 'utf8')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]*`/g, '');
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    if (/(?:file:\/\/\/|\/(?:Users|home)\/[^\s)]+)/i.test(line)) {
      errors.push({ code: 'machine-path', file: relative(root, file), line: index + 1, excerpt: line.trim().slice(0, 160) });
    }
  });
}

const report = { ok: errors.length === 0, checkedFiles: new Set(files).size, errors };
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else if (errors.length) for (const item of errors) console.error(`ERROR ${item.file}:${item.line} — machine-specific path`);
else console.log(`Portability: ${report.checkedFiles} Markdown files checked.`);
process.exit(errors.length ? 1 : 0);
