---
id: A-051
tier: A
category: "HR & hiring"
kind: tactic
title: "Show the magic — sit non-technical leaders in the terminal"
subtitle: "Slide decks and \"AI literacy\" workshops don't move skeptical executives. One hour at the keyboard does."
source: https://www.cybos.ai/cases/A-051
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Founder / operator personally · 1:1 with each non-technical leader (IT director · production economist · CFO · head of department)"
type: case
version: v0.1
---
# Show the magic — sit non-technical leaders in the terminal

> Slide decks and "AI literacy" workshops don't move skeptical executives. One hour at the keyboard does.

## What

The single highest-leverage culture intervention in any AI transformation. Skip slide decks, skip lunchtime AMAs, skip "AI literacy" workshops. Instead: literally sit each non-technical leader down in front of a terminal running Claude Code (or Codex), pick one real, painful, repeatable problem they personally have, and walk them through solving it end-to-end while they watch the agent type. Their reaction — "oh — you can do that?" — is what flips company morale. The on-keyboard live demo is the initiation rite.

The standard arc: Day 1 the IT director is the loudest skeptic ("what's a terminal?"). Day 10 they are the strongest convert, running their own little terminal sessions and asking how to do more. Within ~10 days, peer-to-peer cascade does the rest of the work.

## Why it matters

Concrete observed effect at one mid-size cosmetics retailer: the operator started the transformation. Within ~10 days, the production economist and the CFO were spontaneously running their own terminal sessions. By Day ~14 the original IT director — who had spun a finger at his temple ("the boss has gone mad") on Day 1 — was being re-roled as Chief Integration Officer, owning microservice hardening. Same operator, ~10 days after the first terminal sit-down: "people went from spinning a finger at my temple to running and asking how to do more." This is the social precondition that makes every downstream case (microservice fleet, role-elimination, transcript-into-context, handoffs) actually adoptable rather than top-down imposed.

The intervention is cheap (1 hour per leader, no infra prep) and the conversion rate is high — typically <10% direct refusal across 15–17 departments at the reference site. Refusers exit on good terms with severance.

The reason this beats every other adoption tactic in the corpus: every other tactic (bonus programs, champions networks, AI academies) requires the leader to *imagine* the value before opting in. The terminal demo replaces imagination with watching. Watching is much cheaper than imagining when the thing being imagined has no precedent in the leader's experience.

## End-to-end

1. **List the non-technical leaders you need to flip.** Heads of: IT, finance, production, logistics, ecom, sales, legal, HR. Each one gets a 1-hour slot in your calendar this week. **Don't batch.** One leader, one session, undivided attention.
2. **Before the session, identify ONE specific pain that leader has.** Talk to them in advance (or to their team) and surface a real, small, repeatable problem they personally hate doing. Examples from the reference deployment: file consolidation across spreadsheets, dedupe across CSVs from 3 marketplaces, mass-rename of supplier invoices, monthly reconciliation of one specific number that comes from two systems. The smaller and more repeatable, the better.
3. **Get them in front of YOUR machine.** Do not ask them to install anything yet. Open Claude Code (or Codex) in a terminal on your machine. They sit in your chair. You stand. Hand them a keyboard.
4. **Have them describe the problem out loud, in their own words.** Don't summarise for them. Don't pre-write the prompt. Their actual phrasing is the prompt — they need to feel that the thing they say to the agent is the thing the agent does. If they fumble, let them fumble; the agent handles ambiguity better than your filtering will.
5. **Let the agent do it. Watch their face.** The "what's a terminal?" → "wait, it just... did it?" arc lands in the first 60 seconds of the agent's first response. Don't narrate. Don't explain. Let the moment land.
6. **Let them prompt the next iteration.** "Now do it for the other 11 files." "Now save the output to a Google Sheet." "Now do this every Monday morning." Each iteration is a new "oh, you can do that too?" beat. By the third iteration they own the loop.
7. **Show the deployed URL or the saved file.** End the session with a real artefact — a CSV in their Downloads, a Sheet they can open, a Telegram bot URL. Not a demo. Their problem is actually fixed.
8. **Do not try to teach them anything in this session.** No CLI lecture, no "let me explain the difference between Claude and Codex." The session's only job is the conversion experience. Teaching comes after they ask for it (and they will, within a week).
9. **Within 48 hours, follow up.** "Want a Claude subscription set up on your laptop?" / "Want me to set up a terminal for you on Monday?" The flip-rate is much higher when the follow-up arrives before the impression fades.
10. **Repeat with the next leader.** No batching. The 1:1 setup is the intervention. Group demos do not produce the same flip-rate because the leader isn't holding the keyboard.
11. **Let peer-to-peer routing carry the rest.** Once 2–3 leaders have flipped, the operator stops being the source. "The eCom team — the folks there are doing it really well; go to them; they'll teach you." See the variation in A-039 for the peer-routing pattern that replaces formal Champions for solo-mandate founders.

## Prompts

Pre-session prep — operator's prompt to themselves:

```
`For <leader name>:
- One pain they personally feel: <specific recurring task>
- Inputs they bring: <files/screenshots they already use>
- Desired output: <what would actually relieve the pain>
- Pre-installed: nothing on their machine. We use mine.
- Calendar: 1 hour, 1:1, no agenda doc.
`
```

In-session — operator's instruction to the agent BEFORE the leader speaks:

```
`<Leader> is about to describe a problem to you. They've never used a
terminal before. Constraints:
- Take their phrasing literally; do not rephrase or "improve".
- Ask AT MOST one clarifying question before acting.
- Show every file you read and every file you write.
- After you finish, ask the operator (me) before doing anything destructive
 or anything that touches a remote service.
- Print a one-line summary at the end of each step.

Ready. Wait for <Leader> to speak.
`
```

## Gotchas

- **Don't pick the leader's "interesting problem."** Pick the painful, repeatable, boring one. Boring problems convert better because the leader is already exhausted by them.
- **The 10% who don't convert won't be flipped by repetition.** Run the session once, well; if it doesn't land, part ways amicably with severance. The reference operator's framing: "what we're doing is at world-class frontier; few companies in the world are doing this; want to run with us — let's run; not ready — let's part on good terms." Honesty beats KPI-engineering for this specific motivation gap.
- **Don't run this in a regulated function without compliance context.** Bookkeepers and tax/regulator-facing roles need a compliance overlay first (which data can go to the cloud LLM, which can't). Without that overlay, the session creates risk rather than adoption.
- **2026-Q1 lesson:** generic AI literacy training failed at multiple cohort sites ("40% tried it, 15% used it"). Don't fall back to it after the terminal session. The terminal session IS the literacy intervention; per-function workshops (where teams bring real tasks and leave with working workflows) are the only group-format follow-up that earns its calendar slot.

## Tools

- Claude Code (or Codex) on the operator's laptop, already authenticated
- One hour of the operator's time, 1:1
- A real pain identified in advance (not invented in the meeting)
- The leader sitting at the keyboard, not standing
- Optional: voice input on the operator's laptop if the leader hates typing — but typing the first prompt themselves is part of the conversion experience
