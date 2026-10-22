import { lstat, readFile, realpath } from "node:fs/promises";
import { join, relative } from "node:path";
import { normalizePublishedPath } from "./publication.mjs";
async function safeProjectEntry(root, path, directory = false) {
  if (
    typeof path !== "string" ||
    path.startsWith("/") ||
    /[\\%?#:]/.test(path) ||
    path.split("/").some((s) => !s || s.startsWith("."))
  )
    return null;
  try {
    let current = root;
    for (const segment of path.split("/")) {
      current = join(current, segment);
      if ((await lstat(current)).isSymbolicLink()) return null;
    }
    const rel = relative(await realpath(root), await realpath(current));
    if (rel.startsWith("..") || rel.startsWith("/")) return null;
    const entry = await lstat(current);
    return (directory ? entry.isDirectory() : entry.isFile()) ? current : null;
  } catch (e) {
    if (["ENOENT", "ENOTDIR"].includes(e.code)) return null;
    throw e;
  }
}
export const safeProjectFile = (root, path) => safeProjectEntry(root, path);
export const safeProjectDirectory = (root, path) =>
  safeProjectEntry(root, path, true);
export async function loadPublishedFile(root, path, allowed) {
  if (!normalizePublishedPath(path) || !allowed.includes(path)) return null;
  const abs = await safeProjectFile(root, path);
  return abs ? readFile(abs) : null;
}
export async function readRegistry(root, path, key) {
  const abs = await safeProjectFile(root, path);
  if (!abs) return [];
  const result = JSON.parse(await readFile(abs, "utf8"));
  if (!Array.isArray(result[key]))
    throw Error(`${path}: ${key} must be an array`);
  return result[key];
}
