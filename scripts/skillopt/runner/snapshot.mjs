import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, lstatSync } from 'node:fs';
import { join, relative } from 'node:path';
import { REPO_ROOT } from '../evals/loader.mjs';
import { assertSafePath } from '../../lib/skills.mjs';

export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export const makeRunId = () => `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomBytes(3).toString('hex')}`;
export function runDirectory(runId) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,100}$/.test(runId ?? '')) throw Error('Unsafe run ID');
  return assertSafePath(REPO_ROOT, `.context/skillopt/${runId}`);
}
export function readJson(path) { assertSafePath(REPO_ROOT, path); return JSON.parse(readFileSync(path, 'utf8')); }
export function readText(path) { return readFileSync(assertSafePath(REPO_ROOT, path), 'utf8'); }

export function snapshotFiles(root, paths, { exclude = () => false } = {}) {
  const out = [];
  function visit(path) {
    const absolute = assertSafePath(root, path);
    if (!existsSync(absolute)) { out.push({ path: relative(root, absolute), text: null }); return; }
    const stat = lstatSync(absolute);
    if (stat.isDirectory()) {
      for (const name of readdirSync(absolute).sort()) {
        const child = relative(root, join(absolute, name));
        if (!exclude(child)) visit(child);
      }
    } else if (stat.isFile()) out.push({ path: relative(root, absolute), text: readFileSync(absolute).toString('base64'), encoding: 'base64' });
    else throw Error(`Unsafe resource: ${path}`);
  }
  for (const path of paths) visit(path);
  return [...new Map(out.map(file => [file.path, file])).values()].sort((a, b) => a.path.localeCompare(b.path));
}

export function canonicalContext(root = REPO_ROOT) {
  const paths = ['AGENTS.md', 'harness/rules', 'harness/roles', 'harness/workflows', 'docs/human-interface.md', '.remember/core.md', '.remember/preferences.md', '00_context'];
  const files = snapshotFiles(root, paths);
  const text = files.filter(f => f.text !== null && /\.(?:md|json)$/.test(f.path)).map(f => `# ${f.path}\n\n${Buffer.from(f.text, 'base64').toString('utf8')}`).join('\n\n---\n\n');
  return { files, text, hash: hash(files) };
}

export function systemPrompt(context, skillText) {
  return [context.text, skillText ? `# Active skill\n\n${skillText}` : '# Active skill\n\nNo skill loaded (new-skill baseline).'].join('\n\n---\n\n');
}

export function configFingerprint(config, root = REPO_ROOT) {
  // Only digests of configuration files and credentials are persisted.
  const files = snapshotFiles(root, ['.skillopt.json', '.skilloptrc.json', '.skillopt.js', '.skillopt.yaml', '.skillopt.yml', 'kb.config.mjs', 'package.json']).map(f => ({ path: f.path, hash: hash(f.text) }));
  const environmentHash = hash([process.env.OPENAI_API_KEY, process.env.ANTHROPIC_API_KEY, process.env.SKILLOPT_API_KEY, process.env.CLAUDE_MODEL]);
  const configHash = hash(JSON.stringify(config, (_key, value) => typeof value === 'function' ? String(value) : value));
  // CLI arguments and custom adapters may contain credentials under arbitrary keys.
  // Keep an allowlisted public summary and hash the complete resolved configuration.
  const settings = { provider: config.provider, model: config.model ?? null, timeout_ms: config.timeout_ms, max_retries: config.max_retries ?? 0, judge_model: config.graders?.judge_model ?? null };
  return { settings, files, configHash, environmentHash };
}
