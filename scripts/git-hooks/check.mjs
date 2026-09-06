#!/usr/bin/env node
// Common deterministic gate; callable directly and independent of any AI client.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
for (const args of [
  ["scripts/check-harness.mjs"],
  ["scripts/check-spaces.mjs"],
  ["scripts/check-portability.mjs"],
  ["scripts/check-readability.mjs"],
  ["scripts/semantic/verify.mjs", "--scan", "--provenance", "--no-semantic"],
]) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    timeout: 120000,
  });
  if (result.status !== 0) {
    console.error(
      `Check failed: node ${args.join(" ")}${result.error ? ": " + result.error.message : ""}`,
    );
    process.exit(1);
  }
}
