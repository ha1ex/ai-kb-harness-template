// frontmatter.mjs — единый парсер YAML-frontmatter (C4).
//
// До консолидации 4 скрипта (kb-doctor, dedup-skills, search-quality-probes, eval) держали
// собственные regex-парсеры с расходящимися мелочами. Один источник правды дешевле в поддержке
// и одинаково ведёт себя во всех потребителях.
//
// Намеренно НЕ полный YAML (без вложенности/якорей): frontmatter KB — плоские `key: value`
// плюс список `related:`. Полный YAML-парсер = зависимость, которая хукам не по карману.

/**
 * Разобрать frontmatter документа.
 * @returns {{ raw: string|null, fields: Record<string,string>, body: string }}
 *   raw    — сырой текст между `---` (null, если frontmatter нет);
 *   fields — плоские `key: value` (кавычки по краям сняты; ключи как в файле);
 *   body   — текст после frontmatter (или весь текст, если его нет).
 */
export function parseFrontmatter(text) {
  const s = String(text).replace(/\r\n?/g, '\n');
  const m = s.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)([\s\S]*)$/);
  if (!m) return { raw: null, fields: {}, body: s };
  const fields = {};
  for (const line of m[1].split('\n')) {
    const km = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!km) continue;
    let v = km[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    fields[km[1]] = v;
  }
  return { raw: m[1], fields, body: m[2] };
}

/**
 * Дата документа из frontmatter: первый из ключей с префиксом YYYY-MM-DD, иначе null.
 * Один helper для kb-doctor и think: свежесть считается по знанию, не по mtime файла.
 */
export function parseDocDate(fields, keys = ['updated', 'date', 'ingested']) {
  for (const key of keys) {
    const m = String(fields?.[key] ?? '').match(/^(\d{4}-\d{2}-\d{2})/);
    if (m && !Number.isNaN(Date.parse(m[1]))) return m[1];
  }
  return null;
}

/**
 * Извлечь список `related:` из сырого frontmatter (inline `[a, b]` или блочный `- a`).
 * @param {string|null} raw  поле raw из parseFrontmatter
 * @returns {string[]} значения как в файле (без нормализации путей — это дело вызывающего)
 */
export function parseRelatedList(raw) {
  if (!raw) return [];
  const out = [];
  let inBlock = false;
  for (const line of raw.split('\n')) {
    const inline = line.match(/^related:\s*\[(.*)\]\s*$/);
    if (inline) {
      for (const item of inline[1].split(',')) {
        const c = item.replace(/^["'\s]+|["'\s]+$/g, '');
        if (c) out.push(c);
      }
      inBlock = false;
      continue;
    }
    if (/^related:\s*$/.test(line)) { inBlock = true; continue; }
    if (inBlock) {
      const item = line.match(/^\s*-\s*(.+)$/);
      if (item) {
        const c = item[1].replace(/^["'\s]+|["'\s]+$/g, '');
        if (c) out.push(c);
      } else if (/^\S/.test(line)) inBlock = false;
    }
  }
  return out;
}
