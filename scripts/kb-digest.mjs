#!/usr/bin/env node
// kb-digest.mjs — утренний человекочитаемый дайджест состояния KB (D4, Evolve/Observe).
//
// Сводит в один экран то, что иначе разбросано по журналу, доктору и dream-report:
//   • пробелы KB: запросы с пустой выдачей (кандидаты в open-questions);
//   • проваленные verify и hook-error за окно;
//   • health: stale synthesis/answers, битые related, stub-карточки (kb-doctor --json);
//   • .context/inbox: сколько кандидатов ждут разбора;
//   • ссылка на свежий dream-report (если есть).
//
// Использование:
//   node scripts/kb-digest.mjs                 # печать + .context/digest-YYYY-MM-DD.md
//   node scripts/kb-digest.mjs --days 7        # окно журнала (default 7)
//   KB_DIGEST_WEBHOOK=https://… node …         # дополнительно POST {text} (Slack/Telegram-мост)
//
// Планировщик (launchd/cron): docs/automation.md. Ночная цепочка:
//   kb:index → kb:doctor → kb:dream [--execute] → kb:digest

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { writeFile, mkdir, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readJournal, summarizeJournal, appendJournal, journalStatus } from './lib/journal.mjs';
import { readFindings, findingsMetrics } from './lib/findings.mjs';
import { buildRoster } from './lib/roster.mjs';
import { buildInbox } from './lib/inbox.mjs';
import { loadKbConfig } from './lib/kb-root.mjs';
import { safePath } from './lib/template-state.mjs';
import { KB_ROOT } from './lib/kb-root.mjs';

const argv = process.argv.slice(2);
const daysIdx = argv.indexOf('--days');
const days = daysIdx >= 0 ? Math.max(1, parseInt(argv[daysIdx + 1], 10) || 7) : 7;

const today = new Date().toISOString().slice(0, 10);
const since = new Date(Date.now() - days * 86400000).toISOString();
const CONTEXT = safePath(KB_ROOT, '.context');

// ---------- журнал ----------
const records = await readJournal({ limit: 100_000, since });
const j = summarizeJournal(records);
const hookErrors = records.filter((r) => r.kind === 'hook-error').length;
const findings = readFindings(KB_ROOT);
const queue = findingsMetrics(findings).findings;

// ---------- kb-doctor --json (subprocess: не тянем его состояние в этот процесс) ----------
let doctor = null, doctorFailure = null;
{
  const timeout = Math.max(1, parseInt(process.env.KB_DIGEST_DOCTOR_TIMEOUT_MS ?? '120000', 10) || 120_000);
  const r = spawnSync(process.execPath, [fileURLToPath(new URL('./kb-doctor.mjs', import.meta.url)), '--json'], { cwd: KB_ROOT, encoding: 'utf8', timeout });
  if (r.error || r.status !== 0) doctorFailure = `exit ${r.status ?? r.signal ?? r.error?.code ?? '?'}; ${String(r.stderr || r.error?.message || '').trim().slice(0, 300)}`;
  else { try { doctor = JSON.parse(r.stdout); } catch (e) { doctorFailure = `вывод не JSON: ${e.message}`; } }
}
const alerts = []; // «тишина не успех»: каждое ⚠ попадает сюда; --strict превращает их в exit 1

// ---------- inbox ----------
let inboxCount = 0;
try {
  inboxCount = readdirSync(join(CONTEXT, 'inbox')).filter((f) => f.endsWith('.md')).length;
} catch { /* inbox нет — норма */ }

// ---------- свежий dream-report ----------
let dreamReport = null;
try {
  dreamReport = readdirSync(CONTEXT).filter((f) => /^dream-report-\d{4}-\d{2}-\d{2}(?:T[\dTZ-]+)?\.md$/.test(f)).sort().pop() || null;
} catch { /* нет .context */ }

// ---------- сборка ----------
const lines = [];
const add = (s = '') => lines.push(s);

