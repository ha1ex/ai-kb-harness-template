// Spawn CLI calls in an owned process group (POSIX), and settle deadlines even
// if descendants retain stdout/stderr. Never wait for pipe closure to time out.
import { spawn } from "node:child_process";
export const cliProcessOptions = { detached: process.platform !== "win32" };
export function enforceCliTimeout(proc, timeoutMs, reject, label) {
  let expired = false;
  function signalTree(signal) {
    if (!proc.pid) return;
    try {
      if (process.platform !== "win32") process.kill(-proc.pid, signal);
      else {
        const killer = spawn(
          "taskkill",
          ["/pid", String(proc.pid), "/T", "/F"],
          { stdio: "ignore" },
        );
        killer.on("error", () => {});
        killer.unref();
      }
    } catch (error) {
      if (error.code !== "ESRCH") proc.kill(signal);
    }
  }
  const timer = setTimeout(() => {
    expired = true;
    signalTree("SIGTERM");
    // Keep this bounded cleanup alive even if the immediate parent exits first.
    setTimeout(() => signalTree("SIGKILL"), 250);
    reject(new Error(`[${label}] timeout ${timeoutMs}ms`));
    for (const stream of [proc.stdin, proc.stdout, proc.stderr])
      stream?.destroy();
  }, timeoutMs);
  return {
    clear: () => clearTimeout(timer),
    get expired() {
      return expired;
    },
  };
}
