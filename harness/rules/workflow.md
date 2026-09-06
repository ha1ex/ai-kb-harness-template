# Work and handoff

Start with the task goal, scope and acceptance criteria. Inspect the working copy before editing. Follow the evidence rules and human-interface guide; do not silently approve a proposed decision. Preserve project-owned content and client settings.

Run `node scripts/session-start-context.mjs --task <id> --json` to restore context. Each task has a separate `.remember/tasks/<id>.json` with one writer (`owner`). Use unique task IDs; do not write a shared current-task note. `.remember/now.md` may remain a short human-curated index, never generated task state.

Save with `node scripts/kb-session.mjs save --task <id> --owner <name> --file <handoff.json>`. Required: goal, nextStep, nonempty acceptanceCriteria (completion conditions), and decisions (confirmed decisions; an empty array explicitly means none). Include constraints, sources, changedFiles, checks, openQuestions and result. Each check records command, outcome (passed/failed/not-run) and evidence. Completed state requires a result, no open questions and at least one passed check; this is a structural gate, not proof that the goal was achieved. The owner reviews that judgment. Transfer ownership explicitly with `transfer --task <id> --owner <old> --to <new>`.

Keep transient thoughts in `.context/inbox/`. Promote knowledge only after source and citation checks. Record checkpoints during long operations. Default LLM execution is off; use explicit --execute with a configured provider and bounded timeout/retries. Do not retry unboundedly.

Use roles sequentially unless independent work benefits from available parallel execution. Run common CLI checks regardless of the client; hooks are optional early feedback. Report actual results, remaining work and untested integrations honestly.
