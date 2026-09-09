# Economical, evidence-backed research

`kb:research` runs a bounded research sequence with separate model assignments for planning, collection, synthesis, and review. The default is a manual workflow: it prepares prompts and records responses, but makes no model request. Explicit execution uses only the provider and model configured by the project.

The intended assignment is a strong configured model for the planner, synthesizer, and reviewer, with an evaluated economy model for bounded research workers. `frontier` and `economy` are labels; the harness cannot verify model capability and never substitutes a different tier. This design has no measured savings claim. Compare it with an all-frontier baseline on your own questions before making one.

## What is preserved

Each task stores research state in `.remember/tasks/<task>.json`, immutable attempt receipts named `<attempt-id>-<receipt-id>.json` in `.remember/research/<task>/`, and prepared prompts in `.context/research/<task>/`. The task links each exact receipt path. Receipts pin the policy, inputs, model claim, context claim, source hashes, result, usage, and errors. Failed calls and revisions remain in history and continue to count against budgets.

Research workers must preserve readable source originals in the configured KB source layers. Every collected claim needs an exact quotation that occurs in its source file. Synthesis can cite only collected claim IDs and must carry forward every recorded uncertainty and contradiction. A reachable URL or plausible quotation does not prove a claim; the reviewer must inspect the registered evidence.

## Start with the manual workflow

Register existing sources when initializing the task. Paths must be readable files inside the KB. The planner may also create workers with empty `sourcePaths` for a client that can find and save new source originals later.

```bash
pnpm kb:research init \
  --task pricing-proof \
  --owner alex \
  --question "How many customers were included in the pricing pilot?" \
  --source 01_raw/pricing-pilot.md

pnpm kb:research show --task pricing-proof --json
pnpm kb:context --task pricing-proof --workflow research --json
```

`show` returns the complete task, budget, stale inputs, model assignments, and policy-change flag. The normal context packet exposes a compact `work.research` view with model assignments, budget, worker status, pending prompts, history and receipt paths; a changed policy also makes the context stale. The task keeps one owner. Transfer it with the ordinary `kb:session transfer` command before another writer records results.

### 1. Plan

Prepare the request and note `attempt.id`, `attempt.model`, and `attempt.promptPath` in the JSON output:

```bash
pnpm kb:research prepare --task pricing-proof --owner alex --role planner
```

Save a response such as this as `.context/inbox/planner-response.json`. With the default policy, the exact expected model string is `frontier`; use the model printed by `prepare` if you configured another one.

```json
{
  "model": "frontier",
  "contextId": "planner-context-1",
  "usage": null,
  "output": {
    "summary": "Check the pilot count in the registered original.",
    "workers": [
      {
        "id": "customer-count",
        "question": "What customer count does the pilot source report?",
        "acceptanceCriteria": [
          "Return the exact sentence containing the count and record any scope ambiguity"
        ],
        "sourcePaths": [
          "01_raw/pricing-pilot.md"
        ]
      }
    ]
  }
}
```

```bash
pnpm kb:research record \
  --task pricing-proof --owner alex \
  --attempt PLANNER_ATTEMPT_ID \
  --file .context/inbox/planner-response.json
```

### 2. Collect evidence

Prepare each planned worker by ID. Several workers can be prepared up to `maxConcurrent`; each has its own attempt and response. Run every worker in a fresh context separate from the planner and from every other worker so one worker's assumptions do not silently become another's evidence. Manual and CLI context IDs remain unauthenticated claims.

```bash
pnpm kb:research prepare \
  --task pricing-proof --owner alex \
  --role researcher --worker customer-count
```

The response must use the economy model printed by `prepare`. Replace the example quotation with exact text from the named file; recording fails if it is not present.

```json
{
  "model": "economy",
  "contextId": "researcher-customer-count-1",
  "usage": {
    "input_tokens": 820,
    "output_tokens": 190,
    "external_cost_usd": 0.004
  },
  "output": {
    "summary": "The source reports a 20-customer pilot and does not define the sampling method.",
    "claims": [
      {
        "id": "reported-count",
        "text": "The pricing pilot included 20 customers.",
        "confidence": "high",
        "evidence": [
          {
            "path": "01_raw/pricing-pilot.md",
            "quote": "The pricing pilot included 20 customers.",
            "url": "https://example.org/pricing-pilot",
            "date": "2026-09-01"
          }
        ]
      }
    ],
    "uncertainties": [
      "The source does not describe how customers were selected."
    ],
    "contradictions": []
  }
}
```

```bash
pnpm kb:research record \
  --task pricing-proof --owner alex \
  --attempt RESEARCHER_ATTEMPT_ID \
  --file .context/inbox/researcher-response.json
```

A worker may return no claims when evidence is absent, but it must then record an explicit uncertainty. A contradiction must name at least two collected claim IDs, and synthesis must preserve both sides.

### 3. Synthesize

Synthesis becomes available after every planned worker has a valid result.

