import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const cmd = resolve("scripts/kb-init.mjs");
const hash = (x) => createHash("sha256").update(x).digest("hex");
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "harness-init-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const put = (p, v) => {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), v);
  };
  put(
    "AGENTS.md",
    "# AGENTS\n\n## Project purpose\n\nOld project\n\n## Reading\n\nRead rules.\n",
  );
  put(
    ".remember/core.md",
    "# Core\n\n## Цель проекта\n\nOld\n\n## Контекст\n\nOther\n",
  );
  put(
    "index.md",
    "# Index\n\n## Walkthrough-пример\n\nOld links\n\n## Other\n\nKeep\n",
  );
  put("log.md", "# Log\n");
  const manifest = {
    schemaVersion: 2,
    templateVersion: "0.4.0",
    upstream: "https://example.invalid/template.git",
    templateOwned: ["scripts"],
    projectOwned: ["00_context"],
    managedJson: {},
  };
  put(".template-manifest.json", JSON.stringify(manifest));
  put("scripts/core.mjs", "original template");
  put("01_raw/walkthrough/demo.md", "demo raw");
  put("01_raw/walkthrough/my-notes.md", "my notes");
  put(
    "00_context/spaces.json",
    JSON.stringify({
      spaces: [
        {
          id: "demo",
          title: "Demo",
          start_docs: ["01_raw/walkthrough/demo.md"],
        },
      ],
    }),
  );
  const baseline = {
    schemaVersion: 1,
    templateVersion: "0.4.0",
    sourceRef: "v0.4.0",
    sourceCommit: null,
    files: {
      "scripts/core.mjs": { sha256: hash("original template"), mode: "100644" },
    },
    managedJson: {},
    demoFiles: { "01_raw/walkthrough/demo.md": hash("demo raw") },
    seedFiles: {
      "00_context/spaces.json": hash(
        readFileSync(join(dir, "00_context/spaces.json")),
      ),
    },
  };
  put(".template-baseline.json", JSON.stringify(baseline));
  put("scripts/kb-init.mjs", readFileSync(cmd, "utf8"));
  for (const f of ["kb-root.mjs", "template-state.mjs"])
    put("scripts/lib/" + f, readFileSync(resolve("scripts/lib/" + f), "utf8"));
  const run = (...args) =>
    spawnSync(process.execPath, [join(dir, "scripts/kb-init.mjs"), ...args], {
      cwd: dir,
      env: { ...process.env, KB_ROOT: dir },
      encoding: "utf8",
    });
  return { dir, put, run, read: (p) => readFileSync(join(dir, p), "utf8") };
}
test("init uses target KB_ROOT, records shipped baseline and accepts literal project text and level zero", (t) => {
  const f = fixture(t);
  f.put("scripts/core.mjs", "local customization");
  const r = f.run(
    "--name",
    "Project $1",
    "--purpose",
    "Cost $& and context",
    "--keep-demo",
    "--level",
    "0",
    "--yes",
  );
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(f.read("AGENTS.md"), /Project \$1/);
  assert.match(f.read("AGENTS.md"), /Cost \$& and context/);
  const project = JSON.parse(f.read("00_context/project.json"));
  assert.equal(project.name, "Project $1");
  assert.equal(project.level, 0);
  const lock = JSON.parse(f.read(".harness/lock.json"));
  assert.equal(
    lock.files["scripts/core.mjs"].sha256,
    hash("original template"),
  );
  assert.equal(f.read("scripts/core.mjs"), "local customization");
});
test("strip-demo only removes known unchanged demo files and leaves new raw evidence intact", (t) => {
  const f = fixture(t);
  const r = f.run("--name", "New project", "--strip-demo", "--yes");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(existsSync(join(f.dir, "01_raw/walkthrough/demo.md")), false);
  assert.equal(f.read("01_raw/walkthrough/my-notes.md"), "my notes");
  assert.deepEqual(JSON.parse(f.read("00_context/spaces.json")).spaces, []);
});
test("repeat init preserves project purpose and installed baseline when not supplied", (t) => {
  const f = fixture(t);
  let r = f.run(
    "--name",
    "Mine",
    "--purpose",
    "My actual purpose",
    "--keep-demo",
    "--yes",
  );
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const before = f.read(".harness/lock.json");
  r = f.run("--yes");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(f.read("AGENTS.md"), /My actual purpose/);
  assert.equal(f.read(".harness/lock.json"), before);
});
test("invalid level is rejected before any files change", (t) => {
  const f = fixture(t);
  const before = f.read("AGENTS.md");
  const r = f.run("--name", "Wrong", "--level", "9", "--yes");
  assert.equal(r.status, 1);
  assert.equal(f.read("AGENTS.md"), before);
  assert.equal(existsSync(join(f.dir, ".harness/lock.json")), false);
});

