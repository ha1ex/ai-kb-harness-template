#!/usr/bin/env node
// Common deterministic gate; callable directly and independent of any AI client.
// Runs every check and prints a summary; --fail-fast stops at the first failure.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runChecks } from "../lib/check-runner.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { failed } = runChecks(
  [
    ["scripts/check-harness.mjs"],
    ["scripts/check-spaces.mjs"],
    ["scripts/check-portability.mjs"],
    ["scripts/check-readability.mjs"],
    ["scripts/semantic/verify.mjs", "--scan", "--provenance", "--no-semantic"],
    ["scripts/check-invariants.mjs"],
  ],
  { cwd: root, failFast: process.argv.includes("--fail-fast") },
);
process.exit(failed ? 1 : 0);
