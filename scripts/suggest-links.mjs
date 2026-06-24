#!/usr/bin/env node
// suggest-links.mjs — advisory-предложения недостающих related:-связей между документами KB.
//
// Зеркалит идею Hindsight: на retain сущности/связи извлекаются автоматически. Но мы НЕ отдаём
// курацию агенту и НЕ пишем в KB — только предлагаем. Для каждого человеко-курируемого документа
// (00_context/03_wiki/04_synthesis/05_decisions) ищем семантически близкие ДРУГИЕ документы,
// которых ещё нет в его frontmatter related:, и выводим список-предложение в .context/.
//
// On-device, без LLM: используем тот же e5-индекс (vector-similarity). Детерминированно.
// Человек просматривает предложения и сам добавляет связи + коммитит.
//
// Использование:
//   node scripts/suggest-links.mjs                 # → .context/suggested-links-YYYY-MM-DD.md
//   node scripts/suggest-links.mjs --dry-run       # печать в stdout, без записи
//   node scripts/suggest-links.mjs --json          # машинный вывод
//   node scripts/suggest-links.mjs --top 3 --min-sim 0.84
//   node scripts/suggest-links.mjs --layers 03_wiki,04_synthesis

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createEmbedder,
  QUERY_PREFIX,
  openDb,
  searchVec,
  getForwardLinks,
  DB_PATH,
  REPO_ROOT,
} from './semantic/lib.mjs';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const asJson = argv.includes('--json');
const topIdx = argv.indexOf('--top');
const perDoc = topIdx >= 0 ? parseInt(argv[topIdx + 1], 10) : 5;
const minIdx = argv.indexOf('--min-sim');
const minSim = minIdx >= 0 ? parseFloat(argv[minIdx + 1]) : 0.80;
const layersIdx = argv.indexOf('--layers');
const LAYERS = (layersIdx >= 0 ? argv[layersIdx + 1] : '00_context,03_wiki,04_synthesis,05_decisions')
  .split(',').map((s) => s.trim()).filter(Boolean);

if (!existsSync(DB_PATH)) {
  console.error(`[suggest-links] БД не найдена: ${DB_PATH}. Запустите: node scripts/semantic/index.mjs`);
  process.exit(1);
}

const db = openDb();
const embed = await createEmbedder();

// Исходные документы — человеко-курируемые слои (корпус 06_outputs не трогаем: там 700+ карточек,
// связи между ними не ведём).
const placeholders = LAYERS.map(() => '?').join(',');
const srcFiles = db.prepare(
  `SELECT DISTINCT file FROM chunks WHERE layer IN (${placeholders}) ORDER BY file`,
).all(...LAYERS).map((r) => r.file);

const today = new Date().toISOString().slice(0, 10);
const suggestions = [];

for (const file of srcFiles) {
  const chunks = db.prepare('SELECT text FROM chunks WHERE file = ? ORDER BY line_start').all(file);
  if (chunks.length === 0) continue;

  const existing = new Set(getForwardLinks(db, file).map((r) => r.dst));
  // Агрегируем близость по файлам-соседям: score(neighbor) = Σ по чанкам source max-similarity.
  const score = new Map();
  const embeddings = await embed(chunks.map((c) => QUERY_PREFIX + c.text));
  for (const emb of embeddings) {
    const hits = searchVec(db, emb, { topK: 10 });
    const bestPerFile = new Map();
    for (const h of hits) {
      if (h.file === file) continue;                         // сам себя не предлагаем
      const prev = bestPerFile.get(h.file) ?? 0;
      if (h.similarity > prev) bestPerFile.set(h.file, h.similarity);
    }
    for (const [f, sim] of bestPerFile) score.set(f, (score.get(f) || 0) + sim);
  }

  const ranked = [...score.entries()]
    .map(([f, s]) => ({ file: f, score: s, peak: s / chunks.length }))
    .filter((x) => x.peak >= minSim && !existing.has(x.file))
    .sort((a, b) => b.score - a.score)
    .slice(0, perDoc);

  if (ranked.length) {
    suggestions.push({
      file,
      existing: [...existing],
      suggested: ranked.map((x) => ({ file: x.file, peak: Number(x.peak.toFixed(3)) })),
    });
  }
}

db.close();

if (asJson) {
  console.log(JSON.stringify({ generated_at: today, min_sim: minSim, suggestions }, null, 2));
  process.exit(0);
}

const lines = [
  `# Предложения related:-связей — ${today}`,
  '',
  '> ADVISORY. Сгенерировано `scripts/suggest-links.mjs` (vector-similarity, on-device, без LLM).',
  `> Порог peak-similarity ≥ ${minSim}, до ${perDoc} предложений на документ. Ничего не закоммичено.`,
  '> Просмотри и при согласии добавь пути в frontmatter `related:` нужных файлов вручную.',
  '',
];
if (suggestions.length === 0) {
  lines.push(`_(нет предложений выше порога ${minSim} в слоях ${LAYERS.join(', ')})_`);
} else {
  for (const s of suggestions) {
    lines.push(`## ${s.file}`);
    lines.push('');
    if (s.existing.length) lines.push(`Уже связано: ${s.existing.map((f) => `\`${f}\``).join(', ')}`);
    lines.push('Предлагается добавить в `related:`:');
    for (const x of s.suggested) lines.push(`- \`${x.file}\`  (peak=${x.peak})`);
    lines.push('');
  }
}
const body = lines.join('\n') + '\n';

if (dryRun) {
  console.log(body);
  process.exit(0);
}

const outDir = join(REPO_ROOT, '.context');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `suggested-links-${today}.md`);
writeFileSync(outPath, body);
console.log(`[suggest-links] ${suggestions.length} документ(ов) с предложениями → .context/suggested-links-${today}.md`);
console.log('[suggest-links] ADVISORY: проверь и при согласии добавь related: вручную, затем коммить.');
