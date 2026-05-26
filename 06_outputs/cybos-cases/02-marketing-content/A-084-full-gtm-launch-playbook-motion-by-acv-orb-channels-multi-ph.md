---
id: A-084
tier: A
category: "Marketing & content"
kind: framework
title: "Full GTM launch playbook — motion by ACV, ORB channels, multi-phase sequence"
subtitle: "Problem solved: First-time launches default to a single-day burst then silence — no audience built, wrong channels, no success metric defined; a five-phase playbook turns the launch into a six-week campaign with the motion chosen by ACV and channels chosen by ORB."
source: https://www.cybos.ai/cases/A-084
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "founder launching a first product · PMM at a small company · solo developer shipping a dev tool · anyone announcing a feature/beta/v1"
type: case
version: v0.1
---
# Full GTM launch playbook — motion by ACV, ORB channels, multi-phase sequence

> Problem solved: First-time launches default to a single-day burst then silence — no audience built, wrong channels, no success metric defined; a five-phase playbook turns the launch into a six-week campaign with the motion chosen by ACV and channels chosen by ORB.

## What

A Claude Code skill that runs as a PMM through a full launch. It picks the **GTM motion by ACV band and buyer profile** (PLG / PLG+Sales-Assist / Sales-Led / Community-Led / Partner-Led), runs a **5-phase strategy** (Positioning → Messaging & Content → Channel Strategy via **ORB** → Launch Timeline → Metrics), executes a **6-week timeline** (-6 messaging/content → -4 waitlist/press → -2 social tease → 0 launch day → +1 testimonials → +2 retrospective), and handles a **multi-phase launch sequence** (Internal → Alpha → Beta → Early Access → Full Launch) where gates peel back as validation accumulates. It outputs a **7-deliverable Launch Marketing Pack** and carries a parallel technical-launch track for developer tools with three tiers (Major 12–16wk · Standard 6–8wk · Minor 2–4wk) and developer-first principles (docs non-negotiable, code > marketing copy, interactive > passive, community-first). Four cross-slice GTM-planner duplicates are absorbed here: a **T1/T2/T3 launch-tier framework with hard lead times and a non-optional "Not for" exclusion**, a **soft-launch-to-5–10%-before-full-rollout** rule, a **retro-scheduled-at-planning-time** rule, a **4-question founder foundation interview**, a **2–3-channels-max** discipline with 1–10 channel-fit ratings, and an HTML/Chart.js dashboard output pattern.

## Why it matters

The launch failure modes are predictable and the skill names them: "launching without an audience," "one-day launch then silence," "everything everywhere," "no success metrics." Each has a structural fix here. ACV-based motion selection stops a $200-ACV self-serve product from being sold like a six-figure enterprise deal. ORB forces investment into Owned channels (email list, blog/SEO, branded community — highest ROI, durable) first, using Rented and Borrowed only to drive traffic *into* Owned. The "Not for" exclusion (absorbed) prevents the misdirected sales and support tickets that a vague target audience generates. Defining the metric tree *before* launch is what makes the launch falsifiable instead of a vibe. The artifacts — motion decision tree, ORB diagram, 6-week timeline, multi-phase sequence, 7-deliverable pack — render cleanly enough to double as a founder-talk deck.

## End-to-end

