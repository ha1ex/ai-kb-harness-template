import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const repo = join(import.meta.dirname, "..");
const run = (root, ...args) =>
  spawnSync(process.execPath, args, {
    cwd: repo,
    env: { ...process.env, KB_ROOT: root },
    encoding: "utf8",
  });
test("document build exports custom layers and detects stale content and missing PDF", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "document-export-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "reports"));
  await writeFile(
    join(root, "kb.config.mjs"),
    "export default {layers:{indexable:['reports']}}",
  );
  await writeFile(
    join(root, "reports/note.md"),
    "---\nartifact: reports/note.md\n---\n# Вывод\n\n## Главное\n\nТекст **с источником**.\n\n|Проверка|Итог|\n|---|---|\n|Одна|Готово|\n",
  );
  const built = run(
    root,
    "scripts/build-document.mjs",
    "reports/note.md",
    "--no-pdf",
  );
  assert.equal(built.status, 0, built.stderr + built.stdout);
  const html = await readFile(join(root, "reports/note-print.html"), "utf8");
  assert.match(html, /<table[ >]/);
  assert.match(html, /<strong[^>]*>с источником/);
  const ready = run(root, "scripts/check-documents.mjs");
  assert.equal(ready.status, 0, ready.stderr + ready.stdout);
  const source = await readFile(join(root, "reports/note.md"), "utf8");
  assert.match(source, /print: reports\/note-print.html/);
  assert.ok(!source.includes("pdf:"));
  await writeFile(join(root, "reports/note.md"), source + "\nДругая редакция.");
  const stale = run(root, "scripts/check-documents.mjs");
  assert.notEqual(stale.status, 0);
  assert.match(stale.stderr + stale.stdout, /stale/i);
});
test("export refuses unpublished, archived and escaped sources", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "document-export-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "01_raw"));
  await writeFile(join(root, "01_raw/private.md"), "# Private");
  assert.notEqual(
    run(root, "scripts/build-document.mjs", "01_raw/private.md", "--no-pdf")
      .status,
    0,
  );
  assert.notEqual(
    run(root, "scripts/build-document.mjs", "../private.md", "--no-pdf").status,
    0,
  );
});
