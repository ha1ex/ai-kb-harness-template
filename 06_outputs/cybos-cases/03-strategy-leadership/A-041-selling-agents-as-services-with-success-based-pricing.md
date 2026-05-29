---
id: A-041
tier: A
category: "Strategy & leadership"
kind: strategy
title: "Selling agents as services with success-based pricing"
subtitle: "Per-seat SaaS gets ripped out when customers build their own agent. Charging on outcomes (claims resolved, deals won) flips the math."
source: https://www.cybos.ai/cases/A-041
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "Founder · head of revenue · head of customer success"
type: case
version: v0.1
---
# Selling agents as services with success-based pricing

> Per-seat SaaS gets ripped out when customers build their own agent. Charging on outcomes (claims resolved, deals won) flips the math.

## What

Restructures how an AI-product company prices and delivers value: instead of charging a per-seat SaaS fee (which fights the customer's natural AI-substitution motion), package agents as *services* with **success-based pricing** tied to a customer-meaningful outcome. Two-tier model at one reference deployment: (1) a **copilot tier** ($5–15K/mo at the reference scale) where the agent connects to client systems, runs analyses, generates rules; the human at the client still owns; (2) an **outsourced agent-driven service** (high prices, success-fee economics) where the AI company takes responsibility for the outcome and ~90% of the work is done by agents, with ~1 customer-success person per client. The pricing pattern: "Don't charge 3× your old tool — charge $1 per ticket when the customer pays $10/ticket. 10× cheaper for them, you keep margin because agents do it."

## Why it matters

Two structural changes have happened simultaneously: (a) AI software directly makes or saves money in ways the customer can measure (ad spend allocated, tickets resolved, deals won, claims processed), so paying per-outcome is now legible; (b) the customer's instinct is to substitute your tool with their own agent the moment your seat price gets noticeable. Success-based pricing converts both into your advantage. You ride the customer's value capture; the customer pays only when they win; the customer can't easily DIY because your moat is the catalog of tested workflows + tuned rules + connected data + ML on top of rules. Same reference deployment reports new business lines (paid AI consulting, paid AI services for clients) opened by this packaging shift.

## End-to-end

1. **Pick one measurable outcome.** Examples by vertical: per-ticket resolved (support), per-incremental-conversion (sales), per-dollar retained (retention), per-shipped-MR (engineering), per-correct-claim-decided (insurance), per-incremental-installed-base (acquisition). Must be (a) traceable to your agent's action, (b) already metered by the customer's existing systems, (c) measurable in a billing cycle.
2. **Establish the baseline.** With each pilot customer, agree the *non-AI baseline* in writing for 4–8 weeks: current conversion %, current cost-per-ticket, current churn rate. Without a baseline, "success" is a fight.
3. **Two-tier packaging.**

- **Copilot tier:** flat fee ($5–15K/mo at reference scale), unlimited usage, the agent connects to the customer's systems, the customer's team still operates. Sell as "10× speed-up of your existing team." Land it with department heads (CMOs, VPs of growth), not the operators (media buyers, support agents) — operators often resist.
- **Outsourced tier:** success fee per outcome. Common shapes: $X per resolved ticket (typically 10–20% of customer's current cost-per-ticket), Y% of incremental revenue attributable to AI-generated changes (cap at 25–30% of net new), $Z per closed-won deal. Bake in floors (minimum monthly) and ceilings (cap to control your downside in a great month).

1. **Hire from the industry.** Performance marketers selling to performance marketers; doctors selling to doctors. Retrain on AI in ~8 weeks; the domain credibility unlocks the conversation that pricing can't.
2. **Build the inside structure.** Layers = data → product → agents → tools → skills → automations. Each layer is "the same problem the enterprise already pays someone to solve," unified under one runtime. (See token-metabolism #155 and one-prompt operations #156.)
3. **Phase the customer.** Most won't sign for outsourced on day 1. Standard path: Copilot 3–6 months → metrics prove → Outsourced for one workstream → expansion.
4. **Build the attribution machinery.** A read-only side-car that records every agent action and links it to the outcome event (resolved ticket, won deal). This is what makes invoices defensible.
5. **Open new business lines.** Paid AI consulting (inbound is already happening to firms that publish about their transformation), paid AI training for clients, paid AI services for clients. Same skill set, three SKUs.

## Prompts

Sample success-fee contract shape (skeleton — get a lawyer; this is for orientation):

```
`1. Service. {Provider} delivers AI-driven {workstream, e.g., customer support
 tier-1 resolution} to {Client}'s {customer base / inbound queue / channel}.

2. Baseline measurement period (4 weeks). During the Baseline Period, the
 parties record:
 - current cost per {unit} ("Baseline Cost"): __________
 - current resolution / conversion / outcome rate ("Baseline Rate"): __________
 - {1–2 other anchoring metrics}

3. Pricing.
 3a. Service fee: {currency}__/{unit} × number of {units} where Provider's
 AI action was the proximate cause. Floor: {currency}__/month.
 Ceiling: {currency}__/month.
 3b. Success fee: __% of Incremental Value, where Incremental Value =
 (Baseline Cost − Realized Cost) × {units} in the billing cycle,
 net of agent operating costs.

4. Attribution. Provider operates a read-only attribution log capturing every
 agent action and its outcome event. Client retains read access to this log
 for the duration of the agreement plus 18 months.

5. Customer-success staffing. Provider assigns one named Customer Success
 Engineer per Client for the duration of the agreement.

6. Out-clause. Either party may terminate with 60 days' notice if the
 Realized Rate falls below {threshold} for 8 consecutive weeks.

7. Data. Client data remains Client's property. Provider's agent outputs and
 tuned rule sets remain Provider's property. {Client may license a tuned
 ruleset for use after termination at a fee of {currency}__.}

8. Audit. Annual third-party audit of attribution log, paid by Provider,
 shared with Client.
`
```

Outbound pitch (for a CMO/VP-of-growth on ad spend optimization):

```
`On $1M/mo ad budget, 20% efficiency improvement = $200K/mo.

We sell two ways:
1) Copilot — your team uses our agent. $10K/mo, unlimited. Typical lift
 we see in pilot: 8–15% inside 90 days.
2) Outcome — we take the workstream. We charge 25% of incremental savings
 versus your trailing-12-week baseline. Cap at $50K/mo.

