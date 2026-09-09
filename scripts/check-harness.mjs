#!/usr/bin/env node
// Explicit opt-in setup; read-only validation never guesses the installed client.
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  lstatSync,
  chmodSync,
  unlinkSync,
  rmdirSync,
} from "node:fs";
import { resolve, join, dirname, relative } from "node:path";
import { createHash } from "node:crypto";
import { discoverSkills } from "./lib/skills.mjs";
import { loadWorkSystem } from "./lib/work-system.mjs";
import { spawnSync } from "node:child_process";
const args = process.argv.slice(2);
// URL decoding and KB_ROOT are handled explicitly for paths containing spaces.
import { fileURLToPath } from "node:url";
const base = process.env.KB_ROOT
  ? resolve(process.env.KB_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const setup = args.includes("--setup"),
  errors = [],
  actions = [],
  desired = new Set();
const names = ["codex", "claude", "gemini", "opencode", "mcp"];
const requested = args.flatMap((a, i) =>
  a === "--client" ? [args[i + 1]] : [],
);
for (const c of requested)
  if (!names.includes(c)) errors.push(`Unknown client: ${c}`);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--client") {
    i++;
    continue;
  }
  if (!["--setup", "--json", "--hooks"].includes(args[i]))
    errors.push(`Unknown argument: ${args[i]}`);
}
const statePath = join(base, ".harness/clients.json");
let state = { version: 1, clients: [], files: {} };
try {
  if (existsSync(statePath))
    state = JSON.parse(readFileSync(statePath, "utf8"));
} catch (e) {
  errors.push(`Invalid client state: ${e.message}`);
}
const hash = (s) => createHash("sha256").update(s).digest("hex");
function safe(path) {
  if (
    path.startsWith("/") ||
    path.split("/").some((bit) => bit === ".." || bit === "." || !bit) ||
    path.includes("\\")
  )
    throw new Error(`Unsafe managed path: ${path}`);
  let p = base;
  for (const bit of path.split("/")) {
    p = join(p, bit);
    try {
      if (lstatSync(p).isSymbolicLink())
        throw new Error(`Refusing symlink: ${path}`);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  }
  return p;
}
function manage(path, content) {
  desired.add(path);
  try {
    const dest = safe(path),
      digest = hash(content),
      current = existsSync(dest) ? hash(readFileSync(dest)) : null;
    if (current === digest) {
      if (setup) state.files[path] = digest;
      return;
    }
    if (current && current !== state.files[path]) {
      errors.push(`Preserved modified or foreign file: ${path}`);
      return;
    }
    if (!setup) {
      errors.push(`Missing or outdated managed file: ${path}`);
      return;
    }
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content);
    state.files[path] = digest;
    actions.push(path);
  } catch (e) {
    errors.push(e.message);
  }
}
const clients = [...new Set([...state.clients, ...requested])];
try { loadWorkSystem(base, {checkDraft: true, checkContext: true}); }
catch (error) { errors.push(error.message); }
if (!errors.length) {
  for (const p of [
    "AGENTS.md",
    "harness/rules/evidence.md",
    "harness/rules/workflow.md",
  ])
    if (!existsSync(join(base, p)))
      errors.push(`Missing canonical entry: ${p}`);
  for (const c of clients) {
    if (c === "claude" || c === "gemini")
      manage(
        c === "claude" ? "CLAUDE.md" : "GEMINI.md",
        readFileSync(
          join(
            base,
            "harness/adapters",
            c === "claude" ? "CLAUDE.md" : "GEMINI.md",
          ),
        ),
      );
    if (c === "opencode")
      manage(
        "opencode.json",
        JSON.stringify(
          {
            $schema: "https://opencode.ai/config.json",
            instructions: [
              "AGENTS.md",
              "harness/rules/evidence.md",
              "harness/rules/workflow.md",
            ],
          },
          null,
          2,
        ) + "\n",
      );
    if (c === "mcp")
      manage(
        ".mcp.json",
        readFileSync(join(base, "harness/adapters/mcp.json")),
      );
    const dir = {
      codex: ".agents/skills",
      claude: ".claude/skills",
      gemini: ".gemini/skills",
      opencode: ".opencode/skills",
    }[c];
    if (!dir) continue;
    const discovery = discoverSkills(base);
    errors.push(...discovery.errors);
    for (const skill of discovery.skills) {
      manage(`${dir}/${skill.name}/SKILL.md`, skill.text);
      if (!skill.dir) continue;
      const bundle = join(base, skill.dir);
      function copy(dirpath) {
        for (const item of readdirSync(dirpath, { withFileTypes: true })) {
          const abs = join(dirpath, item.name);
          if (item.isSymbolicLink()) {
            errors.push(`Skill symlink not portable: ${abs}`);
            continue;
          }
          if (item.isDirectory()) copy(abs);
          else if (abs !== join(base, skill.path))
            manage(`${dir}/${skill.name}/${relative(bundle, abs).split("\\").join("/")}`, readFileSync(abs));
        }
      }
      copy(bundle);
    }
  }
  // Retired skill copies are obsolete even when their old digest still matches.
  // Validate all obsolete files before cleanup so an edited bundle remains intact.
  const obsolete = Object.entries(state.files).filter(
    ([p]) =>
      /^\.(agents|claude|gemini|opencode)\/skills\//.test(p) && !desired.has(p),
  );
  const obsoleteFiles = [];
  for (const [p, digest] of obsolete) {
    try {
      const abs = safe(p);
      if (existsSync(abs) && hash(readFileSync(abs)) !== digest)
        errors.push(`Preserved modified retired skill: ${p}`);
      else obsoleteFiles.push([p, abs]);
    } catch (e) {
      errors.push(e.message);
    }
  }
  if (obsoleteFiles.length && !setup)
    errors.push(
      `Obsolete managed skills: ${obsoleteFiles.map(([p]) => p).join(", ")}; run --setup`,
    );
  if (setup && !errors.length)
    for (const [p, abs] of obsoleteFiles) {
      if (existsSync(abs)) unlinkSync(abs);
      delete state.files[p];
      actions.push(`removed ${p}`);
      const stop = join(base, p.split("/").slice(0, 2).join("/"));
      for (let dir = dirname(abs); dir !== stop; dir = dirname(dir)) {
        try {
          rmdirSync(dir);
        } catch (e) {
          if (["ENOTEMPTY", "ENOENT", "EEXIST"].includes(e.code)) break;
          throw e;
        }
      }
    }
  for (const [p, digest] of Object.entries(state.files)) {
    try {
      const abs = safe(p);
      if (!existsSync(abs) || hash(readFileSync(abs)) !== digest)
        errors.push(`Managed copy changed or missing: ${p}`);
    } catch (e) {
      errors.push(e.message);
    }
  }
  if (args.includes("--hooks")) {
    const run = (a) => spawnSync("git", a, { cwd: base, encoding: "utf8" });
    const current = run(["config", "--get", "core.hooksPath"]).stdout.trim();
    const gitDir = run(["rev-parse", "--git-path", "hooks"]);
    if (gitDir.status !== 0) errors.push("Hooks require a Git working copy");
    else {
      const hookDir = resolve(base, gitDir.stdout.trim());
      const foreign = existsSync(hookDir)
        ? readdirSync(hookDir).filter((n) => !n.endsWith(".sample"))
        : [];
      if (current && current !== "scripts/git-hooks")
        errors.push(`Preserved foreign core.hooksPath: ${current}`);
      else if (!current && foreign.length)
        errors.push(`Preserved existing Git hooks: ${foreign.join(", ")}`);
      else if (setup) {
        for (const n of [
          "pre-push",
          "post-checkout",
          "post-merge",
          "post-rewrite",
        ])
          chmodSync(join(base, "scripts/git-hooks", n), 0o755);
        const r = run(["config", "core.hooksPath", "scripts/git-hooks"]);
        if (r.status !== 0) errors.push(r.stderr.trim());
        else actions.push("git core.hooksPath");
      } else if (!current) errors.push("Optional hooks not configured");
    }
  }
  if (setup) {
    state.clients = clients;
    try {
      safe(".harness/clients.json");
      mkdirSync(dirname(statePath), { recursive: true });
      writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
    } catch (e) {
      errors.push(e.message);
    }
  }
}
const report = {
  clients: state.clients,
  setup,
  actions,
  errors: [...new Set(errors)],
  liveClientsVerified: false,
};
console.log(
  args.includes("--json")
    ? JSON.stringify(report, null, 2)
    : [
        ...actions.map((x) => `Updated: ${x}`),
        ...report.errors.map((x) => `ERROR: ${x}`),
        report.errors.length
          ? "Harness check failed."
          : `Harness configuration OK (${state.clients.join(", ") || "no clients selected"}; live sessions not tested).`,
      ].join("\n"),
);
process.exitCode = errors.length ? 1 : 0;
