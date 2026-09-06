#!/usr/bin/env node
// Publisher-only command. The seed baseline travels with Use-this-template copies.
import { existsSync, readFileSync } from "node:fs";
import { KB_ROOT } from "./lib/kb-root.mjs";
import {
  readJson,
  validateManifest,
  snapshot,
  digest,
  git,
  same,
  safePath,
  atomicWrite,
  encode,
  SEED_PATH,
} from "./lib/template-state.mjs";

try {
  const write = process.argv.includes("--write");
  if (!write && !process.argv.includes("--check"))
    throw new Error(
      "Use --write to prepare a release baseline or --check to verify it.",
    );
  const manifest = validateManifest(
    readJson(KB_ROOT, ".template-manifest.json"),
  );
  const pkg = readJson(KB_ROOT, "package.json");
  if (pkg.name !== "ai-kb-harness-template")
    throw new Error(
      "Release preparation is for the upstream template; projects use kb:update.",
    );
  if (pkg.version !== manifest.templateVersion)
    throw new Error("package.json version differs from templateVersion");
  const state = snapshot(KB_ROOT, manifest);
  // The ref is part of the distribution; its exact upstream commit is resolved during update.
  // It cannot be embedded in that same Git commit without a self-referential hash.
  state.demoFiles = {};
  state.seedFiles = {};
  const paths = git(
    KB_ROOT,
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  )
    .split("\0")
    .filter(Boolean);
  for (const p of paths)
    if (
      (manifest.demoPaths ?? []).some(
        (d) => p === d || p.startsWith(d + "/"),
      ) &&
      existsSync(safePath(KB_ROOT, p))
    )
      state.demoFiles[p] = digest(readFileSync(safePath(KB_ROOT, p)));
  for (const p of [
    "00_context/spaces.json",
    "index.md",
    ".claude/settings.json",
  ])
    if (existsSync(safePath(KB_ROOT, p)))
      state.seedFiles[p] = digest(readFileSync(safePath(KB_ROOT, p)));
  if (write) {
    atomicWrite(KB_ROOT, SEED_PATH, encode(state));
    console.log(
      `[release] Baseline ${manifest.templateVersion}: ${Object.keys(state.files).length} managed files, ${Object.keys(state.demoFiles).length} demo files.`,
    );
  } else {
    if (
      !existsSync(safePath(KB_ROOT, SEED_PATH)) ||
      !same(readJson(KB_ROOT, SEED_PATH), state)
    )
      throw new Error(
        "Release baseline is stale. Review changes, then run pnpm kb:release:baseline.",
      );
    console.log(
      `[release] Version ${manifest.templateVersion} and distributed file baseline match.`,
    );
  }
} catch (error) {
  console.error(`[release] ${error.message}`);
  process.exitCode = 1;
}