```bash
pnpm kb:research prepare --task pricing-proof --owner alex --role synthesizer
```

```json
{
  "model": "frontier",
  "contextId": "synthesizer-context-1",
  "usage": null,
  "output": {
    "summary": "The source reports 20 pilot customers; selection quality remains unknown.",
    "claims": [
      {
        "id": "pilot-size",
        "text": "The pricing pilot included 20 customers.",
        "evidence": [
          "customer-count/reported-count"
        ]
      }
    ],
    "uncertainties": [
      "The source does not describe how customers were selected."
    ],
    "contradictions": []
  }
}
```

```bash
pnpm kb:research record \
  --task pricing-proof --owner alex \
  --attempt SYNTHESIZER_ATTEMPT_ID \
  --file .context/inbox/synthesizer-response.json
```

### 4. Review in a separate context

Prepare the reviewer only after synthesis. Give the request to a context different from every planner, worker, and synthesizer context. The request includes the registered primary evidence; review every final claim and every evidence ID attached to it.

```bash
pnpm kb:research prepare --task pricing-proof --owner alex --role reviewer
```

```json
{
  "model": "frontier",
  "contextId": "independent-review-context-1",
  "usage": null,
  "output": {
    "summary": "The count is supported and the sampling uncertainty is retained.",
    "verdict": "passed",
    "checks": [
      {
        "claimId": "pilot-size",
        "verdict": "supported",
        "evidence": [
          "customer-count/reported-count"
        ],
        "note": "The exact sentence in the original supports the count; the answer keeps the source limitation."
      }
    ]
  }
}
```

```bash
pnpm kb:research record \
  --task pricing-proof --owner alex \
  --attempt REVIEWER_ATTEMPT_ID \
  --file .context/inbox/reviewer-response.json

pnpm kb:research show --task pricing-proof --json
```

A manual `model`, `contextId`, and `usage` are recorded claims, not authenticated identities or metering. A separate context reduces shared-author bias but does not prove organizational independence. A `changes-requested` verdict, exhausted review rounds, a stale source, or a budget stop leaves the task unfinished; there is no automatic acceptance path.

## Prepare or execute the next stage

`run` without `--execute` follows the same manual path and prepares the next eligible role or worker batch:

```bash
pnpm kb:research run --task pricing-proof --owner alex
```

After configuring explicit adapters, add `--execute`. With no `--role`, the command advances through the eligible stages and runs at most the configured researcher concurrency. Select one call with `--role` and, for research, `--worker`.

```bash
pnpm kb:research run --task pricing-proof --owner alex --execute
pnpm kb:research run --task pricing-proof --owner alex \
  --role researcher --worker customer-count --execute
```

Every role request forces provider retries to zero. For HTTP, `maxOutputTokens` is sent as the request's `max_tokens`. Manual and CLI calls reserve that amount for accounting, but the harness cannot impose their actual output or turn limit; configure bounded client-specific flags. A failed or invalid provider response is settled as a failed attempt rather than silently retried or accepted.

## Optional project policy

No policy file is required. To customize a project, copy the shipped default, commit the project-owned copy, and edit explicit model/provider assignments:

```bash
cp -n harness/templates/research-policy.json 00_context/research-policy.json
```

Planner, synthesizer, and reviewer aliases must point to models with `"tier": "frontier"`; researcher must point to `"tier": "economy"`. Aliases can have any safe name. The same concrete model can be assigned to both tiers only by explicit configuration.

This example shows the provider-specific fields on one model. Use environment-variable names for credentials; inline API keys and authorization headers are rejected.

```json
{
  "provider": "openai-http",
  "model": "your-explicit-frontier-model",
  "tier": "frontier",
  "base_url": "https://provider.example/v1",
  "api_key_env": "RESEARCH_API_KEY",
  "timeout_ms": 300000,
  "max_retries": 0,
  "prices": {
    "inputPerMillion": 2.5,
    "outputPerMillion": 10
  }
}
```

