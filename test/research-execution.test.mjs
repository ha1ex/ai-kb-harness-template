import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  cpSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const repo = resolve(import.meta.dirname, "..");
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "kb-research-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const p of ["harness", "AGENTS.md", "docs/human-interface.md"])
    cpSync(join(repo, p), join(root, p), { recursive: true });
  write(
    root,
    "01_raw/a.md",
    "Source A, 2026-09-09. The pilot included 12 customers.",
  );
  write(
    root,
    "01_raw/b.md",
    "Source B, 2026-09-09. The pilot included 9 customers.",
  );
  return root;
}
function write(root, path, data) {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(
    join(root, path),
    typeof data === "string" ? data : JSON.stringify(data),
  );
}
function cli(root, ...args) {
  return spawnSync(
    process.execPath,
    [join(repo, "scripts/kb-research.mjs"), ...args],
    { cwd: root, env: { ...process.env, KB_ROOT: root }, encoding: "utf8" },
  );
}
function ok(r) {
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}
function init(root) {
  return ok(
    cli(
      root,
      "init",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--question",
      "How many pilot customers?",
      "--source",
      "01_raw/a.md",
      "--source",
      "01_raw/b.md",
    ),
  );
}
function prepare(root, role, worker) {
  return ok(
    cli(
      root,
      "prepare",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--role",
      role,
      ...(worker ? ["--worker", worker] : []),
    ),
  );
}
function record(
  root,
  request,
  output,
  {
    contextId = request.attempt.id,
    usage = { input_tokens: 20, output_tokens: 10 },
    model = request.attempt.model,
  } = {},
) {
  write(root, "response.json", { output, contextId, model, usage });
  return cli(
    root,
    "record",
    "--task",
    "r1",
    "--owner",
    "writer",
    "--attempt",
    request.attempt.id,
    "--file",
    join(root, "response.json"),
  );
}
const plan = {
  summary: "Compare both sources",
  workers: [
    {
      id: "a",
      question: "Read both counts",
      acceptanceCriteria: ["Preserve the disagreement"],
      sourcePaths: ["01_raw/a.md", "01_raw/b.md"],
    },
  ],
};
const findings = {
  summary: "Sources disagree",
  claims: [
    {
      id: "a12",
      text: "A reports twelve customers",
      confidence: "high",
      evidence: [
        { path: "01_raw/a.md", quote: "The pilot included 12 customers." },
      ],
    },
    {
      id: "b9",
      text: "B reports nine customers",
      confidence: "high",
      evidence: [
        { path: "01_raw/b.md", quote: "The pilot included 9 customers." },
      ],
    },
  ],
  uncertainties: ["The counts disagree"],
  contradictions: [
    { description: "Different pilot counts", claimIds: ["a12", "b9"] },
  ],
};
const synthesis = {
  summary: "The number of customers is uncertain: sources disagree.",
  claims: [
    {
      id: "count",
      text: "Sources report 12 and 9 customers.",
      evidence: ["a/a12", "a/b9"],
    },
  ],
  uncertainties: ["The counts disagree"],
  contradictions: ["Different pilot counts"],
};
function gathered(root) {
  init(root);
  ok(record(root, prepare(root, "planner"), plan));
  ok(record(root, prepare(root, "researcher", "a"), findings));
}
test("manual research resumes with economy workers, preserves conflicting evidence and requires frontier independent review", (t) => {
  const root = fixture(t);
  gathered(root);
  let s = ok(cli(root, "show", "--task", "r1"));
  assert.equal(s.task.currentStage, "synthesize");
  assert.equal(s.task.research.attempts[1].modelAlias, "economy");
  assert.equal(s.task.research.workers[0].result.claims.length, 2);
  const draft = prepare(root, "synthesizer");
  ok(record(root, draft, synthesis, { contextId: "author-session" }));
  const review = prepare(root, "reviewer");
  assert.equal(review.attempt.modelAlias, "frontier");
  assert.match(review.prompt, /The pilot included 12 customers/);
  assert.match(review.prompt, /The pilot included 9 customers/);
  const verdict = {
    summary: "Both source counts preserved; no false certainty",
    verdict: "passed",
    checks: [
      {
        claimId: "count",
        verdict: "supported",
        evidence: ["a/a12", "a/b9"],
        note: "Both originals inspected",
      },
    ],
  };
  assert.equal(
    record(root, review, verdict, { contextId: "author-session" }).status,
    1,
  );
  ok(record(root, review, verdict, { contextId: "separate-review-session" }));
  s = ok(cli(root, "show", "--task", "r1"));
  assert.equal(s.task.status, "complete");
  assert.equal(s.task.currentStage, null);
  assert.equal(
    s.task.stages.find((x) => x.id === "review").review.mode,
    "independent",
  );
});
test("invented quotations cannot become collected evidence", (t) => {
  const root = fixture(t);
  init(root);
  ok(record(root, prepare(root, "planner"), plan));
  const request = prepare(root, "researcher", "a");
  const bad = structuredClone(findings);
  bad.claims[0].evidence[0].quote = "The pilot included 1000 customers.";
  assert.equal(record(root, request, bad).status, 1);
  assert.equal(
    ok(cli(root, "show", "--task", "r1")).task.currentStage,
    "gather",
  );
});
test("a reviewer must cover every final claim and cannot resolve source uncertainty by omission", (t) => {
  const root = fixture(t);
  gathered(root);
  const req = prepare(root, "synthesizer");
  assert.equal(
    record(root, req, { ...synthesis, uncertainties: [], contradictions: [] })
      .status,
    1,
  );
  ok(record(root, req, synthesis));
  const review = prepare(root, "reviewer");
  assert.equal(
    record(root, review, { summary: "Fine", verdict: "passed", checks: [] })
      .status,
    1,
  );
});
test("source changes invalidate approved research in context and prevent completion", (t) => {
  const root = fixture(t);
  gathered(root);
  write(root, "01_raw/a.md", "The pilot included 20 customers.");
  const r = cli(
    root,
    "prepare",
    "--task",
    "r1",
    "--owner",
    "writer",
    "--role",
    "synthesizer",
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /changed|stale/i);
  const c = spawnSync(
    process.execPath,
    [join(repo, "scripts/session-start-context.mjs"), "--task", "r1", "--json"],
    { cwd: root, env: { ...process.env, KB_ROOT: root }, encoding: "utf8" },
  );
  assert.equal(ok(c).work.ready, false);
});
test("unknown client usage stays unknown and completed workers are not dispatched again", (t) => {
  const root = fixture(t);
  init(root);
  ok(record(root, prepare(root, "planner"), plan, { usage: null }));
  let s = ok(cli(root, "show", "--task", "r1"));
  assert.equal(s.budget.totalTokens, null);
  assert.equal(s.budget.costUsd, null);
  ok(record(root, prepare(root, "researcher", "a"), findings));
  assert.equal(
    cli(
      root,
      "prepare",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--role",
      "researcher",
      "--worker",
      "a",
    ).status,
    1,
  );
});
test("role/model mismatch and changed policy do not silently route to another model", (t) => {
  const root = fixture(t);
  init(root);
  const req = prepare(root, "planner");
  assert.equal(record(root, req, plan, { model: "economy" }).status, 1);
  const policy = JSON.parse(
    readFileSync(join(root, "harness/templates/research-policy.json"), "utf8"),
  );
  policy.models.frontier.model = "different-frontier";
  write(root, "00_context/research-policy.json", policy);
  assert.equal(record(root, req, plan).status, 1);
});
test("a task update with an obsolete fingerprint cannot overwrite a newer handoff", (t) => {
  const root = fixture(t);
  init(root);
  write(root, "overwrite.json", {
    goal: "wrong overwrite",
    acceptanceCriteria: ["Done"],
    decisions: [],
    nextStep: "Done",
  });
  const r = spawnSync(
    process.execPath,
    [
      join(repo, "scripts/kb-session.mjs"),
      "save",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--file",
      join(root, "overwrite.json"),
      "--expected-sha",
      "absent",
    ],
    { cwd: root, env: { ...process.env, KB_ROOT: root }, encoding: "utf8" },
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /changed|fingerprint|concurrent/i);
});

