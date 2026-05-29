#!/usr/bin/env node
// dedup-skills.mjs — find semantic near-duplicates between external libraries
// (fabric/anthropics-skills/claude-cookbooks) and cybos-cases.
//
// For each non-cybos file in 06_outputs/, embed its title+subtitle, vec-search
// against indexed chunks, filter only cybos hits, keep best. Reports pairs
// with cosine >= THRESHOLD (default 0.85).
//
// NB (метрика): проверяется ТОЛЬКО ось external→cybos. Внутрикорпусные дубли
// (external↔external, cybos↔cybos) НЕ покрыты — «0 дублей» относится к этой оси.
//
// Writes:
//   - 06_outputs/_dedup-report.md       — human-readable top-N report
//   - .context/dedup-fabric-cybos.json  — raw matches (every external file)
//
// Does NOT modify any source files. Adding `possible_duplicate: <id>` to
// frontmatter is a separate step (kept opt-in to avoid surprise diffs).

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createEmbedder, PASSAGE_PREFIX, openDb, searchVec, REPO_ROOT, DB_PATH } from './semantic/lib.mjs';

const THRESHOLD = 0.85; // cosine; only reported as "duplicate-suspect"
const TOPK_VEC = 20;     // raw vec hits before cybos filter
const SOURCE_DIRS = ['fabric-patterns', 'anthropics-skills', 'claude-cookbooks'];
const TARGET_DIR = 'cybos-cases';

function parseFrontmatter(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: text };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const km = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (km) {
      let v = km[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      fm[km[1]] = v;
    }
  }
  return { fm, body: m[2] };
}

function firstParagraphAfterHeading(body) {
  // skip leading title heading + blockquote subtitle
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length && (lines[i].startsWith('#') || lines[i].startsWith('>') || lines[i].trim() === '')) i++;
  const paras = [];
  while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#')) {
    paras.push(lines[i]);
    i++;
  }
  return paras.join(' ').slice(0, 500);
}

