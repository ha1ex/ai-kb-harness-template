// config.mjs — резолв конфига SkillOpt.
//
// Порядок приоритета (высокий → низкий):
//   1. CLI флаги (--provider, --model, --base-url, --api-key)  — переданы вызывающим
//   2. Env vars (SKILLOPT_*, и fallback OPENAI_API_KEY / ANTHROPIC_API_KEY)
//   3. cosmiconfig: .skillopt.{json,js,yaml,yml}, package.json#skillopt
//   4. Hard defaults
//
// Default provider is manual. Execution requires an explicit configured provider.

import { cosmiconfig } from "cosmiconfig";
import { KB_ROOT } from "../lib/kb-root.mjs";

const MODULE = "skillopt";

export async function loadConfig({ cwd = KB_ROOT, overrides = {} } = {}) {
  const explorer = cosmiconfig(MODULE, {
    searchPlaces: [
      `.${MODULE}.json`,
      `.${MODULE}rc.json`,
      `.${MODULE}.js`,
      `.${MODULE}.yaml`,
      `.${MODULE}.yml`,
      `package.json`,
    ],
  });

  const found = await explorer.search(cwd);
  const fileCfg = found?.config ?? {};

  const merged = mergeDeep(
    defaults(),
    fileCfg,
    fromEnv(),
    overrides,
  );

  if (merged.provider === "auto") throw Error("Choose an explicit SkillOpt provider; auto detection is disabled.");

  return {
    config: merged,
    sourcePath: found?.filepath ?? null,
    extraAdapters: extractCustomAdapters(fileCfg),
  };
}

function defaults() {
  return {
    provider: "manual",
    model: null,
    base_url: null,
    api_key: null,
    timeout_ms: 300_000,
    concurrency: 2,
    graders: { default: "contains" },
    budget: { per_run_usd: 1.0, monthly_usd: 5.0 },
  };
}

function fromEnv() {
  const out = {};
  if (process.env.SKILLOPT_PROVIDER) out.provider = process.env.SKILLOPT_PROVIDER;
  if (process.env.SKILLOPT_MODEL) out.model = process.env.SKILLOPT_MODEL;
  if (process.env.SKILLOPT_BASE_URL) out.base_url = process.env.SKILLOPT_BASE_URL;
  if (process.env.SKILLOPT_API_KEY) out.api_key = process.env.SKILLOPT_API_KEY;
  if (process.env.SKILLOPT_TIMEOUT_MS) out.timeout_ms = Number(process.env.SKILLOPT_TIMEOUT_MS);
  if (process.env.SKILLOPT_CONCURRENCY) out.concurrency = Number(process.env.SKILLOPT_CONCURRENCY);
  return out;
}

function extractCustomAdapters(fileCfg) {
  if (!fileCfg || typeof fileCfg !== "object") return {};
  if (fileCfg.adapters && typeof fileCfg.adapters === "object") return fileCfg.adapters;
  return {};
}

function mergeDeep(...sources) {
  const out = {};
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const [k, v] of Object.entries(src)) {
      if (v == null) continue;
      if (typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object" && !Array.isArray(out[k])) {
        out[k] = mergeDeep(out[k], v);
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}
