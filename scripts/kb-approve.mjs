#!/usr/bin/env node
// Human approval of decision documents as an effect signature in frontmatter. All-or-nothing for several files.
// Does not commit: the human's commit is the approval ledger. Local record, not identity verification.
import { readFileSync, writeFileSync, renameSync, existsSync, unlinkSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { relative } from 'node:path';
import { KB_ROOT, loadKbConfig } from './lib/kb-root.mjs';
import { assertSafePath } from './lib/skills.mjs';
import { approvalConfig, checkApproval, stampApproval } from './lib/approval.mjs';

const help = `Usage:
  node scripts/kb-approve.mjs --file <decision.md> [--file <other.md> ...] --by <human> --reference <authorization-reference> [--json]
  node scripts/kb-approve.mjs --check --file <decision.md> [--file ...] [--json]

Approve stamps status: accepted plus approved_by/approved_at/approved_ref/approved_hash (sha256 of the canonical body).
Several files share one reference and are refused together if any of them is invalid. Re-approving an unchanged
accepted document is a no-op. Editing the body after approval makes the signature stale; approve again or return
the document to status: proposed. --check exits 1 when any file is stale or unsigned.`;

try {
  const { values } = parseArgs({ options: { file: { type: 'string', multiple: true }, by: { type: 'string' }, reference: { type: 'string' }, check: { type: 'boolean' }, json: { type: 'boolean' }, help: { type: 'boolean' } } });
  if (values.help || !values.file?.length) { console.log(help); process.exit(values.help ? 0 : 1); }
  const cfg = approvalConfig(await loadKbConfig());
  const docs = values.file.map((file) => {
    const abs = assertSafePath(KB_ROOT, file);
    if (!existsSync(abs)) throw Error(`File not found: ${file}`);
    const rel = relative(KB_ROOT, abs).split('\\').join('/');
    const text = readFileSync(abs, 'utf8');
    return { file: rel, abs, text, check: checkApproval(text, { approval: cfg }), inLayer: cfg.layers.some((layer) => rel.startsWith(`${layer}/`)) };
  });
  if (values.check) {
    const rows = docs.map((d) => ({ file: d.file, status: d.check.status, reason: d.check.reason, approved_by: d.check.fields.approved_by ?? null, approved_at: d.check.fields.approved_at ?? null, inLayer: d.inLayer }));
    if (values.json) console.log(JSON.stringify(rows, null, 2));
    else for (const row of rows) console.log(`${row.file}  ${row.status}${row.reason ? `  (${row.reason})` : ''}${row.approved_by ? `  by ${row.approved_by} at ${row.approved_at}` : ''}`);
    process.exitCode = rows.some((row) => ['stale', 'unsigned'].includes(row.status)) ? 1 : 0;
  } else {
    const by = values.by, reference = values.reference;
    const problems = docs.filter((d) => !d.check.hasFrontmatter || d.check.status === 'other').map((d) => `${d.file}: ${d.check.reason ?? 'no frontmatter'}`);
    if (problems.length) throw Error(`Refusing the whole set:\n${problems.join('\n')}`);
    const at = new Date().toISOString();
    const results = docs.map((d) => {
      if (d.check.status === 'accepted') return { file: d.file, action: 'unchanged', approved_by: d.check.fields.approved_by };
      const stamped = stampApproval(d.text, { by, reference, at });
      return { file: d.file, action: d.check.status === 'proposed' ? 'approved' : 're-approved', text: stamped, abs: d.abs };
    });
    for (const r of results) {
      if (!r.text) continue;
      const tmp = `${r.abs}.${process.pid}.tmp`;
      writeFileSync(tmp, r.text, { flag: 'wx' });
      try { renameSync(tmp, r.abs); } finally { if (existsSync(tmp)) unlinkSync(tmp); }
    }
    const out = results.map(({ file, action, approved_by }) => ({ file, action, approved_by: approved_by ?? by, approved_ref: reference, approved_at: at }));
    if (values.json) console.log(JSON.stringify(out, null, 2));
    else { for (const r of out) console.log(`${r.file}  ${r.action}`); console.log('Commit the stamped files yourself: the commit is the approval ledger. Not a proof of identity.'); }
    for (const d of docs) if (!d.inLayer) console.error(`[kb-approve] note: ${d.file} is outside approval.layers (${cfg.layers.join(', ')}); scans will not check it`);
  }
} catch (error) {
  console.error(`[kb-approve] ${error.message}`);
  process.exitCode = 1;
}
