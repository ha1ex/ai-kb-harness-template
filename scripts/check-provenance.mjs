#!/usr/bin/env node
// check-provenance.mjs — PreToolUse hook (Write|Edit|MultiEdit) для 04_synthesis / 05_decisions.
//
// N4: enforce порядок пирамиды (AGENTS.md) на этапе записи — synthesis/decisions могут цитировать
// `[source: /path]` только СТРОГО более низкий слой (synthesis → source/wiki/context; decisions →
// вплоть до synthesis). Цитата на свой/более высокий слой = lint failure ещё до записи.
//
// Dependency-free: использует scripts/lib/provenance.mjs (без better-sqlite3/onnx) → хук быстрый.
// Цитаты внутри HTML-комментариев игнорируются (примеры формата). exit 0 (allow) / 2 (block).

import { readFileSync, existsSync } from 'node:fs';
import { checkProvenance, PROVENANCE_ENFORCED_LAYERS } from './lib/provenance.mjs';
import { reportHookError } from './lib/journal.mjs';

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

const raw = readStdin();
if (!raw.trim()) process.exit(0);

let payload;
try { payload = JSON.parse(raw); } catch (e) {
  await reportHookError('check-provenance', e); // fail-open, но наблюдаемый (A4)
  process.exit(0);
}

const tool = payload.tool_name || '';
const input = payload.tool_input || {};
const filePath = input.file_path || '';

if (!/^(Write|Edit|MultiEdit)$/.test(tool)) process.exit(0);
if (!filePath || !/\.md$/i.test(filePath)) process.exit(0);

// Определяем относительный путь, начинающийся со слоя (provenance смотрит на первый сегмент).
let relPath = null;
for (const layer of PROVENANCE_ENFORCED_LAYERS) {
  const idx = filePath.indexOf(`/${layer}/`);
  if (idx >= 0) { relPath = filePath.slice(idx + 1); break; }
  if (filePath.startsWith(`${layer}/`)) { relPath = filePath; break; }
}
if (!relPath) process.exit(0);

// Итоговый текст после правки (как в check-md-frontmatter / check-decisions).
let candidateText = '';
if (tool === 'Write' && typeof input.content === 'string') {
  candidateText = input.content;
} else if (tool === 'Edit') {
  const existing = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  candidateText = (input.new_string && input.old_string)
    ? existing.replace(input.old_string, input.new_string)
    : existing;
} else if (tool === 'MultiEdit' && Array.isArray(input.edits)) {
  let existing = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  for (const e of input.edits) {
    if (e.old_string && e.new_string) existing = existing.replace(e.old_string, e.new_string);
  }
  candidateText = existing;
}
if (!candidateText) process.exit(0);

const { violations } = checkProvenance(relPath, candidateText);
if (violations.length === 0) process.exit(0);

const msg = [
  `[check-provenance] Блокировка записи в ${relPath}.`,
  'Нарушен порядок пирамиды (AGENTS.md): цитировать можно только более низкий слой.',
  '',
  ...violations.map((v) => `  • [source: /${v.path}] — ${v.reason}`),
  '',
  'Что делать: сошлись на evidence нижнего слоя (00_context/02_sources/03_wiki, для decisions — ещё 04_synthesis),',
  'либо вынеси связь между документами своего уровня в frontmatter `related:` (это не [source:]-цитата).',
].join('\n');

process.stderr.write(msg + '\n');
process.exit(2);
