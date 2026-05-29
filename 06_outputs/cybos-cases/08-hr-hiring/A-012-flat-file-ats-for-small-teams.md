---
id: A-012
tier: A
category: "HR & hiring"
kind: workflow
title: "Flat-file ATS for small teams"
subtitle: "Sub-30-person teams pay $50–200/mo per recruiter for an ATS. One markdown file per candidate does the same job."
source: https://www.cybos.ai/cases/A-012
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Founder · hiring manager · ops partner"
type: case
version: v0.1
---
# Flat-file ATS for small teams

> Sub-30-person teams pay $50–200/mo per recruiter for an ATS. One markdown file per candidate does the same job.

## What

A single Claude Code command, `/team-hr candidate "{Name}"`, replaces an ATS for a small team. When a referral arrives (Telegram forward, email, LinkedIn DM), the command creates one flat markdown file under `Org/HR/hiring/{Company} {candidate} {Name} – YYYY-MM-DD.md` with the CV PDF placed flat alongside (not in a subfolder). The file has fixed sections: TL;DR (3–5 lines + founder flag), CV compression (table of period/role/scale — never the full CV), verbatim intro quotes with channel + timestamp, Call YYYY-MM-DD with pre-loaded standard + role-specific question banks, Fit Assessment (2–3 bullets), Decision A/B/C (trial / advisory / pause), Next checklist. Status moves only in frontmatter: `intro → trial / pause / archived`. When archived, file moves to `hiring/archive/`. No per-candidate subfolders. No copy-pasted full CVs.

## Why it matters

Replaces a $50–200/mo per-recruiter ATS for a sub-30-person team. More important: it produces a forced-function for hiring discipline. Per the source skill, "lesson learned 2026-05-05: per-candidate folders multiply, get lost, fragment information." A flat-file intake means search works, agents read it natively, and any team member can scan the hiring pipeline with `ls`. Demo-ready in under 30 seconds: `/team-hr candidate "Jane Doe"` → templated file is created with the right frontmatter, ready to populate after the intro call.

## End-to-end

1. **Install the `team-hr` skill** (a self-contained Claude Code skill):

```
`mkdir -p ~/.claude/skills/team-hr
cp -R /path/to/team-hr-skill/SKILL.md ~/.claude/skills/team-hr/
cp -R /path/to/team-hr-skill/examples ~/.claude/skills/team-hr/
`
```

1. **Create the hiring folder structure:**

```
`mkdir -p "$VAULT/Org/HR/{roles,hiring/archive,onboarding}"
`
```

1. **Customise SKILL.md once.** Replace `<COMPANY>` placeholder, set `HR=` and `VAULT=` paths in the eval block, whitelist your current team members' folder names in the eval grep check #1, decide your standard + role-specific question banks.
2. **Run on every new referral.** When a CV / DM / forward arrives:

- `/team-hr candidate "Mark Petrov"` — the agent creates `Org/HR/hiring/{Company} {candidate} Mark Petrov – 2026-05-10.md` with frontmatter `tags: [team, hr, candidate]`, `type: candidate`, `status: intro`, `person`, `referrer`, `contact`, `cv: [[mark-petrov-cv.pdf]]`, `date`, `direction`.
- Drop the CV PDF flat in `hiring/` (no subfolder).
- Fill TL;DR (3–5 lines: who, strengths, concerns, founder flag).
- Fill the CV compression table: period / role / scale (one row per role; never paste the full CV).
- Paste verbatim intro quotes — with channel and timestamp on each.

