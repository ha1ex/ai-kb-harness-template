// Documentation-vs-code drift scanner (dependency-free). Scope is the template-owned documentation, so
// "Use this template" projects are not failed for their own README, AGENTS or settings.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const PNPM_BUILTINS = new Set(['install', 'rebuild', 'add', 'remove', 'dlx', 'exec', 'audit', 'update', 'outdated', 'why', 'store', 'run']);
const PATH_RE = /(?<![\w.\/])(?:scripts\/[\w./-]+\.mjs|harness\/[\w./-]+\.(?:md|json|ya?ml)|docs\/[\w./-]+\.md)/g;
const PLACEHOLDER = /[<>…*${}]|__/;
const SKIP_DOC_DIRS = new Set(['docs/releases', 'docs/examples', 'docs/project', 'docs/assets']);

function walk(root, dir, accept, out = []) {
  const abs = join(root, dir);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) return out;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) { if (!SKIP_DOC_DIRS.has(rel) && entry.name !== 'node_modules') walk(root, rel, accept, out); }
    else if (accept(rel)) out.push(rel);
  }
  return out;
}

function changelogHead(text) {
  // [Unreleased] plus the most recent released section only; older history may legitimately name removed commands.
  const sections = text.split(/^## /m);
  return sections.slice(0, 3).join('\n## ');
}

export function scanFiles(root) {
  const pkgPath = join(root, 'package.json');
  const pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')) : {};
  const upstream = pkg.name === 'ai-kb-harness-template';
  const files = [
    ...walk(root, 'docs', rel => rel.endsWith('.md') && rel.split('/').length === 2),
    ...walk(root, 'harness', rel => rel.endsWith('.md')),
    ...['scripts/README.md', 'scripts/semantic/README.md'].filter(rel => existsSync(join(root, rel))),
    ...walk(root, 'scripts', rel => rel.endsWith('.mjs') && rel.split('/').length === 2),
    ...walk(root, 'scripts/lib', rel => rel.endsWith('.mjs')),
  ];
  if (upstream) files.push(...['README.md', 'AGENTS.md', 'CLAUDE.md', 'skills/README.md', 'CHANGELOG.md'].filter(rel => existsSync(join(root, rel))));
  return { pkg, upstream, files: [...new Set(files)].sort() };
}

function lineOf(text, index) { return text.slice(0, index).split('\n').length; }

export function scanDocsDrift(root) {
  const { pkg, upstream, files } = scanFiles(root);
  const scripts = pkg.scripts ?? {};
  const errors = [];
  const push = (code, file, line, detail) => errors.push({ code, file, line, detail });
  for (const file of files) {
    let text = readFileSync(join(root, file), 'utf8');
    if (file === 'CHANGELOG.md') text = changelogHead(text);
    for (const m of text.matchAll(/\bpnpm (?:run )?([a-z][a-z0-9:-]*)/g)) {
      const name = m[1];
      if (PNPM_BUILTINS.has(name) || Object.hasOwn(scripts, name)) continue;
      push('unknown-pnpm-script', file, lineOf(text, m.index), `pnpm ${name} is not a package.json script`);
    }
    for (const m of text.matchAll(PATH_RE)) {
      const path = m[0];
      const context = text.slice(Math.max(0, m.index - 3), m.index + path.length + 3);
      if (PLACEHOLDER.test(context) || existsSync(join(root, path))) continue;
      push('missing-path', file, lineOf(text, m.index), `referenced path does not exist: ${path}`);
    }
  }
  // Every managed CLI script has a row in scripts/README.md.
  const manifestPath = join(root, '.template-manifest.json');
  const readmePath = join(root, 'scripts/README.md');
  if (existsSync(manifestPath) && existsSync(readmePath)) {
    const managed = JSON.parse(readFileSync(manifestPath, 'utf8')).managedJson?.['package.json'] ?? [];
    const readme = readFileSync(readmePath, 'utf8');
    for (const pointer of managed) {
      if (!pointer.startsWith('/scripts/')) continue;
      const name = pointer.slice('/scripts/'.length);
      if (['setup', 'test'].includes(name) || name.startsWith('viewer:')) continue;
      if (!readme.includes(`pnpm ${name}`)) push('undocumented-script', 'scripts/README.md', 0, `pnpm ${name} has no row in scripts/README.md`);
    }
  }
  // Registered MCP tools appear in the server documentation row.
  for (const [server, doc] of [['scripts/semantic/mcp-server.mjs', 'scripts/semantic/README.md'], ['scripts/skillopt/mcp-server.mjs', 'scripts/README.md']]) {
    if (!existsSync(join(root, server)) || !existsSync(join(root, doc))) continue;
    const names = [...readFileSync(join(root, server), 'utf8').matchAll(/registerTool\(\s*["']([a-z_]+)["']/g)].map(m => m[1]);
    const rows = readFileSync(join(root, doc), 'utf8').split('\n').filter(line => line.includes('mcp-server.mjs') && line.trim().startsWith('|'));
    for (const name of names) if (!rows.some(row => row.includes(name))) push('undocumented-mcp-tool', doc, 0, `${name} from ${server} is missing in the mcp-server.mjs table row`);
  }
  return { upstream, files, errors };
}
