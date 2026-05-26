#!/usr/bin/env node
// cli.mjs — entrypoint SkillOpt. Подкоманды Phase 1: list | rollout | score.
//
// Запуск через корневой package.json: `pnpm skill <verb>` (см. README).

import { loadConfig } from "./config.mjs";
import { createAdapter } from "./llm/adapter.mjs";
import { runRollout, runScore } from "./runner/rollout.mjs";
import { listSkillsWithEvals } from "./evals/loader.mjs";

const argv = process.argv.slice(2);
const verb = argv[0];

if (!verb || verb === "-h" || verb === "--help" || verb === "help") {
  printHelp();
  process.exit(verb ? 0 : 1);
}

try {
  switch (verb) {
    case "list":
      await cmdList(argv.slice(1));
      break;
    case "rollout":
      await cmdRollout(argv.slice(1));
      break;
    case "score":
      await cmdScore(argv.slice(1));
      break;
    case "reflect":
    case "diff":
    case "apply":
    case "revert":
      console.error(`[skillopt] подкоманда "${verb}" появится в Phase 2 (см. план).`);
      process.exit(2);
    default:
      console.error(`[skillopt] неизвестная подкоманда "${verb}". Запустите без аргументов для справки.`);
      process.exit(1);
  }
} catch (e) {
  console.error(e.message || String(e));
  process.exit(1);
}

// ---------- commands ----------

async function cmdList() {
  const skills = await listSkillsWithEvals();
  if (skills.length === 0) {
    console.log("[skillopt:list] не найдено скиллов в skills/.");
    return;
  }
  console.log("");
  console.log("  Skills и покрытие eval'ами");
  console.log("  ─────────────────────────────────────────────");
  for (const s of skills) {
    const file = s.skillFileExists ? "✓" : "—";
    console.log(`  ${file} ${s.skill.padEnd(36)} evals=${s.caseCount}`);
  }
  console.log("");
  console.log("  Запуск:  pnpm skill rollout <skill> [--case <id>]");
  console.log("");
}

async function cmdRollout(args) {
  const opts = parseArgs(args, { flags: ["ci", "yes", "json"] });
  const skillFilter = opts.positional[0] ?? null;
  const caseFilter = opts.flags.case ?? null;

  if (!skillFilter) {
    throw new Error("Использование: pnpm skill rollout <skill> [--case <id>] [--ci] [--yes]");
  }

  const { config, sourcePath, extraAdapters } = await loadConfig({
    overrides: pickConfigOverrides(opts.flags),
  });
  const adapter = createAdapter(config.provider, config, extraAdapters);

  console.error(
    `[skillopt:rollout] provider=${adapter.name} model=${config.model ?? "(default)"} skill=${skillFilter}${caseFilter ? ` case=${caseFilter}` : ""}`,
  );
  if (sourcePath) console.error(`[skillopt:rollout] config: ${sourcePath}`);

  const { runId, summary, traces, runDir } = await runRollout({
    adapter,
    config,
    skillFilter,
    caseFilter,
    ci: opts.flags.ci,
  });

  if (!runId) {
    console.error("[skillopt:rollout] не найдено ни одного eval-кейса.");
    process.exit(opts.flags.ci ? 1 : 0);
  }

  if (opts.flags.json) {
    process.stdout.write(JSON.stringify({ runId, summary, traces }, null, 2) + "\n");
  } else {
    printRolloutHuman({ runId, summary, traces, runDir });
  }

  if (opts.flags.ci && summary.pass_rate < 1) process.exit(1);
}

async function cmdScore(args) {
  const opts = parseArgs(args, { flags: [] });
  const runId = opts.positional[0];
  if (!runId) throw new Error("Использование: pnpm skill score <run-id>");
  const summary = await runScore(runId);
  console.error(`[skillopt:score] run=${runId} pass=${summary.passed}/${summary.total} (${(summary.pass_rate * 100).toFixed(1)}%)`);
}

// ---------- helpers ----------

function parseArgs(args, { flags = [] } = {}) {
  const out = { positional: [], flags: {} };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      if (flags.includes(key)) {
        out.flags[key] = true;
      } else {
        // value flag: --key value
        out.flags[key] = args[++i];
      }
    } else {
      out.positional.push(a);
    }
  }
  return out;
}

function pickConfigOverrides(flagsObj) {
  const out = {};
  if (flagsObj.provider) out.provider = flagsObj.provider;
  if (flagsObj.model) out.model = flagsObj.model;
  if (flagsObj["base-url"]) out.base_url = flagsObj["base-url"];
  if (flagsObj["api-key"]) out.api_key = flagsObj["api-key"];
  return out;
}

function printRolloutHuman({ runId, summary, traces, runDir }) {
  console.error("");
  console.error(`  Run: ${runId}`);
  console.error(`  Pass: ${summary.passed}/${summary.total} (${(summary.pass_rate * 100).toFixed(1)}%)`);
  console.error(`  Failed: ${summary.failed}   Errored: ${summary.errored}`);
  console.error(`  Tokens: in=${summary.tokens_in} out=${summary.tokens_out}`);
  console.error("");
  for (const t of traces) {
    const status = t.passed ? "✓" : t.error ? "ERR" : "✗";
    const tail = t.error ? ` — ${t.error.slice(0, 80)}` : ` score=${(t.score ?? 0).toFixed(2)} ${t.latency_ms}ms`;
    console.error(`  ${status} ${t.skill}__${t.case_id}${tail}`);
  }
  console.error("");
  console.error(`  Traces: ${runDir}/traces/`);
  console.error("");
}

function printHelp() {
  console.log(`
SkillOpt — оптимизация и регрессионное тестирование SKILL.md документов.

Использование:
  pnpm skill list                                  Список скиллов и покрытие eval'ами
  pnpm skill rollout <skill> [--case <id>]         Прогнать eval-кейсы через LLM
  pnpm skill score <run-id>                        Перепрогнать graders без LLM (offline)

Опции rollout:
  --provider <name>      claude-cli | openai-http (override config)
  --model <name>         например claude-3-5-sonnet / gpt-4o-mini / llama3
  --base-url <url>       для openai-http (Ollama: http://localhost:11434/v1)
  --api-key <key>        иначе берётся из env (SKILLOPT_API_KEY / OPENAI_API_KEY)
  --ci                   exit code 1 если pass-rate < 100%
  --yes                  пропустить confirmation для платных вызовов
  --json                 машинный вывод

Конфиг:
  .skillopt.json в корне репо, env vars SKILLOPT_*, или package.json#skillopt.
  Если не задано — auto-detect (claude CLI → openai-http при OPENAI_API_KEY).

Phase 2 verbs (reflect/diff/apply/revert) — в разработке.
`);
}