add(`# KB-дайджест — ${today} (окно ${days}д)`);
add();
add(`Операций в журнале: ${j.total} · verify-провалов: ${j.failed_verify.length} · hook-errors: ${hookErrors}`);
add();
// ---------- ночной контур: последний запуск каждого шага и его статус ----------
add('## Ночной контур');
if (!journalStatus().enabled) add('- тренды неизвестны: журнал отключён (KB_JOURNAL=0)');
else {
  const last = (pred) => records.filter(pred).sort((a, b) => String(b.written_at ?? b.ts ?? '').localeCompare(String(a.written_at ?? a.ts ?? '')))[0] ?? null;
  const when = (r) => String(r?.ts ?? r?.written_at ?? '').slice(0, 16).replace('T', ' ') || '—';
  const steps = [
    ['findings-scan', (r) => r.kind === 'doctor' || (r.kind === 'run' && r.step === 'findings-scan'), (r) => (r.kind === 'doctor' ? 'ok' : `${r.status}${r.error ? `: ${r.error}` : ''}`), (r) => r.kind === 'run' && r.status === 'failed'],
    ['dream', (r) => r.kind === 'run' && r.step === 'dream', (r) => (r.status === 'skipped' ? `ручной режим (${r.reason}); промпт: ${r.prompt ?? '.context/'}` : `${r.status}${r.reason ? `: ${r.reason}` : ''}`), (r) => r.status === 'failed'],
    ['metrics', (r) => r.kind === 'run' && r.step === 'metrics', (r) => r.status, (r) => r.status === 'failed'],
    ['digest-webhook', (r) => r.kind === 'run' && r.step === 'digest', (r) => (r.delivered ? `доставлен (HTTP ${r.http_status})` : `не доставлен (${r.http_status ? `HTTP ${r.http_status}` : r.error ?? 'ошибка'})`), (r) => !r.delivered],
    ['verify-scan', (r) => r.kind === 'verify-scan', (r) => `${r.scan?.files ?? '?'} файлов, провалов ${r.scan?.failed ?? '?'}`, (r) => r.scan?.files === 0],
  ];
  for (const [step, pick, fmt, bad] of steps) {
    const rec = last(pick);
    if (!rec) { add(`- ${step}: запусков за окно нет`); continue; }
    const alert = bad(rec);
    add(`- ${alert ? '⚠ ' : ''}${step}: ${when(rec)} — ${fmt(rec)}`);
    if (alert) alerts.push(`${step}: ${fmt(rec)}`);
  }
}
add();

if (j.empty_queries.length) {
  add(`## Пробелы KB — запросы с пустой выдачей (${j.empty_queries.length})`);
  add('Кандидаты в 04_synthesis/open-questions.md:');
  for (const q of j.empty_queries.slice(0, 10)) add(`- «${q.query}» ×${q.count}`);
  add();
}

if (j.failed_verify.length) {
  add(`## Проваленные verify (${j.failed_verify.length})`);
  for (const f of j.failed_verify.slice(0, 10)) {
    add(`- ${f.ts?.slice(0, 10) ?? '—'}: цитат ok ${f.citations_ok}/${f.citations_total} — разбор: node scripts/kb-critic.mjs`);
  }
  add();
}

add('## Health (kb-doctor)');
if (!doctor) { add(`- ⚠ kb-doctor не запустился: ${doctorFailure ?? 'неизвестная причина'}`); alerts.push(`kb-doctor: ${doctorFailure}`); add(); }
if (doctor) {
  const d = doctor.summary ?? doctor;
  const health = [];
  if (d.stale_synthesis) health.push(`stale synthesis: ${d.stale_synthesis}`);
  if (d.broken_related) health.push(`битые related: ${d.broken_related}`);
  if (d.orphans) health.push(`orphans: ${d.orphans}`);
  if (d.stale_answers) health.push(`stale answer-cards: ${d.stale_answers}`);
  if (d.stub_cards) health.push(`stub-карточки: ${d.stub_cards}`);
  add(health.length ? health.map((h) => `- ${h}`).join('\n') : '- чисто ✅');
  add();
}

