---
name: economical-research
description: Use when starting, resuming, revising, reviewing, or reconciling a bounded mixed-model research task with kb:research.
---

# Economical research

Read [the research guide](../../../docs/research.md), [evidence rules](../../../harness/rules/evidence.md), and [workflow rules](../../../harness/rules/workflow.md).

1. Preserve readable source originals in the KB. Run `pnpm kb:research show --task ID` before resuming.
2. Start with `pnpm kb:research init`; a research policy is optional. Keep any policy and work-system profile project-owned. Treat `frontier` and `economy` as configured tiers, not verified model capabilities.
3. In the default manual mode, use `prepare` and record the exact model response with `record`. Use `run --execute` only when the project policy explicitly configures an adapter.
4. Follow planner → bounded researchers → synthesizer → reviewer. Give every worker a fresh context separate from the planner and other workers. Researchers return exact quotations, source paths, confidence, uncertainties, and contradictions. Synthesis references collected claim IDs and preserves every gap and conflict.
5. Give the reviewer a different context and the primary registered evidence. Configure CLI adapters as fresh stateless invocations and never resume an author session. Check every final claim. Manual and CLI context identities are recorded claims, not authentication.
6. When review requests changes, settle pending attempts, then use `revise`; previous calls and costs remain. A budget stop or exhausted review round never means acceptance.
7. Keep unknown usage unknown. If a strict cap blocks work, use `reconcile` only with complete usage copied from a client or provider record and state where it came from.

Use `pnpm kb:research help` for command syntax and the guide for valid JSON responses, provider limits, and update steps.