test("strip-demo preserves edited index sections and only rewrites a fingerprinted seed index", (t) => {
  const f = fixture(t),
    original = f.read("index.md");
  const seed = JSON.parse(f.read(".template-baseline.json"));
  seed.seedFiles["index.md"] = hash(original);
  f.put(".template-baseline.json", JSON.stringify(seed));
  f.put("index.md", original.replace("Old links", "USER NOTES INSIDE SECTION"));
  let r = f.run("--strip-demo", "--yes");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(f.read("index.md"), /USER NOTES INSIDE SECTION/);
  f.put("index.md", original);
  r = f.run("--strip-demo", "--yes");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.doesNotMatch(f.read("index.md"), /Walkthrough-пример/);
  assert.match(f.read("index.md"), /Keep/);
});

test("level downgrade preserves client hooks unless the entire settings file matches the shipped seed", (t) => {
  const f = fixture(t),
    path = ".claude/settings.json";
  const original = JSON.stringify({
    hooks: {
      PreToolUse: [
        {
          hooks: [
            { type: "command", command: "node scripts/check-provenance.mjs" },
          ],
        },
      ],
    },
  });
  const edited = JSON.stringify({
    hooks: {
      PreToolUse: [
        {
          hooks: [
            {
              type: "command",
              command: "node scripts/check-provenance.mjs",
              marker: "USER HOOK",
            },
          ],
        },
      ],
    },
  });
  const seed = JSON.parse(f.read(".template-baseline.json"));
  seed.seedFiles[path] = hash(original);
  f.put(".template-baseline.json", JSON.stringify(seed));
  f.put(path, edited);
  let r = f.run("--level", "1", "--yes");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(f.read(path), edited);
  f.put(path, original);
  r = f.run("--level", "1", "--yes");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.deepEqual(JSON.parse(f.read(path)).hooks.PreToolUse, []);
});

test("init personalizes the shipped durable context and prunes only empty demo directories", (t) => {
  const f = fixture(t);
  f.put(
    ".remember/core.md",
    readFileSync(resolve(".remember/core.md"), "utf8"),
  );
  const seed = JSON.parse(f.read(".template-baseline.json"));
  f.put("06_outputs/demo-library/card.md", "demo");
  seed.demoFiles["06_outputs/demo-library/card.md"] = hash("demo");
  f.put(".template-baseline.json", JSON.stringify(seed));
  const r = f.run("--purpose", "A NEW PURPOSE", "--strip-demo", "--yes");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(f.read(".remember/core.md"), /A NEW PURPOSE/);
  assert.equal(existsSync(join(f.dir, "06_outputs/demo-library")), false);
  assert.equal(f.read("01_raw/walkthrough/my-notes.md"), "my notes");
});

test("strip-demo preserves a connected publication group when one example was edited", (t) => {
  const f = fixture(t);
  const paths = [
    "06_outputs/documents/demo.md",
    "06_outputs/documents/demo.pdf",
    "06_outputs/methods/_registry.json",
  ];
  const manifest = JSON.parse(f.read(".template-manifest.json"));
  manifest.demoGroups = [paths];
  f.put(".template-manifest.json", JSON.stringify(manifest));
  const seed = JSON.parse(f.read(".template-baseline.json"));
  for (const path of paths) {
    f.put(path, "original " + path);
    seed.demoFiles[path] = hash("original " + path);
  }
  f.put(".template-baseline.json", JSON.stringify(seed));
  f.put(paths[0], "edited document");
  const result = f.run("--strip-demo", "--yes");
  assert.equal(result.status, 0, result.stderr + result.stdout);
  for (const path of paths) assert.ok(existsSync(join(f.dir, path)), path);
});
