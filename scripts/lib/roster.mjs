// Read-only registry of roles, workflows, skills and their consumers. Dependency-free; no model calls.
// "Built but not connected": a project skill that no role, stage or active profile references never
// reaches kb:context, even though clients may still load it by description.
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadWorkSystem, PROFILE_PATH } from './work-system.mjs';
import { discoverSkills, assertSafePath } from './skills.mjs';
import { readFindings } from './findings.mjs';

const CLIENT_DIRS = ['.agents/skills', '.claude/skills', '.gemini/skills', '.opencode/skills'];

function clientState(root) {
  try {
    const path = assertSafePath(root, '.harness/clients.json');
    if (!existsSync(path)) return { clients: [], files: {} };
    const state = JSON.parse(readFileSync(path, 'utf8'));
    return { clients: state.clients ?? [], files: state.files ?? {} };
  } catch { return { clients: [], files: {} }; }
}

function countEvals(root, dir) {
  if (!dir) return 0;
  const evals = join(root, dir, 'evals');
  if (!existsSync(evals)) return 0;
  let count = 0;
  for (const entry of readdirSync(evals, { withFileTypes: true })) if (entry.isFile() && /\.ya?ml$/.test(entry.name)) count++;
  return count;
}

function foreignCopies(root, state, known) {
  const out = [];
  for (const dir of CLIENT_DIRS) {
    const abs = join(root, dir);
    let entries;
    try { if (!lstatSync(abs).isDirectory()) continue; entries = readdirSync(abs, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (entry.isSymbolicLink() || !entry.isDirectory()) continue;
      const path = `${dir}/${entry.name}/SKILL.md`;
      if (!existsSync(join(root, path)) || Object.hasOwn(state.files, path)) continue;
      out.push({ client: dir.split('/')[0].slice(1), name: entry.name, path, knownSkill: known.has(entry.name) });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

export function buildRoster(root) {
  const errors = [];
  let system = null;
  try { system = loadWorkSystem(root); } catch (error) { errors.push(error.message); }
  const discovery = system ? { skills: [...system.skills.values()], errors: [] } : discoverSkills(root);
  errors.push(...discovery.errors);
  const profile = system?.profile ?? null;
  const profileActive = profile?.status === 'active';
  const roles = system ? Object.values(system.roles) : [];
  const workflows = system ? Object.values(system.workflows) : [];
  let findings = [];
  try { findings = readFindings(root); } catch (error) { errors.push(`Findings unavailable: ${error.message}`); }
  const used = new Map();
  const touch = name => used.get(name) ?? used.set(name, { roles: new Set(), stages: new Set() }).get(name);
  for (const role of roles) for (const name of role.skills) touch(name).roles.add(role.id);
  for (const workflow of workflows) for (const stage of workflow.stages) for (const name of stage.skills) touch(name).stages.add(`${workflow.id}/${stage.id}`);
  const profileSkills = new Set(profile?.skills ?? []);
  const state = clientState(root);
  const skills = discovery.skills.map(skill => {
    const consumers = used.get(skill.name) ?? { roles: new Set(), stages: new Set() };
    const usedBy = { roles: [...consumers.roles].sort(), stages: [...consumers.stages].sort(), profile: profileSkills.has(skill.name) ? (profileActive ? 'active' : 'draft') : null };
    const unreferenced = skill.source === 'project' && !usedBy.roles.length && !usedBy.stages.length && usedBy.profile !== 'active';
    const clientCopies = Object.keys(state.files).filter(path => CLIENT_DIRS.some(dir => path === `${dir}/${skill.name}/SKILL.md`)).sort();
    return { name: skill.name, path: skill.path, source: skill.source, legacy: skill.legacy, status: skill.status ?? null, version: skill.version ?? null, evalCount: countEvals(root, skill.dir), usedBy, unreferenced, clientCopies };
  });
  const roleRows = roles.map(role => ({
    id: role.id, title: role.title, source: profile?.customRoles?.[role.id] ? 'profile' : 'harness', skills: role.skills, requiredContext: role.requiredContext,
    stages: workflows.flatMap(workflow => workflow.stages.filter(stage => stage.role === role.id).map(stage => `${workflow.id}/${stage.id}`)),
    acceptedLessons: findings.filter(f => f.kind === 'feedback' && f.status === 'accepted' && f.role === role.id).length,
  }));
  const workflowRows = workflows.map(workflow => ({
    id: workflow.id, title: workflow.title, source: profile?.customWorkflows?.[workflow.id] ? 'profile' : 'harness',
    stages: workflow.stages.map(stage => ({ id: stage.id, role: stage.role, skills: stage.skills, requiresReview: stage.requiresReview === true, requiresApproval: stage.requiresApproval === true })),
  }));
  const known = new Set(skills.map(s => s.name));
  const foreignSkillCopies = foreignCopies(root, state, known);
  const project = skills.filter(s => s.source === 'project');
  return {
    contractsInstalled: roles.length > 0,
    profile: profile ? { status: profile.status, path: PROFILE_PATH } : null,
    clients: state.clients,
    roles: roleRows, workflows: workflowRows, skills, foreignSkillCopies, errors,
    summary: {
      skills: skills.length, projectSkills: project.length, connected: skills.filter(s => !s.unreferenced).length,
      unreferenced: project.filter(s => s.unreferenced).map(s => s.name), withEvals: skills.filter(s => s.evalCount > 0).length,
      withClientCopies: skills.filter(s => s.clientCopies.length > 0).length, foreignCopies: foreignSkillCopies.length,
    },
  };
}

const cell = value => String(value ?? '').replace(/\|/g, '\\|');
const list = values => values.length ? values.join(', ') : '—';

// Deterministic Markdown (no dates, no .context reads) so the output can be diffed between runs.
export function rosterMarkdown(roster) {
  const lines = ['# Реестр рабочей системы', ''];
  lines.push(`Контракты: ${roster.contractsInstalled ? 'установлены' : 'не установлены (harness/roles отсутствует)'} · профиль: ${roster.profile ? `${roster.profile.status} (${roster.profile.path})` : 'нет'} · клиенты: ${list(roster.clients)}`, '');
  if (roster.roles.length) {
    lines.push('## Роли', '', '| Роль | Источник | Навыки | Этапы | Принятых уроков |', '|---|---|---|---|---|');
    for (const role of roster.roles) lines.push(`| ${cell(role.id)} | ${role.source} | ${cell(list(role.skills))} | ${cell(list(role.stages))} | ${role.acceptedLessons} |`);
    lines.push('');
  }
  if (roster.workflows.length) {
    lines.push('## Сценарии', '', '| Сценарий | Этап | Роль | Навыки этапа | Ревью | Подтверждение |', '|---|---|---|---|---|---|');
    for (const workflow of roster.workflows) for (const stage of workflow.stages) lines.push(`| ${cell(workflow.id)} | ${cell(stage.id)} | ${cell(stage.role)} | ${cell(list(stage.skills))} | ${stage.requiresReview ? 'да' : '—'} | ${stage.requiresApproval ? 'да' : '—'} |`);
    lines.push('');
  }
  lines.push('## Навыки', '', '| Навык | Источник | Статус | Проверок | Используют | Копии у клиентов |', '|---|---|---|---|---|---|');
  for (const skill of roster.skills) {
    const consumers = [...skill.usedBy.roles, ...skill.usedBy.stages, ...(skill.usedBy.profile ? [`profile:${skill.usedBy.profile}`] : [])];
    const using = skill.unreferenced ? 'не подключён (не попадает в kb:context)' : list(consumers);
    lines.push(`| ${cell(skill.name)} | ${skill.source}${skill.legacy ? ' (flat)' : ''} | ${skill.status ?? '—'}${skill.version ? ` v${skill.version}` : ''} | ${skill.evalCount} | ${cell(using)} | ${skill.clientCopies.length} |`);
  }
  lines.push('');
  if (roster.foreignSkillCopies.length) {
    lines.push('## Не управляемые копии у клиентов', '');
    for (const copy of roster.foreignSkillCopies) lines.push(`- ${copy.path}${copy.knownSkill ? '' : ' (нет такого навыка в harness/skills или skills/)'}`);
    lines.push('');
  }
  const s = roster.summary;
  lines.push(`Итог: навыков ${s.skills} · проектных ${s.projectSkills} · подключено ${s.connected} · не подключено: ${list(s.unreferenced)} · с проверками ${s.withEvals} · с копиями у клиентов ${s.withClientCopies} · чужих копий ${s.foreignCopies}`);
  if (roster.errors.length) { lines.push('', '## Ошибки контрактов', ''); for (const error of roster.errors) lines.push(`- ${error}`); }
  lines.push('', 'Навык без роли, этапа или активного профиля не попадает в пакет kb:context; клиент может загрузить его по description. Реестр только читает файлы.');
  return lines.join('\n') + '\n';
}
