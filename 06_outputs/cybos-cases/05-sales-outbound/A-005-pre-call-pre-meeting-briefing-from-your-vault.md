---
id: A-005
tier: A
category: "Sales & outbound"
kind: workflow
title: "Pre-call / pre-meeting briefing from your vault"
subtitle: "Problem solved: \"Has anyone here ever talked to this account?\" gets answered in 30 seconds instead of a 30-minute Slack hunt — and the brief now carries a structured discovery framework, not just history."
source: https://www.cybos.ai/cases/A-005
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "AE · CSM · founder · partnerships lead · recruiter"
type: case
version: v0.1
---
# Pre-call / pre-meeting briefing from your vault

> Problem solved: "Has anyone here ever talked to this account?" gets answered in 30 seconds instead of a 30-minute Slack hunt — and the brief now carries a structured discovery framework, not just history.

## What

Before a meeting with a prospect, customer, or candidate, the user asks the agent one question — "We're meeting with [Account]. Pull everything we have on them and prep me." The agent reads everything in the shared workspace tagged to that account: every email thread, call transcript, task-tracker comment, Slack/Telegram mention, prior brief — and assembles a one-page brief in 30 seconds. People on both sides, prior agreements, open commitments, blockers, last-touch date, what was promised and whether it was delivered, three things to push, three things to avoid, a suggested opener. Folded in from two public sales-skill packs: the brief now also carries a **5-category discovery question set**, a **pain → cost → your-angle** research schema, an **objection prep table**, a **meeting-type × must-leave-with matrix**, and an **attendee influence map**, so the brief tells the rep not just what happened but what to ask and who to win.

## Why it matters

Three compounding outcomes. (1) **The right person comes prepared.** The canonical use case: "Have any of us ever talked to anyone at a large prospect? Pull every comm we've ever had." The agent answered in seconds and surfaced a two-year-old thread with an engineer at the prospect that ended on "let's revisit" — that became the meeting opener. (2) **Account-team handoffs stop costing 30 minutes of "fill me in".** Anyone covering a teammate walks in cold-prepared; prep time on a typical account drops from 30–60 minutes to ~2 minutes. (3) **The discovery framework forces relevance.** A public CEO prospect-research skill enforces one rule the vault-only version lacked: *every insight must connect to what the user sells, not generic research.* A brief full of true-but-irrelevant facts wastes the meeting; the schema forces each item to a pain, a cost, and an angle the seller can act on.

## End-to-end

1. **Foundation: shared workspace as second brain.** Requires the foundation case — a single Git-backed folder tree with all company knowledge ingested, per-department repos under the umbrella so access can be restricted.
2. **Ingest transcript pipeline.** Cron pulls new meetings from the transcription source into `Projects/Transcripts/`, named `YYYY-MM-DD_[client]_[meeting-type].txt`, with an index file for fast lookup.
3. **Account-tagging convention.** Every transcript, Slack dump, task comment carries an `[ACCOUNT:Name]` tag. Load-bearing — without it the skill name-matches and conflates "John at one account" with "John at another".
4. **The brief skill.** Given an account, the agent greps the workspace, reads the latest 3 transcripts + last 6 months of email + open task items + the strategy/competitor file, and produces the structured brief (people, history, last touch, commitments, blockers, three-to-push, three-to-avoid, opener).
5. **Add the discovery framework subsection.** The brief skill now also emits a discovery block built from the 5-category question set and the pain/cost/angle schema (see prompts). This is the half-merge from the two sales packs: the agent doesn't just summarize, it proposes the questions to ask and the angle to land them.
6. **Run it.** From the workspace root: *"Use sales context. Brief me for the [Account] meeting at [time]. Pull last 3 calls, all open task-tracker items, any thread from the last 6 months, and generate the discovery block."*
7. **Iterate the brief structure.** First brief is rough; tighten the skill file (not the prompt-of-the-day) over ~3 iterations. When the brief is wrong, fix the skill or the tagging convention.
8. **Tie it to the calendar.** Optional cron agent reads tomorrow's calendar, runs the brief skill for every external meeting, posts a single morning Telegram digest with one collapsed brief per meeting.

## Prompts

Brief skill structure (~80 lines in `Skills/sales-brief/SKILL.md`):

```
`1. Read sales context:./Docs/SalesAndMarketing/AGENTS.md
2. Resolve account → grep workspace for "[ACCOUNT:<name>]" and "<name>" in transcripts, emails, tasks
3. Read at most: 3 most-recent call transcripts, last 6 months of email
 threads, all open task-tracker items, the competitor file if present.
4. Output exactly this shape:

 # [Account] — brief for <time>
 ## People (us / them)
 ## History (one paragraph, dated)
 ## Last touch (date + what happened)
 ## Open commitments (ours / theirs, with owner and due-by)
 ## Blockers (theirs that affect the deal)
 ## Three things to push
 ## Three things to avoid
 ## Suggested opener (one sentence)

