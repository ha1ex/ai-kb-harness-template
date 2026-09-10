// Durable observations and explicitly reviewed feedback. No model calls or automatic policy edits.
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, readdirSync, readFileSync, mkdirSync, openSync, closeSync, writeFileSync, fsyncSync, renameSync, unlinkSync, constants } from 'node:fs';
import { safePath } from './template-state.mjs';

export const FINDINGS_PATH = '.remember/findings';
export const FINDING_STATUSES = ['open', 'accepted', 'resolved', 'dismissed'];
const KINDS = ['knowledge', 'feedback'];
const SCOPES = ['role', 'workflow', 'skill', 'task'];
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim() || /\0/.test(value)) throw Error(`${field} must be nonempty text`);
  return value.trim();
}
function status(value) {
  if (!FINDING_STATUSES.includes(value)) throw Error(`Invalid finding status: ${value}`);
  return value;
}
function validId(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/.test(value)) throw Error('Invalid finding id');
  return value;
}
function evidence(root, items) {
  if (!Array.isArray(items) || items.length === 0) throw Error('evidence must include a source and an observation');
  return items.map((item) => {
    const source = requiredText(item?.source, 'evidence.source');
    if (/^https?:\/\//i.test(source)) {
      const url = new URL(source);
      if (url.username || url.password) throw Error('Evidence URLs must not include credentials');
    } else safePath(root, source);
    return { source, observation: requiredText(item?.observation, 'evidence.observation') };
  });
}
function content(root, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Finding must be a JSON object');
  if (!KINDS.includes(input.kind)) throw Error('kind must be knowledge or feedback');
  const title = requiredText(input.title ?? input.problem, 'title');
  if (!Array.isArray(input.paths)) throw Error('paths must be an array of project-relative paths');
  const paths = [...new Set(input.paths.map((path) => {
    safePath(root, path);
    return path;
  }))].sort();
  const result = {
    kind: input.kind, title, problem: requiredText(input.problem ?? title, 'problem'), paths,
    evidence: evidence(root, input.evidence), suggestedAction: requiredText(input.suggestedAction, 'suggestedAction'),
  };
  for (const key of [...SCOPES, 'code']) if (input[key] != null) result[key] = requiredText(input[key], key);
  return result;
}
function issueId(input) {
  // Ages and evidence change between scans; neither identifies the underlying issue.
  return hash([input.kind, input.code ?? null, input.title, input.paths, ...SCOPES.map((key) => input[key] ?? null)]);
}
function recordPath(root, id) {
  return safePath(root, `${FINDINGS_PATH}/${validId(id)}.json`);
}
function readRecord(root, id) {
  const path = recordPath(root, id);
  if (!existsSync(path)) return null;
  if (!lstatSync(path).isFile()) throw Error(`Finding is not a regular file: ${id}`);
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  let record;
  try { record = JSON.parse(readFileSync(fd, 'utf8')); } finally { closeSync(fd); }
  if (record.schemaVersion !== 1 || record.id !== id) throw Error(`Invalid finding schema or identity: ${id}`);
  const base = content(root, record);
  if (issueId(base) !== id) throw Error(`Finding identity does not match its contents: ${id}`);
  status(record.status);
  for (const field of ['createdAt', 'updatedAt', 'lastObservedAt']) {
    if (typeof record[field] !== 'string' || !Number.isFinite(Date.parse(record[field]))) throw Error(`Invalid finding ${field}: ${id}`);
  }
  if (!Array.isArray(record.observations) || !record.observations.length || !Array.isArray(record.history)) throw Error(`Invalid finding history: ${id}`);
  for (const item of record.observations) {
    if (!Number.isFinite(Date.parse(item.at))) throw Error(`Invalid observation date: ${id}`);
    evidence(root, item.evidence);
  }
  for (const item of record.history) {
    status(item.from); status(item.to);
    requiredText(item.by, 'history.by'); requiredText(item.note, 'history.note');
    if (!Number.isFinite(Date.parse(item.at))) throw Error(`Invalid disposition date: ${id}`);
  }
  if (record.status !== 'open' && record.history.at(-1)?.to !== record.status) throw Error(`Missing recorded disposition: ${id}`);
  return { ...record, ...base };
}

/** Read-only, synchronous; reject corrupt or unsafe records instead of silently losing lessons. */
export function readFindings(root) {
  const dir = safePath(root, FINDINGS_PATH);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith('.json')).sort().map((name) => readRecord(root, name.slice(0, -5)));
}

