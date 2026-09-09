import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { assertSafePath } from "./skills.mjs";

export const DEFAULT_RESEARCH_POLICY = Object.freeze({
  version: 1,
  models: Object.freeze({
    frontier: Object.freeze({
      provider: "manual",
      model: "frontier",
      tier: "frontier",
    }),
    economy: Object.freeze({
      provider: "manual",
      model: "economy",
      tier: "economy",
    }),
  }),
  roles: Object.freeze({
    planner: "frontier",
    researcher: "economy",
    synthesizer: "frontier",
    reviewer: "frontier",
  }),
  limits: Object.freeze({
    maxWorkers: 4,
    maxConcurrent: 2,
    maxWorkerAttempts: 2,
    maxReviewRounds: 2,
    maxCalls: 16,
    maxContextChars: 40000,
    maxOutputTokens: 4000,
    maxTotalTokens: null,
    maxCostUsd: null,
    reserveReviewTokens: 8000,
    reserveReviewCostUsd: 0,
  }),
});

const PROVIDERS = new Set([
  "manual",
  "claude-cli",
  "generic-cli",
  "openai-http",
  "ollama",
]);
const TIERS = new Set(["frontier", "economy"]);
const REQUIRED_ROLE_TIERS = Object.freeze({
  planner: "frontier",
  researcher: "economy",
  synthesizer: "frontier",
  reviewer: "frontier",
});
const INTEGER_LIMITS = [
  "maxWorkers",
  "maxConcurrent",
  "maxWorkerAttempts",
  "maxReviewRounds",
  "maxCalls",
  "maxContextChars",
  "maxOutputTokens",
  "reserveReviewTokens",
];
const OPTIONAL_INTEGER_LIMITS = ["maxTotalTokens"];
const NUMBER_LIMITS = ["reserveReviewCostUsd"];
const OPTIONAL_NUMBER_LIMITS = ["maxCostUsd"];

function isRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertRecord(value, path) {
  if (!isRecord(value)) throw Error(`${path} must be an object`);
}

function assertNonnegativeFinite(value, path) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw Error(`${path} must be a nonnegative finite number`);
  }
}

function assertNonnegativeInteger(value, path) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw Error(`${path} must be a nonnegative integer`);
  }
}

function assertJsonConfig(value, path, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return;
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw Error(`${path} must contain only finite JSON values`);
    return;
  }
  if (typeof value !== "object")
    throw Error(`${path} must contain only JSON values`);
  if (seen.has(value))
    throw Error(`${path} must not contain circular references`);
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      assertJsonConfig(entry, `${path}[${index}]`, seen),
    );
  } else {
    assertRecord(value, path);
    for (const [key, entry] of Object.entries(value)) {
      if (
        key === "api_key" ||
        key === "apiKey" ||
        key.toLowerCase() === "authorization"
      ) {
        throw Error(
          `Inline credentials are not allowed in ${path}; use api_key_env`,
        );
      }
      if (
        key === "api_key_env" &&
        (typeof entry !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(entry))
      ) {
        throw Error(`${path}.api_key_env must name an environment variable`);
      }
      assertJsonConfig(entry, `${path}.${key}`, seen);
    }
  }
  seen.delete(value);
}

