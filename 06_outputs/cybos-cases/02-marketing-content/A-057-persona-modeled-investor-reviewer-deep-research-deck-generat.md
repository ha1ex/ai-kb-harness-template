---
id: A-057
tier: A
category: "Marketing & content"
kind: workflow
title: "Persona-modeled investor reviewer — deep-research → deck-generator → reviewer loop"
subtitle: "Problem solved: Founders preparing pitch decks wait weeks for generic investor feedback; synthesize the target investor's persona from public talks, tweets, and LinkedIn, then run that persona as an adversarial reviewer agent that bounces a deck-generator until the deck survives the kinds of questions the real investor asks."
source: https://www.cybos.ai/cases/A-057
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · head of fundraising · agency producing client deliverables"
type: case
version: v0.1
---
# Persona-modeled investor reviewer — deep-research → deck-generator → reviewer loop

> Problem solved: Founders preparing pitch decks wait weeks for generic investor feedback; synthesize the target investor's persona from public talks, tweets, and LinkedIn, then run that persona as an adversarial reviewer agent that bounces a deck-generator until the deck survives the kinds of questions the real investor asks.

## What

Three-agent loop for any deliverable that needs investor-grade review. **Agent 1 — Deep-research:** ingests the target market, competitive landscape, and unit economics, producing a ~100k-word raw research dump. **Agent 2 — Deck-generator:** uses claude.ai/design to turn the research into a 4- or 8-slide deck with multiple internal self-validation passes (numbers cross-check, source attribution). **Agent 3 — Persona-modeled reviewer:** a synthesized "personality" built from public artifacts of the *specific* investor the deck is going to — their podcasts, tweets, LinkedIn posts, blog, conference talks. The reviewer reads the generated deck and asks the *uncomfortable* questions that investor is known for. The generator iterates against the reviewer until the reviewer approves. Reported result: usable shipped output by iteration 15.

## Why it matters

The mechanic is not "AI feedback on your deck" — that already exists and is generic. The signal is **persona-modeled adversarial review**: the agent isn't asking generic-VC questions, it's asking the questions *the specific partner you're pitching* asks, in their tone, against their actual decision criteria, with their format preferences. The output is a deck that survives the specific meeting you're walking into, not one that survives "a VC review" in the abstract. The same pattern generalizes to client deliverables — synthesize the client's CMO, run them as the reviewer, save the rework cycle.

## End-to-end

1. **Pick a target investor (or reviewer persona) deliberately.** The whole loop is calibrated to one human. Don't do this for "VCs in general" — do it for the person on the calendar.
2. **Scrape their public artifacts.** Podcasts, conference talks (transcripts via YouTube or Granola), tweets, LinkedIn posts, blog. Anything where they discuss what they look for in a deck, decision criteria, what makes them say no.
3. **Synthesize the persona.** Compress the corpus into a reviewer spec: what they care about, what they ask, their decision criteria, their format preferences, the kinds of numbers that trigger skepticism. This becomes the system prompt for the reviewer agent.
4. **Wire the 3-agent loop.**

- Deep-research agent → ~100k-word raw data dump (market sizing, competitive map, unit economics, regulatory context). Enrich with Statista, SimilarWeb, Sensortower, AppMagic, Google Ads search-volume API where the category supports it.
- Deck-generator agent → uses claude.ai/design for layout; runs internal self-validation passes on numbers (catches multiplication errors before the reviewer does); produces a 4-slide exec version + an 8-slide full version.
- Persona-reviewer agent → reads the deck, asks the uncomfortable questions, returns a pass/fail with specific gaps.

