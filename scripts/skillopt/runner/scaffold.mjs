// Scaffold a project skill draft from harness/templates/skill — never from a neighbouring skill.
// Writes only under .context (advisory). propose → compare → approve → apply moves it into skills/.
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { REPO_ROOT, loadEvalDirectory } from '../evals/loader.mjs';
import { discoverSkills, assertSafePath, assertSkillName, validateSkillText } from '../../lib/skills.mjs';

export const SKILL_TEMPLATE_DIR = 'harness/templates/skill';
const PLACEHOLDER = /__SKILL_NAME__/g;

function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isSymbolicLink()) throw Error(`Template symlink not portable: ${relative(base, abs)}`);
    if (entry.isDirectory()) out.push(...listFiles(abs, base));
    else if (entry.isFile()) out.push(relative(base, abs).split('\\').join('/'));
  }
  return out.sort();
}

export async function runNew({ name, to } = {}) {
  assertSkillName(name);
  const templateDir = assertSafePath(REPO_ROOT, SKILL_TEMPLATE_DIR);
  if (!existsSync(templateDir)) throw Error(`Skill template missing: ${SKILL_TEMPLATE_DIR}; update the harness (pnpm kb:update) before scaffolding`);
  const discovery = discoverSkills(REPO_ROOT);
  if (discovery.skills.some(s => s.name === name)) throw Error(`Skill already exists: ${name}; change it through propose → compare → approve → apply instead of scaffolding`);
  const dirRel = (to ?? `.context/skills/${name}`).split('\\').join('/');
  const dir = assertSafePath(REPO_ROOT, dirRel);
  if (existsSync(dir) && readdirSync(dir).length) throw Error(`Destination is not empty: ${dirRel}`);
  const files = listFiles(templateDir).map(rel => ({ rel, text: readFileSync(join(templateDir, rel), 'utf8').replace(PLACEHOLDER, name) }));
  const main = files.find(f => f.rel === 'SKILL.md');
  if (!main) throw Error(`Skill template has no SKILL.md: ${SKILL_TEMPLATE_DIR}`);
  validateSkillText(main.text, { name });
  for (const f of files) {
    const target = assertSafePath(REPO_ROOT, join(dirRel, f.rel));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, f.text, { flag: 'wx' });
  }
  const evalsDir = join(dir, 'evals');
  const cases = existsSync(evalsDir) ? await loadEvalDirectory(evalsDir, { root: REPO_ROOT, skill: name }) : [];
  const caseErrors = cases.filter(c => c.error).map(c => c.error);
  if (caseErrors.length) throw Error(`Scaffolded eval cases are invalid:\n${caseErrors.join('\n')}`);
  const skillPath = `${dirRel}/SKILL.md`, evalsPath = `${dirRel}/evals`;
  return {
    name, dir: dirRel, files: files.map(f => f.rel), caseCount: cases.length, status: 'scaffolded',
    nextSteps: [
      `Edit ${skillPath} and the cases in ${evalsPath}; keep status: draft until a comparison has passed.`,
      `pnpm skill propose ${name} --file ${skillPath} --evals ${evalsPath} --reason "<why this procedure is needed>"`,
      'pnpm skill compare <run-id> [--execute] → pnpm skill approve <run-id> --by <human> --note <reference> → pnpm skill apply <run-id> → pnpm harness:setup',
      `Add ${name} to profile.skills in 00_context/work-system.json or to a workflow stage; otherwise it never enters kb:context and clients can only load it by description.`,
    ],
    notice: 'Scaffold written under .context only; nothing in skills/ changes until apply. No model was called.',
    discoveryErrors: discovery.errors,
  };
}