Either way, we keep one CSM per account. You can move from (1) to (2) any time.

Pilot: 4 weeks copilot + 4 weeks baseline + 8 weeks outcome (optional).
We'll write the baseline and the attribution log together.
`
```

Reverse-margin pricing rule of thumb:

```
`Your price per outcome = (customer's current cost per outcome) × 0.10–0.20
Your margin per outcome = your price − (your token cost + CSM allocation)
Target gross margin: ≥ 75% on the outsourced tier.
`
```

## Gotchas

- **Operators resist; sell to the head.** Reference deployment finding: media buyers themselves often resist; CMOs/VPs of growth are excited. Tailor the motion accordingly.
- **Baselines are the contract's real heart.** A success fee on an unclear baseline is unenforceable. If the customer won't agree a baseline in writing, walk.
- **Don't price below your token cost in a bad month.** Floors protect you from "they had a bad month, we worked twice as hard."
- **Watch for AI substitution.** As foundation-model costs drop, expect customers to attempt DIY. Your moat is the *catalog* (workflows + tuned rules + connected data + ML on rules), not the LLM call. Publish enough to be the trusted vendor, withhold enough to be hard to clone.
- **Don't enter regulated verticals (healthcare, finance) with success-fee until you have audit-grade attribution.** The legal exposure on misattributed savings is real.

## Variations

- **Pure copilot (lighter):** Start here. Get to 10 paying customers on flat-fee. Use those to figure out outcome attribution before you sell outcomes.
- **Heavier (full outsource):** AI agency model — you run the workstream end-to-end, customer never sees the agent. Used by emerging firms in compliance, support, and outbound. ~1 CSM per ~5–10 client accounts at maturity.
- **Hybrid with tooling:** Charge per-outcome AND license the tuned rule set after termination (Section 7 of the skeleton contract). Lets you give the customer a graceful exit while preserving a stream.

## Tools

- Existing AI agent product or workflow shipping value (this is not a "package what we wish we had" move)
- An attribution log with reliable event-to-outcome linking
- A CSM model — even at light staffing, one named human per outsourced account
- A lawyer who has done outcome-pricing contracts (uncommon; budget time)
- Buyer-side air cover: department head (CMO, COO, VP), not just an operator
