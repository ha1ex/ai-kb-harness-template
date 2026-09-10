// Run every check and summarize. Stopping at the first failure hides the tail: «два падения» в отчёте
// оказывались 27 в полном прогоне (статья §8). --fail-fast keeps the old behaviour when wanted.
import { spawnSync } from 'node:child_process';

export function runChecks(checks, { cwd, failFast = false, timeout = 120_000, log = console.log, exec = process.execPath, stdio = 'inherit' } = {}) {
  const results = [];
  for (const args of checks) {
    const started = Date.now();
    const r = spawnSync(exec, args, { cwd, stdio, timeout });
    const ok = r.status === 0;
    results.push({ name: args.join(' '), status: ok ? 'ok' : 'failed', ms: Date.now() - started, code: r.status, error: r.error?.message ?? null });
    if (!ok && failFast) break;
  }
  const failed = results.filter((x) => x.status === 'failed');
  const skipped = checks.length - results.length;
  const names = failed.map((x) => x.name.split(' ')[0].split('/').pop());
  log(`${checks.length} проверок: ${results.length - failed.length} ok, ${failed.length} failed${skipped ? `, ${skipped} не запущено (--fail-fast)` : ''}${failed.length ? `: ${names.join(', ')}` : ''}`);
  return { results, failed: failed.length > 0, skipped };
}
