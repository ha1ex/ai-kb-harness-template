#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { KB_ROOT } from "./lib/kb-root.mjs";
import { hash, rendererHash, exportPaths } from "./lib/document-export.mjs";
import { buildCatalog } from "../tools/viewer/data.mjs";
import { safeProjectFile } from "../tools/viewer/published-files.mjs";
try {
  const catalog = await buildCatalog(KB_ROOT);
  const errors = [...catalog.publication.errors, ...catalog.registryErrors];
  for (const doc of catalog.docs) {
    const fm = doc.frontmatter;
    if (fm.status === "archived" || fm.supersededBy || (!fm.print && !fm.pdf))
      continue;
    try {
      const metaPath = await safeProjectFile(
        KB_ROOT,
        exportPaths(doc.path).meta,
      );
      if (!metaPath) throw Error("export passport missing");
      const meta = JSON.parse(await readFile(metaPath, "utf8"));
      if (
        meta.sourcePath !== doc.path ||
        meta.sourceSha256 !== hash(doc.raw) ||
        meta.rendererSha256 !== rendererHash()
      )
        throw Error("stale export; rebuild document");
      for (const [key, path, expected] of [
        ["print", meta.printPath, meta.printSha256],
        ["pdf", meta.pdfPath, meta.pdfSha256],
      ]) {
        if ((fm[key] ?? null) !== path)
          throw Error("stale " + key + " reference");
        if (!path) continue;
        if (!catalog.assets.includes(path))
          throw Error("unpublished " + key + " export");
        const abs = await safeProjectFile(KB_ROOT, path);
        if (!abs || hash(await readFile(abs)) !== expected)
          throw Error("stale or missing " + key + " export");
      }
    } catch (e) {
      errors.push(`${doc.path}: ${e.message}`);
    }
  }
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    `[documents] ${catalog.publication.items.length} current documents, ${catalog.methods.length} methods, ${catalog.research.length} research topics, ${catalog.maps.length} maps; exports current.`,
  );
} catch (e) {
  console.error("[documents] " + e.message);
  process.exitCode = 1;
}
