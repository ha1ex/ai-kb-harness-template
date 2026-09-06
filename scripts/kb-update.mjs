#!/usr/bin/env node
// Preview by default. All upstream Git operations take place in a temporary repository.
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, isAbsolute } from "node:path";
import { KB_ROOT } from "./lib/kb-root.mjs";
import {
  LOCK_PATH,
  readJson,
  validateManifest,
  validateState,
  snapshot,
  git,
  planUpdate,
  updateWrites,
  applyWrites,
  encode,
  safePath,
} from "./lib/template-state.mjs";

const options = { apply: false, adopt: false, json: false, resolve: [] };
let temp;
try {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (["--apply", "--adopt", "--json"].includes(a))
      options[a.slice(2)] = true;
    else if (a === "--resolve") {
      const value = args[++i];
      if (!value || value.startsWith("-"))
        throw new Error("Missing --resolve path");
      options.resolve.push(value);
    } else if (["--source", "--ref", "--from", "--remote"].includes(a)) {
      const value = args[++i];
      if (!value || value.startsWith("-"))
        throw new Error(`Missing value for ${a}`);
      options[a.slice(2)] = value;
    } else if (a === "--help" || a === "-h") {
      console.log(
        "kb:update [--ref vX.Y.Z] [--source URL|path] [--apply] [--json] [--resolve PATH[#/json/pointer]]\nLegacy project: kb:update --adopt --from <known-tag-or-commit> [--apply]\nExit 0: clean; 1: error; 2: conflicts. Default: preview only.",
      );
      process.exit(0);
    } else throw new Error(`Unknown option: ${a}`);
  }
  const manifest = validateManifest(
    readJson(KB_ROOT, ".template-manifest.json"),
  );
  let source =
    options.source ??
    (options.remote
      ? git(KB_ROOT, "remote", "get-url", options.remote)
      : manifest.upstream);
  if (!source || source.startsWith("-"))
    throw new Error("Missing or invalid upstream source");
  // Git resolves local sources from its own working directory, which will be a temp checkout.
  // Preserve URL/scp transports while anchoring filesystem sources to the target project.
  if (isAbsolute(source) || source.startsWith(".") || !source.includes(":"))
    source = resolve(KB_ROOT, source);
  if (options.apply && git(KB_ROOT, "status", "--porcelain"))
    throw new Error(
      "Рабочая копия не чистая. Сохраните/закоммитьте изменения перед --apply.",
    );
  if (options.adopt && !options.from)
    throw new Error(
      "Adoption requires --from <known-tag-or-commit>; baseline is never guessed.",
    );
  if (options.adopt && existsSync(safePath(KB_ROOT, LOCK_PATH)))
    throw new Error(
      "Installed baseline already exists; adoption never overwrites it.",
    );
  if (!options.adopt && !existsSync(safePath(KB_ROOT, LOCK_PATH)))
    throw new Error(
      "Нет исходной базы (baseline). Выполните kb:init или kb:update --adopt --from <known-version> --apply.",
    );
  let ref = options.adopt ? options.from : options.ref;
  if (!ref) {
    const tags = git(KB_ROOT, "ls-remote", "--tags", "--refs", source)
      .split("\n")
      .map((l) => l.split("\t")[1]?.replace("refs/tags/", ""))
      .filter((s) => /^v\d+\.\d+\.\d+$/.test(s ?? ""));
    tags.sort((a, b) => {
      const x = a.slice(1).split(".").map(Number),
        y = b.slice(1).split(".").map(Number);
      return y[0] - x[0] || y[1] - x[1] || y[2] - x[2];
    });
    ref = tags[0];
    if (!ref)
      throw new Error(
        "No released version tags found. Specify an exact --ref to review an unreleased revision.",
      );
  }
  if (ref.startsWith("-") || /[\s\0]/.test(ref))
    throw new Error("Invalid upstream ref");
  temp = mkdtempSync(join(tmpdir(), "kb-upstream-"));
  git(temp, "init", "-q");
  git(temp, "fetch", "--depth=1", source, ref);
  git(temp, "checkout", "-q", "--detach", "FETCH_HEAD");
  const targetManifest = validateManifest(
    readJson(temp, ".template-manifest.json"),
  );
  const target = snapshot(temp, targetManifest, {
    repository: source,
    sourceRef: ref,
    sourceCommit: git(temp, "rev-parse", "HEAD"),
  });
  if (/^v\d+\.\d+\.\d+$/.test(ref) && ref !== `v${target.templateVersion}`)
    throw new Error(
      "Release tag does not match templateVersion in its manifest.",
    );
  if (options.adopt) {
    const lock = { ...target, installedVersion: target.templateVersion };
    const report = {
      adopt: ref,
      version: target.templateVersion,
      commit: target.sourceCommit,
      files: Object.keys(target.files).length,
      apply: options.apply,
    };
    if (options.apply)
      applyWrites(
        KB_ROOT,
        new Map([[LOCK_PATH, { data: encode(lock), mode: "100644" }]]),
      );
    console.log(
      options.json
        ? encode(report)
        : `[kb-update] ${options.apply ? "Recorded" : "Preview baseline"} ${ref} (${target.sourceCommit.slice(0, 8)}). Project files preserved. Commit .harness/lock.json before updating.`,
    );
  } else {
    const base = validateState(readJson(KB_ROOT, LOCK_PATH));
    const plan = planUpdate(KB_ROOT, manifest, targetManifest, base, target);
    // A local merge is accepted only by an explicit path acknowledgement, never guessed.
    for (const id of options.resolve) {
      const index = plan.conflicts.findIndex(
        (a) => a.path + (a.pointer ? "#" + a.pointer : "") === id,
      );
      if (index < 0)
        throw new Error(`--resolve is not a currently conflicting path: ${id}`);
      const [item] = plan.conflicts.splice(index, 1);
      plan.settled.push({
        ...item,
        resolution: "reviewed local merge; content preserved",
      });
    }
    const report = {
      from: base.installedVersion ?? base.templateVersion,
      to: target.templateVersion,
      commit: target.sourceCommit,
      apply: options.apply,
      ...plan,
    };
    if (options.apply)
      applyWrites(KB_ROOT, updateWrites(KB_ROOT, temp, base, target, plan));
    if (options.json) console.log(encode(report));
    else {
      console.log(
        `[kb-update] ${report.from} → ${report.to} (${target.sourceCommit.slice(0, 8)}) — ${options.apply ? "apply" : "preview"}`,
      );
      for (const a of plan.actions)
        console.log(`  ${a.kind}: ${a.path}${a.pointer ?? ""}`);
      for (const a of plan.conflicts)
        console.log(`  CONFLICT: ${a.path}${a.pointer ?? ""} — ${a.reason}`);
      console.log(
        `  ${plan.actions.length} changes, ${plan.conflicts.length} conflicts, ${plan.settled.length} already resolved.`,
      );
      console.log(
        options.apply
          ? "Review git diff, run setup/checks, then commit."
          : "No project files, index or Git configuration changed. Apply with --apply.",
      );
    }
    if (plan.conflicts.length) process.exitCode = 2;
  }
} catch (error) {
  console.error(`[kb-update] ${error.message}`);
  process.exitCode = 1;
} finally {
  if (temp) rmSync(temp, { recursive: true, force: true });
}
