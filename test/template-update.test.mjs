import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  chmodSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { validateManifest } from "../scripts/lib/template-state.mjs";

const command = resolve("scripts/kb-update.mjs");
const digest = (s) => createHash("sha256").update(s).digest("hex");
function put(root, p, value) {
  mkdirSync(join(root, p, ".."), { recursive: true });
  writeFileSync(join(root, p), value);
}
const json = (root, p, v) => put(root, p, JSON.stringify(v, null, 2) + "\n");
const get = (root, p) => readFileSync(join(root, p), "utf8");
function git(root, ...args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}
function init(root) {
  mkdirSync(root);
  git(root, "init", "-b", "main");
  git(root, "config", "user.email", "test@example.invalid");
  git(root, "config", "user.name", "Template Test");
}
function commit(root, title) {
  git(root, "add", ".");
  git(root, "commit", "-qm", title);
  return git(root, "rev-parse", "HEAD");
}
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "harness-update-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const source = join(dir, "upstream"),
    project = join(dir, "project");
  init(source);
  init(project);
  const manifest = {
    schemaVersion: 2,
    templateVersion: "0.4.0",
    upstream: source,
    templateOwned: ["scripts", ".template-manifest.json"],
    projectOwned: ["scripts/probes.local.mjs", "00_context"],
    managedJson: { "package.json": ["/scripts/kb:test"] },
  };
  json(source, ".template-manifest.json", manifest);
  put(source, "scripts/core.mjs", "old core\n");
  put(source, "scripts/remove.mjs", "old removal\n");
  put(source, "scripts/probes.local.mjs", "upstream probe\n");
  json(source, "package.json", {
    name: "template",
    scripts: { "kb:test": "node old.mjs" },
  });
  const sha = commit(source, "base");
  git(source, "tag", "v0.4.0");
  const files = {};
  for (const p of [
    "scripts/core.mjs",
    "scripts/remove.mjs",
    ".template-manifest.json",
  ])
    files[p] = { sha256: digest(get(source, p)), mode: "100644" };
  const baseline = {
    schemaVersion: 1,
    templateVersion: "0.4.0",
    repository: source,
    sourceRef: "v0.4.0",
    sourceCommit: sha,
    files,
    managedJson: {
      "package.json": { "/scripts/kb:test": { value: "node old.mjs" } },
    },
  };
  for (const p of Object.keys(files)) put(project, p, get(source, p));
  put(project, "scripts/probes.local.mjs", "my private probes\n");
  put(project, "00_context/product.md", "my project context\n");
  json(project, "package.json", {
    name: "my-project",
    version: "9.0.0",
    scripts: { "kb:test": "node old.mjs", custom: "my command" },
  });
  json(project, ".harness/lock.json", {
    ...baseline,
    installedVersion: "0.4.0",
  });
  commit(project, "independent history");
  manifest.templateVersion = "0.4.1";
  json(source, ".template-manifest.json", manifest);
  put(source, "scripts/core.mjs", "new core\n");
  rmSync(join(source, "scripts/remove.mjs"));
  put(source, "scripts/new.mjs", "new file\n");
  put(source, "scripts/probes.local.mjs", "new upstream probes\n");
  json(source, "package.json", {
    name: "template",
    scripts: { "kb:test": "node new.mjs", "new-entry": "yes" },
  });
  commit(source, "next");
  git(source, "tag", "v0.4.1");
  const run = (...args) =>
    spawnSync(
      process.execPath,
      [command, "--source", source, "--ref", "v0.4.1", ...args],
      {
        cwd: project,
        env: { ...process.env, KB_ROOT: project },
        encoding: "utf8",
      },
    );
  return { source, project, dir, run };
}