1. **Install.** `claude plugin marketplace add manojbajaj95/claude-gtm-plugin`.
2. **Classify the launch tier and confirm it (absorbed).** Tier 1 (major — new product/platform, 8–12 weeks lead), Tier 2 (feature — significant capability, 4–6 weeks), Tier 3 (incremental — UI/perf, 1–2 weeks). Never plan a Tier 1 launch with less than 8 weeks of lead time. Confirm the tier with the user before proceeding.
3. **Run the 4-question foundation interview (absorbed).** Launch stage (pre-launch / launching 0–100 / early traction 100–1k / scaling 1k+); goals (new-customer target, revenue target, key milestone); resources (team size, monthly marketing budget, sales calls/week, existing assets like email list/social/partnerships); and channel-fit ratings 1–10 across organic / paid / direct-sales / product-led.
4. **Pick the GTM motion.** Quick decision tree: ACV < $5K and self-serve possible → PLG; technical buyer → Developer/community-led; everything else → Sales-led.
5. **Phase 1–2 — positioning, messaging, assets.** Define ICP, positioning, messaging; validate with 5+ customer conversations. Fill the message hierarchy (Headline 5–10 words · Sub-headline · 3 key benefits feature→benefit · Social proof · CTA). Include an explicit **"Not for"** segment (absorbed) — it prevents misdirected sales and support tickets. Produce the launch blog post, a 2–3 min demo video, the landing page, the email announcement, and 5–10 social posts.
6. **Phase 3 — channel strategy via ORB.** Build Owned channels first (email list, blog/SEO, branded community — highest ROI). Use Rented (Twitter/X, LinkedIn, YouTube, Reddit) for speed. Tap Borrowed (guest posts, podcast interviews, influencer partnerships, co-marketing) for shortcut audiences. Drive Rented/Borrowed traffic into Owned. Hold to **2–3 channels max** (absorbed) — dominate them rather than spreading thin across ten.
7. **Phase 4 — execute the 6-week timeline and stage the rollout.** Run -6 → -4 → -2 → 0 → +1 → +2. On launch day: publish landing page + blog, post to Product Hunt at 12:01 AM PT, send the launch email, share on socials, monitor and respond. Run the multi-phase sequence Internal → Alpha → Beta → Early Access → Full Launch, and **soft-launch to 5–10% of users before full rollout** for any Tier 1 or 2 launch (absorbed). Rollback procedure required for T1/T2.
8. **Phase 5 — measure, schedule the retro now, and ship the pack.** Define BEFORE launch: Awareness (visitors, social impressions) · Acquisition (signups, trials, purchases) · Activation (users completing the core action) · Revenue (MRR, conversion rate). **Schedule the post-launch retrospective at planning time** (absorbed), not after launch. Produce the 7-deliverable Launch Marketing Pack. For dev tools: pick the tier, write the getting-started guide + API reference + 3+ code samples *before* launch, and engage on Stack Overflow, GitHub, Hacker News, dev.to, Reddit, Discord. Run the Pre-Launch / Launch-Day / Post-Launch checklists. Optional artifact: an HTML/Chart.js dashboard (absorbed) for channel allocation, weekly roadmap, and risk cards.

## Prompts

GTM motion quick decision (verbatim):

```
`ACV < $5K and self-serve possible? → PLG
Buyer technical? → Developer/community-led
Everything else? → Sales-led
`
```

ORB channel strategy (verbatim):

```
`Owned (highest ROI — build these first): Email list · Blog/SEO · Branded community
Rented (speed, not stability): Twitter/X · LinkedIn · YouTube · Reddit — use to drive to owned
Borrowed (shortcut to audiences): Guest posts · Podcast interviews · Influencer partnerships · Co-marketing
Strategy: Use rented/borrowed to drive traffic, capture into owned.
`
```

Launch Marketing Pack — 7 deliverables (verbatim):

```
`1. Context snapshot
2. Launch Marketing Brief
3. Launch Motion + Channel Plan
4. PR Outreach Kit
5. Asset + Internal Readiness Kit
6. Measurement + Experiment Plan
7. Risks / Open questions / Next steps
`
```

Tier discipline and non-negotiables (verbatim, absorbed from the cross-slice planners):

```
`Always confirm tier with the user before proceeding.
Never plan a Tier 1 launch without at least 8 weeks of lead time.
Always include a "Not for" section — it prevents misdirected sales and support tickets.
Recommend a soft launch to 5–10% of users before full rollout for any Tier 1 or 2 launch.
Post-launch retrospective should be scheduled at launch planning time — don't leave it to chance.

Focus on 2-3 channels max. Spreading thin across 10 channels = mediocre results. Dominate 2-3.
Match channel to customer: where does your target customer already spend time? Go there.
Use benchmarks: typical trial→paid conversion is 15-25%, CAC payback <12 months.
Assume 50% of tactics won't work. Test, measure, iterate.
`
```

Install (verbatim — keep runnable):

```
`claude plugin marketplace add manojbajaj95/claude-gtm-plugin
`
```

## Gotchas

- **A launch is a campaign, not an event.** Single-day launches with no run-up are the explicit anti-pattern. The 6-week timeline is the fix.
- **No audience, no launch.** "Build email list first" is a dependency, not a nice-to-have. Launching to no list is launching to silence.
- **No metric tree defined before launch = no signal.** You cannot tell whether the launch worked if the metrics were chosen after the numbers came in.
- **Missing "Not for" generates misdirected sales and support volume** — it is non-optional in the absorbed tier framework.
- **No rollback procedure on a T1/T2 launch is a trust risk.** A Tier 1 mistake without rollback takes down user trust, not just a feature.
- **For dev tools, docs are the single biggest gate.** "Docs non-negotiable" — shipping a dev-tool launch with thin docs is the dev-tool equivalent of launching to no audience.
- **Spreading across 10 channels = mediocre results.** Dominate 2–3 (absorbed) — channel-fit ratings exist to force the cut.

<hr/>

## Tools

- Claude Code with the GTM skill pack installed
- An email list (or a pre-launch waitlist plan) — "build email list first" is a hard pre-launch dependency
- Shipped references the skill loads: templates, intake, workflow, launch-tiers, metrics-frameworks
- For dev-tool launches: a docs surface (getting-started + API reference + ≥3 code samples) ready before launch day
- Optional: Chart.js for the absorbed HTML dashboard output
