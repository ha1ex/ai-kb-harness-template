import { readFile, readdir, stat, realpath } from "node:fs/promises";
import { resolve, relative, join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import matter from "gray-matter";
export async function buildCatalog(root) {
  root = await realpath(root);
  let settings = {};
  try {
    settings = (
      await import(
        pathToFileURL(join(root, "kb.config.mjs")).href + "?t=" + Date.now()
      )
    ).default;
  } catch (e) {
    if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
  }
  let project = {};
  try {
    project = JSON.parse(
      await readFile(join(root, "00_context/project.json"), "utf8"),
    );
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const config = {
    name: "AI KB Harness",
    description: "Источники, выводы и решения вашего проекта.",
    ...project,
    ...settings.viewer,
  };
  const layers = [
    ...new Set([
      ...(settings.layers?.indexable ?? [
        "00_context",
        "02_sources",
        "03_wiki",
        "04_synthesis",
        "05_decisions",
        "06_outputs",
      ]),
      ...(settings.viewer?.includeRaw ? ["01_raw"] : []),
    ]),
  ];
  const docs = [];
  async function walk(dir, layer) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (e) {
      if (e.code === "ENOENT") return;
      throw e;
    }
    for (const entry of entries) {
      if (
        entry.name.startsWith(".") ||
        entry.name === "node_modules" ||
        entry.isSymbolicLink()
      )
        continue;
      const abs = join(dir, entry.name);
      const rel = relative(root, await realpath(abs));
      if (rel.startsWith("..") || rel.startsWith("/")) continue;
      if (entry.isDirectory()) await walk(abs, layer);
      else if (entry.isFile() && entry.name.endsWith(".md")) {
        const raw = await readFile(abs, "utf8");
        const { data, content } = matter(raw);
        const st = await stat(abs);
        docs.push({
          path: rel,
          layer,
          name: entry.name,
          title: data.title || content.match(/^#\s+(.+)$/m)?.[1] || entry.name,
          frontmatter: data,
          size: st.size,
          mtime: st.mtimeMs,
          raw,
          body: content,
          backlinks: [],
        });
      }
    }
  }
  for (const layer of layers) {
    if (
      typeof layer !== "string" ||
      layer.startsWith(".") ||
      layer.includes("..") ||
      layer.startsWith("/")
    )
      throw Error("Invalid viewer layer");
    await walk(resolve(root, layer), layer);
  }
  docs.sort((a, b) => a.path.localeCompare(b.path));
  let spaces = [];
  try {
    const parsed = JSON.parse(
      await readFile(
        join(root, settings.spaces?.registry ?? "00_context/spaces.json"),
        "utf8",
      ),
    );
    spaces = parsed.spaces ?? [];
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const ids = new Set();
  for (const space of spaces) {
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(space.id) || ids.has(space.id))
      throw Error("Invalid or duplicate space id");
    ids.add(space.id);
    space.start_docs ??= [];
  }
  const byPath = new Map(docs.map((d) => [d.path, d]));
  for (const doc of docs) {
    const destinations = new Set();
    for (const match of doc.body.matchAll(
      /(?:\]\(|\[source:\s*)([^\s)\]]+\.md)(?:#[^\s)\]]*)?/g,
    )) {
      const target = match[1];
      if (/^[a-z]+:/i.test(target)) continue;
      const path = target.startsWith("/")
        ? target.replace(/^\//, "")
        : relative(root, resolve(root, dirname(doc.path), target));
      if (path !== doc.path && byPath.has(path)) destinations.add(path);
    }
    for (const target of destinations)
      byPath.get(target).backlinks.push(doc.path);
  }
  const tree = Object.fromEntries(
    layers.map((layer) => [
      layer,
      docs
        .filter((d) => d.layer === layer)
        .map(({ raw, body, backlinks, ...meta }) => meta),
    ]),
  );
  return { config, spaces, docs, layers, tree, builtAt: Date.now() };
}
