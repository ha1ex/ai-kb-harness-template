---
id: A-013
tier: A
category: "HR & hiring"
kind: skill
title: "All-in-one HR skill for small teams"
subtitle: "A 1-2 person ops layer runs hiring + onboarding + reviews + offers for 30 people without an HRIS stack."
source: https://www.cybos.ai/cases/A-013
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · Operations Partner / HR-of-one"
type: case
version: v0.1
---
# All-in-one HR skill for small teams

> A 1-2 person ops layer runs hiring + onboarding + reviews + offers for 30 people without an HRIS stack.

## What

A single Claude Code skill replaces an ATS + HRIS for an 8–30 person team. It triggers on HR keywords (onboarding, hiring, review, candidate, offer, roster) and exposes seven slash-commands — `roster`, `onboard {First}`, `candidate {Name}`, `hire {role-slug}`, `review {First}`, `offer {First}`, `status` — each backed by templates, fixed file layouts, and a self-improving `eval` block of grep hygiene checks. All HR state lives as Markdown files in a vault folder tree; no SaaS dependency.

## Why it matters

A 1–2 person ops layer runs hiring, onboarding, performance reviews, and compensation for a 30-person team without paying for a stack of HR SaaS. The skill compresses tribal knowledge into versioned files that new joiners self-onboard from. The included anti-pattern catalog ties five hard-won rules to specific failure dates — each rule has a war story attached, which makes the culture actually stick.

## End-to-end

