// kb-root.mjs — единая точка разрешения корня KB и project-owned конфига (C1/C2).
//
// Dependency-free (pure Node): его импортируют и хуки, и ядро semantic, и обвязка.
//
// Два контракта:
//   • KB_ROOT / KB_DB_PATH — env-переменные позволяют ОДНОЙ установленной оснастке обслуживать
//     несколько markdown-репозиториев (мультипроектность): KB_ROOT=~/kb/personal pnpm kb:index.
//     Без env — корень репо, в котором лежит сама оснастка (прежнее поведение).
//   • kb.config.mjs в корне KB — project-owned настройки (слои, provenance, frontmatter-правила,
//     модель эмбеддера). Отсутствует — работаем на дефолтах шаблона. Так кастомизация живёт
//     в ОДНОМ файле пользователя, а не размазана по ядру, которое обновляет upstream.

import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Корень целевой KB: env KB_ROOT или репо самой оснастки (scripts/lib → ../..). */
export const KB_ROOT = process.env.KB_ROOT
  ? resolve(process.env.KB_ROOT)
  : resolve(here, '..', '..');

/** Путь к SQLite-индексу целевой KB: env KB_DB_PATH или <KB_ROOT>/.semantic-index.sqlite. */
export const KB_DB_PATH = process.env.KB_DB_PATH
  ? resolve(process.env.KB_DB_PATH)
  : join(KB_ROOT, '.semantic-index.sqlite');

let cachedConfig = null;

/**
 * Загрузить kb.config.mjs из корня целевой KB. Отсутствие файла/битый файл → {} (дефолты).
 * Кэшируется на процесс (конфиг не меняется во время прогона).
 */
export async function loadKbConfig() {
  if (cachedConfig) return cachedConfig;
  try {
    const mod = await import(pathToFileURL(join(KB_ROOT, 'kb.config.mjs')).href);
    cachedConfig = mod.default ?? {};
  } catch {
    cachedConfig = {};
  }
  return cachedConfig;
}
