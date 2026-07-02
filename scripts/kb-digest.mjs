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
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readJournal, summarizeJournal } from './lib/journal.mjs';
import { KB_ROOT } from './lib/kb-root.mjs';

const argv = process.argv.slice(2);
const daysIdx = argv.indexOf('--days');
const days = daysIdx >= 0 ? Math.max(1, parseInt(argv[daysIdx + 1], 10) || 7) : 7;

const today = new Date().toISOString().slice(0, 10);
const since = new Date(Date.now() - days * 86400000).toISOString();
const CONTEXT = join(KB_ROOT, '.context');

// ---------- журнал ----------
const records = await readJournal({ limit: 100_000, since });
const j = summarizeJournal(records);
const hookErrors = records.filter((r) => r.kind === 'hook-error').length;

// ---------- kb-doctor --json (subprocess: не тянем его состояние в этот процесс) ----------
let doctor = null;
{
  const r = spawnSync('node', [join(KB_ROOT, 'scripts', 'kb-doctor.mjs'), '--json'], {
    cwd: KB_ROOT, encoding: 'utf8', timeout: 120_000,
  });
  try { doctor = JSON.parse(r.stdout); } catch { doctor = null; }
}

// ---------- inbox ----------
let inboxCount = 0;
try {
  inboxCount = readdirSync(join(CONTEXT, 'inbox')).filter((f) => f.endsWith('.md')).length;
} catch { /* inbox нет — норма */ }

// ---------- свежий dream-report ----------
let dreamReport = null;
try {
  dreamReport = readdirSync(CONTEXT).filter((f) => /^dream-report-\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().pop() || null;
} catch { /* нет .context */ }

// ---------- сборка ----------
const lines = [];
const add = (s = '') => lines.push(s);

add(`# KB-дайджест — ${today} (окно ${days}д)`);
add();
add(`Операций в журнале: ${j.total} · verify-провалов: ${j.failed_verify.length} · hook-errors: ${hookErrors}`);
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

if (doctor) {
  const d = doctor.summary ?? doctor;
  const health = [];
  if (d.stale_synthesis) health.push(`stale synthesis: ${d.stale_synthesis}`);
  if (d.broken_related) health.push(`битые related: ${d.broken_related}`);
  if (d.orphans) health.push(`orphans: ${d.orphans}`);
  if (d.stale_answers) health.push(`stale answer-cards: ${d.stale_answers}`);
  if (d.stub_cards) health.push(`stub-карточки: ${d.stub_cards}`);
  add('## Health (kb-doctor)');
  add(health.length ? health.map((h) => `- ${h}`).join('\n') : '- чисто ✅');
  add();
}

add('## Ждут человека');
add(`- .context/inbox: ${inboxCount} кандидатов${inboxCount ? ' → разбор через skill-ingest' : ' ✅'}`);
if (dreamReport) add(`- свежий dream-report: .context/${dreamReport}`);
add();
add('Команды: pnpm kb:metrics (тренды) · pnpm kb:dream (аудит) · node scripts/kb-critic.mjs --file <f> (правка цитат)');

const text = lines.join('\n') + '\n';

// ---------- вывод ----------
await mkdir(CONTEXT, { recursive: true });
const outPath = join(CONTEXT, `digest-${today}.md`);
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
    console.log(`[digest] webhook → ${res.status}`);
  } catch (e) {
    console.error(`[digest] webhook не доставлен: ${e.message}`);
  }
}
