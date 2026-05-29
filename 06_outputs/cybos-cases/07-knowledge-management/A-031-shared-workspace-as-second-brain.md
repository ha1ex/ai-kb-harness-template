---
id: A-031
tier: A
category: "Knowledge management"
kind: strategy
title: "Shared Workspace as Second Brain"
subtitle: "AI on top of Notion + Slack + Drive never has the full picture. Collapse everything to one Git folder; deprecate the wikis."
source: https://www.cybos.ai/cases/A-031
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "Founder + Head of Ops · every employee is a participant · at enterprise scale · a Head of Digital Business owns the seeded-clone rollout to ~15 lieutenants"
type: case
version: v0.1
---
# Shared Workspace as Second Brain

> AI on top of Notion + Slack + Drive never has the full picture. Collapse everything to one Git folder; deprecate the wikis.

## What

A single Git-backed folder tree that holds *every* document the company touches — strategy, product specs, sales pipeline, client projects, call transcripts, Slack/Telegram exports, finance, hiring, code repos. Every employee opens it in Cursor or Claude Code; agents at every seat operate on the same canonical files. Notion, Confluence, and Google Docs are *deprecated*, not just complemented. One reference deployment (a marketing-analytics platform) reports –50% Slack/Telegram messages, –15% internal meetings, sales-assistant headcount eliminated, and client-integration time dropping from 6 weeks to 1–2 days inside ~12 months.

At enterprise scale (one large investment firm now ~mid-rollout), the same substrate is cascaded via a **seeded-clone pattern**: the founder builds a personal Second Brain first, then selects ~15 cross-functional lieutenants, gives each a *seeded copy of the founder's own SB* as their starting point, runs a week of training, then weekly community demos. Bootstrap data on Day 1 is the founder's exported ChatGPT and Gemini conversation history — a single command turns months of personal chat into the first set of canonical files. Customer-facing deliverables (personalised interactive web client proposals, one per client) become the first downstream artefacts the cascade produces.

## Why it matters

The "AI transformation" most companies try is *adding* AI on top of fragmented context — chatbots over Notion, copilots over Slack, RAG over Google Drive. It fails because the agent never has the full picture. The Shared Workspace inverts the move: collapse the substrate first, then turn the agents on. Now any agent can answer "have any of our team ever talked to anyone at Genesis-1000?" in seconds across calls, Slack, tasks, and emails. The compounding effect: every new workflow you write benefits from every other workflow's outputs, because they all read the same files.

The enterprise cascade matters because it solves the "we have many employees and few power users" gap: the seeded clone gives the next tier of leaders a non-empty starting point — they are not starting from a blank Obsidian vault, they are starting from a working SB and modifying it. The cascade leader at the reference enterprise firm reframed his own role mid-rollout — from "manager asking team for things" to "proactive assistant going to team with ideas" — because his SB is denser than any individual team member's context, so he proposes and they refine. Downstream artefact: per-client interactive web presentations replacing "clunky PowerPoint portfolio proposals" — the team itself asks "make this for every consultant" once they see the first one.

## End-to-end

1. **Create the umbrella repo.** Name it `{company}-Workspace`. Private. Use the open-source `ai-first-workspace-template` repo as the starting skeleton.
2. **One repo per department, mounted as a subfolder.** Separate Git repos let you scope access (Finance, Client Projects, Sales-Pipeline restricted). Mount under `Docs/` in the umbrella via `setup/clone-all-repos.sh`. Suggested layout:

```
`{company}-Workspace/
├── CLAUDE.md # root navigation (NOT a rules dump)
├── AGENTS.md # cross-agent equivalent
├── {naming-convention} – yyyy-mm-dd.md
├── HOUSE-STYLE.md
├── setup/
│ ├── clone-all-repos.sh
│ ├── update-all.sh
│ └── README.md
├── scripts/ # shared utilities + check_range.py
├── Docs/
│ ├── Strategy/ # separate Git repo
│ ├── Product/ # separate Git repo
│ ├── SalesAndMarketing/ # separate Git repo
│ ├── Operations/
│ ├── Operations-Hiring/
│ ├── Finance/ # restricted access
│ ├── Legal-HR/ # restricted access
│ └── ContentVoice/
├── Projects/
│ ├── Status-Projects/ # per-client status cards
│ ├── Transcripts/ # Fireflies/TLDV dumps
│ └── Fireflies-Transcripts/
├── Presales/ # restricted
├── SePersonalCRM/ # restricted to founder
├── Sales Calls/
├── Dev-{ProductName}/ # actual code repos
└──.gitignore.template
`
```

