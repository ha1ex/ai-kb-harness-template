---
id: A-071
tier: A
category: "Strategy & leadership"
kind: strategy
title: "Founder-as-portfolio-manager — App Factory with 16 specialized agents + one orchestrator"
subtitle: "Problem solved: Founders shifting from \"build one product\" to \"manage a portfolio of agent-built products\" need a concrete architecture covering idea sourcing, scoring, parallel build, deploy, paid-ads launch, and kill-criterion — running solo, with the founder acting as portfolio manager rather than IC."
source: https://www.cybos.ai/cases/A-071
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "XL · Half-year+"
for: "founder · solo operator · venture-builder"
type: case
version: v0.1
---
# Founder-as-portfolio-manager — App Factory with 16 specialized agents + one orchestrator

> Problem solved: Founders shifting from "build one product" to "manage a portfolio of agent-built products" need a concrete architecture covering idea sourcing, scoring, parallel build, deploy, paid-ads launch, and kill-criterion — running solo, with the founder acting as portfolio manager rather than IC.

## What

Treat the founder as portfolio manager of a *factory* that produces consumer apps in parallel. Inputs: external category data (Statista, SimilarWeb, Sensortower, AppMagic, Google Ads APIs) fed into a deep-research pipeline. Funnel: **~1000 raw ideas → ~50 worth attention → ~10 worth building → 1 selected** via an AI-scoring framework on retention, CAC/LTV, scalability, legal risk; final pick adds a "what's closest to me" human filter. Build: dedicated GCP project per app (isolated from production), 6–7 parallel Claude Code agents on feature branches with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, an orchestrator merges, Chrome MCP runs end-to-end tests, Cloud Run deploys, unit-economics check decides scale-or-kill. As the factory matures, **16 specialized event-triggered agents (no heartbeat) plus one Claude orchestrator** run development, testing, marketing, and ops — production deploy approval has been removed as the last human-in-the-loop step. Kill-criterion: **ROAS < 70%**.

## Why it matters

Reported timeline from one solo operator running this loop end-to-end: first app (a book-discovery app) shipped in 4 days; second app (a configured-agent service for small business owners) shipped in 20 days as the factory's second product; **~100 users on the second product**, ads paused while skills mature. Build-side metrics from the same operator: **91 files / 17,865 insertions in a single overnight 6–7-agent run** for the first product. The honest counter-arguments are also in source (see gotchas) — this case includes them, because the strategic primitive (founder-as-portfolio-manager, factory-makes-portfolio) is genuine even where the consumer-app-arbitrage variant is contested.

## End-to-end

