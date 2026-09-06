// Load the same canonical rules for clients that consume a generated prompt.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { KB_ROOT } from "./kb-root.mjs";
export function loadAgentContext(root = KB_ROOT) {
  const parts = [];
  for (const path of [
    "AGENTS.md",
    "harness/rules/evidence.md",
    "harness/rules/workflow.md",
  ]) {
    try {
      const text = readFileSync(join(root, path), "utf8");
      if (text.trim()) parts.push(text);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return (
    parts.join("\n\n") ||
    "Separate FACT, INFERENCE, ASSUMPTION, UNKNOWN and RECOMMENDATION. Cite sources as [source: /path]. Never invent evidence or approve a decision without authority."
  );
}
