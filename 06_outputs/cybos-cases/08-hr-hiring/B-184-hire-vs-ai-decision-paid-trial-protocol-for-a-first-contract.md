---
id: B-184
tier: B
category: "HR & hiring"
kind: workflow
title: "Hire-vs-AI decision + paid-trial protocol for a first contractor"
subtitle: "Problem solved: Non-technical founders over-hire or mis-hire their first contractor; a 5-step gate (try AI first → paid trial → milestoned pay → AI code review) prevents the most expensive mistake."
source: https://www.cybos.ai/cases/B-184
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "non-technical solo founder"
type: case
version: v0.1
---
# Hire-vs-AI decision + paid-trial protocol for a first contractor

> Problem solved: Non-technical founders over-hire or mis-hire their first contractor; a 5-step gate (try AI first → paid trial → milestoned pay → AI code review) prevents the most expensive mistake.

## What

A skill that gives a non-technical founder a hire-vs-AI decision tree ("Can I describe this clearly enough for AI? Did 2–3 attempts fail? One-time or ongoing?"), a market-rate table by region and level, a job-brief template, a paid-trial protocol, a contractor-management runbook, and a red-flag/green-flag vetting list — plus a Tell-AI prompt to have Claude Code review contractor-submitted code on the founder's behalf.

## Why it matters

The skill's central economic claim: "the most expensive developer is the cheap one who breaks things." A paid trial of 5–10 hours ($250–1,500) reveals more than five interviews and prevents far larger mis-hire costs. AI handles 70–80% of a non-technical founder's needs, so the first gate — try AI before hiring at all — eliminates many hires entirely.

## End-to-end

1. Run the hire-vs-AI decision tree: try AI first, try 2–3 prompt variants, only escalate to a human if still stuck; classify as one-time (contractor) vs ongoing (part-time).
2. Pick the right type of help from the comparison table (freelance contractor / part-time / fractional CTO / agency / co-founder); default for solo bootstrappers is a freelance contractor.
3. Source in priority order: personal referrals → Indie Hackers / r/forhire / Twitter → Toptal → Upwork → Arc/Gun.io/Lemon.io → agency.
4. Screen against red flags (no portfolio/GitHub, can't explain simply, "I can build anything," no project questions, suspiciously low rate, refuses a paid trial) and green flags (built SaaS before, asks clarifying questions, pushes back on bad ideas, communicates proactively).
5. Run a paid trial: a real self-contained backlog item, a written brief, normal rate for 5–10 hours; evaluate communication, speed, quality, independence, and code quality (use the Claude Code review prompt to vet the code).
6. Write the job brief from the template (What I Need / Current Setup / Requirements / What "Done" Looks Like / Timeline / Budget / 4 application questions).
7. Set the working agreement: scope in writing, payment terms, milestones, comms cadence, scope-change rule, IP assignment, repo access (start as a limited collaborator, not admin), definition of "done."
8. Pay in milestones (30% upfront / 30% midpoint / 40% on completion); never 100% upfront, never 100% on completion-before-payment; use platform escrow for dispute resolution.

## Prompts

```
`Review this code from a contractor I'm evaluating. Check for:
- Obvious bugs or issues
- Security problems
- Code quality and readability
- Whether it follows the existing codebase patterns
[paste code or point to files]
`
```

## Gotchas

## The cited market-rate table (US/UK/EU senior $125–200/hr; EE/LATAM senior $60–120/hr; SE Asia senior $40–80/hr) is a 2024–2025 snapshot — treat the bands as directional and re-check current rates before quoting them in a brief. The Common Mistakes list flags eight traps; the two most damaging are giving full admin access immediately (start as a limited repo collaborator) and skipping the paid trial. Side rule: the code must always live in your repo — never depend on one person holding it.

## Tools

- Claude Code; Slack/email for comms; Linear or GitHub Issues for tasks; GitHub collaborator access; Upwork / Wise / Stripe for payments; Loom for async demos
- Install: `/plugin marketplace add whawkinsiv/solo-founder-superpowers && /plugin install solo-founder-superpowers@solo-founder-superpowers-marketplace`
