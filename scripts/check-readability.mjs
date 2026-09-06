#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { KB_ROOT, loadKbConfig } from './lib/kb-root.mjs';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const root = resolve(KB_ROOT);
const cfg = await loadKbConfig();
const strict = process.argv.includes('--strict');
const json = process.argv.includes('--json');
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const files = [];
const findings = [];
const rawLayers = new Set(cfg.readability?.excludedLayers ?? ['01_raw']);
const externalDirs = new Set(cfg.provenance?.externalCorpusDirs ?? []);
const exemptBasenames = new Set(
  (cfg.readability?.exemptBasenames ?? ['README.md', '_index.md'])
    .map((name) => name.toLowerCase()),
);
const maxWords = cfg.readability?.maxSentenceWords ?? 35;

function walk(full) {
  if (!existsSync(full)) return;
  const stat = statSync(full);
  if (stat.isFile() && full.endsWith('.md')) files.push(full);
  if (!stat.isDirectory()) return;
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    if (entry.isDirectory() && externalDirs.has(entry.name)) continue;
    walk(join(full, entry.name));
  }
}

if (args.length) for (const arg of args) walk(isAbsolute(arg) ? arg : join(root, arg));
else for (const layer of cfg.layers?.indexable ?? ['00_context', '02_sources', '03_wiki', '04_synthesis', '05_decisions', '06_outputs']) if (!rawLayers.has(layer)) walk(join(root, layer));

const candidates = [...new Set(files)].filter((file) => {
  const rel = relative(root, file);
  const parts = rel.split('/');
  return !rawLayers.has(parts[0])
    && !parts.some((part) => externalDirs.has(part))
    && !exemptBasenames.has(parts.at(-1).toLowerCase());
});

for (const file of candidates) {
  const rel = relative(root, file);
  const body = parseFrontmatter(readFileSync(file, 'utf8')).body;
  let inFence = false;
  let inQuoteSection = false;
  body.split('\n').forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
    if (/^#{1,6}\s+/.test(line)) inQuoteSection = /^#{1,6}\s+(?:Дословно|Verbatim|Transcript|Цитаты?)\b/i.test(line);
    if (inFence || inQuoteSection || /^\s*>/.test(line) || /^\s*\|/.test(line) || /^\s*</.test(line)) return;
    const clean = line.replace(/\[[^\]]+\]\([^)]*\)/g, '').replace(/`[^`]*`/g, '').trim();
    for (const sentence of clean.split(/(?<=[.!?])\s+/)) {
      const count = (sentence.match(/[\p{L}\p{N}][\p{L}\p{N}’'-]*/gu) ?? []).length;
      if (count > maxWords) findings.push({ file: rel, line: index + 1, rule: 'long-sentence', message: `${count} words; target is ${maxWords} or fewer`, excerpt: sentence.slice(0, 180) });
    }
  });
}

const report = { ok: findings.length === 0, strict, checkedFiles: candidates.length, findings };
if (json) console.log(JSON.stringify(report, null, 2));
else {
  for (const item of findings) console.log(`ADVICE ${item.file}:${item.line} ${item.rule} — ${item.message}`);
  console.log(`Readability: ${report.checkedFiles} files, ${findings.length} suggestions${strict ? ' (strict)' : ' (advisory)'}.`);
}
process.exit(strict && findings.length ? 1 : 0);