1. **Three-tier `CLAUDE.md` hierarchy.** Root file is a *distributor*, not a rules dump. Department-level `CLAUDE.md` files are the rulebooks for that subdomain. Project-level files are the focused context. Never go three levels deeper.
2. **Wire `setup/clone-all-repos.sh` and `setup/update-all.sh`.** One command to onboard a laptop; one command every morning to sync everything. Make `bash setup/update-all.sh` the team's morning ritual.
3. **Restricted repos remain repos.** Finance and Client-Projects are separate repos; ACLs at the Git layer; they show up as subfolders in the umbrella only for users with access.
4. **Bootstrap Day-1 content from chat-history exports.** Don't wait for the team to migrate. Export your own ChatGPT and Gemini conversation histories first — both providers offer one-click data exports. Run a small ingestion script that breaks the export into per-project Markdown files (one project = one folder; one substantive conversation = one file). Drop them into the relevant `Docs/` subfolders. By the end of Day 1 the repo is non-empty.
5. **Migrate Notion / Confluence / Google Docs.** Pour everything into the relevant repo as Markdown. Don't make it pretty. Volume matters more than polish — agents read it all.
6. **Announce a kill date for the old wiki.** Pick a date 4–6 weeks out. Communicate weekly. On the date, revoke write access. Force-functioning the deprecation is the single most important governance move. The same reference deployment killed Confluence on a Friday and reports it as the best ops decision of the year.
7. **One ops person, 1:1 onboarding.** Head of Ops spends one hour per employee on Zoom: clone, install Cursor / Claude Code, run `update-all`, fix bugs, demo three queries. ~12 weeks of attention to reach point-of-no-return at ~40 people. Don't socially coast.
8. **Rotate one head if needed.** There will be one team lead who can't or won't transition. Replace them. Same reference deployment did this once; it was the unblock.
9. **Three-tier session affordance.** Stock founder/exec laptops with Wispr Flow + Raycast shortcuts so opening Cursor on the workspace is one keystroke.
10. **(Enterprise cascade — seeded clone rollout).** Once the founder's SB is dense (~3 months of personal use), pick ~15 cross-functional lieutenants — product, six-sigma-style ops, client managers, partner managers. Run a one-week training: how to read, how to write, naming convention, the three-tier CLAUDE.md hierarchy, the morning `update-all` ritual. Then **seed each lieutenant's repo with a copy of the founder's SB** as a starting point — not as a read-only reference, but as their working substrate that they prune and personalise. Homework: each lieutenant describes their own SB additions — data sources unique to their function, skills they want, key artefacts they output. Weekly community demos for ~6 weeks where lieutenants show one workflow each. Q+1: cascade to broader org integrated into the company's existing core CRM systems.
11. **(Enterprise cascade — proactive-assistant management shift).** As the cascade leader's SB becomes denser than any individual team member's domain context, the leader's day shifts: instead of asking the team "please prepare X," they prepare X using their SB and bring it to the team for refinement. The team eventually starts coming back with "let's also do Y." Behavioural pattern: leadership flips from order-giver to proposer. This is the cultural signal that the cascade is working at the leader level.
12. **(Enterprise cascade — customer-facing deliverables).** Downstream artefact pattern: per-customer personalised interactive web presentations (replacing legacy PPT portfolio decks). Aggregate per-client context (interaction history, portfolio, preferences) → generate a personalised web page via a Claude Code skill → embed in the consultant's workflow tool → cascade to all consultants. The team itself demands "make this for every client" once they see the first one. The customer-facing deliverable is the visible artefact that justifies the SB substrate to skeptical executives.

## Prompts

Root `CLAUDE.md` skeleton (a real one is ~80–150 lines; keep it under 200):

