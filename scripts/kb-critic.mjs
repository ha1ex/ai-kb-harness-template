#!/usr/bin/env node
// kb-critic.mjs — N1: замыкает петлю verify → critique → revise → re-verify, БЕЗ автономного агента.
//
// verify.mjs уже строит per-citation критику (result.critique). Этот скрипт превращает её в
// готовый REVISION PROMPT и, опционально, гоняет короткий цикл правок через `claude` CLI.
//
// Дисциплина (как у think.mjs --execute):
//   • По умолчанию НИЧЕГО не исполняет — печатает revision-промпт для копипаста в любой LLM.
//   • --execute: до --rounds (default 2) раз отправляет промпт в `claude -p`, перепроверяет
//     результат через verify, останавливается когда passed или раунды кончились.
//   • claude нет в PATH → graceful degradation: печатает промпт и выходит (никогда не падает из-за CLI).
//   • advisory (FACT weak/none) НЕ форсит revision — гейт только Tier-1 (как в verify).
//
// Использование:
//   node scripts/kb-critic.mjs --file answer.md
//   echo "FACT: ... [source: /x.md]" | node scripts/kb-critic.mjs --stdin
//   node scripts/kb-critic.mjs --file answer.md --execute --rounds 2
//   флаги: --json --threshold N --allow-corpus --no-semantic

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createEmbedder, openDb, DB_PATH } from './semantic/lib.mjs';
import { verifyText } from './semantic/verify.mjs';
import { appendJournal } from './lib/journal.mjs';

const argv = process.argv.slice(2);
let asJson = false, allowCorpus = false, semantic = true, execute = false;
let fromStdin = false, file = null, rounds = 2, threshold;
const textParts = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--json') asJson = true;
  else if (a === '--allow-corpus') allowCorpus = true;
  else if (a === '--no-semantic') semantic = false;
  else if (a === '--stdin') fromStdin = true;
  else if (a === '--execute') execute = true;
  else if (a === '--rounds') rounds = Math.max(1, parseInt(argv[++i], 10) || 2);
  else if (a === '--threshold') threshold = parseFloat(argv[++i]);
  else if (a === '--file') file = argv[++i];
  else if (a === '--text') textParts.push(argv[++i]);
  else textParts.push(a);
}

let text = '';
if (fromStdin) text = readFileSync(0, 'utf8');
else if (file) text = readFileSync(file, 'utf8');
else text = textParts.join(' ');

if (!text.trim()) {
  console.error('Использование: kb-critic.mjs --file answer.md | --text "..." | --stdin   [--execute --rounds 2]');
  process.exit(2);
}

// Tier-2 advisory нужен индекс; без БД молча работаем только Tier-1.
let db = null, embed = null;
if (semantic && existsSync(DB_PATH)) {
  db = openDb();
  embed = await createEmbedder();
} else {
  semantic = false;
}

function buildRevisionPrompt(answer, critique) {
  const lines = [];
  lines.push('# Задача: исправить цитаты в ответе по правилам AGENTS.md');
  lines.push('');
  lines.push('Ниже — ответ с проблемными цитатами `[source: /path]`. Исправь ТОЛЬКО цитаты и метки');
  lines.push('по списку проблем, сохранив смысл и структуру. Верни ПОЛНЫЙ исправленный текст,');
  lines.push('без комментариев и пояснений вокруг.');
  lines.push('');
  lines.push('## Проблемы (errors блокируют, warns — рекомендации)');
  let n = 1;
  for (const it of critique.items) {
    const sev = it.severity === 'error' ? 'ERROR' : 'warn';
    // uncited-claim (A2) не привязан к цитате — у него нет path, только строка в тексте.
    const where = it.path
      ? `[source: /${it.path}${it.line ? `:${it.line}` : ''}]`
      : `строка ${it.line ?? '?'}`;
    const claim = it.claim ? `  ← claim: «${it.claim}»` : '';
    lines.push(`${n}. [${sev}] ${where} — ${it.action}: ${it.suggestion}${claim}`);
    n++;
  }
  lines.push('');
  lines.push('## Текущий ответ');
  lines.push('');
  lines.push(answer.trimEnd());
  lines.push('');
  return lines.join('\n');
}

let claudeAvailable = null;
function hasClaude() {
  if (claudeAvailable === null) claudeAvailable = spawnSync('which', ['claude'], { encoding: 'utf8' }).status === 0;
  return claudeAvailable;
}

let round = 0;
let result = await verifyText(text, { db, embed, threshold, allowCorpus, semantic });
let lastPrompt = '';

while (result.critique.needsRevision && round < rounds) {
  lastPrompt = buildRevisionPrompt(text, result.critique);
  if (!execute) break; // только печать промпта
  if (!hasClaude()) break; // graceful: нет CLI — печатаем промпт ниже
  round++;
  const res = spawnSync('claude', ['-p', lastPrompt], { encoding: 'utf8', timeout: 300_000, killSignal: 'SIGTERM' });
  if (res.error || res.status !== 0 || !String(res.stdout || '').trim()) {
    console.error(`[kb-critic] claude не дал результат на раунде ${round} (${res.error?.code || res.status}). Печатаю промпт.`);
    break;
  }
  text = String(res.stdout).trim();
  result = await verifyText(text, { db, embed, threshold, allowCorpus, semantic });
}

if (db) db.close();

await appendJournal({
  kind: 'critic', ts: new Date().toISOString(),
  critic: {
    rounds: round, executed: execute && round > 0,
    final_passed: result.summary.passed,
    errors: result.critique.errors, warns: result.critique.warns,
  },
});

if (asJson) {
  console.log(JSON.stringify({ rounds: round, result, revisionPrompt: result.critique.needsRevision ? lastPrompt : null, finalText: execute && round > 0 ? text : null }, null, 2));
  process.exit(result.summary.passed ? 0 : 1);
}

if (!result.critique.needsRevision) {
  console.log(`✅ Ревизия не нужна — Tier-1 чисто (${result.summary.citations_ok}/${result.summary.citations_total} цитат)` +
    `${result.critique.warns ? `, но есть ${result.critique.warns} advisory-warn (FACT слабо подтверждён)` : ''}.`);
  if (execute && round > 0) { console.log('\n--- Исправленный текст ---\n'); console.log(text); }
  process.exit(0);
}

// Остались проблемы → печатаем revision-промпт (для копипаста или после неудачного --execute).
if (execute && round >= rounds) console.error(`[kb-critic] исчерпано ${rounds} раунд(ов), Tier-1 всё ещё не чист. Промпт ниже.`);
else if (!execute) console.error('[kb-critic] нужна ревизия. Скопируй промпт ниже в LLM (или добавь --execute для авто-цикла).');
console.log('');
console.log(lastPrompt);
process.exit(1);