function walkMarkdown(dir) {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('_') || ent.name.startsWith('.')) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkMarkdown(p));
    else if (ent.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function main() {
  if (!existsSync(DB_PATH)) {
    console.error('БД не найдена. Сначала: node scripts/semantic/index.mjs');
    process.exit(1);
  }
  const db = openDb();

  const outBase = join(REPO_ROOT, '06_outputs');
  const allMatches = [];
  let processed = 0;

  return createEmbedder().then(async (embedder) => {
    for (const lib of SOURCE_DIRS) {
      const libDir = join(outBase, lib);
      if (!existsSync(libDir)) continue;
      const files = walkMarkdown(libDir);
      console.error(`[dedup] ${lib}: ${files.length} files`);

      for (const file of files) {
        const rel = relative(REPO_ROOT, file);
        const text = readFileSync(file, 'utf-8');
        const { fm, body } = parseFrontmatter(text);
        const queryText = [fm.title, fm.subtitle, firstParagraphAfterHeading(body)]
          .filter(Boolean)
          .join('\n');
        const [emb] = await embedder([PASSAGE_PREFIX + queryText]);
        const hits = searchVec(db, emb, { topK: TOPK_VEC });

        // hits[i].file is the chunk's file path; filter to cybos-cases
        const cybos = hits
          .filter((h) => h.file && h.file.includes(`${TARGET_DIR}/`))
          .filter((h) => !h.file.endsWith('/_index.md') && !h.file.endsWith('/_categories.md'));
        if (cybos.length === 0) {
          processed++;
          continue;
        }
        // dedupe by file (keep best distance per cybos file)
        const byFile = new Map();
        for (const h of cybos) {
          const cur = byFile.get(h.file);
          if (!cur || h.distance < cur.distance) byFile.set(h.file, h);
        }
        // sort by distance ascending; take best
        const ordered = [...byFile.values()].sort((a, b) => a.distance - b.distance);
        const best = ordered[0];

        allMatches.push({
          source: rel,
          source_id: fm.id || '',
          source_title: fm.title || '',
          source_provider: fm.provider || '',
          cybos_path: best.file.startsWith('/') ? relative(REPO_ROOT, best.file) : best.file,
          cybos_chunk_heading: best.heading || '',
          cosine: best.similarity,
          distance: best.distance,
        });
        processed++;
        if (processed % 50 === 0) console.error(`[dedup] ...${processed} done`);
      }
    }

    allMatches.sort((a, b) => b.cosine - a.cosine);

    // --- raw JSON
    const ctxDir = join(REPO_ROOT, '.context');
    mkdirSync(ctxDir, { recursive: true });
    writeFileSync(join(ctxDir, 'dedup-fabric-cybos.json'), JSON.stringify(allMatches, null, 2));

    // --- report
    const suspect = allMatches.filter((m) => m.cosine >= THRESHOLD);
    const lines = [
      '---',
      'type: report',
      'title: Skills dedup — fabric/anthropic/cookbook vs cybos',
      `ingested: ${new Date().toISOString().slice(0, 10)}`,
      'version: v0.1',
      '---',
      '',
      '# Skills dedup — fabric/anthropic/cookbook vs cybos',
      '',
      `> Семантический анализ: для каждой единицы из fabric-patterns / anthropics-skills / claude-cookbooks ` +
        `найден ближайший cybos-кейс через vector-search по индексу. Порог "подозрение на дубль" — ` +
        `**cosine ≥ ${THRESHOLD}** (это очень близко по смыслу title+subtitle+первого абзаца).`,
      '',
      `**Всего проверено:** ${allMatches.length} единиц.  `,
      `**Подозрений на дубль (cosine ≥ ${THRESHOLD}):** ${suspect.length}.`,
      '',
      '## Топ-30 ближайших пар',
      '',
      '| # | Источник | ID | Title | Cosine | Ближайший cybos | Раздел |',
      '| - | - | - | - | -: | - | - |',
    ];
    const top = allMatches.slice(0, 30);
    for (let i = 0; i < top.length; i++) {
      const m = top[i];
      lines.push(
        `| ${i + 1} | ${m.source_provider} | \`${m.source_id}\` | ${m.source_title} ` +
          `| **${m.cosine.toFixed(3)}** | [${m.cybos_path.split('/').pop()}](../${m.cybos_path}) ` +
          `| ${m.cybos_chunk_heading} |`,
      );
    }
    if (suspect.length > 0) {
      lines.push('', '## Все подозрения (cosine ≥ ' + THRESHOLD + ')', '');
      lines.push('| Источник | ID | Title | Cosine | cybos |');
      lines.push('| - | - | - | -: | - |');
      for (const m of suspect) {
        lines.push(
          `| ${m.source_provider} | \`${m.source_id}\` | ${m.source_title} ` +
            `| **${m.cosine.toFixed(3)}** | ${m.cybos_path} |`,
        );
      }
    }
    lines.push(
      '',
      '## Как читать',
      '',
      '- **Cosine 1.0** — почти идентичные тексты (вряд ли встретится, разные источники).',
      '- **0.90+** — очень похожие, требуют ручного просмотра. Возможно один скил пересказывает другой.',
      '- **0.85-0.90** — тематически близкие, но могут быть разными подходами к одной задаче. Не обязательно дубли.',
      '- **<0.85** — разные темы или один общий keyword.',
      '',
      'Если решено пометить пару как дубль — добавь во frontmatter более старого/слабого скила:',
      '',
      '```yaml',
      'possible_duplicate: <id-ближайшего>',
      'duplicate_confidence: <cosine-score>',
      '```',
      '',
    );

    writeFileSync(join(outBase, '_dedup-report.md'), lines.join('\n') + '\n');
    console.error(`[dedup] wrote ${allMatches.length} matches, ${suspect.length} suspects.`);
    console.error(`[dedup] report: ${relative(REPO_ROOT, join(outBase, '_dedup-report.md'))}`);
    console.error(`[dedup] raw:    ${relative(REPO_ROOT, join(ctxDir, 'dedup-fabric-cybos.json'))}`);

    if (suspect.length > 0) {
      console.error('\n[dedup] TOP-10 suspects:');
      for (const m of suspect.slice(0, 10)) {
        console.error(`  ${m.cosine.toFixed(3)}  ${m.source_id} ${m.source_title}`);
        console.error(`         ≈ ${m.cybos_path}`);
      }
    }
  });
}

main();
