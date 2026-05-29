---
id: A-040
tier: A
category: "Strategy & leadership"
kind: strategy
title: "Four-week three-stream launch plan (People / Pilots / Education)"
subtitle: "\"We'll figure the program out later\" turns into 18 months of nothing. Three parallel streams force the first month's wins."
source: https://www.cybos.ai/cases/A-040
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "Founder/Sponsor + Operations Director + 3–4 stream leads"
type: case
version: v0.1
---
# Four-week three-stream launch plan (People / Pilots / Education)

> "We'll figure the program out later" turns into 18 months of nothing. Three parallel streams force the first month's wins.

## What

A 4-week launch plan structured as three parallel streams — **People** (hiring, AI Office formation, bonus program), **Pilots** (3 live AI pilots in parallel), **Education** (Telegram channel, AI Management OS install, weekly workshops) — with weekly milestones and named owners for each. Designed to deliver "AI Office formed, 3 pilots live, 4 workshops delivered, AI Governance approved, adoption baseline measured" within the first month. Companion to the diagnostic methodology (#176); the diagnostic produces the cards, this plan ships the first wave.

## Why it matters

The classic AI transformation failure mode is "we'll figure out the program later." Eighteen months later, the same team is still figuring it out. Three parallel streams force resolution on the three actually-necessary preconditions for any real adoption: the people who'll lead it, the live work that'll prove value, and the literacy that'll prevent shadow AI. Sequential plans starve at least one of those three.

## End-to-end

**Pre-kick-off (week 0):**

- Day 1: Diagnostic results presented to leadership.
- Day 3: Three-stream sync — confirm stream leads, owners per pilot, Telegram channel name.
- Day 5: Stream-1 (People) gets a green light to publish AI Office vacancies.

**Week 1 — Launch**

- **People:** AI Hiring Plan signed off (roles, grades, budget). AI Office formation: extract 3–5 best champions from regular duties (e.g., a unit lead + 2 builders + 1 ops); they report to the Head of AI. Define bonus program (3 tiers — adoption / champion / transformation-protection).
- **Pilots:** Three live AI pilots kicked off in parallel:

1. **Pilot A — Engineering productivity:** QA/regression automation OR full-team Claude Code adoption with `CLAUDE.md` in every repo. Owners: Eng Lead + external Eng partner.
2. **Pilot B — Sales copilot MVP:** real-time prompts in calls + pre-call prep + auto follow-ups. Owners: Sales Eng + external Sales partner.
3. **Pilot C — Customer-success or churn prediction:** rule-based churn model OR support copilot. Owners: CS Lead + external Data partner.

- **Education:** Telegram channel launched with the sponsor's first vision post. AI Management OS installed (daily brief + meeting transcriptions + tasks-for-HQ skill). Workshop #1 (Engineering): Claude Code + AI pair programming + `CLAUDE.md` hands-on.

**Week 2**

- **People:** Champions network rolls out (1 per team, bi-weekly challenges with cash prizes — typical structure: $2K / $1K / $0.5K winners).
- **Pilots:** Quick-win headline shipped (e.g., corporate VPN deployed to unblock the largest blocked dev population). One pilot shows preliminary numbers.
- **Education:** AI Governance draft circulated (data residency, PII handling, approved tools). Workshop #2 (Sales & Commerce).

**Week 3**

- **People:** AI metrics enter Performance Review (commits with AI, LLM usage, AI-assisted test coverage). Bonus program signed off.
- **Pilots:** 100% AI Adoption push in engineering — Claude Code Pro for all devs ($100–120/mo/seat at reference scale), `CLAUDE.md` in every repo, target 80%+ adoption in 6 weeks (each 1% of adoption ≈ a high-six-figure annualized value at 165 devs × +30% productivity).
- **Education:** Workshops #3 (Support & CS) and #4 (Product & HR).

**Week 4 — Milestones**

- AI Office staffed; motivation program live; first vacancies in interview cycles.
- Decision on scaling pilots → Phase 2 (typically: support copilot, voice transcription/categorization, AI code review v2, speech analytics).
- All functions completed an AI workshop; AI Governance approved; adoption baseline measured.

**Summary metrics for month 1:** 3 pilots live · 4 workshops delivered · AI Office formed · ~20 people deeply engaged · governance approved · baseline metrics published.

## Prompts

Stream-lead weekly status template (~150 words, takes 10 min to fill):

```
`Stream: {People | Pilots | Education}
Week: {1-4}
Owner: {name}

Milestone this week (committed last week): {1 sentence}
Status: {hit | partial | missed}
If missed: why, and what changes next week.

Top 3 unblocks needed from sponsor:
1)...
2)...
3)...

Risks:
- {risk}: {owner} mitigating by {date}

Numbers (where applicable):
- adoption %, # active users, # workflows in prod, hours saved/mo
`
```

AI Office roster shape (use the AI Champions org-chart pattern):

```
`Sponsor: {Exec VP name} — "{their AI superpower; 1 line}"
Head of AI: {name} — "{1-line fact}"
Operations Director: {name} — "{1-line fact}"
External partner: {consultancy or "n/a"}

Core Champions (5–7, build/deploy/evangelize):
- {name} ({role}) — "{specific AI artifact they shipped}"

Extended Champions (8–12, build):
- {name} ({role}) — "{specific AI artifact}"
`
```

## Gotchas

- **Don't run the streams sequentially.** People before pilots before education = months of waiting. Parallel is the entire point.
- **Don't generic-train.** A reference deployment did generic Q2 training: 40% tried, only 15% kept using. Cure: per-function workshops where teams bring real tasks and leave with working workflows.
- **Don't let pilots be hypothetical.** "We'll explore X" is not a pilot. A pilot has a named owner, a 4-week clock, a measurable target, and a kill rule.
- **Don't underweight the propaganda track.** The Telegram channel and sponsor vision posts move adoption faster than any tool decision. The "AI Vision Quest" all-hands cited at a reference deployment is concrete.
- **Replace people who can't move.** One reference deployment rotated a department head over Confluence-deprecation refusal. It was the unblock. Expect 1–2 similar moves.

## Variations

- **Lighter (30-person co):** 2 streams (Pilots + Education); fold People into Education for the first 4 weeks. One pilot instead of three.
- **Heavier (enterprise):** Add a 4th stream — Governance — for AI Policy, tool registry, shadow-AI audit, quarterly AI review cadence. Pair with InfoSec.
- **Multi-region:** Run the plan separately per region since data-residency and shadow-AI baselines differ.

## Tools

- A completed diagnostic with at least the TOP-10 initiative cards (#176)
- A sponsor who is explicitly committed (exec VP or founder), not just supportive
- A Head of AI named and freed from prior duties ≥50%
- A Telegram (or Slack) channel for the propaganda track
- Calendar holds for week-by-week workshops, locked at week 0
