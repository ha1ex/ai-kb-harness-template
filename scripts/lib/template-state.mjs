// Versioned file baselines. No shared Git ancestry and no third-party runtime required.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  rmSync,
  chmodSync,
} from "node:fs";
import { join, dirname, resolve } from "node:path";

export const LOCK_PATH = ".harness/lock.json";
export const SEED_PATH = ".template-baseline.json";
export const digest = (data) => createHash("sha256").update(data).digest("hex");
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const stable = (v) =>
  v && typeof v === "object" && !Array.isArray(v)
    ? Object.fromEntries(
        Object.keys(v)
          .sort()
          .map((k) => [k, stable(v[k])]),
      )
    : Array.isArray(v)
      ? v.map(stable)
      : v;
export const same = (a, b) =>
  JSON.stringify(stable(a)) === JSON.stringify(stable(b));
export const encode = (obj) => JSON.stringify(obj, null, 2) + "\n";
export const readJson = (root, file) =>
  JSON.parse(readFileSync(safePath(root, file), "utf8"));
export function git(root, ...args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120000,
  }).trim();
}
export function validPath(p) {
  if (
    typeof p !== "string" ||
    !p ||
    p.includes("\\") ||
    /[\0\r\n]/.test(p) ||
    p.startsWith("/") ||
    /^[A-Za-z]:/.test(p) ||
    p.split("/").some((s) => !s || s === "." || s === "..") ||
    p.split("/").some((s) => s.toLowerCase() === ".git")
  )
    throw new Error(`Unsafe template path: ${p}`);
  return p;
}
export function safePath(root, p) {
  validPath(p);
  let abs = resolve(root);
  for (const segment of p.split("/")) {
    abs = join(abs, segment);
    try {
      if (lstatSync(abs).isSymbolicLink())
        throw new Error(`Symlink is not a managed file path: ${p}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return abs;
}
const within = (p, base) => p === base || p.startsWith(base + "/");
export function validateManifest(m) {
  if (!m || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(m.templateVersion))
    throw new Error("Invalid templateVersion");
  if (![undefined, 1, 2].includes(m.schemaVersion))
    throw new Error(`Unsupported manifest schema: ${m.schemaVersion}`);
  for (const key of ["templateOwned", "projectOwned"]) {
    if (!Array.isArray(m[key]))
      throw new Error(`Manifest ${key} must be an array`);
    m[key].forEach(validPath);
  }
  for (const managed of m.templateOwned)
    for (const protectedPath of m.projectOwned) {
      if (within(managed, protectedPath))
        throw new Error(
          `Ownership overlap: project path ${protectedPath} contains managed path ${managed}`,
        );
    }
  for (const [path, pointers] of Object.entries(m.managedJson ?? {})) {
    validPath(path);
    if (!Array.isArray(pointers))
      throw new Error(`Invalid JSON pointers: ${path}`);
    pointers.forEach(pointerParts);
    if (m.templateOwned.some((p) => within(path, p)))
      throw new Error(`Whole-file and JSON ownership overlap: ${path}`);
    for (const a of pointers)
      for (const b of pointers)
        if (a !== b && within(a, b))
          throw new Error(`Overlapping JSON pointers: ${a}, ${b}`);
  }
  return m;
}
export function isManaged(p, manifest, extraProtected = []) {
  validPath(p);
  return (
    ![
      ...(manifest.projectOwned ?? []),
      ...extraProtected,
      LOCK_PATH,
      SEED_PATH,
    ].some((base) => within(p, base)) &&
    manifest.templateOwned.some((base) => within(p, base))
  );
}
export function pointerParts(pointer) {
  if (
    typeof pointer !== "string" ||
    !pointer.startsWith("/") ||
    pointer === "/"
  )
    throw new Error(`Invalid JSON pointer: ${pointer}`);
  const parts = pointer
    .slice(1)
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  if (parts.some((p) => ["__proto__", "constructor", "prototype"].includes(p)))
    throw new Error(`Unsafe JSON pointer: ${pointer}`);
  return parts;
}
export function getField(data, pointer) {
  let value = data;
  for (const key of pointerParts(pointer)) {
    if (!value || typeof value !== "object" || !own(value, key))
      return undefined;
    value = value[key];
  }
  return { value };
}
export function setField(data, pointer, field) {
  const parts = pointerParts(pointer);
  let parent = data;
  for (const key of parts.slice(0, -1)) {
    if (!own(parent, key)) {
      if (!field) return;
      parent[key] = {};
    }
    if (
      !parent[key] ||
      typeof parent[key] !== "object" ||
      Array.isArray(parent[key])
    )
      throw new Error(`JSON parent is not an object: ${pointer}`);
    parent = parent[key];
  }
  const key = parts.at(-1);
  if (field) parent[key] = field.value;
  else delete parent[key];
}
export function fileEntry(root, p) {
  const abs = safePath(root, p);
  if (!existsSync(abs)) return undefined;
  const stat = lstatSync(abs);
  if (!stat.isFile()) throw new Error(`Expected regular file: ${p}`);
  return {
    sha256: digest(readFileSync(abs)),
    mode: stat.mode & 0o111 ? "100755" : "100644",
  };
}
export function snapshot(root, manifest, source = {}) {
  validateManifest(manifest);
  const paths = git(
    root,
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  )
    .split("\0")
    .filter(Boolean);
  const files = {};
  for (const p of [...new Set(paths)].sort())
    if (isManaged(p, manifest)) {
      const value = fileEntry(root, p);
      if (value) files[p] = value;
    }
  const managedJson = {};
  for (const [p, pointers] of Object.entries(manifest.managedJson ?? {})) {
    const abs = safePath(root, p);
    const data = existsSync(abs) ? readJson(root, p) : {};
    managedJson[p] = {};
    for (const pointer of pointers) {
      const value = getField(data, pointer);
      if (value) managedJson[p][pointer] = value;
    }
  }
  return {
    schemaVersion: 1,
    templateVersion: manifest.templateVersion,
    repository: manifest.upstream,
    sourceRef: `v${manifest.templateVersion}`,
    sourceCommit: null,
    ...source,
    files,
    managedJson,
  };
}
export function validateState(state) {
  if (state?.schemaVersion !== 1 || !state.files || !state.managedJson)
    throw new Error("Unsupported or missing template baseline schema");
  for (const [p, v] of Object.entries(state.files)) {
    validPath(p);
    if (
      !/^[a-f0-9]{64}$/.test(v.sha256) ||
      !["100644", "100755"].includes(v.mode)
    )
      throw new Error(`Invalid baseline file: ${p}`);
  }
  for (const [p, fields] of Object.entries(state.managedJson)) {
    validPath(p);
    for (const ptr of Object.keys(fields)) pointerParts(ptr);
  }
  return state;
}
export function ensureInitialLock(root, manifest) {
  if (existsSync(safePath(root, LOCK_PATH)))
    return validateState(readJson(root, LOCK_PATH));
  if (!existsSync(safePath(root, SEED_PATH)))
    throw new Error(
      "No shipped baseline. Run kb:update --adopt --from <known-version> --apply.",
    );
  const seed = validateState(readJson(root, SEED_PATH));
  if (seed.templateVersion !== manifest.templateVersion)
    throw new Error(
      "Shipped baseline version differs from manifest; adopt a known version explicitly.",
    );
  const lock = { ...seed, installedVersion: seed.templateVersion };
  atomicWrite(root, LOCK_PATH, encode(lock));
  return lock;
}
export function atomicWrite(root, p, content, mode = "100644") {
  const abs = safePath(root, p);
  mkdirSync(dirname(abs), { recursive: true });
  const temp = abs + `.harness-${process.pid}.tmp`;
  try {
    writeFileSync(temp, content, {
      flag: "wx",
      mode: mode === "100755" ? 0o755 : 0o644,
    });
    renameSync(temp, abs);
    chmodSync(abs, mode === "100755" ? 0o755 : 0o644);
  } finally {
    rmSync(temp, { force: true });
  }
}
// Keep a rollback copy in memory; a failed write never leaves a half-written update.
export function applyWrites(root, writes) {
  const backups = new Map();
  for (const [p] of writes) {
    const entry = fileEntry(root, p);
    backups.set(
      p,
      entry
        ? { data: readFileSync(safePath(root, p)), mode: entry.mode }
        : null,
    );
  }
  const applied = [];
  try {
    for (const [p, v] of writes) {
      applied.push(p);
      if (v === null) rmSync(safePath(root, p));
      else atomicWrite(root, p, v.data, v.mode);
    }
  } catch (error) {
    for (const p of applied.reverse()) {
      const old = backups.get(p);
      if (old) atomicWrite(root, p, old.data, old.mode);
      else rmSync(safePath(root, p), { force: true });
    }
    throw error;
  }
}
export function planUpdate(
  root,
  currentManifest,
  targetManifest,
  base,
  target,
) {
  validateState(base);
  validateState(target);
  validateManifest(currentManifest);
  validateManifest(targetManifest);
  const protectedPaths = [
    ...currentManifest.projectOwned,
    ...targetManifest.projectOwned,
  ];
  const managed = (p) =>
    isManaged(p, currentManifest, protectedPaths) ||
    isManaged(p, targetManifest, protectedPaths);
  const actions = [],
    conflicts = [],
    settled = [];
  for (const p of [
    ...new Set([...Object.keys(base.files), ...Object.keys(target.files)]),
  ].sort()) {
    if (!managed(p)) continue;
    const previous = base.files[p],
      next = target.files[p],
      local = fileEntry(root, p);
    // No upstream change: preserve local customization and its original baseline.
    if (same(previous, next)) continue;
    const item = {
      path: p,
      kind: !next ? "delete" : !previous ? "add" : "update",
      next,
    };
    if (same(local, next)) settled.push(item);
    else if (same(local, previous)) actions.push(item);
    else conflicts.push({ ...item, reason: "changed locally and upstream" });
  }
  for (const p of [
    ...new Set([
      ...Object.keys(base.managedJson),
      ...Object.keys(target.managedJson),
    ]),
  ]) {
    if (protectedPaths.some((base) => within(p, base))) continue;
    const abs = safePath(root, p),
      data = existsSync(abs) ? readJson(root, p) : {};
    const declared = new Set([
      ...(currentManifest.managedJson?.[p] ?? []),
      ...(targetManifest.managedJson?.[p] ?? []),
    ]);
    const keys = new Set([
      ...Object.keys(base.managedJson[p] ?? {}),
      ...Object.keys(target.managedJson[p] ?? {}),
    ]);
    for (const pointer of keys) {
      if (!declared.has(pointer)) continue;
      const previous = base.managedJson[p]?.[pointer],
        next = target.managedJson[p]?.[pointer],
        local = getField(data, pointer);
      if (same(previous, next)) continue;
      const item = {
        path: p,
        pointer,
        kind: !next ? "delete" : !previous ? "add" : "update",
        next,
      };
      if (same(local, next)) settled.push(item);
      else if (same(local, previous)) actions.push(item);
      else
        conflicts.push({
          ...item,
          reason: "JSON field changed locally and upstream",
        });
    }
  }
  return { actions, conflicts, settled };
}
export function updateWrites(root, upstream, base, target, plan) {
  const writes = new Map(),
    nextLock = structuredClone(base);
  // Do not advance the manifest/version until all conflicts are resolved.
  const metadata = (p) => p === ".template-manifest.json";
  const accepted = [...plan.actions, ...plan.settled].filter(
    (a) => !plan.conflicts.length || !metadata(a.path),
  );
  const acceptedActions = plan.actions.filter(
    (a) => !plan.conflicts.length || !metadata(a.path),
  );
  const jsonDocs = new Map();
  for (const a of acceptedActions) {
    if (a.pointer) {
      if (!jsonDocs.has(a.path))
        jsonDocs.set(
          a.path,
          existsSync(safePath(root, a.path)) ? readJson(root, a.path) : {},
        );
      setField(jsonDocs.get(a.path), a.pointer, a.next);
    } else
      writes.set(
        a.path,
        a.next
          ? {
              data: readFileSync(safePath(upstream, a.path)),
              mode: a.next.mode,
            }
          : null,
      );
  }
  for (const [p, data] of jsonDocs)
    writes.set(p, { data: encode(data), mode: "100644" });
  for (const a of accepted) {
    const container = a.pointer
      ? (nextLock.managedJson[a.path] ??= {})
      : nextLock.files;
    const key = a.pointer ?? a.path;
    if (a.next) container[key] = a.next;
    else delete container[key];
  }
  if (plan.conflicts.length)
    nextLock.pending = {
      version: target.templateVersion,
      ref: target.sourceRef,
      commit: target.sourceCommit,
      conflicts: plan.conflicts.map((a) => a.path + (a.pointer ?? "")),
    };
  else {
    nextLock.installedVersion = target.templateVersion;
    nextLock.templateVersion = target.templateVersion;
    nextLock.sourceRef = target.sourceRef;
    nextLock.sourceCommit = target.sourceCommit;
    nextLock.repository = target.repository;
    delete nextLock.pending;
  }
  if (!same(base, nextLock))
    writes.set(LOCK_PATH, { data: encode(nextLock), mode: "100644" });
  return writes;
}