1. **Install the skill.** `mkdir -p ~/.claude/skills/team-hr && cp -R team-hr-skill/SKILL.md team-hr-skill/examples ~/.claude/skills/team-hr/`. Create the vault folders: `mkdir -p "$VAULT/Org/HR/{roles,hiring/archive,onboarding}"`.
2. **Adapt the template.** Edit `SKILL.md`: replace `<COMPANY>` placeholders, replace the worked-example roster section with your team, set the `eval` block's `HR=` and `VAULT=` paths, whitelist your team members in eval check #1.
3. **`roster` subsection.** Maintain one role card per person at `Org/HR/roles/{role} {First Last}.md` with required frontmatter (`type: role`, `status: active|trial|parted`, `person`, `position`, `format`, `start`, `tags`). Run `/team-hr roster` — the skill reads every role card and produces a markdown table of name, role, format, status. Compensation MUST NOT be in role cards; only in the personal folder `Org/HR/{Person}/`.
4. **Role-card schema (absorbs #50).** Five required sections per card: Expertise (background + network + languages); Zones of Responsibility (Owns / Co-owns / **NOT owns** — the NOT-owns list is the unique discipline most role docs lack); Agreements (compensation marked `[PRIVATE — see personal HR folder]`, schedule, working hours, quarterly KPIs); Team Interactions (cadence with named counterparts); 1-1 History (running log of monthly 1-on-1s with wins/blockers/next-month focus).
5. **`onboard {First}` — 5-stage onboarding (absorbs #43/#44).** One command produces a role-card stub, a personal HR folder, a draft Welcome Package personalized from the template, and Stage 0–1 checklists. Stages: 0 Preparation (3–5 days before start: access provisioning across 7+ systems, buddy assigned, onboarding call scheduled), 1 Day-1 onboarding call (60 min, 6-bullet agenda), 2 Welcome Package sent Day 2–3, 3 Days 2–5 reading + shadowing + small tasks, 4 Weeks 2–4 first initiative + 1-on-1 with founder, 5 Month-1 Fit Assessment with 3–5 anonymous team feedback responses → continue / adjust scope / part ways. Red-flag escalation rules: silent 48h, missed Day-2-3 reading, 2 missed Linear deadlines, "AI did the work" without understanding.
6. **`candidate {Name}` — flat-file intake (absorbs #46).** One command creates a single flat file `Org/HR/hiring/{Company} {candidate} {Name} – YYYY-MM-DD.md` with the CV PDF placed flat alongside (NOT in a subfolder). Required sections: TL;DR (3–5 lines + founder flag), CV compression (table of period/role/scale — NOT full text), verbatim intro quotes with timestamps, dated Call section with standard + role-specific question banks, Fit Assessment (✓/⚠️ across AI fluency, ownership, domain knowledge, culture fit), Decision A/B/C (trial / advisory / pause), Next checklist. Status moves only in frontmatter: `intro` → `trial` / `pause` / `archived`. Archived files move to `hiring/archive/`. Multi-round process: initial chat (15–20 min) → founder call (45–60 min) → paid test (1–2 days, $100–300 if no offer) → optional external advisor → trial month (paid, explicit KPIs) → permanent.
7. **`hire {role-slug}` — auto-JD landing page.** Reads a JD source from `Org/HR/hiring/` and generates an HTML landing page deployable to GitHub Pages (or Notion public / Webflow / Framer). JD template requires: Brief (one-sentence essence), Who we're looking for (affirmative verb-object, day-to-day), Context, 3 Functions with % summing to 100, Must-haves with junior/mid/senior levels (AI workflow fluency is a deal-breaker), Who we're NOT looking for (3+ anti-patterns including "activity-in-chat performance"), Process (5 steps), KPI for first quarter, Compensation (USD-equivalent range), Apply (direct contact + checklist including concrete AI usage example), Benchmarks, Build Decisions Log.
8. **`review {First}` — auto-prepared review agenda.** Reads role card + personal HR folder + recent tasks from the tracker. Outputs an agenda pre-populated with concrete data points. Four review types: Monthly 1-on-1 (30–45 min, 5-bullet agenda), Quarterly (45–60 min, includes KPI scorecard + compensation review), Annual (with 360 feedback), Fit Assessment (Month-1 for new hires). After meeting, log a dated entry in role card `## 1-1 History`.
9. **`offer {First}` — formal offer doc.** Reads current role card + any in-progress `{Company} {negotiations} – YYYY-MM-DD.md` files in the person's HR folder, writes a formal offer markdown at `Org/HR/{First}/{Company} {offer} – YYYY-MM-DD.md`. Signed offers are NEVER edited; revisions create new `(revised).md` files as historical documents.
10. **`status` — one-screen overview.** Walks `roles/`, `hiring/` (active JDs), `hiring/` (candidates with `status: intro|trial`), and role-card 1-1 histories to surface upcoming reviews. Replaces a founder's weekly scan across 5 surfaces with one command.
11. **`eval` self-improving grep block.** Five hygiene checks run on demand or weekly cron: (1) candidates flat, not in subfolders; (2) candidate files have `cv:` in frontmatter; (3) candidates with `status: intro` older than 14 days (forces a decision); (4) role cards have `status:` and `## 1-1 History`; (5) compensation strings (`$NK/month`, `€N/month` patterns) do NOT leak outside `Org/HR/`. Rule: if `eval` finds something, fix the file. If `eval` fails to find something it should have, add a new check.

## Prompts

Folder structure (enforced):

```
`Org/HR/
 roles/{role} {First Last}.md
 hiring/{Company} {candidate} {Name} – YYYY-MM-DD.md
 hiring/{Company} {jd} [Role] – YYYY-MM-DD.md
 hiring/archive/
 onboarding/
 {Person}/ # only AFTER they join
`
```

Eval block (excerpted; extract with: `bash -c "$(awk '/^\```bash$/{flag=1;next}/^```$/{flag=0}flag' ~/.claude/skills/team-hr/SKILL.md)"`):

```
`HR="$VAULT/Org/HR"
`
```

## Gotchas

- **No per-candidate folders. Use `{Company} {candidate} {Name} – YYYY-MM-DD.md` flat files.** Real failure date 2026-05-05: a per-candidate folder structure was tried; folders multiplied, fragmented information, and broke search. Grep check #1 was added the same day and cannot recur. (Catalog rule #2.)
- **No reusing a generic JD template across roles.** Each JD must declare its own anti-patterns up front in "Who we're NOT looking for" — the affirmative-essence + anti-pattern combination is what filters signal. Recycling one JD across three roles produces generic candidates.
- **No compensation strings outside `Org/HR/`.** Eval check #5 catches `$NK/month` and `€N/month` patterns leaking into notes, project docs, or chats. Cultural blast radius is severe. (Catalog rule #1.)
- **Never edit signed offers.** If terms change, create `{Company} {offer} – YYYY-MM-DD (revised).md` as a new historical document. Audit trail matters legally. (Catalog rule #3.)
- **No activity-in-chat as KPI.** "Presence-in-chat ≠ work" is baked into the welcome-package template and the JD template's "Who we're NOT looking for" section. Penalizes quiet performers and breaks async-first culture. (Catalog rule #4 — team-feedback round 2 lesson.)
- **No full-CV paste in intake files.** The CV compression table (period / role / scale, one row per role) is the readable signal; the PDF lives alongside. (Catalog rule #5.)
- **Don't add new sections to `SKILL.md` without a real failure.** The skill explicitly forbids this — `eval` is the gate. Bloat kills the skill faster than missing features.

## Variations

- **Lighter (4–8 person team):** skip the JD landing-page step (`hire`); share JDs as raw markdown links. Skip the eval block until you've made one real mistake worth a grep check.
- **Heavier (30–60 person team):** wire the role-card schema to a custom dashboard (the role files are the data; the dashboard is a renderer). Add MCP integration to the task tracker for `review`'s task-pull step.
- **Multi-entity:** prefix every file with `{Entity}` to keep separate legal-entity teams isolated in one vault.

## Tools

- Claude Code (`npm i -g @anthropic-ai/claude-code`).
- A file-based vault (Obsidian / Dropbox / plain Git repo).
- A task tracker accessible to Claude Code (Linear in the example, but any tracker works for `review`'s "pull recent tasks" step).
- Telegram (or another channel) for comms.
- Optional: GitHub Pages repo for JD landings, OG-image generator.
- Bash/awk/grep (macOS/Linux standard) for the `eval` block; note `stat` flag differs (`-f %m` BSD/macOS vs `-c %Y` Linux).
