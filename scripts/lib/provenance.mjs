// provenance.mjs — dependency-free утилиты для цитат [source: /path] и provenance-порядка слоёв.
//
// Зачем отдельный модуль: им пользуются ДВА потребителя с разными ограничениями —
//   • verify.mjs (Control/Evaluate) — может позволить себе native-deps (sqlite/onnx);
//   • check-provenance.mjs (PreToolUse hook) — должен быть БЫСТРЫМ и БЕЗ native-deps,
//     иначе каждая правка .md тянула бы better-sqlite3 + загрузку модели.
// Поэтому здесь НЕТ импортов lib.mjs — только pure Node (regex + строки).
//
// Две идеи:
//   1. Цитаты внутри HTML-комментариев <!-- ... --> — это ПРИМЕРЫ формата, а не живые
//      утверждения (см. 04_synthesis/contradictions.md). maskHtmlComments их вычищает.
//   2. Provenance-порядок пирамиды (AGENTS.md): документ слоя N может цитировать только
//      СТРОГО более низкий слой. 04_synthesis цитирует source/wiki, но не другой synthesis;
//      05_decisions цитирует вплоть до synthesis, но не другое decision.

// Ранг слоя в пирамиде 00→06 (меньше = «сырее»/ближе к evidence).
export const LAYER_RANK = {
  '00_context': 0,
  '01_raw': 1,
  '02_sources': 2,
  '03_wiki': 3,
  '04_synthesis': 4,
  '05_decisions': 5,
  '06_outputs': 6,
};

// Для каких слоёв-ИСТОЧНИКОВ enforce provenance. Остальные (00/01/02/06) — свободны.
// Ровно по утверждённому плану N4: гейтим handoff на этапах synthesis и decisions.
export const PROVENANCE_ENFORCED_LAYERS = new Set(['04_synthesis', '05_decisions']);

// Зеркала внешних библиотек внутри 06_outputs — к ним внутренние [source:] неприменимы
// (цитата = frontmatter source:-URL). Совпадает с EXTERNAL_CORPUS_DIRS в verify.mjs.
export const EXTERNAL_CORPUS_DIRS = new Set([
  'anthropics-skills', 'claude-cookbooks', 'cybos-cases', 'fabric-patterns', 'mcp-catalog',
]);

const CITATION_RE = /\[source:\s*([^\]]+)\]/g;

// Заменяет совпадения `re` пробелами той же длины (переносы строк сохраняются) — чтобы
// смещения символов остались валидными для вызывающего кода (verify.mjs строит claim-span
// по позициям в тексте).
function maskSpan(text, re) {
  return text.replace(re, (m) => m.replace(/[^\n]/g, ' '));
}

/** Маскирует только HTML-комментарии. Оставлен отдельно для обратной совместимости. */
export function maskHtmlComments(text) {
  return maskSpan(String(text), /<!--[\s\S]*?-->/g);
}

/**
 * Маскирует все «не-живые» зоны, где `[source: …]` — это ПРИМЕР, а не утверждение:
 *   • HTML-комментарии `<!-- … -->`;
 *   • fenced-блоки кода ``` … ``` и ~~~ … ~~~;
 *   • инлайн-код `…`.
 * Реальные цитаты живут в прозе (`Утверждение. [source: /path]`), не в бэктиках, — поэтому
 * маскирование примеров не прячет настоящие цитаты, но снимает ложные срабатывания на
 * документах, которые ОПИСЫВАЮТ синтаксис цитат (напр. 06_outputs/_audit-report).
 */
export function maskExamples(text) {
  let s = String(text);
  s = maskSpan(s, /<!--[\s\S]*?-->/g);
  s = maskSpan(s, /```[\s\S]*?```/g);
  s = maskSpan(s, /~~~[\s\S]*?~~~/g);
  s = maskSpan(s, /`[^`\n]+`/g);
  return s;
}

/** "/04_synthesis/x.md:12" → "04_synthesis/x.md" (нормализован, без :line, без ведущего слэша). */
export function normCitePath(raw) {
  let s = String(raw).trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
  const m = s.match(/:(\d+)\s*$/);
  if (m) s = s.slice(0, m.index);
  return s;
}

/** Извлекает ЖИВЫЕ цитаты (вне HTML-комментариев). → [{ raw, path, layer }]. */
export function extractCitations(text) {
  const scan = maskExamples(text);
  const out = [];
  let m;
  CITATION_RE.lastIndex = 0;
  while ((m = CITATION_RE.exec(scan)) !== null) {
    const path = normCitePath(m[1]);
    out.push({ raw: m[1].trim(), path, layer: path.split('/')[0] || '' });
  }
  return out;
}

/** Путь указывает на карточку external-corpus (06_outputs/<provider>/…). */
export function isExternalCorpus(path) {
  const parts = String(path).split('/');
  return parts[0] === '06_outputs' && EXTERNAL_CORPUS_DIRS.has(parts[1] || '');
}

/**
 * Причина provenance-нарушения, если документ слоя srcLayer цитирует слой citLayer,
 * иначе null. Правило: разрешено цитировать только СТРОГО более низкий ранг.
 */
export function provenanceReason(srcLayer, citLayer) {
  const sr = LAYER_RANK[srcLayer];
  const cr = LAYER_RANK[citLayer];
  if (sr == null || cr == null) return null; // незнакомый слой — не наша зона ответственности
  if (cr >= sr) {
    return `цитирует ${citLayer} (rank ${cr}) ≥ собственный слой ${srcLayer} (rank ${sr}) — нарушает порядок пирамиды`;
  }
  return null;
}

/**
 * Проверить документ на provenance. srcLayer определяется из srcPath.
 * @returns {{ enforced: boolean, srcLayer: string, violations: Array<{path,layer,reason}> }}
 */
export function checkProvenance(srcPath, text) {
  const srcLayer = normCitePath(srcPath).split('/')[0] || '';
  if (!PROVENANCE_ENFORCED_LAYERS.has(srcLayer)) return { enforced: false, srcLayer, violations: [] };
  const violations = [];
  for (const c of extractCitations(text)) {
    if (isExternalCorpus(c.path)) continue; // external corpus — отдельный carve-out (verify Tier-1)
    const reason = provenanceReason(srcLayer, c.layer);
    if (reason) violations.push({ path: c.path, layer: c.layer, reason });
  }
  return { enforced: true, srcLayer, violations };
}