test("update previews an unrelated template project without changing files, index or Git config", (t) => {
  const f = fixture(t);
  const before = [
    get(f.project, "scripts/core.mjs"),
    get(f.project, ".harness/lock.json"),
    git(f.project, "config", "--local", "--list"),
    git(f.project, "status", "--porcelain"),
  ];
  const r = f.run();
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /scripts\/core.mjs/);
  assert.deepEqual(
    [
      get(f.project, "scripts/core.mjs"),
      get(f.project, ".harness/lock.json"),
      git(f.project, "config", "--local", "--list"),
      git(f.project, "status", "--porcelain"),
    ],
    before,
  );
});
test("update adds, removes and changes only managed files and JSON fields, then becomes a no-op", (t) => {
  const f = fixture(t);
  let r = f.run("--apply");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(get(f.project, "scripts/core.mjs"), "new core\n");
  assert.equal(existsSync(join(f.project, "scripts/remove.mjs")), false);
  assert.equal(get(f.project, "scripts/new.mjs"), "new file\n");
  assert.equal(
    get(f.project, "scripts/probes.local.mjs"),
    "my private probes\n",
  );
  assert.equal(get(f.project, "00_context/product.md"), "my project context\n");
  const pkg = JSON.parse(get(f.project, "package.json"));
  assert.equal(pkg.name, "my-project");
  assert.equal(pkg.version, "9.0.0");
  assert.equal(pkg.scripts.custom, "my command");
  assert.equal(pkg.scripts["kb:test"], "node new.mjs");
  const lock = JSON.parse(get(f.project, ".harness/lock.json"));
  assert.equal(lock.installedVersion, "0.4.1");
  assert.match(lock.sourceCommit, /^[0-9a-f]{40}$/);
  commit(f.project, "apply");
  r = f.run("--apply");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(git(f.project, "status", "--porcelain"), "");
});
test("local committed changes conflict; safe paths advance without claiming the whole release is installed", (t) => {
  const f = fixture(t);
  put(f.project, "scripts/core.mjs", "local customization\n");
  commit(f.project, "customize");
  let r = f.run("--apply");
  assert.equal(r.status, 2, r.stderr + r.stdout);
  assert.equal(get(f.project, "scripts/core.mjs"), "local customization\n");
  assert.equal(get(f.project, "scripts/new.mjs"), "new file\n");
  let lock = JSON.parse(get(f.project, ".harness/lock.json"));
  assert.equal(lock.installedVersion, "0.4.0");
  assert.equal(lock.pending.version, "0.4.1");
  assert.equal(lock.files["scripts/core.mjs"].sha256, digest("old core\n"));
  // Resolve consciously by taking the target content, then retry the same update.
  put(f.project, "scripts/core.mjs", "new core\n");
  commit(f.project, "resolve");
  r = f.run("--apply");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  lock = JSON.parse(get(f.project, ".harness/lock.json"));
  assert.equal(lock.installedVersion, "0.4.1");
  assert.equal(lock.pending, undefined);
});
test("uncommitted work prevents application before any managed content changes", (t) => {
  const f = fixture(t);
  put(f.project, "00_context/product.md", "ongoing edit\n");
  const r = f.run("--apply");
  assert.equal(r.status, 1, r.stderr + r.stdout);
  assert.equal(get(f.project, "scripts/core.mjs"), "old core\n");
});
test("symlink parent cannot redirect an upstream write outside the project", (t) => {
  const f = fixture(t);
  const outside = join(f.dir, "outside");
  mkdirSync(outside);
  put(outside, "core.mjs", "outside protected\n");
  rmSync(join(f.project, "scripts"), { recursive: true });
  symlinkSync(outside, join(f.project, "scripts"));
  commit(f.project, "symlink");
  const r = f.run("--apply");
  assert.notEqual(r.status, 0);
  assert.equal(get(outside, "core.mjs"), "outside protected\n");
});
test("unknown baseline requires explicit adoption; adopting a known old release preserves local differences", (t) => {
  const f = fixture(t);
  rmSync(join(f.project, ".harness/lock.json"));
  put(f.project, "scripts/core.mjs", "my old customization\n");
  commit(f.project, "legacy");
  let r = f.run();
  assert.equal(r.status, 1, r.stderr + r.stdout);
  assert.match(r.stderr + r.stdout, /adopt|baseline|баз/i);
  r = f.run("--adopt", "--from", "v0.4.0", "--apply");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(get(f.project, "scripts/core.mjs"), "my old customization\n");
  const lock = JSON.parse(get(f.project, ".harness/lock.json"));
  assert.equal(lock.files["scripts/core.mjs"].sha256, digest("old core\n"));
});

test("an explicitly reviewed local merge advances its baseline without replacing the merged code", (t) => {
  const f = fixture(t);
  put(f.project, "scripts/core.mjs", "new core plus local extension\n");
  commit(f.project, "reviewed merge");
  const r = f.run("--resolve", "scripts/core.mjs", "--apply");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(
    get(f.project, "scripts/core.mjs"),
    "new core plus local extension\n",
  );
  const lock = JSON.parse(get(f.project, ".harness/lock.json"));
  assert.equal(lock.installedVersion, "0.4.1");
  assert.equal(lock.files["scripts/core.mjs"].sha256, digest("new core\n"));
  assert.equal(lock.pending, undefined);
  commit(f.project, "record reviewed update");
  const again = f.run("--apply");
  assert.equal(again.status, 0, again.stderr + again.stdout);
  assert.equal(git(f.project, "status", "--porcelain"), "");
});

test("relative local source is resolved against the target project, outside the temporary fetch repository", (t) => {
  const f = fixture(t);
  const r = f.run("--source", "../upstream", "--apply");
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(get(f.project, "scripts/core.mjs"), "new core\n");
});

test("ownership validation rejects protected ancestors and equal paths, retaining narrow exceptions", () => {
  const base = {
    schemaVersion: 2,
    templateVersion: "0.4.0",
    templateOwned: ["scripts/core"],
    managedJson: {},
  };
  for (const path of ["scripts", "scripts/core"])
    assert.throws(
      () => validateManifest({ ...base, projectOwned: [path] }),
      /ownership|overlap/i,
    );
  assert.doesNotThrow(() =>
    validateManifest({ ...base, projectOwned: ["scripts/core/local.mjs"] }),
  );
});
