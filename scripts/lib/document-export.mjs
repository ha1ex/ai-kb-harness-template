import { createHash } from "node:crypto";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
export const TOOL_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const hash = (data) => createHash("sha256").update(data).digest("hex");
export const rendererHash = () =>
  hash(
    [
      "tools/viewer/render-document.tsx",
      "tools/viewer/print.css",
      "tools/viewer/src/v2/components/MarkdownDoc.tsx",
      ...["KbSteps", "KbAccordion", "KbTabs", "KbFileTree", "KbLinkCard"].map(
        (n) => "tools/viewer/src/v2/components/kb/" + n + ".tsx",
      ),
    ]
      .map((path) => readFileSync(join(TOOL_ROOT, path), "utf8"))
      .join("\n"),
  );
export const exportPaths = (path) => ({
  print: path.replace(/\.md$/, "-print.html"),
  pdf: path.replace(/\.md$/, ".pdf"),
  meta: path.replace(/\.md$/, ".export.json"),
});
export function findHeadlessChrome() {
  if (process.env.KB_CHROME) {
    if (!existsSync(process.env.KB_CHROME))
      throw Error("KB_CHROME does not exist");
    return process.env.KB_CHROME;
  }
  const caches = [
    join(homedir(), "Library/Caches/ms-playwright"),
    join(homedir(), ".cache/ms-playwright"),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "ms-playwright"),
  ].filter(Boolean);
  for (const cache of caches) {
    if (!existsSync(cache)) continue;
    for (const name of readdirSync(cache)
      .filter((n) => n.startsWith("chromium_headless_shell-"))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))) {
      for (const binary of [
        "chrome-headless-shell-mac-arm64/chrome-headless-shell",
        "chrome-headless-shell-mac-x64/chrome-headless-shell",
        "chrome-headless-shell-linux64/chrome-headless-shell",
        "chrome-headless-shell-win64/chrome-headless-shell.exe",
      ]) {
        const path = join(cache, name, binary);
        if (existsSync(path)) return path;
      }
    }
  }
  return null;
}
export const escapeHtml = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