1. **Pre-load questions for the upcoming call.** Standard bank (5 universal: ownership story, AI workflow concrete example, hardest decision in last year, what would you do in your first 90 days, anti-pattern personal example). Role-specific bank (3 questions per role — keep these in `Org/HR/Global-Rules/Question-Banks/`).
2. **After the call, fill Fit Assessment** with `✓` / `⚠️` markers across the standard axes: AI fluency, ownership, domain knowledge, culture fit. Then mark decision A (trial) / B (advisory) / C (pause).
3. **Run the multi-round process.** Initial chat (15–20 min) → Founder call (45–60 min) → **Paid test ($100–300 if no offer)** → optional external advisor → Trial month (paid, explicit KPIs) → Permanent or part ways.
4. **Status changes are frontmatter edits.** `status: intro` → `status: trial` → if archived, move the file to `hiring/archive/` and set `status: archived`. The personal folder `Org/HR/{First}/` is created ONLY after they actually join.
5. **Run the eval hygiene block weekly.** The skill ships with 5 grep-based checks: candidates flat (not in subfolders); candidate files have `cv:`; candidates with `status: intro` older than 14 days force a decision; role cards have `status:` and `1-1 History`; compensation strings don't leak outside `Org/HR/`. Schedule `bash` on the embedded eval block weekly.

## Prompts

The `/team-hr candidate` command (called from Claude Code in the vault):

```
`/team-hr candidate "Mark Petrov"
`
```

The generated file shape (sample frontmatter + section skeleton):

```
`---
tags: [team, hr, candidate]
type: candidate
status: intro
person: Mark Petrov
referrer: "@anna_referrer (Telegram, 2026-05-08)"
contact: mark.petrov@example.com / @mpetrov
cv: [[Mark Petrov CV 2026-05-10.pdf]]
date: 2026-05-10
direction: Engineering — backend
---
`
```

## Gotchas

- **No per-candidate subfolders.** Banned 2026-05-05 after a candidate-folder case where candidate data fragmented across `Mark/`, `Mark-Petrov/`, `Backend/Mark/`. Flat files only. The eval block catches violations.
- **No full-CV paste into the intake file.** Use the CV compression table. Full CV is the PDF flat in `hiring/`. Reason: long files become unreadable; the table is what humans + agents both query.
- **No per-candidate-status subfolders either** (no `hiring/intro/`, `hiring/trial/`). Status lives in frontmatter; the eval block + grep are the index.
- **No 8-section-with-emojis intake files.** The 6 sections (TL;DR / CV table / Quotes / Call / Fit / Decision / Next) are the entire schema. Adding a "Personality assessment" or "🎯 Goals" section drifts.
- **Personal folder `Org/HR/{First}/` is created ONLY after the candidate joins.** Not during trial. Not "in anticipation". Not at offer. After they actually start. Compensation, NDA, contracts live there; pre-creation invites compensation leaks into hiring discussions.
- **Paid test is paid even on no-offer.** $100–300 if no offer is made. This is the quality filter — refuses unpaid-take-home culture, attracts senior candidates.
- **Compensation never lives in the candidate intake file.** Negotiation drafts go in the personal HR folder only after they join. Past failure: comp strings leaked into a shared candidate file and were screenshot-shared.

## Variations

- **Lighter (1-3 person team):** drop the eval block — manual hygiene is fine at this scale. Keep the file shape and the paid-test rule.
- **Heavier (30-100 person team):** add an agent-driven Stage-1 screening pre-call (CV + intro quotes → preliminary fit assessment, see #54+#55). Add a `hire {role-slug}` companion command that auto-generates a public JD landing page from a JD source file. Add the `team-hr review` command for periodic performance reviews of joined teammates.
- **Recruiting-led variant:** replace founder approval with hiring-manager approval; add a "panel" frontmatter field tracking 3–5 interviewers; rotate decision authority across panel.

## Tools

- Claude Code: `npm i -g @anthropic-ai/claude-code` (Pro or Max — Max sub is flat-rate and cheaper at any volume).
- An Obsidian / Dropbox / file-based vault with `Org/HR/` at the root.
- A task tracker (Linear in the source example) accessible to the agent for `review` follow-on.
- The `team-hr-skill` files (open-source pattern; if you don't have a starter, regenerate the structure from the SKILL.md in this batch's source notes).
- Optional: AgentMail or similar if you want auto-email replies; GitHub Pages or Notion public for JD landings (separate `hire` command).
