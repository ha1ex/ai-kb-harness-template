import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  cpSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const repo = resolve(import.meta.dirname, "..");
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "harness-agents-"));
  for (const path of ["scripts", "harness", "AGENTS.md"])
    if (existsSync(join(repo, path)))
      cpSync(join(repo, path), join(root, path), {
        recursive: true,
        filter: (p) => !p.includes("node_modules"),
      });
  return root;
}
function cli(root, script, args = []) {
  return spawnSync(process.execPath, [join(root, "scripts", script), ...args], {
    cwd: root,
    encoding: "utf8",
  });
}
test("explicit setup copies skills, is repeatable, and protects edited files", () => {
  const root = fixture();
  let r = cli(root, "check-harness.mjs", ["--setup", "--client", "codex"]);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const skill = join(root, ".agents/skills/harness-evidence/SKILL.md");
  assert.ok(existsSync(skill));
  assert.equal(cli(root, "check-harness.mjs").status, 0);
  writeFileSync(skill, "User edit");
  r = cli(root, "check-harness.mjs", ["--setup", "--client", "codex"]);
  assert.equal(r.status, 1);
  assert.equal(readFileSync(skill, "utf8"), "User edit");
  assert.equal(cli(root, "check-harness.mjs").status, 1);
});
test("no clients inferred from a shared skills folder; foreign configuration preserved", () => {
  const root = fixture();
  mkdirSync(join(root, ".agents/skills"), { recursive: true });
  const r = cli(root, "check-harness.mjs", ["--json"]);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).clients, []);
  writeFileSync(join(root, "GEMINI.md"), "My own instructions");
  assert.equal(
    cli(root, "check-harness.mjs", ["--setup", "--client", "gemini"]).status,
    1,
  );
  assert.equal(
    readFileSync(join(root, "GEMINI.md"), "utf8"),
    "My own instructions",
  );
});
test("sessions preserve independent task state and reject another writer or unsupported completion", () => {
  const root = fixture();
  const save = (task, owner, data) => {
    const p = join(root, `${task}-input.json`);
    writeFileSync(
      p,
      JSON.stringify({
        acceptanceCriteria: ["Work reviewed"],
        decisions: [],
        ...data,
      }),
    );
    return cli(root, "kb-session.mjs", [
      "save",
      "--task",
      task,
      "--owner",
      owner,
      "--file",
      p,
    ]);
  };
  assert.equal(
    save("a", "one", { goal: "Explore", nextStep: "Read source", checks: [] })
      .status,
    0,
  );
  assert.equal(
    save("b", "two", {
      goal: "Review",
      nextStep: "Check citations",
      checks: [],
    }).status,
    0,
  );
  assert.equal(save("a", "two", { goal: "Overwrite" }).status, 1);
  assert.equal(save("a", "one", { status: "complete" }).status, 1);
  const r = cli(root, "session-start-context.mjs", ["--task", "a", "--json"]);
  assert.equal(r.status, 0, r.stderr);
  const context = JSON.parse(r.stdout);
  assert.equal(context.task.owner, "one");
  assert.equal(context.task.goal, "Explore");
  assert.equal(
    cli(root, "session-start-context.mjs", ["--task", "b", "--json"]).status,
    0,
  );
});
test("all client stubs load the same rules and optional setup preserves foreign hooks", () => {
  const root = fixture();
  const r = cli(root, "check-harness.mjs", [
    "--setup",
    ...["codex", "claude", "gemini", "opencode", "mcp"].flatMap((c) => [
      "--client",
      c,
    ]),
  ]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  for (const file of ["CLAUDE.md", "GEMINI.md", "opencode.json"])
    assert.match(
      readFileSync(join(root, file), "utf8"),
      /harness\/rules\/evidence/,
    );
  assert.equal(cli(root, "check-harness.mjs").status, 0);
  spawnSync("git", ["init"], { cwd: root });
  spawnSync("git", ["config", "core.hooksPath", "custom-hooks"], { cwd: root });
  assert.equal(
    cli(root, "check-harness.mjs", ["--setup", "--hooks"]).status,
    1,
  );
  assert.equal(
    spawnSync("git", ["config", "--get", "core.hooksPath"], {
      cwd: root,
      encoding: "utf8",
    }).stdout.trim(),
    "custom-hooks",
  );
});
test("project skill bundles copy assets; invalid frontmatter fails", () => {
  const root = fixture();
  mkdirSync(join(root, "skills/custom/assets"), { recursive: true });
  writeFileSync(
    join(root, "skills/custom/SKILL.md"),
    "---\nname: custom\ndescription: A local skill\n---\nInstructions",
  );
  writeFileSync(join(root, "skills/custom/assets/note.txt"), "asset");
  assert.equal(
    cli(root, "check-harness.mjs", ["--setup", "--client", "codex"]).status,
    0,
  );
  assert.equal(
    readFileSync(join(root, ".agents/skills/custom/assets/note.txt"), "utf8"),
    "asset",
  );
  writeFileSync(join(root, "skills/custom/SKILL.md"), "broken");
  assert.equal(cli(root, "check-harness.mjs").status, 1);
});
test("standard skill frontmatter accepts description before name", () => {
  const root = fixture();
  mkdirSync(join(root, "skills/custom"), { recursive: true });
  writeFileSync(
    join(root, "skills/custom/SKILL.md"),
    "---\ndescription: A local skill\nname: custom\n---\nInstructions",
  );
  const r = cli(root, "check-harness.mjs", ["--setup", "--client", "codex"]);
  assert.equal(r.status, 0, r.stdout);
});
test("context loader includes canonical rule text beyond the short entry point", async () => {
  const { loadAgentContext } = await import("../scripts/lib/agent-context.mjs");
  const root = fixture();
  writeFileSync(join(root, "AGENTS.md"), "Short entry");
  writeFileSync(join(root, "harness/rules/evidence.md"), "Evidence marker");
  writeFileSync(join(root, "harness/rules/workflow.md"), "Workflow marker");
  const prompt = loadAgentContext(root);
  assert.match(prompt, /Short entry/);
  assert.match(prompt, /Evidence marker/);
  assert.match(prompt, /Workflow marker/);
});
test("task completion and explicit writer transfer remain recoverable", () => {
  const root = fixture();
  const file = join(root, "handoff.json");
  writeFileSync(
    file,
    JSON.stringify({
      goal: "Check source",
      acceptanceCriteria: ["Source checked"],
      decisions: [],
      nextStep: "Review result",
      result: "Source checked",
      status: "complete",
      checks: [
        {
          command: "citation check",
          outcome: "passed",
          evidence: "No missing citation targets",
        },
      ],
    }),
  );
  assert.equal(
    cli(root, "kb-session.mjs", [
      "save",
      "--task",
      "done",
      "--owner",
      "one",
      "--file",
      file,
    ]).status,
    0,
  );
  assert.equal(
    cli(root, "kb-session.mjs", [
      "transfer",
      "--task",
      "done",
      "--owner",
      "one",
      "--to",
      "two",
    ]).status,
    0,
  );
  const r = cli(root, "session-start-context.mjs", [
    "--task",
    "done",
    "--json",
  ]);
  assert.equal(JSON.parse(r.stdout).task.owner, "two");
  assert.equal(JSON.parse(r.stdout).task.status, "complete");
});

test("removed managed bundles are cleaned only when unchanged", () => {
  const root = fixture();
  assert.equal(
    cli(root, "check-harness.mjs", ["--setup", "--client", "codex"]).status,
    0,
  );
  const source = join(root, "harness/skills/harness-evidence"),
    dest = join(root, ".agents/skills/harness-evidence/SKILL.md");
  rmSync(source, { recursive: true });
  assert.equal(cli(root, "check-harness.mjs").status, 1);
  assert.equal(cli(root, "check-harness.mjs", ["--setup"]).status, 0);
  assert.equal(existsSync(dest), false);
  const edited = join(root, ".agents/skills/harness-handoff/SKILL.md");
  writeFileSync(edited, "Local edit");
  rmSync(join(root, "harness/skills/harness-handoff"), { recursive: true });
  assert.equal(cli(root, "check-harness.mjs", ["--setup"]).status, 1);
  assert.equal(readFileSync(edited, "utf8"), "Local edit");
});
test("handoff requires explicit criteria and decisions and restores bounded durable memory", () => {
  const root = fixture(),
    file = join(root, "input.json");
  const save = (data) => {
    writeFileSync(file, JSON.stringify(data));
    return cli(root, "kb-session.mjs", [
      "save",
      "--task",
      "criteria",
      "--owner",
      "writer",
      "--file",
      file,
    ]);
  };
  const base = { goal: "Read", nextStep: "Review" };
  assert.equal(save(base).status, 1);
  assert.equal(
    save({ ...base, acceptanceCriteria: ["Source checked"], decisions: [] })
      .status,
    0,
  );
  assert.equal(save({ acceptanceCriteria: [] }).status, 1);
  assert.equal(save({ decisions: "not an array" }).status, 1);
  mkdirSync(join(root, ".remember"), { recursive: true });
  writeFileSync(
    join(root, ".remember/core.md"),
    "Durable marker" + "x".repeat(10000),
  );
  writeFileSync(join(root, ".remember/preferences.md"), "Preference marker");
  const context = JSON.parse(
    cli(root, "session-start-context.mjs", ["--task", "criteria", "--json"])
      .stdout,
  );
  assert.deepEqual(context.task.acceptanceCriteria, ["Source checked"]);
  assert.deepEqual(context.task.decisions, []);
  assert.match(context.core, /Durable marker/);
  assert.ok(context.core.length <= 6000);
  assert.match(context.preferences, /Preference marker/);
});
test("stale session locks recover explicitly; active and unknown writers stay protected", () => {
  const root = fixture(),
    dir = join(root, ".remember/tasks");
  mkdirSync(dir, { recursive: true });
  // A process that has actually exited is evidence of a dead PID.
  const dead = spawnSync(
    process.execPath,
    ["-e", "process.stdout.write(String(process.pid))"],
    { encoding: "utf8" },
  );
  const pid = Number(dead.stdout);
  const lock = join(dir, "locked.json.lock");
  const metadata = {
    version: 1,
    pid,
    task: "locked",
    owner: "writer",
    createdAt: new Date().toISOString(),
  };
  writeFileSync(lock, JSON.stringify(metadata));
  const recover = () =>
    cli(root, "kb-session.mjs", [
      "recover",
      "--task",
      "locked",
      "--owner",
      "writer",
    ]);
  assert.equal(recover().status, 0);
  assert.equal(existsSync(lock), false);
  const input = join(root, "input.json");
  writeFileSync(
    input,
    JSON.stringify({
      goal: "Read",
      nextStep: "Review",
      acceptanceCriteria: ["Reviewed"],
      decisions: [],
    }),
  );
  assert.equal(
    cli(root, "kb-session.mjs", [
      "save",
      "--task",
      "locked",
      "--owner",
      "writer",
      "--file",
      input,
    ]).status,
    0,
  );
  writeFileSync(lock, JSON.stringify({ ...metadata, pid: process.pid }));
  assert.equal(recover().status, 1);
  assert.equal(existsSync(lock), true);
  assert.equal(
    cli(root, "kb-session.mjs", [
      "transfer",
      "--task",
      "locked",
      "--owner",
      "writer",
      "--to",
      "other",
    ]).status,
    1,
  );
  writeFileSync(lock, "");
  assert.equal(recover().status, 1);
  assert.equal(readFileSync(lock, "utf8"), "");
  writeFileSync(lock, JSON.stringify(metadata));
  writeFileSync(lock + ".recovery", "another recovery");
  assert.equal(recover().status, 1);
  assert.equal(existsSync(lock), true);
});

test("session help succeeds without a task and does not create state", () => {
  const root = fixture();
  for (const flag of ["--help", "-h"]) {
    const result = cli(root, "kb-session.mjs", [flag]);
    assert.equal(result.status, 0, result.stderr);
    for (const command of ["save --task", "transfer --task", "recover --task"])
      assert.ok(result.stdout.includes(command));
  }
  assert.equal(existsSync(join(root, ".remember/tasks")), false);
});
test("fresh shipped client entries support all clients and preserve both MCP servers", () => {
  const root = fixture();
  for (const path of ["CLAUDE.md", "GEMINI.md", ".mcp.json", "skills"])
    cpSync(join(repo, path), join(root, path), { recursive: true });
  const setup = () =>
    cli(root, "check-harness.mjs", [
      "--setup",
      ...["codex", "claude", "gemini", "opencode", "mcp"].flatMap((c) => [
        "--client",
        c,
      ]),
    ]);
  const result = setup();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(
    readFileSync(join(root, ".agents/skills/skill-ingest/SKILL.md"), "utf8"),
    readFileSync(join(repo, "skills/skill-ingest.md"), "utf8"),
  );
  assert.ok(existsSync(join(root, ".agents/skills/skill-ingest/evals")));
  const file = join(root, ".mcp.json"),
    config = JSON.parse(readFileSync(file, "utf8"));
  assert.deepEqual(Object.keys(config.mcpServers).sort(), [
    "kb-local",
    "skillopt-local",
  ]);
  const changed = JSON.stringify({ ...config, userSetting: "preserve" });
  writeFileSync(file, changed);
  assert.equal(setup().status, 1);
  assert.equal(readFileSync(file, "utf8"), changed);
});

test("legacy flat skills synthesize missing discovery fields without editing sources", () => {
  const root = fixture();
  mkdirSync(join(root, "skills"), { recursive: true });
  const file = join(root, "skills/local-review.md"),
    original = "# Local review\n\nCheck the proposed result.";
  writeFileSync(file, original);
  const result = cli(root, "check-harness.mjs", [
    "--setup",
    "--client",
    "codex",
  ]);
  assert.equal(result.status, 0, result.stdout);
  const copy = readFileSync(
    join(root, ".agents/skills/local-review/SKILL.md"),
    "utf8",
  );
  assert.match(copy, /name: "local-review"/);
  assert.match(copy, /description:/);
  assert.ok(copy.endsWith(original));
  assert.equal(readFileSync(file, "utf8"), original);
});
