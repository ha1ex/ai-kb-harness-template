// One inbox for everything that waits for a human: proposed/stale decisions, task stages awaiting review or
// approval, skill comparisons awaiting approval, profile proposals, kb_retain candidates, open findings,
// prepared research prompts. Read-only; every card carries the one command that resolves it.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseFrontmatter } from './frontmatter.mjs';
import { approvalConfig, checkApproval } from './approval.mjs';
import { readFindings } from './findings.mjs';
import { loadWorkSystem } from './work-system.mjs';

const DEFAULT_EXEMPT = ['decision-log.md', 'rejected-options.md', 'assumptions.md', 'readme.md'];

function walkMd(root, dir, out = []) {
  const abs = join(root, dir);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) return out;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walkMd(root, rel, out);
    else if (entry.name.endsWith('.md')) out.push(rel);
  }
  return out;
}
const isoDate = (value) => { const t = Date.parse(value ?? ''); return Number.isNaN(t) ? null : new Date(t).toISOString(); };
const readJson = (path) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; } };

export function buildInbox(root, { olderThanDays = 7, now = Date.now(), config = {} } = {}) {
  const cards = [], notes = [];
  const approval = approvalConfig(config);
  const exempt = new Set((config.decisions?.exemptBasenames ?? DEFAULT_EXEMPT).map((n) => n.toLowerCase()));
  const card = (kind, what, where, since, action, durable) => cards.push({ kind, what, where, since, ageDays: since ? Math.floor((now - Date.parse(since)) / 86_400_000) : null, action, durable });

  for (const layer of approval.layers) for (const rel of walkMd(root, layer)) {
    if (exempt.has(rel.split('/').pop().toLowerCase())) continue;
    let text; try { text = readFileSync(join(root, rel), 'utf8'); } catch { continue; }
    const check = checkApproval(text, { approval });
    if (!['proposed', 'unsigned', 'stale'].includes(check.status)) continue;
    const since = isoDate(check.fields.date) ?? new Date(statSync(join(root, rel)).mtimeMs).toISOString();
    card(check.status === 'proposed' ? 'decision-proposed' : `decision-approval-${check.status}`, check.fields.title || rel, rel, since, `pnpm kb:approve --file ${rel} --by <human> --reference <ref>`, true);
  }

  let system = null;
  try { system = loadWorkSystem(root); } catch (error) { notes.push(`work system unavailable: ${error.message}`); }
  const tasksDir = join(root, '.remember/tasks');
  if (existsSync(tasksDir)) for (const name of readdirSync(tasksDir).filter((n) => n.endsWith('.json')).sort()) {
    const task = readJson(join(tasksDir, name));
    if (!task || task.status === 'complete') continue;
    const id = task.task ?? name.slice(0, -5);
    const workflow = system?.workflows?.[task.workflow];
    if (workflow) {
      const current = workflow.stages.find((s) => (task.stages ?? []).find((x) => x.id === s.id)?.status !== 'complete');
      const saved = (task.stages ?? []).find((x) => x.id === current?.id) ?? {};
      if (current?.requiresApproval && !saved.approval?.by) card('task-awaiting-approval', `${id} · этап ${current.id}`, `.remember/tasks/${name}`, isoDate(task.updatedAt), `записать approval.by и approval.reference этапа ${current.id} в handoff после реального согласования, затем pnpm kb:session save --task ${id}`, true);
      if (current?.requiresReview && saved.review?.status !== 'passed') card('task-awaiting-review', `${id} · этап ${current.id}`, `.remember/tasks/${name}`, isoDate(task.updatedAt), `в отдельном контексте: pnpm kb:context --task ${id} --role reviewer --json → записать review в handoff`, true);
    }
    for (const attempt of task.research?.attempts ?? []) if (attempt.status === 'prepared') card('research-awaiting-record', `${id} · ${attempt.role}${attempt.workerId ? `/${attempt.workerId}` : ''}`, `.remember/tasks/${name}`, isoDate(attempt.preparedAt ?? task.updatedAt), `pnpm kb:research record --task ${id} --owner ${task.owner ?? '<owner>'} --attempt ${attempt.id} --file <response.json>`, true);
  }

  const runs = join(root, '.context/skillopt');
  if (existsSync(runs)) for (const run of readdirSync(runs).sort()) {
    const dir = join(runs, run);
    if (!existsSync(join(dir, 'comparison.json')) || existsSync(join(dir, 'applied.json'))) continue;
    const comparison = readJson(join(dir, 'comparison.json'));
    const passed = comparison?.passed ?? comparison?.assessment?.passed ?? comparison?.summary?.passed ?? false;
    if (!passed) continue;
    const skill = readJson(join(dir, 'proposal.json'))?.skill ?? comparison?.skill ?? run;
    const approved = existsSync(join(dir, 'approval.json'));
    card(approved ? 'skill-awaiting-apply' : 'skill-awaiting-approval', `навык ${skill} · run ${run}`, `.context/skillopt/${run}`, isoDate(comparison?.completed_at ?? comparison?.created_at) ?? new Date(statSync(dir).mtimeMs).toISOString(), approved ? `pnpm skill apply ${run}` : `pnpm skill approve ${run} --by <human> --note <ref>`, false);
  }
  const proposal = join(root, '.context/work-system/proposal.json');
  if (existsSync(proposal)) card('profile-awaiting-apply', readJson(proposal)?.profile?.purpose ?? 'профиль проекта', '.context/work-system/proposal.json', isoDate(readJson(proposal)?.createdAt), 'pnpm kb:profile apply --by <human> --note <ref>', false);
  const inbox = join(root, '.context/inbox');
  if (existsSync(inbox)) for (const name of readdirSync(inbox).filter((n) => n.endsWith('.md')).sort()) {
    const fields = parseFrontmatter(readFileSync(join(inbox, name), 'utf8')).fields;
    card('inbox-candidate', fields.title || name, `.context/inbox/${name}`, isoDate(fields.created) ?? new Date(statSync(join(inbox, name)).mtimeMs).toISOString(), 'разобрать через skill-ingest: разложить по слоям или удалить', false);
  }
  for (const finding of readFindings(root)) if (finding.status === 'open') card('finding-open', `[${finding.kind}] ${finding.title}`, `.remember/findings/${finding.id}.json`, isoDate(finding.createdAt), `pnpm kb:findings transition --id ${finding.id} --status accepted|resolved|dismissed --by <human> --note <confirmation>`, true);

  cards.sort((a, b) => (b.ageDays ?? -1) - (a.ageDays ?? -1) || a.kind.localeCompare(b.kind));
  const olderThan = cards.filter((c) => c.ageDays != null && c.ageDays > olderThanDays).length;
  return { olderThanDays, cards, notes, summary: { total: cards.length, durable: cards.filter((c) => c.durable).length, local: cards.filter((c) => !c.durable).length, olderThan } };
}

export function inboxText(inbox) {
  const lines = [`Ждут человека: ${inbox.summary.total} (durable ${inbox.summary.durable}, локально ${inbox.summary.local})`];
  if (inbox.summary.olderThan) lines.push(`⚠ ${inbox.summary.olderThan} ждут дольше ${inbox.olderThanDays} дней`);
  for (const c of inbox.cards) lines.push(`- [${c.kind}] ${c.what} — ${c.where}${c.ageDays != null ? ` · ${c.ageDays} дн.` : ''}${c.durable ? '' : ' (локально, не в git)'}`, `  → ${c.action}`);
  if (!inbox.cards.length) lines.push('- ничего не ждёт решения ✅');
  for (const note of inbox.notes) lines.push(`- ${note}`);
  return lines.join('\n') + '\n';
}
