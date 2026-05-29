---
id: A-045
tier: A
category: "Founder productivity"
kind: workflow
title: "Year-review system — 9-history Context Lab playbook"
subtitle: "Personal annual reviews die in 5 hours of Notion journaling. Nine prompts over a weekend produce a System Prompt next year's agent inherits."
source: https://www.cybos.ai/cases/A-045
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "Founder · end of year. Optionally each team member."
type: case
version: v0.1
---
# Year-review system — 9-history Context Lab playbook

> Personal annual reviews die in 5 hours of Notion journaling. Nine prompts over a weekend produce a System Prompt next year's agent inherits.

## What

A runnable annual ritual built from 9 reusable markdown "histories" produced by an AI-native operations cohort. Pre-work: export 12 months of personal data sources (calendar, chats, voice notes, photos, health, banking, browser, GitHub). Then run 9 sequenced prompts: data-source guide → methodologies overview → contextual X-ray (the main one-shot review) → correlations across data layers → chat analysis → voice analysis → calendar analysis → Ray's 8-block system → personal System Prompt 2026 template. Final output is a one-page "My year as a system" plus a personal System Prompt that you paste into Claude Projects / ChatGPT Custom Instructions for the next year. Distinct from YearCompass / ProcessDriven Annual Planning / Spotify Wrapped: this is *evidence-based*, not wishlist-based.

## Why it matters

A standalone founder ritual that produces (a) a personal "constitution" for next year's AI partner — encoded as a System Prompt that every subsequent Claude/Cursor session inherits, (b) an honest pattern map of where energy went, (c) a small set of testable hypotheses ("> 15,000 steps correlates with anxiety, < 5,000 with mood drop") for the new year. Founders who have run it report it replaces 2–3 hours of YearCompass plus 8+ hours of ad-hoc reflection plus the disorder of "did I really make progress?". Pairs naturally with the personal-OS architecture: the System Prompt becomes the inheritance file every other case in this playbook reads.

## End-to-end

1. **Week before:** export your data, by tier.

- **Quick wins (5–10 min each):** Google Calendar → Settings → Export →.ics; Apple Photos timeline screenshot per month; Telegram Desktop → Settings → Advanced → Export Chat History (HTML or JSON) for 3–5 key chats; a 5-minute voice dump into Voice Memos or Telegram saved-messages: "what was important in my year, what repeated, what made me happy, what worried me, how do I think differently now vs January".
- **Medium (30–60 min each):** Apple Health → Export; bank statements as CSV; browser history export; Obsidian / Notion folder export.
- **Deep (1–2 hr each):** Gmail Takeout; call transcripts from Granola/Krisp/Otter; social-media archives; GitHub contributions screenshot or `gh api` export.
- Land everything in `~/year-review-2026/data/` under category subfolders: `time-attention/`, `communication/`, `health/`, `money/`, `creation/`, `social/`, `learning/`, `emotions/`. Keep raw; do not preprocess.

1. **Run History 1 (data-source guide) first.** It's a checklist, not a prompt — tick off what you have, decide what to skip.
2. **Run History 2 (methodologies overview)** to pick depth. The default is "Context Lab light" — 3–4 sources + correlations. Full version takes a week.
3. **Run History 3 — Contextual X-ray.** This is the one-shot deep prompt. If you only run one history, run this one. It works even without exported data, using whatever context the AI already has from your prior conversations.
4. **Run History 4 — Correlations.** Stack the layers and look for cross-layer signals. The hypotheses you generate here are the testable inputs for the next year.
5. **Run Histories 5–7 (chats, voice, calendar)** on the specific exports. Each takes ~30 minutes if data is ready. Outputs are mid-resolution analyses you'll later compose.
6. **Run History 8 — Ray's 8-block system.** This is the long-form ritual. Eight blocks (thinking, inner life, time/plans/goals, work, communications, body/health, money/lifestyle, media/travel). Drip-feed data into the AI one block at a time; receive 3-7 "I-statements", 3-5 reflection questions, one metaphor per block. End with the final synthesis prompt that compresses everything into one page.
7. **Run History 9 — System Prompt 2026 template.** Fill the template with what you learned. Save as `~/system-prompt-2026.md`. Paste into Claude Projects → Custom Instructions, ChatGPT → Settings → Personalization → Custom Instructions, and reference it from your team `CLAUDE.md` and personal vault.
8. **Save the corpus.** Everything you produced this week — analyses, the System Prompt, the visual card — lives in `~/year-review-2026/output/`. Next December, History 1's checklist is shorter because you already have the structure.

## Prompts

History 3 — Contextual X-ray of the year (the main one-shot, verbatim):

```
`I want you to act as my "context analyst" and produce an honest review of my
past year.

GOAL:
- Do NOT judge and do NOT "optimize" at any cost
- Help me see: how the context of my life was organized (roles, projects, people,
 tools, habits)
- What was overloading me, and what was unloading me
- Which patterns to carry into the new year, and which to leave behind

DATA:
- Use everything you know about me from our chat history
- You may add data below:

=== DATA START ===
[paste notes, plans, calendar exports, journal — or leave empty]
=== DATA END ===

ADAPTATION (important):
- Tailor the analysis to ME, not an abstract person
- If you can see I barely use systems — don't impose a productivity lens
- If it's more about emotions/relationships — shift focus there
- Use MY language
- If a section doesn't fit — rename or skip it

STRUCTURE:
1) Frame of the year and who I was — period, roles, key events/turning points
2) The year's storyline (3-6 phases) — each phase: what life was occupied with, load, "context weight"
3) Map of contexts and "loose ends" — phantom projects, relationships, self-demands, deferred decisions
4) My "museum of systems" — tools launched and abandoned, mental scenarios, images vs real needs
5) Lessons of the year — 5-10 practical insights; two lists "carry into the new year" and "leave behind in this one"
6) Draft System Prompt for the new year — 7-12 points, realistic constraints,
 "this is mine" criteria, AI's role

