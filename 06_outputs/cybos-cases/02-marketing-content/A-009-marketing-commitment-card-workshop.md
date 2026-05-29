---
id: A-009
tier: A
category: "Marketing & content"
kind: workflow
title: "Marketing Commitment Card workshop"
subtitle: "Founders run random marketing for years. 20 minutes of forced choices produces one ICP, one channel, one metric."
source: https://www.cybos.ai/cases/A-009
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "founder · head of growth · founder-marketer pair"
type: case
version: v0.1
---
# Marketing Commitment Card workshop

> Founders run random marketing for years. 20 minutes of forced choices produces one ICP, one channel, one metric.

## What

A Claude Code plugin runs a 6-phase, ~20-minute interactive workshop that forces a founder to commit, in writing, to five marketing decisions they routinely avoid: one specific ICP, one primary channel for the next 6 months, one stage-appropriate content cadence, one independently-verifiable trust signal, and one 90-day success metric. The output is a single-page Markdown "Marketing Commitment Card" under 300 words — not a strategy doc. The skill rejects vague answers and re-prompts until the founder is specific.

## Why it matters

Replaces a multi-week strategy project (or, more commonly, the absence of one) with a single sticky-note-sized artifact in 20 minutes. Forces the compression that the cited case studies — a 12-year, 70-blog-posts-per-year security firm with zero paid spend; a content-flywheel SEO company with ~$101 CAC sustained for 6 years on $0 paid — already validated. Concrete result: one channel committed for 6 months, weekly anchor cadence, 90-day measurable checkpoint. Stops the "random acts of marketing" failure mode and gives the team something to be held to.

## End-to-end

1. **Install.** In Claude Code: `/plugin marketplace add Gerstep/marketing-playbook-plugin`, then `/plugin install marketing-playbook@marketing-playbook-plugins`. Invoke with `/marketing-playbook:marketing-playbook`.
2. **Phase 0 — Context & stage.** Paste an existing positioning statement if you have one (chains from the positioning plugin, case #25). If not, answer three free-text questions. Then force a binary stage choice: pre-PMF ("some users, unclear if they'd miss us") vs post-PMF ("users would be upset if we disappeared, now need more"). Stage gates the entire rest of the workshop.
3. **Phase 1 — ICP gate.** Write one sentence containing role/title + company stage/size + the specific pain felt today. Must be specific enough to find on LinkedIn in 30 seconds. Then name 3–5 real people who fit and where they spend time. The skill rejects "B2B companies" or "SaaS teams" and re-prompts: "That's too broad. Try again — who EXACTLY is feeling this pain the most?"
4. **Phase 2 — Channel commitment.** The skill detects available research MCPs (Perplexity, Exa, Parallel Search, or built-in WebSearch) and spawns a research sub-agent that maps where the Phase-1 audience actually clusters online. Founder commits to ONE primary channel for 6 months. Post-PMF founders additionally pick one secondary at 20% effort. Rules embedded in the prompt: pick where the audience already is (not where you wish they were); pick what you can show up on consistently; if you can't commit to 6 months, it isn't your channel.
5. **Phase 3 — Content system.** Branches on stage. Pre-PMF: write three one-sentence message variants (problem-led, outcome-led, differentiation-led) to test; pick a minimum cadence floor (the bar you'll hit on your worst week); pick one of four content archetypes (build-in-public / teach / curate / show-proof). Post-PMF: commit to ONE weekly recurring anchor piece for 6 months (a regular industry data report, a weekly customer story, a regular technical findings post); pick supporting cadence; describe the proof pipeline — what evidence your team already generates through normal work that could become content.
6. **Phase 4 — Trust signal.** Pick ONE signal a skeptical buyer can verify without asking you: open-source repo with stars, a public case study with a named customer plus a metric, a recurring industry report, a third-party benchmark, a financial guarantee or SLA. Testimonials and "we're the best" are explicitly downgraded.
7. **Phase 5 — 90-day metric + card generation.** Specify what would make you say at day 90 "this is working" vs "time to adjust" — a number, a conversion, a signal, not "more followers". The skill then generates the Commitment Card from a fixed Markdown template and asks where to save it.
8. **Phase 6 (optional) — iteration.** Re-run any single phase to revise a decision without redoing the workshop. After 90 days of pre-PMF data, the skill can graduate the card to the post-PMF branch using the winning message variant.

## Prompts

ICP rejection re-prompt, verbatim:

```
`Describe your ideal customer in ONE sentence.
Rules:
- Must include their role/title.
- Must include their company stage or size.
- Must include the specific pain they feel right now.
- Must be specific enough that you could find this person on LinkedIn in 30 seconds.
`
```

Channel-commit rules, verbatim:

```
`Pick the channel where your audience already is (not where you wish they were).
Pick the channel you can show up on consistently (not the one with the most users).
If you can't commit to 6 months on it, it's not your channel.
`
```

Card output template, fixed sections:

```
`Audience
Message (3 variants if pre-PMF / 1 validated if post-PMF)
Channel — Primary [+ Secondary if post-PMF]
Content System — Type, Anchor (post-PMF), Cadence, Proof pipeline (post-PMF)
Trust Signal
90-Day Checkpoint
Rules:
 1. No new channels for 6 months.
 2. Minimum cadence is a floor, not a ceiling.
 3. Organic proves the message. No paid until organic resonates.
 4. [PRE-PMF] Every post is a message test.
 5. [POST-PMF] Every week the system runs.
Debugging order: adjust message first, then channel, then audience.
`
```

## Gotchas

- The skill refuses to advance on vague input — by design. The "your answer is too broad, try again" loop *is* the workshop. Don't disable it.
- Pre-PMF founders are explicitly forbidden from paid spend in the card's rules.
- Don't ask the skill to generate content ideas — it refuses by design. The output is commitments, not creative.
- Quality of Phase 2 research depends on which MCPs are connected. With only built-in WebSearch the channel evidence is shallower.

## Variations

- **Lighter:** skip Phase 4 trust-signal selection for very early-stage teams that have no shippable signal yet — schedule it for the 90-day revisit.
- **Heavier:** chain with the positioning plugin (case #25) first so Phase 0 ingests a validated statement and downstream phases reuse the WHO/WHAT.
- **Verticalised:** swap the four content archetypes for vertical-specific anchors (security firms → vulnerability research; fintech → regulatory commentary; dev tools → open-source releases).

## Tools

- Claude Code with plugin support.
- Optional but recommended: positioning-statement plugin output (case #25) — when present, Phase 0 ingests WHO/WHAT/HOW/ALTERNATIVE and skips context questions.
- Optional: one of Perplexity / Exa / Parallel Search MCP (or built-in WebSearch falls through).
- ~20 minutes of focused founder time.
