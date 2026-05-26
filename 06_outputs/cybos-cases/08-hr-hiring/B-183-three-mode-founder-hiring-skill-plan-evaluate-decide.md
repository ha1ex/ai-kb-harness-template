---
id: B-183
tier: B
category: "HR & hiring"
kind: skill
title: "Three-mode founder hiring skill — Plan, Evaluate, Decide"
subtitle: "Problem solved: Founders hire reactively or on vibes; a three-mode skill forces role definition, scorecard evidence, and a pre-offer \"hell yes or no\" decision gate."
source: https://www.cybos.ai/cases/B-183
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · hiring manager at a sub-50-person company"
type: case
version: v0.1
---
# Three-mode founder hiring skill — Plan, Evaluate, Decide

> Problem solved: Founders hire reactively or on vibes; a three-mode skill forces role definition, scorecard evidence, and a pre-offer "hell yes or no" decision gate.

## What

A skill that walks a founder of a small team through the entire hiring lifecycle in three explicit modes — Plan (define the role, write a job post, design a 3–4 step interview process), Evaluate (build a weighted scorecard, score candidates 1–5 with evidence, surface red/green flags), and Decide (force-test the gut call with pressure questions, frame the offer, or recommend "don't hire anyone right now"). It reads a `BUSINESS_CONTEXT.md` so company stage/revenue/team size shapes the conversation.

## Why it matters

A bad early hire is the most expensive mistake a small-company founder can make. The skill embeds hard limits that prevent the usual failures: 3–4 interview steps maximum (long processes lose the best candidates), 2 weeks first-contact-to-offer, must-haves are sacred (no compromise even for a likeable candidate), and an explicit path to recommending *no hire* when the founder is hiring to avoid doing the work themselves.

## End-to-end

1. The skill triggers on phrases like "I need to hire," "interview questions for," "should I hire," "evaluate this candidate."
2. Check `BUSINESS_CONTEXT.md`; if absent, ask one-shot (company, team size, revenue, current quarter focus) and save it.
3. Determine mode (Plan / Evaluate / Decide); if unclear, ask which.
4. **Plan mode:** start with "What problem does this hire solve?" — if the founder can't state it in one sentence, push back ("Are you sure this is a hire, or a process you haven't built?"). Walk 7 role-definition questions, generate a sub-500-word job post avoiding clichés, recommend sourcing, and design a lean 4-step process (resume screen 5min → phone screen 20min → working session 60min simulating the actual job → final 45min). Save to `hiring/[role-slug]-hiring-plan.md`.
5. **Evaluate mode:** build a weighted scorecard from must-haves; score each candidate 1–5 with specific evidence per criterion (no hand-waving); surface red flags (vague impact claims, comp mismatch, badmouthing prior employers) and green flags (specific examples, sharp questions, ownership).
6. **Decide mode:** ask the three forcing questions, pressure-test must-haves and 90-day/12-month realism against the cost of a wrong hire vs the cost of waiting; if green-lit, define comp/timeline/negotiation boundaries; if not, give explicit reasons to pump the brakes.

## Prompts

```
`Decide Mode forcing questions:
"If you had to decide right now, who would you pick?"
"What's your biggest hesitation?"
"Is this a 'hell yes' or a 'probably'?"
If it's not a hell yes, it's a no — for early hires, at least.

Job post anti-words: "Fast-paced environment" (chaotic), "Wear many hats"
(undefined), "Self-starter" (no management), "Rockstar/ninja/guru".
`
```

## Gotchas

## The dominant anti-pattern the skill is built to catch: hiring to avoid doing the work — when a founder can't state the problem the hire solves in one sentence, the answer is usually a process they haven't built, not a person. The other recurring trap is compromising on a must-have because a candidate is likeable; the skill treats must-haves as non-negotiable on purpose. The best interview question is a work sample that simulates the real job, not a behavioral one.

## Tools

- Claude Code (or any SKILL.md-compatible agent)
- Optional `BUSINESS_CONTEXT.md` at project root (reusable convention across the same skill pack)
- Install: `npx skills@latest add TheCraigHewitt/skills/ceo -s hiring`
