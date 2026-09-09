import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  DEFAULT_RESEARCH_POLICY,
  loadResearchPolicy,
  researchBudget,
  researchModel,
  reserveResearchCall,
  validateResearchPolicy,
} from "../scripts/lib/research-policy.mjs";

function temporaryRoot(t) {
  const root = mkdtempSync(join(tmpdir(), "research-policy-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function writeJson(root, relativePath, value) {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function policy(overrides = {}) {
  const base = structuredClone(DEFAULT_RESEARCH_POLICY);
  return {
    ...base,
    ...overrides,
    models: overrides.models ?? base.models,
    roles: overrides.roles ?? base.roles,
    limits: { ...base.limits, ...(overrides.limits ?? {}) },
  };
}

test("default policy routes research to economy and judgment roles to frontier", () => {
  assert.equal(
    researchModel(DEFAULT_RESEARCH_POLICY, "researcher").alias,
    "economy",
  );
  assert.equal(
    researchModel(DEFAULT_RESEARCH_POLICY, "researcher").config.tier,
    "economy",
  );
  for (const role of ["planner", "synthesizer", "reviewer"]) {
    assert.equal(
      researchModel(DEFAULT_RESEARCH_POLICY, role).alias,
      "frontier",
    );
    assert.equal(
      researchModel(DEFAULT_RESEARCH_POLICY, role).config.tier,
      "frontier",
    );
  }
});

test("routing rejects an unknown role instead of silently falling back", () => {
  assert.throws(
    () => researchModel(DEFAULT_RESEARCH_POLICY, "fact-checker"),
    /Unknown research role: fact-checker/,
  );
});

test("routing always disables provider retries without mutating the policy", () => {
  const original = policy();
  const routed = researchModel(original, "researcher");
  assert.equal(routed.config.max_retries, 0);
  assert.equal(original.models.economy.max_retries, undefined);
});

test("validation uses declared tiers rather than hard-coded model aliases", () => {
  const custom = policy({
    models: {
      careful: {
        provider: "manual",
        model: "same-explicit-model",
        tier: "frontier",
      },
      fast: {
        provider: "manual",
        model: "same-explicit-model",
        tier: "economy",
      },
    },
    roles: {
      planner: "careful",
      researcher: "fast",
      synthesizer: "careful",
      reviewer: "careful",
    },
  });

  const validated = validateResearchPolicy(custom);
  assert.equal(researchModel(validated, "researcher").alias, "fast");
  assert.equal(validated.models.careful.model, validated.models.fast.model);
});

test("validation rejects missing roles, dangling references, and wrong role tiers", () => {
  const missingRole = policy();
  delete missingRole.roles.reviewer;
  assert.throws(() => validateResearchPolicy(missingRole), /roles\.reviewer/);

  assert.throws(
    () =>
      validateResearchPolicy(
        policy({ roles: { ...policy().roles, reviewer: "absent" } }),
      ),
    /roles\.reviewer.*unknown model alias/,
  );
  assert.throws(
    () =>
      validateResearchPolicy(
        policy({ roles: { ...policy().roles, researcher: "frontier" } }),
      ),
    /roles\.researcher.*economy tier/,
  );
});

test("validation allows only supported explicit providers and zero hidden retries", () => {
  for (const provider of [
    "manual",
    "claude-cli",
    "generic-cli",
    "openai-http",
    "ollama",
  ]) {
    const candidate = policy();
    candidate.models.economy.provider = provider;
    if (provider === "generic-cli")
      candidate.models.economy.cli = {
        command: "research-client",
        args: ["--model", "{{model}}"],
      };
    candidate.models.economy.api_key_env = "RESEARCH_API_KEY";
    candidate.models.economy.max_retries = 0;
    assert.equal(
      validateResearchPolicy(candidate).models.economy.provider,
      provider,
    );
  }

  const unknown = policy();
  unknown.models.economy.provider = "auto";
  assert.throws(
    () => validateResearchPolicy(unknown),
    /Unsupported research provider/,
  );

  const retries = policy();
  retries.models.economy.max_retries = 1;
  assert.throws(() => validateResearchPolicy(retries), /max_retries must be 0/);
});

test("validation rejects inline credentials while allowing an environment variable name", () => {
  for (const secret of [
    { api_key: "secret" },
    { apiKey: "secret" },
    { headers: { Authorization: "Bearer secret" } },
    { headers: { authorization: "Bearer secret" } },
  ]) {
    const candidate = policy();
    Object.assign(candidate.models.frontier, secret);
    assert.throws(
      () => validateResearchPolicy(candidate),
      /Inline credentials are not allowed/,
    );
  }

  const env = policy();
  env.models.frontier.api_key_env = "OPENAI_API_KEY";
  assert.equal(
    validateResearchPolicy(env).models.frontier.api_key_env,
    "OPENAI_API_KEY",
  );
  env.models.frontier.api_key_env = "not-valid-name";
  assert.throws(() => validateResearchPolicy(env), /api_key_env/);
});

test("validation rejects malformed numeric limits and prices", () => {
  for (const [field, value] of [
    ["maxWorkers", -1],
    ["maxConcurrent", 1.5],
    ["maxCalls", Number.NaN],
    ["maxContextChars", Number.POSITIVE_INFINITY],
    ["maxCostUsd", -0.01],
    ["reserveReviewCostUsd", Number.POSITIVE_INFINITY],
  ]) {
    assert.throws(
      () => validateResearchPolicy(policy({ limits: { [field]: value } })),
      new RegExp(`limits\\.${field}`),
    );
  }

  const badPrices = policy();
  badPrices.models.frontier.prices = {
    inputPerMillion: 1,
    outputPerMillion: Number.NaN,
  };
  assert.throws(() => validateResearchPolicy(badPrices), /outputPerMillion/);
});

test("validation rejects unknown top-level policy fields", () => {
  assert.throws(
    () => validateResearchPolicy({ ...policy(), fallbackProvider: "auto" }),
    /Unknown research policy field: fallbackProvider/,
  );
});

test("validation rejects concurrency and review reserves that exceed enabled caps", () => {
  assert.throws(
    () =>
      validateResearchPolicy(
        policy({ limits: { maxWorkers: 1, maxConcurrent: 2 } }),
      ),
    /maxConcurrent.*maxWorkers/,
  );
  assert.throws(
    () => validateResearchPolicy(policy({ limits: { maxTotalTokens: 7999 } })),
    /reserveReviewTokens.*maxTotalTokens/,
  );
  assert.throws(
    () =>
      validateResearchPolicy(
        policy({ limits: { maxCostUsd: 0, reserveReviewCostUsd: 0.01 } }),
      ),
    /reserveReviewCostUsd.*maxCostUsd/,
  );
});

test("empty history reports zero rather than unknown usage", () => {
  assert.deepEqual(researchBudget(DEFAULT_RESEARCH_POLICY, []), {
    calls: 0,
    pending: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    costUsd: 0,
    unknownUsage: false,
    remainingCalls: 16,
    blockedReasons: [],
  });
});

test("budget counts measured successes, provider errors, and pending reservations", () => {
  const priced = policy({
    models: {
      frontier: {
        provider: "manual",
        model: "frontier",
        tier: "frontier",
        prices: { inputPerMillion: 3, outputPerMillion: 4 },
      },
      economy: {
        provider: "manual",
        model: "economy",
        tier: "economy",
        prices: { inputPerMillion: 1, outputPerMillion: 2 },
      },
    },
  });
  const attempts = [
    {
      id: "a",
      role: "researcher",
      status: "complete",
      modelAlias: "economy",
      reservation: { tokens: 999, costUsd: 999 },
      usage: { input_tokens: 100, output_tokens: 20 },
    },
    {
      id: "b",
      role: "reviewer",
      status: "failed",
      modelAlias: "frontier",
      reservation: { tokens: 999, costUsd: 999 },
      usage: { input_tokens: 10, output_tokens: 5, external_cost_usd: 0.25 },
      error: "provider stopped after returning usage",
    },
    {
      id: "c",
      role: "researcher",
      status: "prepared",
      modelAlias: "economy",
      reservation: { tokens: 50, costUsd: 0.01 },
      usage: null,
    },
  ];

  const budget = researchBudget(priced, attempts);
  assert.equal(budget.calls, 3);
  assert.equal(budget.pending, 1);
  assert.equal(budget.inputTokens, 110);
  assert.equal(budget.outputTokens, 25);
  assert.equal(budget.totalTokens, 185);
  assert.ok(Math.abs(budget.costUsd - 0.26019) < 1e-12);
  assert.equal(budget.unknownUsage, false);
  assert.equal(budget.remainingCalls, 13);
});

test("settled attempts without measured tokens remain unknown instead of becoming zero", () => {
  const attempts = [
    {
      id: "failed",
      role: "researcher",
      status: "failed",
      modelAlias: "economy",
      reservation: { tokens: 200, costUsd: null },
      usage: null,
      error: "provider timeout",
    },
  ];
  const budget = researchBudget(DEFAULT_RESEARCH_POLICY, attempts);

  assert.equal(budget.calls, 1);
  assert.equal(budget.pending, 0);
  assert.equal(budget.inputTokens, null);
  assert.equal(budget.outputTokens, null);
  assert.equal(budget.totalTokens, null);
  assert.equal(budget.costUsd, null);
  assert.equal(budget.unknownUsage, true);
});

test("a strict token cap blocks reservations until unknown settled usage is reconciled", () => {
  const capped = policy({ limits: { maxTotalTokens: 20000 } });
  const attempts = [
    {
      id: "unknown",
      role: "planner",
      status: "complete",
      modelAlias: "frontier",
      reservation: { tokens: 10, costUsd: null },
      usage: null,
    },
  ];

  assert.match(
    researchBudget(capped, attempts).blockedReasons.join("\n"),
    /Token usage is unknown/,
  );
  assert.throws(
    () =>
      reserveResearchCall(capped, attempts, {
        role: "researcher",
        inputBytes: 1,
      }),
    /Token usage is unknown/,
  );
});

test("missing prices remain unknown and block a configured cost cap", () => {
  const capped = policy({ limits: { maxCostUsd: 1 } });
  const measured = [
    {
      id: "measured",
      role: "researcher",
      status: "complete",
      modelAlias: "economy",
      reservation: { tokens: 10, costUsd: null },
      usage: { input_tokens: 4, output_tokens: 2 },
    },
  ];

  const budget = researchBudget(capped, measured);
  assert.equal(budget.unknownUsage, false);
  assert.equal(budget.costUsd, null);
  assert.match(budget.blockedReasons.join("\n"), /Cost is unknown/);
  assert.throws(
    () =>
      reserveResearchCall(capped, [], { role: "researcher", inputBytes: 1 }),
    /price.*required.*cost cap/i,
  );
});

test("prepared researcher calls reserve budget and consume concurrency slots", () => {
  const attempts = [
    {
      id: "one",
      role: "researcher",
      status: "prepared",
      modelAlias: "economy",
      reservation: { tokens: 100, costUsd: null },
      usage: null,
    },
    {
      id: "two",
      role: "researcher",
      status: "prepared",
      modelAlias: "economy",
      reservation: { tokens: 120, costUsd: null },
      usage: null,
    },
  ];

  const budget = researchBudget(DEFAULT_RESEARCH_POLICY, attempts);
  assert.equal(budget.pending, 2);
  assert.equal(budget.totalTokens, 220);
  assert.match(
    budget.blockedReasons.join("\n"),
    /Researcher concurrency limit/,
  );
  assert.throws(
    () =>
      reserveResearchCall(DEFAULT_RESEARCH_POLICY, attempts, {
        role: "researcher",
        inputBytes: 1,
      }),
    /Researcher concurrency limit/,
  );
  assert.deepEqual(
    reserveResearchCall(DEFAULT_RESEARCH_POLICY, attempts, {
      role: "reviewer",
      inputBytes: 1,
      outputTokens: 2,
    }),
    { tokens: 3, costUsd: null },
  );
});

test("non-review calls preserve the review reserve while reviewers can use the full cap", () => {
  const capped = policy({
    models: {
      frontier: {
        provider: "manual",
        model: "frontier",
        tier: "frontier",
        prices: { inputPerMillion: 10000, outputPerMillion: 10000 },
      },
      economy: {
        provider: "manual",
        model: "economy",
        tier: "economy",
        prices: { inputPerMillion: 10000, outputPerMillion: 10000 },
      },
    },
    limits: {
      maxTotalTokens: 100,
      reserveReviewTokens: 30,
      maxCostUsd: 1,
      reserveReviewCostUsd: 0.25,
      maxOutputTokens: 100,
    },
  });

  assert.deepEqual(
    reserveResearchCall(capped, [], {
      role: "researcher",
      inputBytes: 10,
      outputTokens: 60,
    }),
    { tokens: 70, costUsd: 0.7 },
  );
  assert.throws(
    () =>
      reserveResearchCall(capped, [], {
        role: "researcher",
        inputBytes: 11,
        outputTokens: 60,
      }),
    /reserved for reviewer/,
  );
  assert.deepEqual(
    reserveResearchCall(capped, [], {
      role: "reviewer",
      inputBytes: 40,
      outputTokens: 60,
    }),
    { tokens: 100, costUsd: 1 },
  );
});

test("non-review calls also preserve the configured review cost reserve", () => {
  const capped = policy({
    models: {
      frontier: {
        provider: "manual",
        model: "frontier",
        tier: "frontier",
        prices: { inputPerMillion: 10000, outputPerMillion: 10000 },
      },
      economy: {
        provider: "manual",
        model: "economy",
        tier: "economy",
        prices: { inputPerMillion: 10000, outputPerMillion: 10000 },
      },
    },
    limits: {
      maxCostUsd: 1,
      reserveReviewCostUsd: 0.25,
      maxOutputTokens: 100,
    },
  });

  assert.throws(
    () =>
      reserveResearchCall(capped, [], {
        role: "researcher",
        inputBytes: 16,
        outputTokens: 60,
      }),
    /reserved for reviewer/,
  );
  assert.deepEqual(
    reserveResearchCall(capped, [], {
      role: "reviewer",
      inputBytes: 40,
      outputTokens: 60,
    }),
    { tokens: 100, costUsd: 1 },
  );
});

test("pending reservations reduce the remaining token budget for parallel calls", () => {
  const capped = policy({
    limits: {
      maxTotalTokens: 500,
      reserveReviewTokens: 100,
      maxOutputTokens: 300,
    },
  });
  const pending = [
    {
      id: "pending",
      role: "planner",
      status: "prepared",
      modelAlias: "frontier",
      reservation: { tokens: 250, costUsd: null },
      usage: null,
    },
  ];

  assert.deepEqual(
    reserveResearchCall(capped, pending, {
      role: "researcher",
      inputBytes: 50,
      outputTokens: 100,
    }),
    { tokens: 150, costUsd: null },
  );
  assert.throws(
    () =>
      reserveResearchCall(capped, pending, {
        role: "researcher",
        inputBytes: 51,
        outputTokens: 100,
      }),
    /reserved for reviewer/,
  );
});

test("call ceiling includes failed calls and actual overspend stays blocked", () => {
  const capped = policy({
    limits: { maxCalls: 1, maxTotalTokens: 9000 },
  });
  const attempts = [
    {
      id: "error",
      role: "reviewer",
      status: "failed",
      modelAlias: "frontier",
      reservation: { tokens: 10, costUsd: null },
      usage: { input_tokens: 9001, output_tokens: 0 },
      error: "late provider error",
    },
  ];

  const reasons = researchBudget(capped, attempts).blockedReasons.join("\n");
  assert.match(reasons, /Maximum research calls reached/);
  assert.match(reasons, /Token budget exhausted/);
  assert.throws(
    () =>
      reserveResearchCall(capped, attempts, {
        role: "reviewer",
        inputBytes: 0,
        outputTokens: 0,
      }),
    /Maximum research calls reached/,
  );
});

test("reservation validates byte and output ceilings and does not mutate history", () => {
  const attempts = [];
  assert.throws(
    () =>
      reserveResearchCall(DEFAULT_RESEARCH_POLICY, attempts, {
        role: "researcher",
        inputBytes: 1.5,
      }),
    /inputBytes must be a nonnegative integer/,
  );
  assert.throws(
    () =>
      reserveResearchCall(DEFAULT_RESEARCH_POLICY, attempts, {
        role: "researcher",
        inputBytes: 1,
        outputTokens: 4001,
      }),
    /outputTokens.*maxOutputTokens/,
  );
  assert.deepEqual(attempts, []);
});

test("policy loader falls back to a detached default with a stable hash", (t) => {
  const root = temporaryRoot(t);
  const first = loadResearchPolicy(root);
  assert.equal(first.path, null);
  assert.deepEqual(first.policy, DEFAULT_RESEARCH_POLICY);
  assert.match(first.sha256, /^[a-f0-9]{64}$/);

  first.policy.roles.researcher = "frontier";
  const second = loadResearchPolicy(root);
  assert.equal(second.policy.roles.researcher, "economy");
  assert.equal(second.sha256, first.sha256);
});

test("policy loader reads the project override and hashes semantic JSON deterministically", (t) => {
  const root = temporaryRoot(t);
  const custom = policy({ limits: { maxCalls: 7 } });
  writeJson(root, "00_context/research-policy.json", custom);
  const first = loadResearchPolicy(root);
  assert.equal(first.path, "00_context/research-policy.json");
  assert.equal(first.policy.limits.maxCalls, 7);

  writeJson(root, "00_context/research-policy.json", {
    limits: custom.limits,
    roles: custom.roles,
    models: custom.models,
    version: custom.version,
  });
  assert.equal(loadResearchPolicy(root).sha256, first.sha256);

  custom.limits.maxCalls = 8;
  writeJson(root, "00_context/research-policy.json", custom);
  assert.notEqual(loadResearchPolicy(root).sha256, first.sha256);
});

test("policy loader uses the shared path guard and does not expose inline secrets", (t) => {
  const root = temporaryRoot(t);
  const outside = temporaryRoot(t);
  symlinkSync(outside, join(root, "00_context"));
  assert.throws(() => loadResearchPolicy(root), /Skill symlink not portable/);

  rmSync(join(root, "00_context"));
  const secretPolicy = policy();
  secretPolicy.models.frontier.api_key = "do-not-print-this";
  writeJson(root, "00_context/research-policy.json", secretPolicy);
  assert.throws(
    () => loadResearchPolicy(root),
    (error) =>
      /Inline credentials/.test(error.message) &&
      !error.message.includes("do-not-print-this"),
  );
});

test("shipped policy template is valid and matches the built-in fallback", () => {
  const template = JSON.parse(
    readFileSync(
      new URL("../harness/templates/research-policy.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(validateResearchPolicy(template), DEFAULT_RESEARCH_POLICY);
});

test("research CLI routing requires a model argument and does not resume a Claude author context", () => {
  const policy = structuredClone(DEFAULT_RESEARCH_POLICY);
  policy.models.economy.provider = "generic-cli";
  policy.models.economy.cli = { command: "research-client", args: [] };
  assert.throws(() => validateResearchPolicy(policy), /model/);
  policy.models.economy.cli.args = ["--model", "{{model}}"];
  assert.doesNotThrow(() => validateResearchPolicy(policy));
  policy.models.frontier.provider = "claude-cli";
  policy.models.frontier.cli = { extra_args: ["--resume", "old-session"] };
  assert.throws(() => validateResearchPolicy(policy), /context|resume/);
});