```
``
```

## Gotchas

- **Don't try to enforce by social pressure alone.** 12 weeks of attention plus one big deprecation event is the proven recipe. Pick one or the other and you'll plateau at ~60% adoption.
- **Don't dump files into Downloads.** Once you allow one person to keep working from Downloads/Desktop, you allow everyone. Forbid it; provide a path-copy shortcut to make the right move easier.
- **Don't go more than 3 layers deep in `CLAUDE.md` hierarchy.** Root → department → project. After that the agent's context bloats and orientation costs more than the rules save.
- **Confidentiality posture.** A small distributed startup accepts that data passes through Claude/Codex. Not appropriate for regulated industries; for those, run inference in-VPC and pair with token-metabolism's on-prem variant.
- **Filesystem-merge conflicts are rare but real.** Agents auto-resolve most; treat files like Notion docs: "save my update" / "pull latest" rather than long-running branches.
- **File-chaos open question (operator-flagged, unresolved).** Multiple operators flag that, after 2–3 months, the structure becomes idiosyncratic — "I keep too much in my head; folders are unstructured for anyone but me." Mitigation: a top-level `INDEX.md` regenerated by a cron agent; treat the workspace as a living artefact, not a one-time architecture exercise. Pairs with the handoffs case (per-project structured docs).
- **Don't seed-clone before the founder's SB is dense.** Seeding from a thin SB just propagates emptiness. Wait ~3 months of personal use before cloning to ~15 lieutenants. The 4-tier KM architecture (separate case) is one way to assess density.
- **Cascade-leader role-shift can backfire if the team isn't ready.** The "from order-giver to proactive proposer" pattern works when team members are confident enough to push back on a leader-generated proposal. If the team defaults to "yes, boss," the SB-rich leader will accidentally over-direct. Calibrate by asking proposals as questions ("does this match what you're seeing?") for the first month.
- Stop trimming context to "save tokens." Brief the agent like a $1000/hr consultant whose first hour is reading your situation: paste the full transcript, the full doc, the full prior thread. Minimal-context instincts are leftover from chat-GPT-3 economics; they cost more in re-prompts and wrong answers than the saved tokens are worth.
- A single sweeping "let the agent restructure my whole vault" pass can destroy weeks of trust in 5 minutes. Real failure: April 1-5, 2,400-note vault left in a half-restructured state, full recovery took days. Mitigations: (1) snapshot the vault before any global restructure; (2) restructure one tier at a time (four-tier KM), never all four at once; (3) keep an "incoming" tier that the agent is never allowed to mutate; (4) require human approval on any move-or-delete affecting more than N files per session.
- Explicit "don't rewrite" list from a transformation operator: (1) accounting modules in the legacy ERP — pay the specialist instead; (2) tax integration / official reporting — regulatory cost of bugs dwarfs build savings; (3) bank-integration plumbing that already works — wrap, don't replace; (4) any module the ERP vendor patches monthly — your fork rots. Build microservices around these; never inside them.
- File chaos remains an open problem at the 1000+ file scale, even with naming conventions (A-034), documentation skills (A-033), and four-tier KM (new-N13-09). No widely-deployed solution as of 2026-05. Reviewers and adopters should expect periodic "vault cleanup" sprints rather than once-and-done hygiene, and budget one operator-day per month for re-tiering and deduplication.
- When stuck or confused by the agent's output, recursively ask "explain this simpler" until you understand it. Non-technical operators reported this as the unlock for getting past "the agent did something I can't follow." Practical rule: never accept an artifact you cannot explain in your own words; loop the simplification request until you can.

## Tools

- GitHub org (private repos), one umbrella + one repo per department
- Cursor or Claude Code installed on every laptop
- SSH keys per employee, set up during onboarding
- The `ai-first-workspace-template` as the skeleton (open-source)
- One technical person to babysit setup; one ops person for 1:1 onboardings
- A confirmed kill date for the old wiki
- (Day-1 bootstrap) ChatGPT export + Gemini export of the founder's conversation history — both providers expose one-click data export
- (Enterprise cascade) ~15 named lieutenants extracted ~20% of their time for the 6-week seeded-clone pilot
