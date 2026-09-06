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

Optional hooks: `node scripts/check-harness.mjs --setup --hooks`. This refuses an existing foreign `core.hooksPath` or non-sample default hooks. The common gate is `node scripts/git-hooks/check.mjs`, independent of any client. Pre-push runs deterministic structural, citation and presentation checks; missing dependencies cause an explicit failure and are not downloaded. Post-checkout/merge/rewrite provide nonblocking checks; `HARNESS_SYNC_SKILLS=1` explicitly enables protected regeneration. Hooks do not replace CI.

## Session transfer

```sh
node scripts/session-start-context.mjs --task source-review --json
node scripts/kb-session.mjs save --task source-review --owner researcher --file harness/templates/handoff.json
node scripts/kb-session.mjs transfer --task source-review --owner researcher --to reviewer
```

Each task lives in `.remember/tasks/<id>.json`. The context command reads working-copy status, recent commits, the selected handoff and a compact list of tasks. It includes durable core context, presentation preferences and the human overview, each limited to 6,000 characters. Atomic replacement and a per-task write lock prevent overlapping writers; an existing task rejects a different owner until explicitly transferred. No generated global “current task” note can overwrite another task. New lock files record the writer PID, owner, task and creation time. After a crash, run `node scripts/kb-session.mjs recover --task <id> --owner <writer>`: it removes the lock only when its recorded PID is demonstrably absent, leaving task state unchanged. A live PID (including a reused PID), inaccessible process or invalid/legacy empty lock is refused. Recovery attempts serialize through an exclusive `.json.lock.recovery` guard. If recovery itself crashes, inspect that guard's PID before manually removing only the guard; never remove a live or unknown writer's lock. Then repeat the recovery command. These local PID checks assume the task state is on one machine, not shared between hosts.

Every saved record requires nonempty acceptanceCriteria (an array of completion conditions) and an explicit decisions array (confirmed decision descriptions, or empty when none), as well as goal and nextStep. Older records must add these fields on their next save. A completed record also requires a result, resolved questions and passing checks with evidence. This checks structure, not truth or task success; review the actual checks. Task IDs and writer names identify coordination responsibility, not an authentication boundary.

## Optional LLM execution

`think`, `critic`, and `dream` all use `scripts/lib/llm.mjs`, backed by the existing SkillOpt adapter factory. Their generated prompts contain AGENTS.md plus the same evidence/workflow rules; MCP prompt building uses that common loader too. Default operation builds a prompt for manual use. Even with `--execute`, an absent provider remains manual mode. No cloud provider is selected from a key or executable found on the machine.

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