1. **Iterate to convergence.** One operator reports 15 iterations before the reviewer stopped flagging gaps. Each iteration: reviewer flags → generator revises → re-submit. Don't shortcut: the early iterations catch the obvious gaps; the late iterations catch the ones that would have killed the meeting.
2. **Run a dedicated data-validation test suite separately.** An LLM-generated deck will at some point ship a multiplication error (one operator caught a 180×240 arithmetic mistake in a deck — "anyone who notices this once never trusts the calculation again"). Build a deterministic numerical-consistency check that runs on the final draft. The generator's internal self-validation is necessary but not sufficient.
3. **Optional: enrich with external data APIs.** Statista, SimilarWeb, Sensortower, AppMagic for market sizing; Google Ads search-volume API for category demand signals. These are not in the base loop — add them when the reviewer's questions keep landing on "show me category traction".

## Prompts

Persona-modeling kernel — the rationale behind the reviewer:

```
`Theoretically what I built is a synthesis of a real person's personality
from publicly available data — understanding what's important to them,
what they look at in a pitch deck. Everyone has their own particularities
in how they process data, so I tried to adapt, to personalize the
presentation for a specific person. A bit of social engineering, but with
good intent.
`
```

Adversarial-reviewer pattern+ #12698 (one operator's earlier version uses ChatGPT directly for the same effect):

```
`"I usually ask ChatGPT to write a prompt for a strict investor and have it
 ask hard questions that founders are afraid of and find difficult to
 answer. Then I send the prompt with my deck and let it think for ~20
 minutes — usually enough."
`
```

System-prompt skeleton for the persona-reviewer agent:

```
`You are <Reviewer-Persona-Name>, a synthesized model of an investor based on
public artifacts. Your decision style:

- <criterion 1, extracted from their podcasts/posts — e.g. "always asks about
 retention before revenue">
- <criterion 2 — e.g. "skeptical of TAM slides; wants serviceable obtainable
 market">
- <criterion 3 — e.g. "rejects decks that lead with 'AI-powered' as a verb">
- <format preference — e.g. "8 slides max; one chart per slide">
- <numerical-skepticism patterns — e.g. "will multiply revenue × retention ×
 CAC payback in their head and reject if math is off">

Your job is NOT to write the deck. Your job is to read it as <Reviewer> would
and ask the 3-5 questions that would derail the meeting. Be specific. Cite
the slide. Where a number doesn't reconcile, point to which numbers.

Return:
1. PASS / NEEDS_REWORK
2. Specific gaps (slide-cited)
3. The single question that, if unanswered, kills the deal
`
```

## Gotchas

- **LLM-generated decks read as "no soul, too many numbers".** Multiple reviewers in source flag the same failure mode: generated decks feel like research dumps, not investor pitches. The persona-reviewer catches *some* of this if you've trained on a reviewer who values story arc — but not all. Have a human do the final story-arc pass after the agent loop converges.
- **The "I'll prove I won't lose your money" vibe is a real failure mode.** One reviewer's specific critique on a generated deck: it reads as defensive ("see, I won't lose your money") rather than offensive ("here's why this becomes a $1B outcome"). If your persona-reviewer doesn't have this critique in their criteria, generated decks will fall into it.
- **At pre-seed, the deck barely matters — they fund people and traction.** One reviewer's caveat: "below $3-4M, one check, it doesn't matter what deck you bring; they fund the person, then traction." Don't over-optimize the deck loop for a stage where the deck isn't the decision artifact.
- **Numerical errors compound trust collapse.** A multiplication mistake (180 × 240 = the wrong number) in one of the iterations destroys confidence in every number on every slide. The data-validation test suite is not optional once you're at investor-grade output.
- **Don't run the reviewer on a generic-VC persona.** The whole value is specificity. Generic-VC reviewers produce generic-VC feedback — you could have done that yourself in a chat window.

<hr/>

## Tools

- Claude Code (or Codex) — orchestrator for the 3-agent loop
- claude.ai/design — deck-generator layout engine
- A public-artifact corpus for the target persona (podcast transcripts, tweets, LinkedIn, blog)
- Statista / SimilarWeb / Sensortower / AppMagic / Google Ads search-volume API — optional enrichment
- A deterministic numerical-consistency test suite (don't trust the LLM's self-check on numbers alone)
