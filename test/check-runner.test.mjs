import test from 'node:test';
import assert from 'node:assert/strict';
import { runChecks } from '../scripts/lib/check-runner.mjs';

const checks = [['-e', 'process.exit(1)'], ['-e', 'process.exit(0)'], ['-e', 'process.exit(2)']];
test('every check runs to the end and the summary names each failure', () => {
  const logs = [];
  const { results, failed } = runChecks(checks, { cwd: process.cwd(), stdio: 'ignore', log: (s) => logs.push(s) });
  assert.equal(results.length, 3); assert.equal(failed, true);
  assert.deepEqual(results.map((r) => r.status), ['failed', 'ok', 'failed']);
  assert.match(logs[0], /3 проверок: 1 ok, 2 failed/);
});
test('--fail-fast keeps the old stop-at-first-failure behaviour and says what was skipped', () => {
  const logs = [];
  const { results, skipped } = runChecks(checks, { cwd: process.cwd(), stdio: 'ignore', failFast: true, log: (s) => logs.push(s) });
  assert.equal(results.length, 1); assert.equal(skipped, 2); assert.match(logs[0], /2 не запущено/);
});