export function validateResearchPolicy(policy) {
  assertRecord(policy, "research policy");
  const unknownPolicyField = Object.keys(policy).find(
    (field) => !["version", "models", "roles", "limits"].includes(field),
  );
  if (unknownPolicyField)
    throw Error(`Unknown research policy field: ${unknownPolicyField}`);
  if (policy.version !== 1) throw Error("research policy.version must be 1");
  assertRecord(policy.models, "research policy.models");
  if (Object.keys(policy.models).length === 0)
    throw Error("research policy.models must not be empty");

  for (const [alias, config] of Object.entries(policy.models)) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(alias)) {
      throw Error(`Invalid research model alias: ${alias}`);
    }
    assertRecord(config, `models.${alias}`);
    assertJsonConfig(config, `models.${alias}`);
    if (!PROVIDERS.has(config.provider))
      throw Error(`Unsupported research provider for models.${alias}`);
    if (typeof config.model !== "string" || !config.model.trim()) {
      throw Error(`models.${alias}.model must be a nonempty string`);
    }
    if (!TIERS.has(config.tier))
      throw Error(`models.${alias}.tier must be frontier or economy`);
    if (config.max_retries !== undefined && config.max_retries !== 0) {
      throw Error(`models.${alias}.max_retries must be 0`);
    }
    if (config.provider === "generic-cli") {
      if (
        !config.cli?.command ||
        !Array.isArray(config.cli.args) ||
        !config.cli.args.every((a) => typeof a === "string") ||
        !config.cli.args.some((a) => a.includes("{{model}}"))
      ) {
        throw Error(
          `models.${alias}.cli needs a command and args passing {{model}} explicitly`,
        );
      }
    }
    if (
      config.provider === "claude-cli" &&
      config.cli?.extra_args?.some((a) =>
        /^(--resume|--continue|--session-id|--model|--fallback-model)(=|$)|^-[cr]$/.test(
          a,
        ),
      )
    ) {
      throw Error(
        `models.${alias}.cli must not override the model or resume another context`,
      );
    }
    if (config.prices !== undefined) {
      assertRecord(config.prices, `models.${alias}.prices`);
      for (const field of ["inputPerMillion", "outputPerMillion"]) {
        assertNonnegativeFinite(
          config.prices[field],
          `models.${alias}.prices.${field}`,
        );
      }
      const unknownPriceFields = Object.keys(config.prices).filter(
        (field) => field !== "inputPerMillion" && field !== "outputPerMillion",
      );
      if (unknownPriceFields.length)
        throw Error(
          `Unknown models.${alias}.prices field: ${unknownPriceFields[0]}`,
        );
    }
  }

  assertRecord(policy.roles, "research policy.roles");
  for (const [role, expectedTier] of Object.entries(REQUIRED_ROLE_TIERS)) {
    if (typeof policy.roles[role] !== "string" || !policy.roles[role]) {
      throw Error(`research policy.roles.${role} is required`);
    }
    const model = policy.models[policy.roles[role]];
    if (!model)
      throw Error(
        `research policy.roles.${role} references unknown model alias`,
      );
    if (model.tier !== expectedTier) {
      throw Error(
        `research policy.roles.${role} must reference a model with ${expectedTier} tier`,
      );
    }
  }
  for (const [role, alias] of Object.entries(policy.roles)) {
    if (
      typeof role !== "string" ||
      !role ||
      typeof alias !== "string" ||
      !policy.models[alias]
    ) {
      throw Error(
        `research policy.roles.${role} references unknown model alias`,
      );
    }
  }

  assertRecord(policy.limits, "research policy.limits");
  const knownLimits = new Set([
    ...INTEGER_LIMITS,
    ...OPTIONAL_INTEGER_LIMITS,
    ...NUMBER_LIMITS,
    ...OPTIONAL_NUMBER_LIMITS,
  ]);
  for (const field of INTEGER_LIMITS)
    assertNonnegativeInteger(policy.limits[field], `limits.${field}`);
  for (const field of OPTIONAL_INTEGER_LIMITS) {
    if (policy.limits[field] !== null)
      assertNonnegativeInteger(policy.limits[field], `limits.${field}`);
  }
  for (const field of NUMBER_LIMITS)
    assertNonnegativeFinite(policy.limits[field], `limits.${field}`);
  for (const field of OPTIONAL_NUMBER_LIMITS) {
    if (policy.limits[field] !== null)
      assertNonnegativeFinite(policy.limits[field], `limits.${field}`);
  }
  const unknownLimit = Object.keys(policy.limits).find(
    (field) => !knownLimits.has(field),
  );
  if (unknownLimit)
    throw Error(`Unknown research policy limit: ${unknownLimit}`);
  if (policy.limits.maxConcurrent > policy.limits.maxWorkers) {
    throw Error("limits.maxConcurrent must not exceed limits.maxWorkers");
  }
  if (
    policy.limits.maxTotalTokens !== null &&
    policy.limits.reserveReviewTokens > policy.limits.maxTotalTokens
  ) {
    throw Error(
      "limits.reserveReviewTokens must not exceed limits.maxTotalTokens",
    );
  }
  if (
    policy.limits.maxCostUsd !== null &&
    policy.limits.reserveReviewCostUsd > policy.limits.maxCostUsd
  ) {
    throw Error(
      "limits.reserveReviewCostUsd must not exceed limits.maxCostUsd",
    );
  }

  return structuredClone(policy);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function policyHash(policy) {
  return createHash("sha256").update(canonicalJson(policy)).digest("hex");
}

export function loadResearchPolicy(root) {
  const relativePath = "00_context/research-policy.json";
  const absolutePath = assertSafePath(root, relativePath);
  let path = null;
  let candidate = DEFAULT_RESEARCH_POLICY;
  if (existsSync(absolutePath)) {
    path = relativePath;
    try {
      candidate = JSON.parse(readFileSync(absolutePath, "utf8"));
    } catch (error) {
      throw Error(`Invalid JSON in ${relativePath}: ${error.message}`);
    }
  }
  const policy = validateResearchPolicy(candidate);
  return { policy, path, sha256: policyHash(policy) };
}