test("explicit execution routes actual HTTP calls by role and can finish exactly at its call limit", async (t) => {
  const { createServer } = await import("node:http"),
    { execFile } = await import("node:child_process"),
    { promisify } = await import("node:util");
  const root = fixture(t),
    calls = [];
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const b of req) body += b;
    const data = JSON.parse(body),
      packet = JSON.parse(data.messages[0].content);
    calls.push({ model: data.model, packet });
    const role = packet.instructions.split("\n")[0].match(/the (\w+) for/)[1];
    const output = {
      planner: plan,
      researcher: findings,
      synthesizer: synthesis,
      reviewer: {
        summary: "All evidence checked",
        verdict: "passed",
        checks: [
          {
            claimId: "count",
            verdict: "supported",
            evidence: ["a/a12", "a/b9"],
            note: "Originals agree with both reported counts",
          },
        ],
      },
    }[role];
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(output) } }],
        usage: { prompt_tokens: 20, completion_tokens: 10 },
      }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const policy = JSON.parse(
    readFileSync(join(root, "harness/templates/research-policy.json"), "utf8"),
  );
  for (const [alias, cfg] of Object.entries(policy.models)) {
    cfg.provider = "openai-http";
    cfg.base_url = `http://127.0.0.1:${server.address().port}/v1`;
    cfg.model = alias === "frontier" ? "strong-model" : "cheap-model";
  }
  policy.limits.maxCalls = 4;
  write(root, "00_context/research-policy.json", policy);
  init(root);
  const { stdout } = await promisify(execFile)(
    process.execPath,
    [
      join(repo, "scripts/kb-research.mjs"),
      "run",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--execute",
    ],
    { cwd: root, env: { ...process.env, KB_ROOT: root } },
  );
  const result = JSON.parse(stdout);
  assert.equal(result.task.status, "complete");
  assert.deepEqual(
    calls.map((c) => c.model),
    ["strong-model", "cheap-model", "strong-model", "strong-model"],
  );
  assert.equal(result.budget.totalTokens, 120);
  assert.equal(calls[3].packet.sourceDocuments.length, 2);
});
test("failed attempts and budget exhaustion remain incomplete, and source revision preserves spent calls", (t) => {
  const root = fixture(t);
  init(root);
  ok(record(root, prepare(root, "planner"), plan));
  const request = prepare(root, "researcher", "a");
  write(root, "failed.json", {
    model: request.attempt.model,
    contextId: "worker-error",
    usage: null,
    error: "Search service unavailable",
  });
  ok(
    cli(
      root,
      "record",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--attempt",
      request.attempt.id,
      "--file",
      join(root, "failed.json"),
    ),
  );
  ok(record(root, prepare(root, "researcher", "a"), findings));
  let state = ok(cli(root, "show", "--task", "r1"));
  assert.equal(state.budget.calls, 3);
  write(root, "01_raw/a.md", "The pilot included 20 customers.");
  ok(
    cli(
      root,
      "revise",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--worker",
      "a",
      "--reason",
      "Source changed",
    ),
  );
  state = ok(cli(root, "show", "--task", "r1"));
  assert.equal(state.budget.calls, 3);
  assert.notEqual(state.task.status, "complete");
  assert.equal(
    cli(
      root,
      "prepare",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--role",
      "researcher",
      "--worker",
      "a",
    ).status,
    1,
  );
});
test("unknown usage under an enabled token cap blocks work until an explicit reconciliation", (t) => {
  const root = fixture(t),
    policy = JSON.parse(
      readFileSync(
        join(root, "harness/templates/research-policy.json"),
        "utf8",
      ),
    );
  policy.limits.maxTotalTokens = 200000;
  write(root, "00_context/research-policy.json", policy);
  init(root);
  const request = prepare(root, "planner");
  ok(record(root, request, plan, { usage: null }));
  assert.equal(
    cli(
      root,
      "prepare",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--role",
      "researcher",
      "--worker",
      "a",
    ).status,
    1,
  );
  write(root, "usage.json", { input_tokens: 100, output_tokens: 100 });
  ok(
    cli(
      root,
      "reconcile",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--attempt",
      request.attempt.id,
      "--file",
      join(root, "usage.json"),
      "--reason",
      "Copied full usage from client trace",
    ),
  );
  assert.equal(prepare(root, "researcher", "a").attempt.modelAlias, "economy");
});

