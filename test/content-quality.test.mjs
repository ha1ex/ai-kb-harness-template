import test from "node:test";
import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repo = resolve(import.meta.dirname, "..");

function fixture(config = {}) {
  const root = mkdtempSync(join(tmpdir(), "harness-quality-"));
  writeFileSync(join(root, "package.json"), '{"type":"module"}\n');
  writeFileSync(
    join(root, "kb.config.mjs"),
    `export default ${JSON.stringify(config)};\n`,
  );
  return root;
}

function put(root, rel, text) {
  mkdirSync(resolve(root, rel, ".."), { recursive: true });
  writeFileSync(join(root, rel), text);
}

function run(root, script, args = []) {
  return spawnSync(process.execPath, [join(repo, "scripts", script), ...args], {
    cwd: root,
    env: { ...process.env, KB_ROOT: root },
    encoding: "utf8",
  });
}

test("spaces are optional, but an existing registry validates ids, references, and audiences", () => {
  const root = fixture({
    layers: { indexable: ["knowledge"] },
    spaces: { registry: "nav/spaces.json" },
  });
  put(root, "knowledge/free.md", "# Материал без аудитории\n");
  let result = run(root, "check-spaces.mjs", ["--json"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).registry, null);

  put(
    root,
    "nav/spaces.json",
    JSON.stringify({
      spaces: [
        { id: "team", title: "Команда", start_docs: ["knowledge/missing.md"] },
      ],
    }),
  );
  put(root, "knowledge/tagged.md", "---\naudience: [unknown]\n---\n# Tagged\n");
  result = run(root, "check-spaces.mjs", ["--json"]);
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.ok(report.errors.some((p) => p.code === "broken-doc-ref"));
  assert.ok(report.errors.some((p) => p.code === "unknown-audience"));
  assert.ok(report.errors.some((p) => p.code === "missing-description"));
});

test("portability follows configured layers and ignores examples inside code", () => {
  const root = fixture({
    layers: { indexable: ["knowledge"], rootFiles: ["guide.md"] },
  });
  put(
    root,
    "knowledge/portable.md",
    "# Good\n\n```text\n/Users/example/demo\n```\n",
  );
  put(root, "guide.md", "Use `/home/example/demo` only as a placeholder.\n");
  let result = run(root, "check-portability.mjs", ["--json"]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  put(
    root,
    "knowledge/leak.md",
    "Откройте [файл](file:///Users/alice/private.md).\n",
  );
  result = run(root, "check-portability.mjs", ["--json"]);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).errors[0].code, "machine-path");
});

test("readability is advisory by default, strict on request, and preserves quoted source text", () => {
  const root = fixture({ layers: { indexable: ["knowledge", "01_raw"] } });
  const long = `${"Это предложение намеренно перегружено словами и уточнениями, ".repeat(7)}чтобы проверка дала полезную подсказку.`;
  put(root, "knowledge/brief.md", `# Вывод\n\n${long}\n`);
  put(root, "knowledge/quotes.md", `# Источник\n\n## Дословно\n\n> ${long}\n`);
  put(root, "01_raw/transcript.md", `# Запись\n\n${long}\n`);

  let result = run(root, "check-readability.mjs", ["--json"]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.ok(report.findings.some((p) => p.file === "knowledge/brief.md"));
  assert.ok(!report.findings.some((p) => p.file === "knowledge/quotes.md"));
  assert.ok(!report.findings.some((p) => p.file === "01_raw/transcript.md"));

  result = run(root, "check-readability.mjs", [
    "--strict",
    "knowledge/brief.md",
  ]);
  assert.equal(result.status, 1);
});

test("readability skips configured external mirrors and navigation files but checks owned prose", () => {
  const root = fixture({
    layers: { indexable: ["knowledge", "outputs"] },
    provenance: { externalCorpusDirs: ["vendor-mirror"] },
  });
  const long = `${"Длинная редакторская фраза с повторяющимися уточнениями и деталями, ".repeat(7)}которую должен заметить линтер.`;
  put(root, "knowledge/owned.md", `# Собственный текст\n\n${long}\n`);
  put(root, "knowledge/README.md", `# Навигация\n\n${long}\n`);
  put(root, "knowledge/_index.md", `# Индекс\n\n${long}\n`);
  put(
    root,
    "outputs/vendor-mirror/imported.md",
    `# Внешний корпус\n\n${long}\n`,
  );

  const result = run(root, "check-readability.mjs", ["--json"]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(
    report.findings.map((item) => item.file),
    ["knowledge/owned.md"],
  );
  assert.equal(report.checkedFiles, 1);
});

test("human KB samples remain valid after copying their layers into a real KB root", () => {
  const root = fixture({
    layers: {
      indexable: ["02_sources", "04_synthesis"],
      rank: { "02_sources": 2, "04_synthesis": 4 },
    },
    provenance: { enforced: ["04_synthesis"] },
  });
  for (const layer of ["02_sources", "04_synthesis"]) {
    cpSync(join(repo, "examples/human-kb", layer), join(root, layer), {
      recursive: true,
    });
  }

  const docs = [
    "02_sources/research-notes.md",
    "02_sources/research-summary.md",
    "04_synthesis/pilot-recommendation.md",
  ];
  const citations = [];
  for (const rel of docs) {
    const file = join(root, rel);
    const content = readFileSync(file, "utf8");
    const result = spawnSync(
      process.execPath,
      [join(repo, "scripts/check-provenance.mjs")],
      {
        cwd: root,
        env: { ...process.env, KB_ROOT: root },
        input: JSON.stringify({
          tool_name: "Write",
          tool_input: { file_path: file, content },
        }),
        encoding: "utf8",
      },
    );
    assert.equal(result.status, 0, result.stderr + result.stdout);
    citations.push(
      ...[...content.matchAll(/\[source:\s*(\/[^\]]+\.md)\]/g)].map(
        (match) => match[1],
      ),
    );
  }
  assert.ok(
    citations.length > 0,
    "sample synthesis must demonstrate a canonical source citation",
  );
  for (const citation of citations)
    assert.ok(existsSync(join(root, citation)), `missing ${citation}`);
});