export function researchModel(policy, role) {
  const alias = policy?.roles?.[role];
  if (!alias || !policy?.models?.[alias])
    throw Error(`Unknown research role: ${role}`);
  return { alias, config: { ...policy.models[alias], max_retries: 0 } };
}

function isKnownUsage(usage) {
  return (
    isRecord(usage) &&
    typeof usage.input_tokens === "number" &&
    Number.isFinite(usage.input_tokens) &&
    usage.input_tokens >= 0 &&
    typeof usage.output_tokens === "number" &&
    Number.isFinite(usage.output_tokens) &&
    usage.output_tokens >= 0
  );
}

function attemptCost(config, usage) {
  if (!config.prices) return null;
  if (
    usage.external_cost_usd !== undefined &&
    (typeof usage.external_cost_usd !== "number" ||
      !Number.isFinite(usage.external_cost_usd) ||
      usage.external_cost_usd < 0)
  ) {
    return null;
  }
  return (
    (usage.input_tokens * config.prices.inputPerMillion) / 1_000_000 +
    (usage.output_tokens * config.prices.outputPerMillion) / 1_000_000 +
    (usage.external_cost_usd ?? 0)
  );
}

function summarizeBudget(policy, attempts) {
  if (!Array.isArray(attempts))
    throw Error("research attempts must be an array");
  let pending = 0;
  let pendingResearchers = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let reservedTokens = 0;
  let costUsd = 0;
  let unknownUsage = false;
  let unknownCost = false;

  for (const [index, attempt] of attempts.entries()) {
    const path = `attempts[${index}]`;
    assertRecord(attempt, path);
    if (!["prepared", "complete", "failed"].includes(attempt.status)) {
      throw Error(`${path}.status must be prepared, complete, or failed`);
    }
    if (!policy.models[attempt.modelAlias])
      throw Error(`${path}.modelAlias is not in the research policy`);
    if (typeof attempt.role !== "string" || !policy.roles[attempt.role]) {
      throw Error(`${path}.role is not in the research policy`);
    }
    assertRecord(attempt.reservation, `${path}.reservation`);
    assertNonnegativeInteger(
      attempt.reservation.tokens,
      `${path}.reservation.tokens`,
    );
    if (attempt.reservation.costUsd !== null) {
      assertNonnegativeFinite(
        attempt.reservation.costUsd,
        `${path}.reservation.costUsd`,
      );
    }

    if (attempt.status === "prepared") {
      pending++;
      if (attempt.role === "researcher") pendingResearchers++;
      reservedTokens += attempt.reservation.tokens;
      if (attempt.reservation.costUsd === null) unknownCost = true;
      else costUsd += attempt.reservation.costUsd;
      continue;
    }

    if (!isKnownUsage(attempt.usage)) {
      unknownUsage = true;
      unknownCost = true;
      continue;
    }
    inputTokens += attempt.usage.input_tokens;
    outputTokens += attempt.usage.output_tokens;
    const cost = attemptCost(policy.models[attempt.modelAlias], attempt.usage);
    if (cost === null) unknownCost = true;
    else costUsd += cost;
  }

  const totalTokens = unknownUsage
    ? null
    : inputTokens + outputTokens + reservedTokens;
  const reasons = [];
  if (attempts.length >= policy.limits.maxCalls) {
    reasons.push(
      `Maximum research calls reached (${attempts.length}/${policy.limits.maxCalls})`,
    );
  }
  if (pendingResearchers >= policy.limits.maxConcurrent) {
    reasons.push(
      `Researcher concurrency limit reached (${pendingResearchers}/${policy.limits.maxConcurrent})`,
    );
  }
  if (policy.limits.maxTotalTokens !== null) {
    if (totalTokens === null) {
      reasons.push(
        "Token usage is unknown; reconcile settled attempts before reserving under maxTotalTokens",
      );
    } else if (totalTokens >= policy.limits.maxTotalTokens) {
      reasons.push(
        `Token budget exhausted (${totalTokens}/${policy.limits.maxTotalTokens})`,
      );
    }
  }
  if (policy.limits.maxCostUsd !== null) {
    if (unknownCost) {
      reasons.push(
        "Cost is unknown; reconcile usage or prices before reserving under maxCostUsd",
      );
    } else if (costUsd >= policy.limits.maxCostUsd) {
      reasons.push(
        `Cost budget exhausted (${costUsd}/${policy.limits.maxCostUsd} USD)`,
      );
    }
  }

  return {
    calls: attempts.length,
    pending,
    pendingResearchers,
    inputTokens: unknownUsage ? null : inputTokens,
    outputTokens: unknownUsage ? null : outputTokens,
    totalTokens,
    costUsd: unknownCost ? null : costUsd,
    unknownUsage,
    remainingCalls: Math.max(0, policy.limits.maxCalls - attempts.length),
    blockedReasons: reasons,
  };
}