function withLock(root, id, fn) {
  const dir = safePath(root, FINDINGS_PATH);
  mkdirSync(dir, { recursive: true });
  const path = safePath(root, `${FINDINGS_PATH}/${id}.lock`);
  const deadline = Date.now() + 5000;
  let fd;
  while (fd === undefined) {
    try { fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      safePath(root, `${FINDINGS_PATH}/${id}.lock`);
      if (Date.now() >= deadline) throw Error(`Finding ${id} is locked. Check the writer before removing ${id}.lock.`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
    }
  }
  try {
    writeFileSync(fd, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
    return fn();
  } finally {
    closeSync(fd);
    unlinkSync(safePath(root, `${FINDINGS_PATH}/${id}.lock`));
  }
}
function writeRecord(root, record) {
  const dest = recordPath(root, record.id);
  const temp = safePath(root, `${FINDINGS_PATH}/${record.id}.${randomUUID()}.tmp`);
  const fd = openSync(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o644);
  try {
    try { writeFileSync(fd, JSON.stringify(record, null, 2) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
    recordPath(root, record.id);
    renameSync(temp, dest);
  } finally { if (existsSync(temp)) unlinkSync(temp); }
}

/** Add an open observation. Repeated scans never overwrite a reviewed disposition or lesson. */
export function upsertFinding(root, input) {
  const base = content(root, input);
  const id = issueId(base);
  if (input.id != null && input.id !== id) throw Error('An observation cannot replace a different finding id');
  return withLock(root, id, () => {
    const old = readRecord(root, id);
    const now = new Date().toISOString();
    const observations = [...(old?.observations ?? [])];
    if (!observations.some((item) => hash(item.evidence) === hash(base.evidence))) observations.push({ at: now, evidence: base.evidence });
    const record = old ? {
      ...old, ...(old.status === 'open' ? base : {}), observations, updatedAt: now, lastObservedAt: now,
    } : {
      schemaVersion: 1, id, ...base, status: 'open', createdAt: now, updatedAt: now, lastObservedAt: now,
      observations, history: [],
    };
    writeRecord(root, record);
    return record;
  });
}

/** This records a user's confirmation; it is an audit trail, not an authorization system. */
export function transitionFinding(root, { id, status: next, by, note }) {
  validId(id); status(next);
  by = requiredText(by, 'by'); note = requiredText(note, 'note');
  return withLock(root, id, () => {
    const old = readRecord(root, id);
    if (!old) throw Error(`Finding not found: ${id}`);
    const now = new Date().toISOString();
    const record = { ...old, status: next, updatedAt: now, history: [...old.history, { at: now, from: old.status, to: next, by, note }] };
    writeRecord(root, record);
    return record;
  });
}

/** Observations come directly from doctor; suggested actions deliberately ask for review. */
export function doctorFindings(report) {
  const definitions = {
    missingFrontmatter: ['Missing metadata', 'Review the required fields and fill them from the source.'],
    brokenRelated: ['Broken related link', 'Check the intended source and correct the link after reading it.'],
    orphan: ['Unlinked knowledge page', 'Review whether this page belongs in the knowledge graph and add justified links.'],
    staleSynthesis: ['Synthesis needs freshness review', 'Compare the synthesis with current sources before updating any conclusion.'],
    ghostInIndex: ['Index references a missing file', 'Check the file history, then rebuild the local index if the deletion was intended.'],
    staleInbox: ['Inbox observation awaits review', 'Read the candidate and its sources, then decide whether to ingest or dismiss it.'],
    staleAnswers: ['Answer source changed after verification', 'Recheck the answer against the changed source before renewing verification.'],
    stubCards: ['Incomplete or deprecated source card', 'Review the source and decide whether to complete or retain this card.'],
    approvalIssues: ['Decision approval missing or stale', 'Confirm the decision with pnpm kb:approve or return it to status: proposed.'],
  };
  const out = [];
  for (const [code, [label, suggestedAction]] of Object.entries(definitions)) {
    for (const issue of report.issues?.[code] ?? []) {
      const source = issue.src ?? issue.file;
      const detail = JSON.stringify(issue);
      out.push({ kind: 'knowledge', code: `doctor:${code}`, title: `${label}: ${source}${issue.dst ? ` → ${issue.dst}` : ''}${issue.source ? ` (${issue.source})` : ''}`, problem: `Doctor observed ${code}: ${detail}`, paths: [source], evidence: [{ source, observation: `kb-doctor filesystem/index check: ${detail}` }], suggestedAction });
    }
  }
  return out;
}

export function findingsMetrics(findings, records = []) {
  const byStatus = Object.fromEntries(FINDING_STATUSES.map((value) => [value, findings.filter((finding) => finding.status === value).length]));
  const byKind = Object.fromEntries(KINDS.map((value) => [value, findings.filter((finding) => finding.kind === value).length]));
  const feedback = findings.filter((finding) => finding.kind === 'feedback');
  const sampleSize = feedback.reduce((sum, finding) => sum + finding.observations.length, 0);
  const repeated = sampleSize - feedback.length;
  // Existing verify and completed task records do not establish a first review attempt.
  const reviews = new Map();
  for (const item of records) {
    if (item.kind !== 'task-review' || typeof item.task !== 'string' || !item.task.trim() || item.attempt !== 1 || typeof item.passed !== 'boolean') continue;
    if (item.stage != null && (typeof item.stage !== 'string' || !item.stage.trim())) continue;
    const sample = JSON.stringify([item.task, item.stage ?? null]);
    if (!reviews.has(sample)) reviews.set(sample, item.passed);
  }
  const passed = [...reviews.values()].filter(Boolean).length;
  const papercuts = feedback.filter((finding) => finding.code === 'papercut').map((finding) => ({ id: finding.id, title: finding.title, count: finding.observations.length })).sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
  return {
    papercuts: { total: papercuts.length, repeated3plus: papercuts.filter((item) => item.count >= 3).length, top: papercuts.slice(0, 5) },
    findings: { total: findings.length, byStatus, byKind },
    repeatedFeedback: { status: sampleSize ? 'observed' : 'insufficient-data', value: sampleSize ? repeated / sampleSize : null, sampleSize, repeated: sampleSize ? repeated : null, basis: 'Distinct evidence sets per feedback issue; duplicate ingestion is excluded.' },
    firstPassCompletion: { status: reviews.size ? 'observed' : 'insufficient-data', value: reviews.size ? passed / reviews.size : null, sampleSize: reviews.size, passed: reviews.size ? passed : null, basis: 'Independent review first attempts per (task, stage), or per task for legacy records without a stage. Requires explicit task-review entries with attempt: 1 and boolean passed; excludes retries and ordinary verify runs. This is not human acceptance or task completion.' },
  };
}
