#!/usr/bin/env node
// parse-raw.mjs — конвертация бинарного raw-артефакта (PDF/docx/pptx/xlsx/html) в Markdown-черновик
// для слоя 02_sources. Опциональный шаг ingest-цепочки (skill-ingest, Шаг 1.5).
//
// Зеркалит file-parser Hindsight (markitdown). У нас — тонкая обёртка: shell-out к `markitdown`
// (Microsoft, https://github.com/microsoft/markitdown), если он установлен. Жёсткой Python-зависимости
// НЕ добавляем — деградирует мягко: если markitdown не в PATH, печатает подсказку по установке и
// выходит с кодом 0 (ingest продолжается вручную). Это сознательно: local-first, без обязательного Python.
//
// Установка (по желанию): pipx install markitdown   (или: pip install 'markitdown[all]')
//
// Использование:
//   node scripts/parse-raw.mjs 01_raw/contracts/2026-06-msa.pdf            # → stdout (markdown)
//   node scripts/parse-raw.mjs 01_raw/contracts/2026-06-msa.pdf --draft    # → 02_sources/<date>-<slug>.md (с frontmatter)
//   node scripts/parse-raw.mjs <file> --draft --out 02_sources/custom.md

import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, basename, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(here, '..');

const argv = process.argv.slice(2);
const draft = argv.includes('--draft');
const outIdx = argv.indexOf('--out');
const outArg = outIdx >= 0 ? argv[outIdx + 1] : null;
const positional = argv.filter((a, i) => !a.startsWith('--') && !(outIdx >= 0 && i === outIdx + 1));
const rawFile = positional[0];

if (!rawFile) {
  console.error('Использование: node scripts/parse-raw.mjs <raw-файл> [--draft] [--out 02_sources/<...>.md]');
  process.exit(1);
}
const rawAbs = resolve(REPO_ROOT, rawFile);
if (!existsSync(rawAbs)) {
  console.error(`[parse-raw] файл не найден: ${rawFile}`);
  process.exit(1);
}

// markitdown в PATH?
const which = spawnSync('which', ['markitdown'], { encoding: 'utf8' });
if (which.status !== 0) {
  console.error('[parse-raw] markitdown не найден в PATH — шаг пропущен (мягкая деградация).');
  console.error('[parse-raw] Установка (опц.): pipx install markitdown   или   pip install "markitdown[all]"');
  console.error('[parse-raw] Затем повторите, либо создайте 02_sources-саммари вручную (skill-ingest, Шаг 2).');
  process.exit(0);
}

const res = spawnSync('markitdown', [rawAbs], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (res.status !== 0) {
  console.error(`[parse-raw] markitdown завершился с ошибкой: ${(res.stderr || '').trim() || res.error?.message || '?'}`);
  process.exit(1);
}
const markdown = (res.stdout || '').trim();
if (!markdown) {
  console.error('[parse-raw] markitdown вернул пустой результат.');
  process.exit(1);
}

if (!draft) {
  process.stdout.write(markdown + '\n');
  process.exit(0);
}

// --draft: оборачиваем во frontmatter-черновик для 02_sources (статус draft — человек дорабатывает).
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9а-яё]+/giu, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'source';
}
const today = new Date().toISOString().slice(0, 10);
const base = basename(rawFile, extname(rawFile));
const slug = slugify(base);
const outRel = outArg || `02_sources/${today}-${slug}.md`;
const outAbs = resolve(REPO_ROOT, outRel);
mkdirSync(dirname(outAbs), { recursive: true });

const fm = [
  '---',
  'type: source-summary',
  'status: draft',
  `date: ${today}`,
  `source: /${rawFile.replace(/^\/+/, '')}`,
  'confidence: medium',
  'tags: []',
  '---',
  '',
  `# Source summary — ${base}`,
  '',
  '> ЧЕРНОВИК из `parse-raw.mjs` (markitdown). Замени сырой текст ниже на 5–15 bullet-фактов',
  '> с дословными цитатами и метками; затем проиндексируй (`node scripts/semantic/index.mjs`).',
  '',
  '## Сырой текст (markitdown)',
  '',
  markdown,
  '',
].join('\n');

writeFileSync(outAbs, fm);
console.log(`[parse-raw] черновик 02_sources записан → ${outRel} (status: draft).`);
console.log('[parse-raw] Доработай в саммари вручную (skill-ingest, Шаг 2), затем reindex.');
