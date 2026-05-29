---
id: A-022
tier: A
category: "Operations"
kind: workflow
title: "Internal scheduled cron agents — \"when users come in, everything is updated\""
subtitle: "Every employee runs 4-5 morning agent jobs by hand. A VM runs them overnight so the workspace is fresh at 9am."
source: https://www.cybos.ai/cases/A-022
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "Engineering lead · ops lead · founder"
type: case
version: v0.1
---
# Internal scheduled cron agents — "when users come in, everything is updated"

> Every employee runs 4-5 morning agent jobs by hand. A VM runs them overnight so the workspace is fresh at 9am.

## What

A dedicated VM in the company runs the agent CLI in headless mode on a schedule. Every 15 minutes / hour / day a cron job triggers a skill: pull the latest data from the CRM, sort new transcripts into the right project folders, refresh client status cards, recompute the per-project dashboard, sync new tasks from the inbox, regenerate weekly digests. Each job commits its outputs to the relevant department git repo and pushes. When employees open their workspace in the morning, everything is already current — or one `bash setup/update-all.sh` pulls it.

## Why it matters

Removes the "I need to run my agents before I can start working" tax from every employee, every morning. At a 30-person agency where each employee was previously running 4–5 morning agent jobs by hand, this reclaimed roughly 20 minutes of attention per person per day and — more importantly — eliminated the "did I remember to update the dashboard?" anxiety. It also forces a discipline of "if it should be fresh, it should be cron-fresh" — anything stale gets noticed within hours because someone tries to act on it.

## End-to-end

1. **Provision a small VM** (DigitalOcean droplet, Hetzner box, or in-house — 4 GB RAM is enough for the agent runtime; budget more for parallelism).
2. **Install the agent CLI in headless mode.** Claude Code / Codex / Cursor agent; same auth (Max-sub keys / API tokens). Confirm the agent can clone the workspace repo and push back with a dedicated bot git identity.
3. **Author one skill at a time.** Each cron job is a single skill in the workspace's `skills/` folder. Start with the three highest-leverage:

- `pull-transcripts` — pulls new notetaker transcripts, applies naming convention, classifies them (see #71).
- `update-status-cards` — runs the team-meeting → status-card skill (#86) automatically after the weekly team meeting hits the transcripts folder.
- `refresh-dashboards` — recomputes the per-project dashboards and any other live HTML artefacts.

1. **Use systemd timers or plain cron.** Each job: `cd /opt/workspace && claude -p "Run skill X" --allowedTools Bash --max-turns 30 >> logs/X.log 2>&1`. Log everything; rotate logs weekly.
2. **Commit + push from the bot identity.** Each skill ends with `git add -A && git commit -m "auto: <skill> @ $(date -Iseconds)" && git push`. Restrict the bot's PR scope by branch protection.
3. **Wire failure alerts.** Telegram bot ping to the on-call engineer when any skill returns non-zero or skips its slot. Don't trust silence.
4. **Expose a kill-switch.** A flag file on the VM (`data/cron_paused.flag`) that every skill checks first. Useful during big migrations.
5. **Track spend.** Token-usage logs per skill per day; subscriptions plus token costs typically end up at ~4% of payroll once cron agents take over the routine.

## Prompts

Cron entries (`/etc/cron.d/agents`):

```
``
```

## Gotchas

- **Don't run jobs that no one consumes.** Every cron skill should feed a dashboard, a file someone opens, or an alert someone reads. Orphan cron jobs accumulate cost and noise.
- **Don't bypass the workspace conventions.** Cron-generated files must follow the same naming convention as hand-made ones; otherwise downstream queries break.
- **Don't let the bot have prod-deploy permissions.** Read everywhere, write only to specific paths under `Projects/` and `Docs/`. Branch protection on `main`.
- **Don't trust silence.** A skill that "ran fine" with zero output is usually a skill that returned early because something was missing. Telegram a heartbeat with every successful run.
- **2026-04-21 lesson (from a workshop participant):** an unchecked content-generation skill filled an entire developer's Mac disk in one morning; Dropbox sync then propagated the failure to the whole team. Always cap output volume per run; always have one team-member's workspace switched off as a cold backup.
- Don't let an overnight restructure agent move files without a reversion path. Always write the move log to a single file the operator can read; always implement `undo last-night` as a one-command rollback. A 2026-04 incident: an "ontology pass" by an overnight agent merged two top-level folders the operator considered semantically distinct; recovery took an afternoon. Solution: append-only move log + atomic rollback skill.

## Variations

- **Lighter:** Run cron on a power-user's laptop with `launchd` (macOS) — fine for a 5-person team.
- **Heavier:** Multiple VMs, one per "department" (engineering, ops, sales) so failures in one don't block the others.
- **Vertical:** For trading / finance, cap each skill's wall-clock and require explicit approval before any commit that touches a downstream-of-money path.
- **Overnight KB self-restructure variant.** A nightly cron (~2–4 AM) runs a "vault-keeper" agent that scans the previous day's incoming files, re-files them under the canonical taxonomy, deduplicates, and writes a "what changed last night" summary to a top-level `inbox/auto-reorg-<date>.md` file. The operator reads the summary with morning coffee; rejects any move with one line; the agent reverts and notes the rule. Over weeks, the agent learns the operator's filing preferences with no explicit training. A cohort participant ran this against a 2400-note Obsidian vault.

## Tools

- A VM with the agent CLI installed and persistent disk
- Git push access for a dedicated bot identity
- The workspace already structured with `skills/`, `Docs/`, `Projects/`
- Telegram bot or equivalent for failure alerts
- Token budget — expect 1–4% of payroll once routine jobs are autonomous
