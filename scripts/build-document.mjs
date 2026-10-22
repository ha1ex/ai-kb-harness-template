#!/usr/bin/env node
// Build explicit print/PDF exports. KB_ROOT may be a different project.
import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
  lstatSync,
} from "node:fs";
import { join, dirname, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { KB_ROOT } from "./lib/kb-root.mjs";
import { parseFrontmatter } from "./lib/frontmatter.mjs";
import {
  TOOL_ROOT,
  hash,
  rendererHash,
  exportPaths,
  findHeadlessChrome,
  escapeHtml,
} from "./lib/document-export.mjs";
import { buildCatalog } from "../tools/viewer/data.mjs";
import { safeProjectFile } from "../tools/viewer/published-files.mjs";
try {
  const args = process.argv.slice(2);
  const noPdf = args.includes("--no-pdf");
  const paths = args.filter((x) => !x.startsWith("--"));
  if (!paths.length || args.some((x) => x.startsWith("--") && x !== "--no-pdf"))
    throw Error("Usage: pnpm kb:document:build <published.md> [--no-pdf]");
  const catalog = await buildCatalog(KB_ROOT);
  for (const path of paths) {
    const doc = catalog.docs.find((d) => d.path === path);
    if (
      !doc ||
      doc.frontmatter.status === "archived" ||
      doc.frontmatter.supersededBy
    )
      throw Error("Source must be a current published Markdown: " + path);
    const abs = await safeProjectFile(KB_ROOT, path);
    if (!abs) throw Error("Unsafe source: " + path);
    const output = exportPaths(path);
    for (const p of Object.values(output)) {
      try {
        if (lstatSync(join(KB_ROOT, p)).isSymbolicLink())
          throw Error("Refusing symbolic output: " + p);
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
    }
    const chrome = noPdf ? null : findHeadlessChrome();
    const parsed = parseFrontmatter(readFileSync(abs, "utf8"));
    const fm = (parsed.raw ?? "")
      .split("\n")
      .filter((line) => !/^(print|pdf):/.test(line) && line.trim())
      .join("\n");
    const raw = `---\n${fm}${fm ? "\n" : ""}print: ${output.print}\n${chrome ? "pdf: " + output.pdf + "\n" : ""}---\n${parsed.body}`;
    const temp = mkdtempSync(join(tmpdir(), "kb-export-"));
    try {
      writeFileSync(
        join(temp, "input.json"),
        JSON.stringify({ path, body: parsed.body }),
      );
      const render = spawnSync(
        process.execPath,
        [
          "--import",
          join(TOOL_ROOT, "tools/viewer/node_modules/tsx/dist/loader.mjs"),
          join(TOOL_ROOT, "tools/viewer/render-document.tsx"),
          join(temp, "input.json"),
        ],
        {
          cwd: join(TOOL_ROOT, "tools/viewer"),
          encoding: "utf8",
          timeout: 60_000,
          maxBuffer: 16 * 1024 * 1024,
        },
      );
      if (render.status !== 0)
        throw Error(render.stderr || "Markdown renderer failed");
      const css = readFileSync(
        join(TOOL_ROOT, "tools/viewer/print.css"),
        "utf8",
      );
      const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(doc.title)}</title><style>${css}</style></head><body><main>${render.stdout}</main></body></html>`;
      writeFileSync(join(KB_ROOT, output.print), html);
      let pdfSha256 = null;
      if (chrome) {
        const rendered = spawnSync(
          chrome,
          [
            "--headless",
            "--disable-gpu",
            "--use-mock-keychain",
            "--password-store=basic",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-extensions",
            "--disable-sync",
            "--disable-background-networking",
            "--no-pdf-header-footer",
            "--user-data-dir=" + join(temp, "profile"),
            "--print-to-pdf=" + join(KB_ROOT, output.pdf),
            pathToFileURL(join(KB_ROOT, output.print)).href,
          ],
          { encoding: "utf8", timeout: 60_000 },
        );
        if (rendered.status !== 0)
          throw Error(rendered.stderr || "PDF printing failed");
        const pdf = readFileSync(join(KB_ROOT, output.pdf));
        if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-")))
          throw Error("Invalid PDF output");
        pdfSha256 = hash(pdf);
      }
      writeFileSync(abs, raw);
      writeFileSync(
        join(KB_ROOT, output.meta),
        JSON.stringify(
          {
            schemaVersion: 1,
            sourcePath: path,
            sourceSha256: hash(raw),
            rendererSha256: rendererHash(),
            printPath: output.print,
            printSha256: hash(html),
            pdfPath: chrome ? output.pdf : null,
            pdfSha256,
            builtAt: new Date().toISOString(),
          },
          null,
          2,
        ) + "\n",
      );
      console.log(`${path}: HTML ready${chrome ? ", PDF ready" : ""}`);
      if (!noPdf && !chrome) {
        console.error(
          "PDF not built: install headless Chromium with pnpm -C tools/viewer exec playwright install chromium --only-shell, or set KB_CHROME. HTML was preserved.",
        );
        process.exitCode = 2;
      }
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  }
} catch (e) {
  console.error("[document-build] " + e.message);
  process.exitCode = 1;
}
