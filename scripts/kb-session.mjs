#!/usr/bin/env node
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  unlinkSync,
  openSync,
  closeSync,
  lstatSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = process.env.KB_ROOT
  ? resolve(process.env.KB_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2),
  arg = (k) => args[args.indexOf(k) + 1];
if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage:
  kb-session.mjs save --task <id> --owner <writer> --file <handoff.json>
  kb-session.mjs transfer --task <id> --owner <current-writer> --to <new-writer>
  kb-session.mjs recover --task <id> --owner <lock-writer>

Task IDs use letters, numbers, underscores and hyphens. Save requires goal,
nextStep, acceptanceCriteria (nonempty array) and decisions (array; may be empty).
Completion also requires a result, resolved questions and passing checks.
Transfer changes an existing task's writer. Recover removes only a lock whose
recorded PID is demonstrably dead; it never changes the saved task state.

Options: --task, --owner, --file (save), --to (transfer), --help / -h.
KB_ROOT selects the project directory; otherwise the script's project is used.`);
  process.exit(0);
}
let lock, fd;
function recoverLock(lock, task, owner) {
  const guard = lock + ".recovery";
  let guardFd;
  try {
    guardFd = openSync(guard, "wx");
    writeFileSync(
      guardFd,
      JSON.stringify({
        pid: process.pid,
        createdAt: new Date().toISOString(),
        task,
        owner,
      }) + "\n",
    );
    const stat = lstatSync(lock);
    if (!stat.isFile() || stat.isSymbolicLink())
      throw Error("Recovery requires a regular lock file");
    let metadata;
    try {
      metadata = JSON.parse(readFileSync(lock, "utf8"));
    } catch {
      throw Error(
        "Lock has no valid writer metadata; inspect it manually, do not guess its owner",
      );
    }
    if (
      metadata.version !== 1 ||
      !Number.isSafeInteger(metadata.pid) ||
      metadata.pid <= 0 ||
      metadata.task !== task ||
      metadata.owner !== owner ||
      !Number.isFinite(Date.parse(metadata.createdAt))
    )
      throw Error("Lock metadata does not identify the requested writer");
    let dead = false;
    try {
      process.kill(metadata.pid, 0);
    } catch (error) {
      if (error.code === "ESRCH") dead = true;
      else throw Error("Cannot establish that the lock writer is dead");
    }
    if (!dead)
      throw Error(
        `Lock writer PID ${metadata.pid} is still live; recovery refused`,
      );
    // Only this recovery can unlink while holding the exclusive recovery guard.
    // A dead writer cannot release its lock and ordinary writers use exclusive create.
    unlinkSync(lock);
    console.log(
      `Recovered stale lock for ${task} (exited PID ${metadata.pid}); task state unchanged`,
    );
  } finally {
    if (guardFd !== undefined) {
      closeSync(guardFd);
      unlinkSync(guard);
    }
  }
}
try {
  const task = args.includes("--task") ? arg("--task") : null,
    owner = args.includes("--owner") ? arg("--owner") : null;
  if (!task || !owner || !/^[-a-zA-Z0-9_]+$/.test(task))
    throw Error(
      "Use save|transfer|recover --task <safe-id> --owner <writer> --file <json> (or --to <new-owner>)",
    );
  const dir = join(root, ".remember/tasks");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${task}.json`);
  lock = path + ".lock";
  if (args[0] === "recover") {
    recoverLock(lock, task, owner);
  } else {
    fd = openSync(lock, "wx");
    writeFileSync(
      fd,
      JSON.stringify({
        version: 1,
        pid: process.pid,
        task,
        owner,
        createdAt: new Date().toISOString(),
      }) + "\n",
    );
    const previous = existsSync(path)
      ? JSON.parse(readFileSync(path, "utf8"))
      : null;
    if (previous && previous.owner !== owner)
      throw Error(
        `Task is owned by ${previous.owner}; transfer ownership explicitly`,
      );
    let next;
    if (args[0] === "transfer") {
      if (!previous || !args.includes("--to") || !arg("--to"))
        throw Error("Transfer requires an existing task and --to <new-owner>");
      next = { ...previous, owner: arg("--to") };
    } else if (args[0] === "save") {
      if (!args.includes("--file"))
        throw Error("save requires --file <handoff.json>");
      const input = JSON.parse(readFileSync(arg("--file"), "utf8"));
      next = {
        constraints: [],
        sources: [],
        changedFiles: [],
        checks: [],
        openQuestions: [],
        status: "active",
        result: "",
        ...previous,
        ...input,
        task,
        owner,
      };
      if (!next.goal?.trim() || !next.nextStep?.trim())
        throw Error("goal and nextStep are required");
      for (const field of [
        "acceptanceCriteria",
        "decisions",
        "constraints",
        "sources",
        "changedFiles",
        "checks",
        "openQuestions",
      ])
        if (!Array.isArray(next[field]))
          throw Error(`${field} must be an array`);
      if (
        !next.acceptanceCriteria.length ||
        next.acceptanceCriteria.some((c) => typeof c !== "string" || !c.trim())
      )
        throw Error(
          "acceptanceCriteria must contain nonempty completion conditions",
        );
      if (next.decisions.some((d) => typeof d !== "string" || !d.trim()))
        throw Error(
          "decisions must contain confirmed decision descriptions (or be empty)",
        );
      for (const check of next.checks)
        if (
          !check.command ||
          !["passed", "failed", "not-run"].includes(check.outcome) ||
          !check.evidence
        )
          throw Error("Each check needs command, outcome and evidence");
      if (!["active", "blocked", "complete"].includes(next.status))
        throw Error("Invalid task status");
      if (
        next.status === "complete" &&
        (!next.result?.trim() ||
          next.openQuestions.length ||
          !next.checks.length ||
          next.checks.some((c) => c.outcome !== "passed"))
      )
        throw Error(
          "Completion requires result, resolved questions and passing checks",
        );
    } else throw Error("Expected save or transfer");
    next.updatedAt = new Date().toISOString();
    const temp = path + `.${process.pid}.tmp`;
    writeFileSync(temp, JSON.stringify(next, null, 2) + "\n");
    renameSync(temp, path);
    console.log(JSON.stringify(next, null, 2));
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  if (fd !== undefined) {
    closeSync(fd);
    unlinkSync(lock);
  }
}