test("context exposes role routing and unknown usage, and detects changed policy", (t) => {
  const root = fixture(t);
  init(root);
  ok(record(root, prepare(root, "planner"), plan, { usage: null }));
  const context = () =>
    ok(
      spawnSync(
        process.execPath,
        [
          join(repo, "scripts/session-start-context.mjs"),
          "--task",
          "r1",
          "--json",
        ],
        { cwd: root, env: { ...process.env, KB_ROOT: root }, encoding: "utf8" },
      ),
    );
  let c = context();
  assert.equal(c.work.research.models.researcher.tier, "economy");
  assert.equal(c.work.research.budget.totalTokens, null);
  const policy = JSON.parse(
    readFileSync(join(root, "harness/templates/research-policy.json"), "utf8"),
  );
  policy.models.frontier.model = "new-model";
  write(root, "00_context/research-policy.json", policy);
  c = context();
  assert.equal(c.work.research.policyChanged, true);
  assert.equal(c.work.ready, false);
});
test("edited embedded output cannot replace the immutable result, and session saves cannot drop history", (t) => {
  const root = fixture(t);
  gathered(root);
  const path = ".remember/tasks/r1.json",
    saved = JSON.parse(readFileSync(join(root, path), "utf8"));
  const edited = structuredClone(saved);
  edited.research.workers[0].result.claims[0].text = "Unreviewed substitute";
  write(root, path, edited);
  assert.equal(
    cli(
      root,
      "prepare",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--role",
      "synthesizer",
    ).status,
    1,
  );
  write(root, path, saved);
  write(root, "drop.json", { ...saved, research: null });
  const r = spawnSync(
    process.execPath,
    [
      join(repo, "scripts/kb-session.mjs"),
      "save",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--file",
      join(root, "drop.json"),
    ],
    { cwd: root, env: { ...process.env, KB_ROOT: root }, encoding: "utf8" },
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /history/);
});
test("requested changes preserve review feedback and stop at review-round ceiling without acceptance", (t) => {
  const root = fixture(t),
    policy = JSON.parse(
      readFileSync(
        join(root, "harness/templates/research-policy.json"),
        "utf8",
      ),
    );
  policy.limits.maxReviewRounds = 1;
  write(root, "00_context/research-policy.json", policy);
  gathered(root);
  ok(record(root, prepare(root, "synthesizer"), synthesis));
  const review = {
    summary: "Explain why the counts differ",
    verdict: "changes-requested",
    checks: [
      {
        claimId: "count",
        verdict: "uncertain",
        evidence: ["a/a12", "a/b9"],
        note: "No reconciliation yet",
      },
    ],
  };
  ok(record(root, prepare(root, "reviewer"), review));
  let s = ok(cli(root, "run", "--task", "r1", "--owner", "writer"));
  assert.equal(s.budget.calls, 4);
  assert.notEqual(s.task.status, "complete");
  ok(
    cli(
      root,
      "revise",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--reason",
      "Investigate difference",
    ),
  );
  const worker = prepare(root, "researcher", "a");
  assert.match(worker.prompt, /Explain why the counts differ/);
  ok(record(root, worker, findings));
  ok(record(root, prepare(root, "synthesizer"), synthesis));
  assert.equal(
    cli(
      root,
      "prepare",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--role",
      "reviewer",
    ).status,
    1,
  );
  assert.equal(ok(cli(root, "show", "--task", "r1")).budget.calls, 6);
});
test("parallel workers settle out of order without losing evidence or costs", async (t) => {
  const { createServer } = await import("node:http"),
    { execFile } = await import("node:child_process"),
    { promisify } = await import("node:util");
  const root = fixture(t);
  let concurrent = 0,
    peak = 0;
  const twoPlan = {
    summary: "Independent checks",
    workers: ["a", "b"].map((id) => ({ ...plan.workers[0], id })),
  };
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const b of req) body += b;
    const packet = JSON.parse(JSON.parse(body).messages[0].content),
      role = packet.instructions.split("\n")[0].match(/the (\w+) for/)[1];
    if (role === "researcher") {
      peak = Math.max(peak, ++concurrent);
      await new Promise((resolve) =>
        setTimeout(resolve, packet.task.worker.id === "a" ? 100 : 10),
      );
      concurrent--;
    }
    const output =
      role === "planner"
        ? twoPlan
        : role === "researcher"
          ? findings
          : role === "synthesizer"
            ? {
                ...synthesis,
                claims: [
                  {
                    ...synthesis.claims[0],
                    evidence: ["a/a12", "a/b9", "b/a12", "b/b9"],
                  },
                ],
              }
            : {
                summary: "Checked all originals",
                verdict: "passed",
                checks: [
                  {
                    claimId: "count",
                    verdict: "supported",
                    evidence: ["a/a12", "a/b9", "b/a12", "b/b9"],
                    note: "Both independent reports preserve counts",
                  },
                ],
              };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(output) } }],
        usage: { prompt_tokens: 20, completion_tokens: 10 },
      }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const policy = JSON.parse(
    readFileSync(join(root, "harness/templates/research-policy.json"), "utf8"),
  );
  for (const c of Object.values(policy.models)) {
    c.provider = "openai-http";
    c.base_url = `http://127.0.0.1:${server.address().port}/v1`;
  }
  write(root, "00_context/research-policy.json", policy);
  init(root);
  const { stdout } = await promisify(execFile)(
    process.execPath,
    [
      join(repo, "scripts/kb-research.mjs"),
      "run",
      "--task",
      "r1",
      "--owner",
      "writer",
      "--execute",
    ],
    { cwd: root, env: { ...process.env, KB_ROOT: root }, maxBuffer: 2000000 },
  );
  const result = JSON.parse(stdout);
  assert.equal(result.task.status, "complete");
  assert.equal(result.budget.calls, 5);
  assert.equal(result.budget.totalTokens, 150);
  assert.equal(peak, 2);
  assert.equal(result.task.research.workers.filter((w) => w.result).length, 2);
});

test("worker paths cannot disguise a synthesis draft as original source evidence", (t) => {
  const root = fixture(t);
  init(root);
  ok(record(root, prepare(root, "planner"), plan));
  write(root, "04_synthesis/draft.md", "The pilot included 12 customers.");
  const bad = structuredClone(findings);
  bad.claims[0].evidence[0].path = "01_raw/../04_synthesis/draft.md";
  const result = record(root, prepare(root, "researcher", "a"), bad);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /outside registered sources/);
});
