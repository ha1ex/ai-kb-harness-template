// Apply only an unchanged, passing comparison with recorded exact-hash approval.
import { mkdir, writeFile, copyFile, rm, rmdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { REPO_ROOT } from '../evals/loader.mjs';
import { assertSafePath } from '../../lib/skills.mjs';
import { verifiedComparison, writeJson } from './lifecycle.mjs';
import { hash, runDirectory, readJson, readText, snapshotFiles } from './snapshot.mjs';

function git(...args) {
  const r = spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
  if (r.status !== 0) throw Error(`Git check failed: ${r.stderr || r.error?.message || r.status}`);
  return r.stdout;
}

export async function runApply({ runId, skillFilter = null } = {}) {
  const { proposal, comparison, frozen } = await verifiedComparison(runId, { approval: true });
  const skill = proposal.skill, target = assertSafePath(REPO_ROOT, proposal.target);
  if (skillFilter && !skillFilter.includes(skill)) throw Error(`Proposal contains ${skill}; --skill must select it`);
  if (frozen.base.exists && frozen.base.source !== 'project') throw Error('Only project-owned skills can be applied');
  const scope = frozen.base.exists ? proposal.target : `skills/${skill}`;
  if (git('status', '--porcelain', '--', scope).trim()) throw Error(`Dirty working tree for ${scope}; commit or preserve local changes before apply`);
  if (existsSync(join(proposal.dir, 'applied.json'))) throw Error('This proposal has already been applied; create a new run');
  const backupDir = assertSafePath(REPO_ROOT, join(proposal.dir, 'backups'));
  await mkdir(backupDir, { recursive: true });
  const backupPath = `backups/${skill}.md`;
  if (frozen.base.exists) await copyFile(target, assertSafePath(REPO_ROOT, join(proposal.dir, backupPath)));
  else await writeJson(join(backupDir, `${skill}.absent.json`), { existed: false, target: proposal.target });
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, frozen.text);
  const paths = [proposal.target];
  if (!frozen.base.exists) {
    const evalRoot = join(proposal.dir, 'evals');
    for (const file of snapshotFiles(REPO_ROOT, [relative(REPO_ROOT, evalRoot)])) {
      if (file.text === null) continue;
      const path = `skills/${skill}/evals/${relative(evalRoot, join(REPO_ROOT, file.path))}`;
      const absolute = assertSafePath(REPO_ROOT, path);
      await mkdir(dirname(absolute), { recursive: true });
      await writeFile(absolute, Buffer.from(file.text, 'base64'));
      paths.push(path);
    }
  }
  const applied = [{ skill, path: proposal.target, created: !frozen.base.exists, backup_path: frozen.base.exists ? backupPath : null, old_size: frozen.base.text.length, new_size: frozen.text.length, paths: paths.map(path => ({ path, hash: hash(readText(path)) })), git_staged: false }];
  const summaryPath = join(proposal.dir, 'applied.json');
  // Record recovery information before staging, so a Git failure retains a backup.
  const record = { runId, appliedAt: new Date().toISOString(), comparison_hash: hash(comparison), applied, skipped: [] };
  await writeJson(summaryPath, record);
  git('add', '--', ...paths);
  applied[0].git_staged = true;
  for (const path of applied[0].paths) path.index_entry = git('ls-files', '--stage', '--', path.path);
  await writeJson(summaryPath, record);
  return { applied, skipped: [], summaryPath, nextSteps: ['pnpm harness:setup', 'pnpm harness:check'] };
}

export async function runRevert({ runId, skillFilter = null } = {}) {
  const dir = runDirectory(runId), path = join(dir, 'applied.json');
  if (!existsSync(path)) throw Error('No apply record/backup for this run');
  const record = readJson(path), reverted = [], skipped = [];
  for (const a of record.applied) {
    if (skillFilter && !skillFilter.includes(a.skill)) continue;
    if (!a.paths || !a.path.startsWith(`skills/${a.skill}`)) throw Error('Unverified legacy apply record; restore its backup manually');
    // Preserve any edits made after apply, including staged edits.
    if (a.paths.some(p => !p.path.startsWith('skills/') || hash(readText(p.path)) !== p.hash)) throw Error('Skill changed after apply; preserve local changes before revert');
    if (a.paths.some(p => !p.index_entry || git('ls-files', '--stage', '--', p.path) !== p.index_entry)) throw Error('Staged skill changed after apply; preserve index changes before revert');
    if (a.created) {
      const boundary = join(REPO_ROOT, 'skills', a.skill), directories = new Set();
      const files = new Set(a.paths.map(p => assertSafePath(REPO_ROOT, p.path)));
      for (const p of a.paths) {
        let dir = dirname(assertSafePath(REPO_ROOT, p.path));
        while (dir === boundary || dir.startsWith(boundary + '/')) {
          directories.add(dir);
          if (dir === boundary) break;
          dir = dirname(dir);
        }
      }
      for (const dir of directories) {
        for (const entry of await readdir(assertSafePath(REPO_ROOT, dir), { withFileTypes: true })) {
          const path = assertSafePath(REPO_ROOT, join(dir, entry.name));
          if ((entry.isDirectory() && !directories.has(path)) || (!entry.isDirectory() && !files.has(path))) throw Error('New skill contains additional user files or directories; preserve them outside the skill before revert');
        }
      }
      for (const p of a.paths) await rm(assertSafePath(REPO_ROOT, p.path));
      for (const dir of [...directories].sort((a, b) => b.length - a.length)) {
        try { await rmdir(assertSafePath(REPO_ROOT, dir)); }
        catch (error) { if (!['ENOTEMPTY', 'EEXIST', 'ENOENT'].includes(error.code)) throw error; }
      }
    } else await copyFile(assertSafePath(REPO_ROOT, join(dir, a.backup_path)), assertSafePath(REPO_ROOT, a.path));
    git('add', '-A', '--', ...a.paths.map(p => p.path));
    reverted.push({ skill: a.skill, path: a.path });
  }
  await writeJson(join(dir, 'reverted.json'), { reverted_at: new Date().toISOString(), reverted });
  return { reverted, skipped, nextSteps: ['pnpm harness:setup', 'pnpm harness:check'] };
}