FORMAT:
- Write like a living person
- No corporate newspeak or coaching clichés
- Concrete, careful, personal
- Slightly narrative, like a story, is fine
`
```

History 4 — Multi-Layer Timeline (correlations, verbatim):

```
`I have data for [year] across several categories:
Calendar: [events by month]
Health: [steps, sleep]
Emotions: [from journal or memory]
Finances: [spending categories]
Chats: [activity, tone]

Build a multi-layer timeline. For each month, show: calendar density,
health metrics, emotional state, social activity, financial patterns.

Find correlations:
1. When busy calendar → stress?
2. When low steps → bad mood?
3. When impulsive spending → what was happening?
4. When high productivity + good health + positive mood?
`
```

History 5 — Chat analysis (verbatim core):

```
`Here is the export of my chats for [year]: [paste JSON or text]

Analyze:
1. Top-10 contacts (by message count) — how did activity change month by month?
2. Top-5 conversation themes — topic modeling, which themes are recurring?
3. Emotional dynamics by quarter — Q1..Q4 overall tone
4. New vs old contacts — who appeared, who dropped out of regular communication
5. Dead conversations — with whom did correspondence stop

Especially find: recurring questions, moments of excitement, support moments.
`
```

History 6 — Voice notes (verbatim core):

```
`Here are the transcripts of my voice notes for [year]: [text]

Analyze:
1. Key themes (top 5-7 by frequency)
2. Emotional peaks — moments of joy / moments of anxiety
3. Recurring phrases — which phrases I repeat
4. State of mind by quarter Q1..Q4
5. Shifts in focus — what I was planning at the start vs what I'm discussing now

Format: markdown timeline with quotes.
`
```

History 7 — Calendar (verbatim core):

```
`Here is my calendar for [year]: [paste.ics file or monthly summary]

Analyze:
1. Peak months (by event count) — correlation with results?
2. "Pits" with no activity (> 3 days without meetings) — rest or burnout?
3. Top-10 people (by meeting frequency) — work vs personal
4. Categories — work %, personal %, health %, social %
5. Regular patterns — weekly, monthly rituals

Create a visualization: 12 squares by month, density shaded.
+ insights: what does the calendar say about my real priorities?
`
```

History 8 — Master prompt (Ray's 8 blocks, verbatim core):

```
`I want to review my year as a system.

I have eight blocks of data:
1) Me and my thinking
2) Inner life and self-reflection
3) Time, plans, goals
4) Work and professional sphere
5) Communications and relationships
6) Body and health
7) Money and lifestyle
8) Media, visual memory, and travel

I'll upload excerpts for each of these blocks in turn.

Your task:
- help me see patterns, not give advice
- ask careful questions
- connect different blocks to each other
- do not give medical, legal, or financial recommendations

Response format for each block:
1) 3–7 observations as "I-statements"
2) 3–5 questions for self-reflection
3) One metaphor: "My year in this area is like…"

Ready? Ask for the first block.
`
```

History 8 — final synthesis (verbatim):

```
`We've gone through my year in eight blocks. Compose one page "My year as a system":
1) Title of the year — like a movie or book title
2) 5–7 key patterns of the year
3) 3–5 things I can be proud of
4) 3–5 soft branching points for next year (not goals, but vectors)
5) Metaphor: "My year is like…"
6) 3 questions to enter the next year with

Speak in the first person, without motivational pathos.
`
```

History 9 — System Prompt 2026 template (the inheritance artefact, verbatim):

```
``
```

## Gotchas

- **Don't push productivity on a non-productivity-oriented user.** History 3 explicitly tells the AI: "if you can see I barely use systems — don't impose a productivity lens". Respect this — the failure mode of bulk-reflection tools is exactly this overreach.
- **Don't run all 9 in one day.** Histories 3 + 8 + 9 each need separate sittings or you get shallow output. Spread across a week.
- **Don't summarize prematurely.** "Summary born without context is bad" (workshop principle). The histories explicitly cross-feed; don't compress History 5 before History 4 has run.
- **Privacy:** keep exports local; share *insights*, not raw data. Some chat exports contain dozens of people who didn't consent to being part of your retrospective.
- **Don't generate "wishlist goals".** This is the Context Lab differentiator from YearCompass / ProcessDriven — outputs are evidence-based, not aspirational. If your AI starts producing "next year I will…" lists, redirect to "what does the evidence say I actually do?"

## Variations

- **30-minute light version:** History 3 only, no data exports, on whatever the AI already remembers about you from your prior chats.
- **2–3 hour version:** History 3 + one data source (most useful: calendar from History 7).
- **Full week version (~20 hr):** all 9 histories, all data sources, ending with a visual card via the bonus prompt in History 8 (3-5 colour palette + 3 phrases for a poster).
- **Team variant:** each team-member runs the ritual privately. The team's collective output is a *shared System Prompt for the company* — the union of explicit operating principles, encoded in your team `CLAUDE.md`. This becomes the new-hire onboarding gift on Day 1.

## Tools

- ChatGPT, Claude, or Gemini — Histories 3, 4, 8 work in any.
- Telegram Desktop for chat export; Apple Calendar / Google Calendar export for.ics.
- Optional: Granola / Krisp / Otter for call transcripts (History 6).
- Optional: Obsidian to store the outputs under naming convention (`{personal} {year-review} description – 2026-12-31.md`).
- Optional: SuperWhisper / Wispr Flow for the voice dump in History 6.
- ~20 hours of unhurried time over a week.
