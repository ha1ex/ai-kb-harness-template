---
id: A-046
tier: A
category: "Founder productivity"
kind: workflow
title: "Personal CRM for fundraising — founder's relationship management as a private repo"
subtitle: "Founders manage hundreds of VC/LP/angel relationships in their head. One private repo + Telegram bridge replaces the assistant."
source: https://www.cybos.ai/cases/A-046
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "Founder during fundraising · later · executive assistant or fundraising chief of staff"
type: case
version: v0.1
---
# Personal CRM for fundraising — founder's relationship management as a private repo

> Founders manage hundreds of VC/LP/angel relationships in their head. One private repo + Telegram bridge replaces the assistant.

## What

A separate private Git repo (e.g. `founder-personal-crm` or similar) housing the founder's fundraising relationships. One file per contact, one file per fund/firm, two top-level backlogs (active pipeline vs revisit-later), a tasks file separated from contact files, an inbox-processing rules file, and a small `Scripts/ResearchTools/` folder with Perplexity-API-driven research scripts (`contact_research.py`, `company_research.py`, `general_research.py`, `linkedin_research.py`). Connected via a Telegram bridge so the founder can talk to it walking around. The most important asset is not the structure — it is the single `AGENTS.md` rule: **DO NOT INVENT TASKS**.

## Why it matters

A founder doing fundraising-grade relationship management without an executive assistant, or with a lean one. Maintains professional CRM-quality discipline across hundreds of VCs, LPs, family offices, advisors, and angels. Natural-language commands ("do web research for [Person]", "do company research for [Fund]") complete in seconds. The repo doubles as personal historical record — after the round closes, you keep the corpus and re-use it the next round.

## End-to-end

1. **Create a private Git repo with restricted access** (just you, or you + one operator). Never inside the team workspace — fundraising data has different exposure rules.
2. **Structure under `MainCRM/`:**

- `Contacts/{First Last}/` — per-contact folder with `profile.md`, `linkedin.md` (Harmonic / Apollo dump), `email-thread.md` (running paste from Gmail), `telegram.md` (running paste from Telegram).
- `Companies/{Type: Name}/` — e.g. `Companies/Fund: Sequoia/`, `Companies/Firm: Lazard/`. Minimal company profile + list of contacts at that firm we know.
- `Context/Contacts_Actual.md` — your active pipeline backlog (one row per active contact). Sortable, ~70 KB at any moment.
- `Context/Contacts_Later.md` — future-revisit with explicit re-engage condition ("return when ARR > $5M").
- `Tasks/work_tasks.md` — this-week to-do list (P0/P1/P2/P3). Strictly tasks YOU explicitly chose to do or that were explicitly agreed in the conversation.
- `Inbox/inbox_processing_rules.md` — two-stage workflow: collect all inboxes first, then process with full context.
- `Scripts/ResearchTools/` — research scripts driven by Perplexity API (or equivalent).
- `Specs/` — technical specs per script. Documented so the agent can debug them.
- `AGENTS.md` — the constitution (see below).

