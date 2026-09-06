#!/usr/bin/env node
// Initialize the target project from its shipped file baseline; never guess a baseline from local edits.
import { existsSync, readFileSync, rmSync, rmdirSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { KB_ROOT } from "./lib/kb-root.mjs";
import {
  validateManifest,
  readJson,
  ensureInitialLock,
  SEED_PATH,
  atomicWrite,
  digest,
  safePath,
  encode,
} from "./lib/template-state.mjs";

try {
  const args = process.argv.slice(2),
    flags = {
      stripDemo: null,
      keepWalkthrough: false,
      level: undefined,
      yes: false,
    };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (["--name", "--purpose", "--level"].includes(a)) {
      const v = args[++i];
      if (v === undefined || v.startsWith("--"))
        throw new Error(`Missing value for ${a}`);
      flags[a.slice(2)] = v;
    } else if (a === "--strip-demo") flags.stripDemo = true;
    else if (a === "--keep-demo") flags.stripDemo = false;
    else if (a === "--keep-walkthrough") flags.keepWalkthrough = true;
    else if (a === "--yes" || a === "-y") flags.yes = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        "kb:init --name NAME --purpose TEXT [--strip-demo|--keep-demo] [--keep-walkthrough] [--level 0..3] [--yes]\nWorks on KB_ROOT or the repository containing this script. Uses the shipped baseline and preserves local changes.",
      );
      process.exit(0);
    } else throw new Error(`Unknown option: ${a}`);
  }
  if (flags.level !== undefined && !/^[0-3]$/.test(flags.level))
    throw new Error("--level must be 0, 1, 2 or 3");
  if (
    process.stdin.isTTY &&
    !flags.yes &&
    (flags.name === undefined || flags.stripDemo === null)
  ) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    if (flags.name === undefined)
      flags.name =
        (await rl.question("Название проекта (пусто — сохранить): ")).trim() ||
        undefined;
    if (flags.purpose === undefined)
      flags.purpose =
        (await rl.question("Цель проекта (пусто — сохранить): ")).trim() ||
        undefined;
    if (flags.stripDemo === null)
      flags.stripDemo = /^(y|yes|да)$/i.test(
        (
          await rl.question(
            "Удалить неизменённые демонстрационные материалы? [y/N]: ",
          )
        ).trim(),
      );
    rl.close();
  }
  const manifest = validateManifest(
    readJson(KB_ROOT, ".template-manifest.json"),
  );
  const projectPath = "00_context/project.json";
  const project = existsSync(safePath(KB_ROOT, projectPath))
    ? readJson(KB_ROOT, projectPath)
    : {};
  const seed = existsSync(safePath(KB_ROOT, SEED_PATH))
    ? readJson(KB_ROOT, SEED_PATH)
    : {};
  const lock = ensureInitialLock(KB_ROOT, manifest);
  const notes = [];
  function read(p) {
    return existsSync(safePath(KB_ROOT, p))
      ? readFileSync(safePath(KB_ROOT, p), "utf8")
      : "";
  }
  function write(p, text) {
    if (read(p) !== text) {
      atomicWrite(KB_ROOT, p, text);
      notes.push(p);
    }
  }
  if (flags.name !== undefined) project.name = flags.name;
  if (flags.purpose !== undefined) project.description = flags.purpose;
  project.level =
    flags.level === undefined ? (project.level ?? 2) : Number(flags.level);
  write(projectPath, encode(project));
  if (flags.name !== undefined || flags.purpose !== undefined) {
    const purpose = [
      project.name ? `**${project.name}.**` : "",
      project.description ?? "",
    ]
      .filter(Boolean)
      .join(" ");
    for (const [file, title] of [
      ["AGENTS.md", "Project purpose"],
      [".remember/core.md", "(?:Purpose|Цель проекта)"],
    ]) {
      const text = read(file);
      if (!text) continue;
      const re = new RegExp(`(## ${title}\\n\\n)[\\s\\S]*?(?=\\n## |$)`);
      if (re.test(text))
        write(
          file,
          text.replace(re, (_all, heading) => heading + purpose + "\n"),
        );
      else
        console.error(
          `[kb-init] ${file}: section «${title}» absent, preserve manual content.`,
        );
    }
  }
  if (flags.stripDemo) {
    let removed = 0,
      retained = 0;
    const emptyCandidates = new Set();
    for (const [p, expected] of Object.entries(seed.demoFiles ?? {})) {
      if (flags.keepWalkthrough && /walkthrough/.test(p)) continue;
      const abs = safePath(KB_ROOT, p);
      if (!existsSync(abs)) continue;
      if (digest(readFileSync(abs)) !== expected) {
        retained++;
        continue;
      }
      rmSync(abs);
      removed++;
      const parts = p.split("/");
      while (parts.length > 2) {
        parts.pop();
        emptyCandidates.add(parts.join("/"));
      }
    }
    // Empty library directories must disappear too: corpus-specific evaluations use
    // directory presence. rmdir preserves every directory with added/edited content.
    for (const p of [...emptyCandidates].sort(
      (a, b) => b.split("/").length - a.split("/").length,
    )) {
      try {
        rmdirSync(safePath(KB_ROOT, p));
      } catch (error) {
        if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes(error.code))
          throw error;
      }
    }
    if (!seed.demoFiles)
      console.error("[kb-init] No shipped demo fingerprints: nothing removed.");
    notes.push(
      `demo: removed ${removed}, locally changed retained ${retained}`,
    );
    if (!flags.keepWalkthrough) {
      const index = read("index.md");
      if (index && digest(index) === seed.seedFiles?.["index.md"])
        write(
          "index.md",
          index.replace(/## Walkthrough-пример[\s\S]*?(?=\n## |$)/, ""),
        );
      else if (index)
        console.error(
          "[kb-init] index.md: preserve local content; remove obsolete demo links manually.",
        );
      const spaces = "00_context/spaces.json",
        text = read(spaces);
      if (text && digest(text) === seed.seedFiles?.[spaces])
        write(spaces, encode({ spaces: [] }));
    }
  }
  if (project.level < 2) {
    // Only remove the template's own unchanged gates. A user's edited workflow is preserved.
    for (const file of [
      ".github/workflows/kb-ci.yml",
      ".github/workflows/ci.yml",
    ]) {
      const text = read(file);
      if (text && digest(text) === lock.files[file]?.sha256) {
        rmSync(safePath(KB_ROOT, file));
        notes.push(`disabled ${file} (L${project.level})`);
      }
    }
    const settingsPath = ".claude/settings.json",
      text = read(settingsPath);
    if (text && digest(text) === seed.seedFiles?.[settingsPath]) {
      const settings = JSON.parse(text),
        groups = settings.hooks?.PreToolUse;
      if (Array.isArray(groups)) {
        settings.hooks.PreToolUse = groups
          .map((g) => ({
            ...g,
            hooks: (g.hooks ?? []).filter(
              (h) =>
                !/scripts\/check-(decisions|md-frontmatter|provenance)\.mjs/.test(
                  h.command ?? "",
                ),
            ),
          }))
          .filter((g) => g.hooks.length);
        write(settingsPath, encode(settings));
      }
    } else if (text)
      console.error(
        "[kb-init] .claude/settings.json: preserve local settings; adjust optional gates manually.",
      );
  }
  if (notes.length && existsSync(safePath(KB_ROOT, "log.md"))) {
    const line = `\n## ${new Date().toISOString().slice(0, 10)}\n\n- kb:init: ${project.name ?? "project"}, level=${project.level}; ${flags.stripDemo ? "unchanged demo files removed" : "content preserved"}.\n`;
    write("log.md", read("log.md").trimEnd() + "\n" + line);
  }
  console.log(
    `[kb-init] Ready. Baseline ${lock.installedVersion ?? lock.templateVersion}; level ${project.level}.`,
  );
  for (const p of notes) console.log(`  ${p}`);
  console.log(
    "Next: pnpm harness:setup --client <codex|claude|opencode|gemini|mcp>; pnpm kb:index; pnpm kb:doctor; pnpm viewer:dev.\nCommit .harness/lock.json with your project. Retrieval baselines change only after reviewing actual evidence, not automatically on init.",
  );
} catch (error) {
  console.error(`[kb-init] ${error.message}`);
  process.exitCode = 1;
}
