// Effect signature for decision documents: a human approves a concrete body, the hash is recomputed
// at check time, and any later edit removes the approval. Local record, not authentication.
import { createHash } from 'node:crypto';
import { parseFrontmatter } from './frontmatter.mjs';

export const APPROVAL_FIELDS = ['approved_by', 'approved_at', 'approved_ref', 'approved_hash'];
export const DEFAULT_APPROVAL = Object.freeze({ layers: ['05_decisions'], required: false, acceptedStatuses: ['accepted', 'approved'], proposedStatuses: ['proposed', 'draft'] });

export function approvalConfig(cfg) {
  const given = cfg?.approval ?? {};
  const list = (value, fallback) => (Array.isArray(value) && value.every((v) => typeof v === 'string' && v.trim()) ? value.map((v) => v.trim()) : fallback);
  return { layers: list(given.layers, DEFAULT_APPROVAL.layers), required: given.required === true, acceptedStatuses: list(given.acceptedStatuses, DEFAULT_APPROVAL.acceptedStatuses).map((s) => s.toLowerCase()), proposedStatuses: list(given.proposedStatuses, DEFAULT_APPROVAL.proposedStatuses).map((s) => s.toLowerCase()) };
}

// Canonical body: LF line endings, no trailing whitespace per line, trimmed. Frontmatter is excluded so that
// stamping the approval itself (or touching metadata) never changes the signed effect.
export function effectHash(body) {
  const canonical = String(body).replace(/\r\n/g, '\n').split('\n').map((line) => line.replace(/[ \t]+$/, '')).join('\n').trim();
  return createHash('sha256').update(canonical).digest('hex');
}

export function checkApproval(text, cfg) {
  const a = approvalConfig(cfg);
  const { raw, fields, body } = parseFrontmatter(text);
  const status = String(fields.status ?? '').trim().toLowerCase();
  if (a.acceptedStatuses.includes(status)) {
    const missing = APPROVAL_FIELDS.filter((key) => !String(fields[key] ?? '').trim());
    if (missing.length) return { status: 'unsigned', reason: `status: ${status} without ${missing.join(', ')}`, fields, hasFrontmatter: raw != null };
    if (fields.approved_hash !== effectHash(body)) return { status: 'stale', reason: 'body changed after approval; approved_hash does not match the current text', fields, hasFrontmatter: true };
    return { status: 'accepted', reason: null, fields, hasFrontmatter: true };
  }
  if (!status || a.proposedStatuses.includes(status)) return { status: 'proposed', reason: null, fields, hasFrontmatter: raw != null };
  return { status: 'other', reason: `status: ${status} is outside the approval vocabulary (${[...a.proposedStatuses, ...a.acceptedStatuses].join(', ')})`, fields, hasFrontmatter: raw != null };
}

export function stampApproval(text, { by, reference, at = new Date().toISOString() }) {
  if (!String(by ?? '').trim() || !String(reference ?? '').trim()) throw Error('approval requires --by <human> and --reference <authorization reference>');
  const { raw, body } = parseFrontmatter(text);
  if (raw == null) throw Error('Document has no frontmatter; add type/status first');
  const kept = raw.split('\n').filter((line) => !/^(status|approved_by|approved_at|approved_ref|approved_hash)\s*:/.test(line));
  kept.push('status: accepted', `approved_by: ${JSON.stringify(String(by).trim())}`, `approved_at: ${at}`, `approved_ref: ${JSON.stringify(String(reference).trim())}`, `approved_hash: ${effectHash(body)}`);
  return `---\n${kept.join('\n')}\n---\n${body}`;
}
