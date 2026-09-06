// Shared explicit runtime for think, critic and dream; reuses SkillOpt adapters.
import { createAdapter } from "../skillopt/llm/adapter.mjs";
import { loadKbConfig } from "./kb-root.mjs";
export async function completePrompt(prompt, { execute = false, config } = {}) {
  const cfg = config ?? (await loadKbConfig()).llm ?? {};
  if (!execute || !cfg.provider || cfg.provider === "manual")
    return {
      executed: false,
      prompt,
      reason:
        "Manual prompt mode (configure kb.config.mjs llm and pass --execute).",
    };
  const timeout = cfg.timeout_ms ?? 300000,
    retries = cfg.max_retries ?? 0;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 1800000)
    throw Error("llm.timeout_ms must be 1..1800000");
  if (!Number.isInteger(retries) || retries < 0 || retries > 3)
    throw Error("llm.max_retries must be 0..3");
  if (cfg.provider === "auto")
    throw Error(
      "Choose an explicit LLM provider; auto is disabled for KB tasks",
    );
  const adapter = createAdapter(cfg.provider, {
    ...cfg,
    timeout_ms: timeout,
    max_retries: retries,
  });
  const result = await adapter.complete({ user: prompt });
  if (!result.text?.trim()) throw Error("Provider returned an empty response");
  return { ...result, executed: true, provider: cfg.provider };
}
