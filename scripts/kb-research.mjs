#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { KB_ROOT } from "./lib/kb-root.mjs";
import {
  initializeResearch,
  prepareResearch,
  recordResearch,
  reviseResearch,
  reconcileResearchUsage,
  showResearch,
  runResearch,
} from "./lib/research-runner.mjs";
const args = process.argv.slice(2),
  verb = args.shift();
const value = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  if (!args[i + 1] || args[i + 1].startsWith("--"))
    throw Error(`${name} requires a value`);
  return args[i + 1];
};
const values = (name) =>
  args.flatMap((x, i) => (x === name ? [args[i + 1]] : []));
try {
  if (
    !verb ||
    verb === "help" ||
    args.includes("--help") ||
    verb === "--help"
  ) {
    console.log(`Research tasks with separate model roles and durable evidence:
  kb:research init --task ID --owner NAME --question TEXT [--source PATH ...]
  kb:research show --task ID [--json]
  kb:research prepare --task ID --owner NAME --role planner|researcher|synthesizer|reviewer [--worker ID]
  kb:research record --task ID --owner NAME --attempt ID --file RESPONSE.json
  kb:research run --task ID --owner NAME [--role ROLE] [--worker ID] [--execute]
  kb:research revise --task ID --owner NAME [--worker ID] --reason TEXT
  kb:research reconcile --task ID --owner NAME --attempt ID --file USAGE.json --reason TEXT

prepare returns a prompt plus expected output shape. Manual response:
{model,contextId,usage:{input_tokens,output_tokens,external_cost_usd?}|null,output}
Use {model,contextId,usage,error} to settle a failed/interrupted attempt.
reconcile only fills unknown settled usage and requires an explanation.
run without --execute prepares prompts; run --execute uses explicit project model adapters.
Policy: optional 00_context/research-policy.json; default is manual with no paid requests.
Sources are readable snapshots in your KB. HTTP model adapters do not browse the web.
Model identity/usage from manual clients are recorded claims. See docs/research.md.`);
  } else {
    const seen = new Set();
    for (let i = 0; i < args.length; i++) {
      const flag = args[i];
      if (
        ![
          "--task",
          "--owner",
          "--role",
          "--worker",
          "--attempt",
          "--reason",
          "--question",
          "--source",
          "--file",
          "--execute",
          "--json",
        ].includes(flag)
      )
        throw Error(`Unknown research option: ${flag}`);
      if (seen.has(flag) && flag !== "--source")
        throw Error(`Duplicate option: ${flag}`);
      seen.add(flag);
      if (
        !["--execute", "--json"].includes(flag) &&
        (!args[++i] || args[i].startsWith("--"))
      )
        throw Error(`${flag} requires a value`);
    }
    const options = {
      task: value("--task"),
      owner: value("--owner"),
      role: value("--role"),
      worker: value("--worker"),
      attempt: value("--attempt"),
      reason: value("--reason"),
      execute: args.includes("--execute"),
    };
    let result;
    if (verb === "init")
      result = await initializeResearch(KB_ROOT, {
        ...options,
        question: value("--question"),
        sources: values("--source"),
      });
    else if (verb === "show") result = showResearch(KB_ROOT, options.task);
    else if (verb === "prepare") result = prepareResearch(KB_ROOT, options);
    else if (verb === "record")
      result = recordResearch(KB_ROOT, {
        ...options,
        response: JSON.parse(readFileSync(value("--file"), "utf8")),
      });
    else if (verb === "revise") result = reviseResearch(KB_ROOT, options);
    else if (verb === "reconcile")
      result = reconcileResearchUsage(KB_ROOT, {
        ...options,
        usage: JSON.parse(readFileSync(value("--file"), "utf8")),
      });
    else if (verb === "run") {
      process.chdir(KB_ROOT);
      result = await runResearch(KB_ROOT, options);
    } else throw Error(`Unknown research command: ${verb}`);
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