5. Cite every claim with [REF: <path>] so the user can verify.
`
```

5-category discovery question set (verbatim shape from a public sales-call-prep skill, repo `labs21-dev/agents-stack`):

```
`For this meeting, generate 3-5 questions in EACH category:
 1. CURRENT STATE — how do they handle <problem> today?
 2. PAIN & PRIORITY — what's the cost of the status quo? is it a top-3 priority?
 3. DECISION PROCESS — who signs, what's the eval path, what's the timeline?
 4. SUCCESS CRITERIA — what does "this worked" look like in 90 days?
 5. COMMERCIAL CONTEXT — budget cycle, incumbent, switching cost.
`
```

Pain / cost / angle research schema (verbatim shape from a public CEO prospect-research skill, repo `TheCraigHewitt/skills`):

```
`For every insight you surface, output exactly three lines:
 PAIN: <the specific problem they have, in their words>
 COST: <what that problem is costing them — quantify if the source allows>
 YOUR ANGLE: <how what WE sell connects to this pain — not generic research>

Rule: if an insight cannot be tied to what we sell, drop it.
Rule: be honest about what you don't know. Write "[unknown — needs ask]"
 rather than inferring. No invented quotes, no inferred attendees.

Conversation-starter test (stalker vs peer):
 BAD (stalker): "I saw you spoke at <event> and went to <school>..."
 GOOD (peer): "Most <role>s I talk to are fighting <pain> right now —
 is that on your plate or already solved?"
`
```

Meeting-type × must-leave-with matrix + attendee influence map:

```
`Tag the meeting type, then state the ONE thing to leave with:
 Discovery → a quantified pain + the decision process
 Demo → a yes/no on whether THIS solves THEIR named pain
 Negotiation → a single open commercial term + a close date
 QBR → the next expansion or renewal trigger

Attendee influence map (label every attendee):
 decision-maker | champion | evaluator | blocker | end-user
For each: what they want, what they fear, how to address it.
`
```

Anti-hallucination rule (loaded from the root `AGENTS.md` / `CLAUDE.md`):

```
`Every statement in the brief is either [CANONICAL] (first declaration,
sourced) or [REF: folder/file.md#section]. No invented quotes. No inferred
attendees. If unknown, say "[unknown — needs ask]".
`
```

## Gotchas

- **Brief without citations is a fabrication generator.** Without `[REF:...]` per claim, the agent confidently invents agreements that never happened. The anti-hallucination rule is the floor.
- **Tagging convention is the foundation.** Without consistent `[ACCOUNT:X]` tags, the agent conflates same-name people across accounts. Fix tags first.
- **Generic research is worse than no research.** The pain/cost/angle rule exists because the most common failure of an AI brief is a wall of true-but-irrelevant facts. If an insight can't tie to what you sell, drop it.
- **"Be honest about what you don't know."** The prospect-research merge adds an explicit anti-hallucination clause: the agent must write `[unknown — needs ask]` rather than infer a decision-maker or a budget. Keep this verbatim; it's the same discipline as the [CANONICAL]/[REF] rule.
- **Don't ingest into Notion; ingest into the filesystem.** Notion/Confluence search is worse than `grep`, agents can't write back cleanly, and you lose two-layer navigation.
- **Don't try to brief without the foundation case.** This is a feature of the shared workspace, not a standalone install. Empty vault → invented brief.

## Variations

- **Calendar-driven morning digest.** Cron agent runs the brief skill for every external meeting on tomorrow's calendar, posts one Telegram digest.
- **Vertical-specific briefs.** CS version pulls integration status + open tickets + last commercial-terms doc; recruiter version pulls candidate file + interview transcripts + role-competency match. Same skill, different `Sections` block.
- **Cross-team intelligence query.** Ad-hoc, not per-meeting: "Show me every conversation about pricing with prospects above $100K ARR in the last 90 days." Same vault, different prompt.

## Tools

- Cursor or Claude Code at the workspace root
- Shared Git-backed workspace populated with transcripts, emails (or Gmail MCP), task-tracker dumps, Slack/TG dumps
- Ingest cron (TLDV / Fireflies / equivalent → `Projects/Transcripts/`)
- Account-tagging convention enforced in the root `AGENTS.md` / `CLAUDE.md`
- Optional: install a public sales-call-prep skill for the discovery scaffold — `git clone https://github.com/labs21-dev/agents-stack.git &&./docs/scripts/init.sh`
- Optional: install a public CEO prospect-research skill for the pain/cost/angle schema — `npx skills@latest add TheCraigHewitt/skills/ceo -s prospect-research`