Supported providers are `manual`, `claude-cli`, `generic-cli`, `openai-http`, and `ollama`. HTTP and Ollama completion receive only the source documents in the prepared request and cannot browse. A configured CLI may use tools available to that installed client under its own trust settings; it must still save readable originals in the KB and return exact evidence. Generic CLI must pass `{{model}}` in its configured arguments and use a fresh stateless invocation. Claude CLI cannot use model overrides or resume flags that could silently change the assignment or share an author context. These settings reduce accidental reuse; the harness does not authenticate a fresh or independent context. See [client and provider compatibility](compatibility.md#economical-research-providers).

The policy is pinned when the task starts. If it changes, the existing task stops instead of rerouting to a new model. Restore the recorded policy or initialize a new task.

## Budgets, failures, and reconciliation

The default has call, worker, concurrency, review-round, and context ceilings. It reserves `maxOutputTokens` for every call and sends it as an HTTP output limit; manual and CLI clients require their own output and turn limits. Token and dollar caps are `null` by default because many manual and CLI clients do not expose complete usage.

- Every prepared, successful, or failed attempt counts as a call.
- Prepared attempts hold their token and cost reservation, including calls prepared in parallel.
- Measured settlement replaces the reservation with actual usage, even when the call failed.
- Missing token usage remains `null`, never zero. Missing model prices make cost unknown.
- The `generic-cli` and `claude-cli` adapter paths record usage as unknown; use a complete external client trace for reconciliation.
- When `maxTotalTokens` or `maxCostUsd` is enabled, an unknown relevant measurement blocks another reservation until it is reconciled.
- `reserveReviewTokens` and `reserveReviewCostUsd` keep capacity available for review.
- A recorded total can exceed a cap when actual provider usage exceeds its reservation. The task remains blocked; budget exhaustion never marks research complete.

Record provider and client failures instead of abandoning their pending attempt:

```json
{
  "model": "economy",
  "contextId": "researcher-customer-count-2",
  "usage": null,
  "error": "Client timed out before returning complete usage"
}
```

```bash
pnpm kb:research record \
  --task pricing-proof --owner alex \
  --attempt FAILED_ATTEMPT_ID \
  --file .context/inbox/failed-response.json
```

If a settled attempt has `usage: null`, copy complete usage from a trustworthy client or provider trace into a JSON file:

```json
{
  "input_tokens": 820,
  "output_tokens": 190,
  "external_cost_usd": 0.004
}
```

```bash
pnpm kb:research reconcile \
  --task pricing-proof --owner alex \
  --attempt FAILED_ATTEMPT_ID \
  --file .context/inbox/reconciled-usage.json \
  --reason "Copied from provider request log 2026-09-09T12:40Z"
```

Reconciliation only fills unknown usage on a settled attempt. Known historical usage cannot be rewritten. Configured token prices estimate model cost; `external_cost_usd` can record known search or tool charges. Neither reservations nor totals guarantee an external bill, especially when a CLI launches child tools or a provider meters unreported services.

## Revise after evidence or review changes

Settle every pending attempt before revision. Select one worker for a review-directed correction; stale source input can invalidate all affected downstream work. Synthesis and review are cleared, while previous calls, errors, receipts, and usage remain counted.

```bash
pnpm kb:research revise \
  --task pricing-proof --owner alex \
  --worker customer-count \
  --reason "Reviewer requested verification against the dated pilot export"
```

Prepare the worker again, then repeat synthesis and independent review. If an immutable receipt changed, restore it before continuing.

## Adopt research support in an existing project

Version 0.6.0 is transferred through the normal baseline-aware updater. Commit or otherwise clean the project working tree before `--apply`; preview does not change project files.

```bash
pnpm kb:update --ref v0.6.0
pnpm kb:update --ref v0.6.0 --apply
pnpm run setup
pnpm harness:setup
pnpm test
pnpm check
pnpm kb:verify --scan --provenance --no-semantic
```

The updater preserves project-owned content, profiles, skills, and modified files, and reports conflicts instead of guessing a merge. `harness:setup` synchronizes unchanged managed bundles for the clients already selected by the project. The research policy remains optional; use `cp -n` so an existing project policy is never overwritten. For a legacy project without `.harness/lock.json`, first follow [the known-baseline adoption procedure](upgrades.md#старый-проект-без-lock), then preview and apply `v0.6.0`.

## Architectural references and limits

The local design was informed by source review at pinned revisions:

- [LangChain DeepAgents at `ee5d7f63e77acd7d027eefeb85e5ad54adc27ab8`](https://github.com/langchain-ai/deepagents/tree/ee5d7f63e77acd7d027eefeb85e5ad54adc27ab8) supports per-subagent model and tool assignment with isolated task context. Its default deep-research example does not itself provide this complete strong-planner/economy-worker/independent-reviewer workflow, and its optional GPU backend is outside this Markdown harness.
- [GPT Researcher at `6f998577d547b1e54ec662dac63583aa11e3b84b`](https://github.com/assafelovic/gpt-researcher/tree/6f998577d547b1e54ec662dac63583aa11e3b84b) separates planning, concurrent section research, fact checking, and revision. Several model settings affect worker cost, its cost callback was not active in the inspected path, and some revision-limit routes accept a draft; this harness instead fails closed.
- [DeerFlow at `0d4925305a6330a3442dcd336ed25750aea87cbd`](https://github.com/bytedance/deer-flow/tree/0d4925305a6330a3442dcd336ed25750aea87cbd) exposes per-subagent model, skill, token, turn, and timeout settings. Its token middleware acts after a model response and its defaults are large backstops, so it does not establish a pre-billing dollar cap or an economical preset.

These references support architectural choices, not measured quality or savings. A useful evaluation compares mixed and all-frontier assignments on the same 10–20 project questions, then counts factual and citation errors, independent-review outcomes, revisions, model usage, and external search/tool cost.
