#!/usr/bin/env node
// Universal, read-only session context; safe to call from any client or hook.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { buildWorkContext } from "./lib/work-context.mjs";
import { assertSafePath } from "./lib/skills.mjs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, basename } from "node:path";
const root = process.env.KB_ROOT
  ? resolve(process.env.KB_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2),
  i = args.indexOf("--task"),
  id = i < 0 ? null : args[i + 1];
try {
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: kb:context [--task ID] [--role ID] [--workflow ID] [--max-chars N] [--json]\nRead-only packet; no profile required. Missing required context is reported as work.ready=false.");
    process.exit(0);
  }
  const selectors = {};
  for (let at = 0; at < args.length; at++) {
    const flag=args[at];
    if(flag==="--json") continue;
    if(!["--task","--role","--workflow","--max-chars"].includes(flag)) throw Error(`Unknown argument: ${flag}`);
    const value=args[++at];
    if(!value || value.startsWith("--")) throw Error(`Missing value for ${flag}`);
    selectors[flag.slice(2)]=value;
  }
  if (i >= 0 && (!id || !/^[-a-zA-Z0-9_]+$/.test(id)))
    throw Error("Invalid task ID");
  const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
  const git = (a) => {
    const r = spawnSync("git", a, {
      cwd: root,
      encoding: "utf8",
      timeout: 5000,
    });
    return r.status === 0 ? r.stdout.trim() : null;
  };
  const tasksDir = assertSafePath(root, ".remember/tasks");
  const tasks = existsSync(tasksDir)
    ? readdirSync(tasksDir)
        .filter((x) => x.endsWith(".json"))
        .map((x) => {
          const s = JSON.parse(read(assertSafePath(root, ".remember/tasks/" + x)));
          return {
            task: s.task,
            owner: s.owner,
            status: s.status,
            nextStep: s.nextStep,
          };
        })
    : [];
  const task =
    id && existsSync(join(tasksDir, id + ".json"))
      ? JSON.parse(read(assertSafePath(root, ".remember/tasks/" + id + ".json")))
      : null;
  const context = {
    project: basename(root),
    git: {
      branch: git(["branch", "--show-current"]),
      status: git(["status", "--short"]),
      recentCommits: git(["log", "-5", "--oneline"]),
    },
    task,
    tasks,
    work: buildWorkContext(root, { task, taskId: id, role: selectors.role, workflow: selectors.workflow, maxChars: selectors["max-chars"] === undefined ? 24000 : Number(selectors["max-chars"]) }),
    core: read(join(root, ".remember/core.md")).slice(0, 6000),
    preferences: read(join(root, ".remember/preferences.md")).slice(0, 6000),
    notes: read(join(root, ".remember/now.md")).slice(0, 6000),
    rules: [
      "AGENTS.md",
      "harness/rules/evidence.md",
      "harness/rules/workflow.md",
      "docs/human-interface.md",
    ],
  };
  if (id && !task)
    context.notice = `No saved state for ${id}; create a task handoff before leaving the session.`;
  console.log(
    args.includes("--json")
      ? JSON.stringify(context, null, 2)
      : `# Session context: ${context.project}\n\nRead ${context.rules.join(", ")}.\n\n${JSON.stringify(context, null, 2)}`,
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
