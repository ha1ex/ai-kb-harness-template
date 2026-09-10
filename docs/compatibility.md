# Agent compatibility and portable runtime

The shared rules live in `harness/`; `AGENTS.md` is a short project-owned entry point. Configuration checks demonstrate file layout and protected setup, not that a live model followed every instruction. No live paid client session was run for this release.

| Client | Entry and skills | Checked here | Live session |
|---|---|---|---|
| Codex | AGENTS.md; `.agents/skills/*/SKILL.md` | Explicit setup, bundle copies, hashes, edit protection | Not tested |
| Claude Code | CLAUDE.md imports; `.claude/skills/*/SKILL.md` | Stub and bundle checks; existing settings retained | Not tested |
| OpenCode, including GLM | AGENTS.md plus opencode.json instructions; `.opencode/skills` | Stub and bundle checks | Not tested; configure provider/model yourself |
| Gemini CLI | GEMINI.md imports; `.gemini/skills/*/SKILL.md` | Explicit setup; no inference from `.agents` | Not tested |
| Generic MCP client | `.mcp.json` stdio declaration | Declaration generation | Load rules separately; client session not tested |

Gemini's layout follows its [context import documentation](https://geminicli.com/docs/cli/gemini-md/) and [skill bundle documentation](https://geminicli.com/docs/cli/creating-skills/). OpenCode's skill directories follow its [official documentation](https://opencode.ai/docs/skills). Client versions and trust settings can affect discovery; verify loaded instructions inside your chosen client.

## Setup and preservation

```sh
node scripts/check-harness.mjs
node scripts/check-harness.mjs --setup --client codex --client gemini
node scripts/check-harness.mjs --json
```

Setup has no dependency on API keys. Choose `codex`, `claude`, `opencode`, `gemini`, or `mcp` explicitly; repeat `--client` for several. No client is detected from an executable or shared folder. Copies work without symlinks; setup rejects symlink destinations. Standard bundles include SKILL.md frontmatter and may contain supporting files. Project-owned bundles in `skills/` are copied alongside core bundles. Duplicate names are reported.

`.harness/clients.json` records selections and content hashes. Commit it alongside the generated client files so another checkout can recognize and update unchanged managed copies. A repeat setup updates only unchanged managed files, adopts identical copies, and preserves foreign or modified files with an actionable error. Retired skill copies are reported by read-only checks; setup removes unchanged retired copies and empty bundle directories. An edited retired copy blocks cleanup and is preserved for review. Existing settings are never merged blindly. If a client already has a different stub, review and manually incorporate the canonical imports, retaining your original configuration. To resume managed generation, first back up the edited file and remove that generated destination, then rerun setup. Do not delete your project source skill.

Read-only checking never changes client state or Git configuration. It succeeds with zero selected clients in a clean generic clone. Hash checks cover generated copies; source layout is checked when the relevant client is selected.

Optional hooks: `node scripts/check-harness.mjs --setup --hooks`. This refuses an existing foreign `core.hooksPath` or non-sample default hooks. The common gate is `node scripts/git-hooks/check.mjs`, independent of any client; it runs every check to the end and prints a summary (`--fail-fast` stops at the first failure). Pre-push runs deterministic structural, citation and presentation checks; missing dependencies cause an explicit failure and are not downloaded. Post-checkout/merge/rewrite provide nonblocking checks; `HARNESS_SYNC_SKILLS=1` explicitly enables protected regeneration. Hooks do not replace CI. The «Слои контроля» table in `docs/architecture.md` lists every gate, its layer (code gate, advisory, human confirmation) and where it runs.

## Session transfer

```sh
node scripts/session-start-context.mjs --task source-review --json
node scripts/kb-session.mjs save --task source-review --owner researcher --file harness/templates/handoff.json
node scripts/kb-session.mjs transfer --task source-review --owner researcher --to reviewer
```

Each task lives in `.remember/tasks/<id>.json`. The context command reads working-copy status, recent commits, the selected handoff and a compact list of tasks. It includes durable core context, presentation preferences and the human overview, each limited to 6,000 characters. Atomic replacement and a per-task write lock prevent overlapping writers; an existing task rejects a different owner until explicitly transferred. No generated global “current task” note can overwrite another task. New lock files record the writer PID, owner, task and creation time. After a crash, run `node scripts/kb-session.mjs recover --task <id> --owner <writer>`: it removes the lock only when its recorded PID is demonstrably absent, leaving task state unchanged. A live PID (including a reused PID), inaccessible process or invalid/legacy empty lock is refused. Recovery attempts serialize through an exclusive `.json.lock.recovery` guard. If recovery itself crashes, inspect that guard's PID before manually removing only the guard; never remove a live or unknown writer's lock. Then repeat the recovery command. These local PID checks assume the task state is on one machine, not shared between hosts.

Every saved record requires nonempty acceptanceCriteria (an array of completion conditions) and an explicit decisions array (confirmed decision descriptions, or empty when none), as well as goal and nextStep. Older records must add these fields on their next save. A completed record also requires a result, resolved questions and passing checks with evidence. This checks structure, not truth or task success; review the actual checks. Task IDs and writer names identify coordination responsibility, not an authentication boundary.

## Economical research providers

`kb:research` uses its own optional project policy at `00_context/research-policy.json`; it does not reuse the general `kb.config.mjs` `llm` object. With no policy file, every role is manual and no provider request is made. Copy `harness/templates/research-policy.json` only when the project needs explicit models or caps. The project work-system profile also remains optional and project-owned.

| Provider | Execution behavior | Usage recorded by the adapter path |
|---|---|---|
| `manual` | `prepare` or `run` returns a prompt for the current client | The response file supplies complete usage or `null` |
| `openai-http` | Sends the prepared prompt and registered source documents to the configured endpoint | OpenAI-compatible response usage when present; otherwise unknown |
| `ollama` | Uses the OpenAI-compatible local endpoint | Compatible response usage when present; otherwise unknown |
| `claude-cli` | Starts the configured CLI with the selected model and no allowed resume flag | Unknown; reconcile only from a complete client trace |
| `generic-cli` | Runs a configured fresh, stateless command with an explicit model argument | Unknown; reconcile only from a complete client trace |

HTTP providers receive only the supplied source documents and do not browse. An installed CLI may use its own tools according to that client's configuration and trust settings; the resulting research still needs readable source originals, exact quotations, and recorded uncertainty.

Generic CLI configuration must include `cli.command` and pass the selected model in `cli.args` with `{{model}}`. This prevents an installed client default from silently changing the requested tier:

```json
{
  "provider": "generic-cli",
  "model": "your-explicit-economy-model",
  "tier": "economy",
  "timeout_ms": 300000,
  "max_retries": 0,
  "cli": {
    "command": "llm",
    "args": ["--model", "{{model}}"]
  }
}
```

For `claude-cli`, `cli.extra_args` cannot override `--model` or `--fallback-model` and cannot use `--resume`, `--continue`, `--session-id`, `-r`, or `-c`. Generic CLI configuration must likewise represent a fresh stateless invocation and never resume an earlier session. Use a separate fresh context for the planner, every individual worker, synthesis, and review. These constraints prevent obvious model or context reuse, but the harness cannot authenticate that a CLI context is fresh or independent. Every research role also forces hidden retries to zero.

`maxOutputTokens` is sent to OpenAI-compatible HTTP adapters as `max_tokens`. In manual and CLI modes it is a conservative reservation, not an enforced generation or turn limit. Configure the selected client with its own bounded output, turn, and tool settings.

Cloud credentials use a configured `api_key_env` environment-variable name. Inline `api_key`, `apiKey`, and authorization headers are rejected so persisted policy snapshots do not contain credentials. Manual model/context identity and usage are client claims, not authentication or verified metering.

Unknown usage remains unknown. If a token or cost cap is enabled, a settled call with unknown usage blocks further reservations until `kb:research reconcile` records complete nonnegative usage with a reason. Model price calculations and reservations cannot guarantee an external bill or capture unreported child-tool charges. Budget exhaustion, provider errors, and review-round exhaustion never accept a result. See [the complete research procedure](research.md).

## Optional LLM execution

`think`, `critic`, and `dream` all use `scripts/lib/llm.mjs`, backed by the existing SkillOpt adapter factory. This section describes their shared `kb.config.mjs` setting; role-separated `kb:research` uses the policy above. Their generated prompts contain AGENTS.md plus the same evidence/workflow rules; MCP prompt building uses that common loader too. Default operation builds a prompt for manual use. Even with `--execute`, an absent provider remains manual mode. No cloud provider is selected from a key or executable found on the machine.

Set the optional `llm` object in project-owned `kb.config.mjs`, for example:

```js
llm: {
  provider: 'ollama',
  model: 'your-installed-model',
  base_url: 'http://localhost:11434/v1',
  timeout_ms: 300000,
  max_retries: 0,
},
```

Providers: `manual`, `ollama`, `openai-http`, `claude-cli`, `generic-cli`. An explicit `--execute` sends the generated prompt (which can include source content) to that provider. Cloud cost/privacy depend on your selection. `max_retries` is 0–3 additional HTTP attempts; each request has a 1–1,800,000 ms timeout. CLI calls do not retry automatically. Their deadlines settle without waiting for descendant-held pipes; POSIX process groups are terminated, and Windows uses taskkill for process-tree cleanup. Critic is bounded to at most ten revision rounds (`--rounds`, default two). Failures preserve a manual prompt and do not produce a successful result. Generic CLI defaults to piping the prompt through stdin; argument templates and JSON extraction follow the SkillOpt adapter contract.

Tests use neutral prompts, a localhost mock HTTP endpoint and Node as a mock CLI. They cover manual mode, short stdin delivery, HTTP errors without implicit retries, stalled-body timeouts, and CLI failures/timeouts. No external model quality, GLM endpoint, Gemini authentication, or operating-system-wide client installation was validated.