1. **Bootstrap the research scripts.** Each script wraps a single Perplexity API call with a structured prompt and writes the result into the corresponding `Contacts/{Name}/research-YYYY-MM-DD.md` or `Companies/{Type: Name}/research-YYYY-MM-DD.md`. Run from the agent: "do web research for Alex Smith" → agent invokes `contact_research.py "Alex Smith"`.
2. **Wire a Telegram bridge** (see the mobile Telegram-bridge case below). The Telegram bot accepts natural-language commands and routes them to the CRM repo. Founder walks around, says: "log my call with Sequoia — I told them we'll have a follow-up deck in two weeks; they said they're tracking us; nothing else committed."
3. **Set inbox-processing as a daily ritual.** Once a day, "collect inbox" pulls everything from Gmail + Telegram + LinkedIn into a flat `Inbox/raw-YYYY-MM-DD.md`. Then "process inbox" reads it with full context (Contacts_Actual + Strategy folder), drafts updates to the right contact files, and proposes tasks — but never adds tasks unless they were explicitly committed.
4. **Strategy folder is loaded for every fundraising comms.** Almost all fundraising messages benefit from current company state (ARR, traction, ask). Reference the strategy folder in the master `.cursorrules` so the agent always knows the latest numbers before drafting.
5. **Keep the file naming flat for contacts.** One folder per person; PDFs/decks alongside. Mirror the `candidate {Name}` hiring pattern (no per-contact subfolders by status — that's a different anti-pattern: see #46).

## Prompts

The repo `.cursorrules` (the constitution — the single most important file):

```
`You manage my personal fundraising CRM. This repo is private. NEVER push to a public remote.

CRITICAL — DO NOT INVENT TASKS
- A task lives in Tasks/work_tasks.md only if:
 (a) I explicitly said "add task: X", OR
 (b) the contact and I explicitly agreed it in a message thread I show you.
- Do NOT generate "obvious next steps". Do NOT add follow-up tasks because it
 "would be a good idea". Do NOT pre-draft "as agreed" tasks from a meeting I
 haven't yet shared with you.
- If you think a task belongs, output a "Suggested tasks (NOT ADDED)" section.
 I will decide.

CONTACT WRITES
- When updating a contact file: append, never overwrite. Each update gets a YYYY-MM-DD
 H:MM dateline. Cite source: [gmail/<thread>] or [tg/<chat>:<msg>] or [call/<file>].
- For new contacts, run Scripts/ResearchTools/contact_research.py first. Save under
 Contacts/{First Last}/research-YYYY-MM-DD.md.

STRATEGY CONTEXT
- Before drafting any fundraising message, read Docs/Strategy/Company-Overview.md
 and Docs/Strategy/Current-Round-Ask.md. Those are canonical.
- Cite numbers as [CANONICAL] or [REF: file.md#section]. Never extrapolate ARR or
 traction figures.

WHAT YOU MAY NOT DO
- Generate speculative "AS-IF-AGREED" recap texts (e.g. "as discussed, here's the deck"
 when no such agreement exists). Past failure: 2026-03 — sent a 'follow-up' to an LP
 for a meeting that hadn't happened yet.
- Auto-classify contacts as "cold" or "passed". Status lives only on my explicit say-so.

COMMANDS YOU UNDERSTAND
- "do web research for [Name]" → run contact_research.py
- "do company research for [Fund/Firm]" → run company_research.py
- "do linkedin research for [Name]" → run linkedin_research.py (requires session)
- "research: [topic]" → general_research.py
- "log [verb] [Name] [Co]: [what was said]" → append to contact file with full citation
- "update CRM" → git pull
- "commit" → git add -A; git commit; git push (private remote only)
`
```

Sample contact research script call (verbatim signature):

```
`python3 Scripts/ResearchTools/contact_research.py \
 --name "Alex Smith" \
 --firm "Sequoia Capital" \
 --output "Contacts/Alex Smith/research-2026-05-12.md" \
 --depth deep
`
```

The script wraps a Perplexity API call with a structured prompt: "Research [Name], current role at [Firm], recent investments, recent public commentary, prior funds, education, public social presence. Cite all sources. Output as Markdown with sections: role, recent activity (last 12 months), prior investments by sector, public quotes, public social handles, possible connectors to me (if information is available)."

## Gotchas

- **DO NOT INVENT TASKS.** This is the rule that justifies the case. The single hardest part of an agentic CRM is suppressing the agent's helpful-but-fabricating instinct. Encode it in `.cursorrules` and reinforce it every weekly tune-up.
- **No per-contact subfolders by status** (mirror of the hiring anti-pattern). One folder per contact, status in frontmatter. Status moves are frontmatter edits, not file moves. (Distributed anti-pattern lesson, 2026-05-05.)
- **Don't share the CRM repo with the team.** Fundraising relationships have different confidentiality posture than the team workspace. Some VCs assume they're "in stealth" with you; visible cross-pollination breaks trust.
- **Don't bridge to Telegram without strong auth.** Anyone with the bot token has access to your fundraising data. Per-user bot, restricted to your Telegram user ID only.
- **Don't auto-classify "cold" or "passed".** Status is a deliberate human act. The agent only proposes.

## Variations

- **Lighter version (pre-fundraise):** drop the Perplexity scripts. Just file structure + the `.cursorrules`. Useful for any founder managing >50 high-value relationships (partnerships, advisors, hires).
- **Heavier version (with a chief of staff):** add an inbound-routing layer: every email/Telegram message to the founder gets pre-classified into "needs me / can be handled / FYI", with handle-able items routed to the chief of staff via a separate `cos/` repo (see #211). Founder reviews summary once a day.
- **Investor side:** flip the schema — `Investments/`, `Pipeline/`, `Watchlist/`, with the same constitution rule that the agent must never auto-progress a deal.
- **Live-event capture variant** — drop a phone screenshot of a referral; OCR plus voice prompt creates a vault card before the conversation ends.

## Tools

- Private GitHub or self-hosted Git repo with strict access (just you + executor).
- Perplexity API key (~$20/mo) or equivalent for research scripts.
- Optional Harmonic / Apollo API for LinkedIn-quality structured contact data.
- A Telegram bot bridge (see the mobile Telegram-bridge case) for mobile access.
- Cursor or Claude Code, plus a small folder of Python scripts.