export function researchBudget(policy, attempts) {
  const validated = validateResearchPolicy(policy);
  const { pendingResearchers: _pendingResearchers, ...budget } =
    summarizeBudget(validated, attempts);
  return budget;
}

export function reserveResearchCall(policy, attempts, options) {
  const validated = validateResearchPolicy(policy);
  assertRecord(options, "research reservation options");
  const { role, inputBytes } = options;
  const { config } = researchModel(validated, role);
  if (!Number.isSafeInteger(inputBytes) || inputBytes < 0) {
    throw Error("inputBytes must be a nonnegative integer");
  }
  const outputTokens = options.outputTokens ?? validated.limits.maxOutputTokens;
  if (!Number.isSafeInteger(outputTokens) || outputTokens < 0) {
    throw Error("outputTokens must be a nonnegative integer");
  }
  if (outputTokens > validated.limits.maxOutputTokens) {
    throw Error(
      `outputTokens must not exceed limits.maxOutputTokens (${validated.limits.maxOutputTokens})`,
    );
  }
  const tokens = inputBytes + outputTokens;
  if (!Number.isSafeInteger(tokens))
    throw Error("research token reservation exceeds the safe integer range");
  const costUsd = config.prices
    ? (inputBytes * config.prices.inputPerMillion) / 1_000_000 +
      (outputTokens * config.prices.outputPerMillion) / 1_000_000
    : null;
  const budget = summarizeBudget(validated, attempts);

  if (budget.calls >= validated.limits.maxCalls) {
    throw Error(
      `Maximum research calls reached (${budget.calls}/${validated.limits.maxCalls})`,
    );
  }
  if (
    role === "researcher" &&
    budget.pendingResearchers >= validated.limits.maxConcurrent
  ) {
    throw Error(
      `Researcher concurrency limit reached (${budget.pendingResearchers}/${validated.limits.maxConcurrent})`,
    );
  }
  if (validated.limits.maxTotalTokens !== null) {
    if (budget.totalTokens === null) {
      throw Error(
        "Token usage is unknown; reconcile settled attempts before reserving under maxTotalTokens",
      );
    }
    const roleCeiling =
      role === "reviewer"
        ? validated.limits.maxTotalTokens
        : validated.limits.maxTotalTokens -
          validated.limits.reserveReviewTokens;
    if (budget.totalTokens + tokens > roleCeiling) {
      if (
        role !== "reviewer" &&
        budget.totalTokens + tokens <= validated.limits.maxTotalTokens
      ) {
        throw Error(
          `Token reservation would consume ${validated.limits.reserveReviewTokens} tokens reserved for reviewer`,
        );
      }
      throw Error(
        `Token reservation exceeds maxTotalTokens (${budget.totalTokens + tokens}/${validated.limits.maxTotalTokens})`,
      );
    }
  }
  if (validated.limits.maxCostUsd !== null) {
    if (costUsd === null) {
      throw Error(
        `Model prices are required to reserve a call under a cost cap (${role})`,
      );
    }
    if (budget.costUsd === null) {
      throw Error(
        "Cost is unknown; reconcile usage or prices before reserving under maxCostUsd",
      );
    }
    const roleCeiling =
      role === "reviewer"
        ? validated.limits.maxCostUsd
        : validated.limits.maxCostUsd - validated.limits.reserveReviewCostUsd;
    if (budget.costUsd + costUsd > roleCeiling) {
      if (
        role !== "reviewer" &&
        budget.costUsd + costUsd <= validated.limits.maxCostUsd
      ) {
        throw Error(
          `Cost reservation would consume ${validated.limits.reserveReviewCostUsd} USD reserved for reviewer`,
        );
      }
      throw Error(
        `Cost reservation exceeds maxCostUsd (${budget.costUsd + costUsd}/${validated.limits.maxCostUsd} USD)`,
      );
    }
  }

  return { tokens, costUsd };
}
