---
id: C-092
tier: C
category: "Engineering productivity"
kind: tactic
title: "Codex YOLO mode — full-auto autonomy via `--dangerously-bypass-approvals-and-sandbox`"
subtitle: "Problem solved: Codex's default approval prompts kill overnight autonomous runs; three escalating flags trade safety for un-paused throughput on isolated machines."
source: https://www.cybos.ai/cases/C-092
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "engineer comfortable with sandboxed autonomous Codex runs"
type: case
version: v0.1
---
# Codex YOLO mode — full-auto autonomy via `--dangerously-bypass-approvals-and-sandbox`

> Problem solved: Codex's default approval prompts kill overnight autonomous runs; three escalating flags trade safety for un-paused throughput on isolated machines.

## What

Three modes in increasing trust order. Option 1 (recommended): `codex --dangerously-bypass-approvals-and-sandbox`. Option 2 "full-auto": `codex exec --full-auto "<task>"`. Option 3 "YOLO": `codex exec --sandbox danger-full-access "<task>"`. One operator reported running this mode continuously for "several days, PR after PR, almost never stops." Pair with devcontainer isolation and an independent test/rollback pipeline before enabling.