1. **Deep research per category.** External data APIs (Statista, SimilarWeb, Sensortower, AppMagic, Google Ads) feed into a research agent. Output: dozens of ideas per category with market-size, competition, and signal data. One operator runs ~156 deep-research runs before the factory loop kicks in.
2. **Idea-scoring framework.** Take your manual evaluation framework (the rubric you've been using mentally for years) and codify it into a skill. Three idea categories, composite score across retention/CAC-LTV/scalability/legal-risk. Validate against past decisions before trusting forward decisions. Funnel: **1000 → 50 → 10 → 1**. Human filter at the end: "what's closest to me, in what do I have an edge."
3. **Stack + PRD for the selected idea.** Reuse code across apps. Write the spec; the agent factory consumes it.
4. **Dedicated GCP project per app.** Isolated from production. New keys, new IAM, no access to your main environment. Firebase Auth, GCS, Cloud Run — standard consumer-app stack.
5. **6–7 parallel Claude Code agents on feature branches.** Enable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Each agent owns a subsystem (auth, billing, ingestion, UI, etc.) — not a role. An orchestrator watches, polls, merges to monorepo, deploys.
6. **Chrome MCP for end-to-end tests.** Slow but full-auto. The agent watches itself click through the UI, takes screenshots, verifies functionality. For the prep phase, `--dangerously-skip-permissions` is one operator's default; safety net is the isolated GCP project plus deploy-gate.
7. **Mature into 16-agent + orchestrator layout.** As you ship more apps, the factory accretes specialized agents (Guardian, Fleet, Skill-writer, Skill-tester, Marketing, Customer-support, Deploy, Health-monitor, etc. — 16 in one operator's stable config). All event-triggered, none with heartbeat. One Claude orchestrator at the top with a Paperclip-management skill polls every 5–10 minutes. Build the skill-writing + skill-testing agents *first* — skill quality requires focused attention and was the first thing the operator automated.
8. **Kill on ROAS < 70%.** Paid-ads launch is part of the factory. After 24h on a new app, the kill-script flags assets with ROAS below threshold. Reinvest into winning apps until they saturate the channel; kill the rest.

## Prompts

The 16-agent + orchestrator transition milestone:

```
`New milestone:
1. Removed the last bastion of human-in-the-loop — production
 deploy approval. All controls handed to AI.
2. Fully migrated the project onto Paperclip.
3. 16 agents (no heartbeat) and one orchestrator — Claude with a
 Paperclip-management skill.
With the council skill, this team can now fully manage the project:
development, marketing, ops.
`
```

Operator principle on agent structure:

```
`Don't structure agents along the human org hierarchy.
Structure them so the orchestrator finds them convenient.
The orchestrator knows best.
`
```

Agent Teams flag (verbatim from source — the operator's working env):

```
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
`
```

## Gotchas

- **HONEST GOTCHA — ad arbitrage doesn't scale.** From one operator in the same group: "you'll get to a 50% organic threshold and stop." Another operator: **"if 5 apps per month worked, well-funded competitors would do 5 new geographies per month."** The numbers-game thesis is genuinely contentious in the source — the factory primitive works for production speed, but the *consumer-app-paid-ads-at-volume* variant is a debated strategic bet, not a proven one.
- **One operator's $470 burn in a few days** running a Paperclip-orchestrated agent team without a UI-design skill: MVP was 10% of expectations, 75% rework. Cap users to subscription-only Claude by default. Pair the agent team with a UI-design skill (Claude Design replica or claude.ai/design output) before expecting usable UI. **"Like leaving a solo startup to join a big bureaucratic company — you see 'big IT', but solo your results were in 5 minutes; here they're in 5 hours and a lot of money burned."**
- **Don't structure agents along the human org chart.** "CEO → GM → Tech-Lead → Builder" multi-agent setups burn tokens on routing chatter and rarely merge code. Subsystem-boundary slicing (~10 source files per agent) is what works.
- **Don't use Paperclip's UI manually.** Let the Claude orchestrator drive it. Builder-style agents tend to "optimize for reporting truth rather than changing code" if instructions emphasize "honest assessment".
- **Beyond 6 parallel agents the operator breaks, not the system.** Multiple operators report 4–6 as the personal ceiling; one caps at 3–4. Beyond that, context-switching cost wipes out the throughput gain.
- **First product looks like the "browser-and-compiler" articles.** ShadCN UI defaults make first-iteration landing pages look identical to every other AI-built landing. Real content (real screenshots, real reviews, real demo video) is what differentiates — one operator's critique: "without this, products become same-y and flat." Plan content production explicitly, not as an afterthought.
- **WhatsApp QR pairing is the killing UX problem** when the factory ships agents that need messenger integration. One workaround discovered in source: mirror trick (point phone at mirror, scan inverted QR). For US-market consumer products, plan around Telegram-only until WhatsApp UX improves.
- **AI-generated landing copy needs human-grounded content.** Same lesson as the App Farm case: don't ship a landing page without real reviews, real screenshots, and a real demo video. Auto-generated lands flat.

<hr/>

## Tools

- Claude Code Max subscription (multiple parallel sessions)
- GCP: Cloud Run, Firebase Auth, GCS — one dedicated project per app
- Chrome MCP — end-to-end UI tests
- Paperclip orchestrator — task tracking + specialized worker pool (use as backend, not as a CEO/GM pyramid; the actual orchestrator is Claude with a Paperclip-management skill)
- External data APIs for category research: Statista, SimilarWeb, Sensortower, AppMagic, Google Ads
- Idea-scoring skill — codified version of your personal evaluation rubric
- Meta Business Suite (or equivalent ad platform) — paid-ads launch is part of the factory
- claude.ai/design — for landing pages and UI when the in-factory output looks too generic
