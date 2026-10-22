import { readFile, readdir, stat, realpath } from "node:fs/promises";
import { resolve, relative, join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import matter from "gray-matter";
import { validateMaps } from "./maps.mjs";
import { collectPublications, normalizePublishedPath } from "./publication.mjs";
import {
  safeProjectFile,
  safeProjectDirectory,
  readRegistry,
} from "./published-files.mjs";
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
  const methods = await readRegistry(
    root,
    settings.viewer?.registries?.methods ?? "06_outputs/methods/_registry.json",
    "methods",
  );
  const research = await readRegistry(
    root,
    settings.viewer?.registries?.research ??
      "06_outputs/research/_registry.json",
    "research",
  );
  const maps = await readRegistry(
    root,
    settings.viewer?.registries?.maps ?? "06_outputs/maps/_registry.json",
    "maps",
  );
  const excluded = [
    ...(settings.viewer?.excludePaths ?? []),
    ...research.map((r) => r.workdir).filter(Boolean),
  ];
  const excludedPath = (path) =>
    excluded.some(
      (prefix) =>
        path === prefix || path.startsWith(prefix.replace(/\/$/, "") + "/"),
    );
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
      if (rel.startsWith("..") || rel.startsWith("/") || excludedPath(rel))
        continue;
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
    const directory = await safeProjectDirectory(root, layer);
    if (directory) await walk(directory, layer);
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
  const assets = [];
  for (const doc of docs) {
    if (doc.frontmatter.status === "archived" || doc.frontmatter.supersededBy)
      continue;
    for (const key of ["artifact", "print", "pdf"]) {
      const path = normalizePublishedPath(doc.frontmatter[key]);
      if (
        !path ||
        path.endsWith(".md") ||
        excludedPath(path) ||
        !layers.some((layer) => path.startsWith(layer + "/"))
      )
        continue;
      if (await safeProjectFile(root, path)) assets.push(path);
    }
  }
  const publishedAssets = [...new Set(assets)].sort();
  const publication = collectPublications(
    docs,
    settings.viewer?.documents,
    publishedAssets,
  );
  const registryErrors = validateMaps(
    maps,
    docs.map((d) => d.path),
  );
  for (const [kind, entries] of [
    ["methods", methods],
    ["research", research],
  ]) {
    const seen = new Set();
    for (const entry of entries) {
      if (
        !/^[a-z0-9][a-z0-9-]*$/.test(entry.id) ||
        seen.has(entry.id) ||
        !entry.title
      )
        registryErrors.push(`${kind}: invalid or duplicate id/title`);
      seen.add(entry.id);
      if (kind === "methods") {
        if (
          !byPath.has(entry.card) ||
          !/^https?:\/\//.test(entry.source ?? "") ||
          !entry.license ||
          !entry.lens
        )
          registryErrors.push(
            `methods: ${entry.id} needs a published card, lens, source and license`,
          );
      } else {
        if (
          !Array.isArray(entry.results) ||
          entry.results.some((path) => !byPath.has(path))
        )
          registryErrors.push(`research: ${entry.id} has unpublished results`);
      }
    }
  }
  const resultHomes = new Set();
  for (const topic of research)
    for (const path of topic.results ?? []) {
      if (resultHomes.has(path))
        registryErrors.push(`research: multiple homes for ${path}`);
      resultHomes.add(path);
    }
  return {
    config,
    spaces,
    docs,
    layers,
    tree,
    publication,
    assets: publishedAssets,
    methods,
    research,
    maps,
    registryErrors,
    builtAt: Date.now(),
  };
}
