import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { completePrompt } from "../scripts/lib/llm.mjs";
test("manual fallback has no implicit provider or call", async () => {
  const r = await completePrompt("neutral prompt", { config: {} });
  assert.equal(r.executed, false);
  assert.equal(r.prompt, "neutral prompt");
  const s = await completePrompt("neutral prompt", {
    execute: true,
    config: {},
  });
  assert.equal(s.executed, false);
});
test("HTTP adapter uses configured local server with bounded retries", async (t) => {
  let calls = 0;
  const server = createServer((req, res) => {
    calls++;
    let body = "";
    req.on("data", (b) => (body += b));
    req.on("end", () => {
      assert.equal(JSON.parse(body).messages[0].content, "neutral prompt");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          choices: [{ message: { content: "local response" } }],
        }),
      );
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => server.close());
  const config = {
    provider: "openai-http",
    model: "local-test",
    base_url: `http://127.0.0.1:${server.address().port}/v1`,
    timeout_ms: 1000,
    max_retries: 0,
  };
  const r = await completePrompt("neutral prompt", { execute: true, config });
  assert.equal(r.text, "local response");
  assert.equal(r.executed, true);
  assert.equal(calls, 1);
});
test("generic CLI receives a short prompt on stdin", async () => {
  const r = await completePrompt("short", {
    execute: true,
    config: {
      provider: "generic-cli",
      timeout_ms: 1000,
      cli: {
        command: process.execPath,
        args: ["-e", "process.stdin.pipe(process.stdout)"],
      },
    },
  });
  assert.equal(r.text, "short");
});
test("HTTP failure respects zero retries and reports error", async (t) => {
  let calls = 0;
  const server = createServer((req, res) => {
    calls++;
    res.writeHead(503);
    res.end("unavailable");
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => server.close());
  await assert.rejects(
    completePrompt("neutral", {
      execute: true,
      config: {
        provider: "openai-http",
        base_url: `http://127.0.0.1:${server.address().port}`,
        max_retries: 0,
        timeout_ms: 100,
      },
    }),
    /503/,
  );
  assert.equal(calls, 1);
});
test("HTTP timeout includes stalled response body", async (t) => {
  const server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write("{");
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  await assert.rejects(
    completePrompt("neutral", {
      execute: true,
      config: {
        provider: "openai-http",
        base_url: `http://127.0.0.1:${server.address().port}`,
        timeout_ms: 50,
        max_retries: 0,
      },
    }),
    /timeout/,
  );
});
test("generic CLI failures and timeout are not successful text", async () => {
  await assert.rejects(
    completePrompt("neutral", {
      execute: true,
      config: {
        provider: "generic-cli",
        timeout_ms: 200,
        cli: { command: process.execPath, args: ["-e", "process.exit(3)"] },
      },
    }),
    /exit 3/,
  );
  await assert.rejects(
    completePrompt("neutral", {
      execute: true,
      config: {
        provider: "generic-cli",
        timeout_ms: 50,
        cli: {
          command: process.execPath,
          args: ["-e", "setInterval(()=>{},1000)"],
        },
      },
    }),
    /timeout/,
  );
});
test("generic CLI that ignores TERM still has a bounded timeout", async () => {
  const start = Date.now();
  await assert.rejects(
    completePrompt("neutral", {
      execute: true,
      config: {
        provider: "generic-cli",
        timeout_ms: 200,
        cli: {
          command: process.execPath,
          args: [
            "-e",
            'process.on("SIGTERM",()=>{});setTimeout(()=>process.exit(0),1500)',
          ],
        },
      },
    }),
    /timeout/,
  );
  assert.ok(
    Date.now() - start < 1200,
    "must force-stop a process that ignores TERM",
  );
});

test("CLI timeout settles when a descendant keeps inherited pipes open", async () => {
  const start = Date.now();
  await assert.rejects(
    completePrompt("neutral", {
      execute: true,
      config: {
        provider: "generic-cli",
        timeout_ms: 100,
        cli: {
          command: process.execPath,
          args: [
            "-e",
            `require('child_process').spawn(process.execPath,['-e','setTimeout(()=>{},2000)'],{stdio:'inherit'});setTimeout(()=>{},2000)`,
          ],
        },
      },
    }),
    /timeout/,
  );
  assert.ok(
    Date.now() - start < 1000,
    "timeout must not await descendant pipe closure",
  );
});
