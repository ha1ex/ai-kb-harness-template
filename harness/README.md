# Harness map

`rules/` holds shared evidence and workflow rules; `roles/` describes responsibilities; `skills/` holds standard SKILL.md bundles; `templates/` supplies handoff, work-system and research-policy forms plus the skill scaffold in `templates/skill/` used by `pnpm skill new`; `adapters/` documents client loading. Project-owned procedures belong in root `skills/`.

Read AGENTS.md first. Run `node scripts/check-harness.mjs` for a read-only check. Explicitly select clients with `--setup --client codex --client gemini` (or claude, opencode, mcp). Setup copies bundles without symlinks, keeps installed-file hashes and refuses to overwrite modified or foreign files. A client selection records configuration intent, not proof of a live client session. See docs/compatibility.md.
