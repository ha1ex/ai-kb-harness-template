#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { KB_ROOT, loadKbConfig } from './lib/kb-root.mjs';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const root = resolve(KB_ROOT);
const cfg = await loadKbConfig();
const registryRel = cfg.spaces?.registry ?? '00_context/spaces.json';
const registry = join(root, registryRel);
const errors = [];
const warnings = [];
let checkedDocuments = 0;
const add = (list, code, detail) => list.push({ code, detail });

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function values(raw) {
  if (!raw) return null;
  const block = raw.match(/^audience:\s*\n((?:\s+-\s+.*\n?)+)/m);
  if (block) return block[1].split('\n').map((line) => line.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
  const inline = raw.match(/^audience:\s*\[(.*?)\]\s*$/m);
  return inline ? inline[1].split(',').map((item) => item.trim().replace(/^["']|["']$/g, '')).filter(Boolean) : null;
}

function output(report) {
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    for (const item of errors) console.error(`ERROR ${item.code} — ${item.detail}`);
    for (const item of warnings) console.log(`WARN ${item.code} — ${item.detail}`);
    console.log(`spaces: ${report.spaces} · documents: ${checkedDocuments} · errors: ${errors.length} · warnings: ${warnings.length}`);
  }
}

// A registry is an optional navigation enhancement. Its absence must not turn the
// optional `audience` field into a hidden project requirement.
if (!existsSync(registry)) {
  output({ ok: true, registry: null, spaces: 0, checkedDocuments: 0, errors, warnings });
  process.exit(0);
}

let data;
try { data = JSON.parse(readFileSync(registry, 'utf8')); }
catch (error) {
  add(errors, 'registry-unparsable', `${registryRel}: ${error.message}`);
  output({ ok: false, registry: registryRel, spaces: 0, checkedDocuments, errors, warnings });
  process.exit(1);
}

const spaces = Array.isArray(data.spaces) ? data.spaces : [];
const ids = new Set();
for (const space of spaces) {
  const id = String(space?.id ?? '');
  if (!/^[a-z][a-z0-9-]*$/.test(id)) add(errors, 'bad-id', id || '(missing)');
  if (ids.has(id)) add(errors, 'duplicate-id', id);
  ids.add(id);
  if (!String(space?.title ?? '').trim()) add(errors, 'missing-title', id || '(missing)');
  if (!String(space?.description ?? '').trim()) add(errors, 'missing-description', id || '(missing)');
  for (const field of ['start_docs', 'raw_docs', 'key_docs']) {
    const refs = space?.[field] ?? [];
    if (!Array.isArray(refs)) {
      add(errors, 'bad-doc-list', `${id}.${field} must be an array`);
      continue;
    }
    for (const rel of refs) {
      if (typeof rel !== 'string' || !rel.trim()) {
        add(errors, 'bad-doc-ref', `${id}.${field}: ${JSON.stringify(rel)}`);
        continue;
      }
      const abs = join(root, rel);
      if (!existsSync(abs) || !statSync(abs).isFile()) add(errors, 'broken-doc-ref', `${id}.${field}: ${rel}`);
    }
  }
}
const sharedDocs = data.shared?.key_docs ?? [];
if (!Array.isArray(sharedDocs)) add(errors, 'bad-doc-list', 'shared.key_docs must be an array');
for (const rel of Array.isArray(sharedDocs) ? sharedDocs : []) {
  if (typeof rel !== 'string' || !rel.trim()) {
    add(errors, 'bad-doc-ref', `shared.key_docs: ${JSON.stringify(rel)}`);
    continue;
  }
  const abs = join(root, rel);
  if (!existsSync(abs) || !statSync(abs).isFile()) add(errors, 'broken-doc-ref', `shared.key_docs: ${rel}`);
}

const layers = cfg.layers?.indexable ?? ['00_context', '02_sources', '03_wiki', '04_synthesis', '05_decisions', '06_outputs'];
for (const layer of layers) {
  for (const file of walk(join(root, layer))) {
    checkedDocuments += 1;
    const rel = relative(root, file);
    const audience = values(parseFrontmatter(readFileSync(file, 'utf8')).raw);
    if (!audience) continue;
    if (audience.length === 0) add(errors, 'audience-empty', rel);
    for (const id of audience) if (id !== 'all' && !ids.has(id)) add(errors, 'unknown-audience', `${rel}: ${id}`);
  }
}

const report = { ok: errors.length === 0, registry: registryRel, spaces: spaces.length, checkedDocuments, errors, warnings };
output(report);
process.exit(errors.length ? 1 : 0);