add('## Очередь находок и обратной связи');
add(`Всего: ${queue.total} · open: ${queue.byStatus.open} · accepted: ${queue.byStatus.accepted} · resolved: ${queue.byStatus.resolved} · dismissed: ${queue.byStatus.dismissed}`);
const repeatIdx = argv.indexOf('--repeat-threshold');
const repeatThreshold = repeatIdx >= 0 ? Math.max(2, parseInt(argv[repeatIdx + 1], 10) || 2) : 2;
for (const finding of findings) {
  add(`- ${finding.id} [${finding.kind}/${finding.status}] ${finding.title}${finding.kind === 'feedback' && finding.observations?.length > 1 ? ` ×${finding.observations.length}` : ''}`);
  add(`  Следующий шаг: ${finding.suggestedAction}`);
  add(`  Карточка: .remember/findings/${finding.id}.json`);
}
add('Разбор: pnpm kb:findings list --json; после решения человека — pnpm kb:findings transition --id <id> --status accepted|resolved|dismissed --by <имя> --note <подтверждение>.');
add('accepted у feedback сохраняет подтверждённый урок; открытая находка остаётся наблюдением.');
add();
// Papercuts: weak signals, deliberately not a backlog. Repeats are the only thing that matters.
const papercuts = findingsMetrics(findings).papercuts;
add('## Papercuts (не бэклог)');
add(papercuts.total ? `Записей: ${papercuts.total} · с тремя и более повторами: ${papercuts.repeated3plus}` : 'Записей нет. Трение сессии: pnpm kb:findings papercut "<текст>"');
for (const item of papercuts.top) add(`- ×${item.count} ${item.title} (${item.id})`);
add();
// Repeated feedback that no skill proposal has picked up — the loop from practice to procedure is open here.
let proposalFindingIds = new Set();
try {
  const runs = join(CONTEXT, 'skillopt');
  for (const run of readdirSync(runs)) {
    try { for (const f of JSON.parse(readFileSync(join(runs, run, 'proposal.json'), 'utf8')).findings ?? []) proposalFindingIds.add(f.id); } catch { /* not a proposal run */ }
  }
} catch { /* no local runs */ }
const repeated = findings.filter((f) => f.kind === 'feedback' && (f.observations?.length ?? 0) >= repeatThreshold && !proposalFindingIds.has(f.id));
add(`## Повторяющиеся замечания без предложения навыка (≥${repeatThreshold})`);
if (!repeated.length) add('повторяющихся замечаний без предложения нет');
for (const f of repeated) {
  add(`- ${f.id} [${f.status}] ×${f.observations.length} ${f.title}`);
  add(`  UNKNOWN: «${f.title}» повторяется ${f.observations.length} раз; вопрос владельцу: нужен ли навык или правка процедуры? → принять урок (kb:findings transition --status accepted), затем pnpm skill propose <skill> --from-findings ${f.id}`);
}
add('(локальные предложения читаются из .context/skillopt; на другой машине список может быть неполным)');
add();
add('## Ждут человека');
add(`- .context/inbox: ${inboxCount} кандидатов${inboxCount ? ' → разбор через skill-ingest' : ' ✅'}`);
// Единый инбокс: каждая карточка — что / где / команда. Durable-источники (git) отдельно от локальных (.context).
try {
  const inbox = buildInbox(KB_ROOT, { olderThanDays: 7, config: await loadKbConfig() });
  const durable = inbox.cards.filter((c) => c.durable), local = inbox.cards.filter((c) => !c.durable);
  if (inbox.summary.olderThan) add(`- ⚠ ${inbox.summary.olderThan} предложений ждут дольше ${inbox.olderThanDays} дней`);
  for (const c of durable) add(`- [${c.kind}] ${c.what} — ${c.where}${c.ageDays != null ? ` · ${c.ageDays} дн.` : ''}\n  → ${c.action}`);
  if (local.length) add(`- локальные предложения (.context, на другой машине неполно): ${local.length}`);
  for (const c of local) add(`  - [${c.kind}] ${c.what} — ${c.where}\n    → ${c.action}`);
  if (!inbox.cards.length) add('- решений, ожидающих человека, нет ✅');
  add('  Полный список: pnpm kb:inbox');
} catch (e) { add(`- инбокс недоступен: ${e.message}`); }
if (dreamReport) add(`- свежий dream-report: .context/${dreamReport} (проверьте содержимое; старые файлы могут содержать только промпт)`);
try {
  const roster = buildRoster(KB_ROOT);
  if (roster.contractsInstalled) {
    const s = roster.summary;
    add(`- Реестр: навыков ${s.skills}, подключено ${s.connected}, с проверками ${s.withEvals}${s.unreferenced.length ? `, не подключено: ${s.unreferenced.join(', ')} → добавьте в profile.skills или этап сценария` : ''} (pnpm kb:roster)`);
  }
} catch (e) { add(`- Реестр недоступен: ${e.message}`); }
add();
add('Команды: pnpm kb:metrics (тренды) · pnpm kb:dream (аудит) · node scripts/kb-critic.mjs --file <f> (правка цитат)');

const text = lines.join('\n') + '\n';

// ---------- вывод ----------
await mkdir(CONTEXT, { recursive: true });
const outPath = safePath(KB_ROOT, `.context/digest-${today}.md`);
await writeFile(outPath, text, 'utf8');
console.log(text);
console.log(`[digest] сохранён → .context/digest-${today}.md`);

// ---------- опциональный webhook ----------
const hook = process.env.KB_DIGEST_WEBHOOK;
if (hook) {
  try {
    const res = await fetch(hook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    await appendJournal({ kind: 'run', step: 'digest', status: res.ok ? 'ok' : 'failed', delivered: res.ok, http_status: res.status });
    await appendFile(outPath, `\n[digest] webhook → HTTP ${res.status}\n`);
    console.log(`[digest] webhook → ${res.status}`);
    if (!res.ok) { console.error(`[digest] webhook не доставлен: HTTP ${res.status}`); process.exitCode = 1; }
  } catch (e) {
    await appendJournal({ kind: 'run', step: 'digest', status: 'failed', delivered: false, error: String(e.message).slice(0, 200) });
    await appendFile(outPath, `\n[digest] webhook не доставлен: ${e.message}\n`);
    console.error(`[digest] webhook не доставлен: ${e.message}`);
    process.exitCode = 1;
  }
}
if (argv.includes('--strict') && alerts.length) { console.error(`[digest] --strict: ${alerts.length} предупреждений — ${alerts.join(' | ')}`); process.exitCode = 1; }
