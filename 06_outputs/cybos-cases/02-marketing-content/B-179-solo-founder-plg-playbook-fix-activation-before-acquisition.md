---
id: B-179
tier: B
category: "Marketing & content"
kind: workflow
title: "Solo-founder PLG playbook — fix activation before acquisition"
subtitle: "Problem solved: Solo SaaS founders pour money into acquisition before fixing activation; a strict Activation→Retention→Acquisition order with per-step \"Tell AI\" prompts wires the funnel inside the codebase."
source: https://www.cybos.ai/cases/B-179
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "solo founder · growth PM"
type: case
version: v0.1
---
# Solo-founder PLG playbook — fix activation before acquisition

> Problem solved: Solo SaaS founders pour money into acquisition before fixing activation; a strict Activation→Retention→Acquisition order with per-step "Tell AI" prompts wires the funnel inside the codebase.

## What

A skill that walks a solo founder through designing product-led growth as a system: define the aha moment, drive users to it in under 3 minutes, design viral loops inside the core workflow (not as a sidebar), build habit loops and feature drips for retention, and pick exactly ONE acquisition channel — only stacking the next once the first works. Each section ends in a "Tell AI" prompt the operator hands to Claude Code to implement the mechanic in the product. It absorbs a companion copywriting skill that supplies per-UI-surface "Tell AI" prompts (headlines, CTAs, error messages, empty states) and a 7-question copy-review checklist.

## Why it matters

Most founders waste their first growth months on acquisition while the bucket leaks. Enforcing the Activation→Retention→Acquisition order, and forcing the choice of one channel at a time, avoids the leaky-bucket trap. Because every section terminates in a concrete prompt that edits the codebase, the playbook produces shipped mechanics and a real activation/D7 dashboard, not a strategy doc.

## End-to-end

1. Define the aha moment from the examples table (PM tool = first project + task created; email tool = first campaign sent).
2. Implement the activation-flow "Tell AI" prompt: skip the "check your email" screen, ship a 3–5-step setup wizard, pre-populate with templates/sample data, add a progress checklist, single CTA on every empty state.
3. Pair with a 5-email welcome sequence (delegated to the companion email skill).
4. Pick exactly ONE acquisition channel from the comparison table (free tool / template gallery / content-as-product / community / integrations / freemium) by product fit, effort, and time-to-results; hand the channel-specific prompt to Claude.
5. Engineer ONE viral mechanic from the SaaS catalog (collaboration invites, shared outputs, referral rewards, public pages, embeds) living inside the core workflow.
6. Implement the retention prompt: weekly digest, activity-based (not time-based) notifications, cumulative-value progress indicators, compounding data investment.
7. Implement progressive feature disclosure (week 1 core, week 2 tooltip-surfaced advanced, week 3+ gentle upgrade prompts at moment of need).
8. Stand up the growth-metrics dashboard (signups by source, aha-completion + time-to-aha, D1/D7/D30, free→paid, viral coefficient) with alerts on activation-rate and D7-retention; frame every experiment as "If we [change], then [metric] will [improve] because [reason]", run 1–2 weeks or 100+ users, ship or revert, document failures.

## Prompts

```
`Design the onboarding flow to get users to [your aha moment] in under 3 minutes:
1. After signup, skip the "check your email" screen — go directly to the product
2. Show a setup wizard (3-5 steps max) that collects only what's needed to deliver value
3. Pre-populate with sample data or templates so the product looks useful immediately
4. Add a progress checklist: "Complete your setup: ☑ Create [X] ☐ [Next step] ☐ [Final step]"
5. Show an empty state with a clear CTA on every empty page ("Create your first [X]")
`
```

## Gotchas

## The cited Common Mistakes catalog is the real anti-pattern list: building viral features nobody uses because they sit in a sidebar instead of the core workflow; measuring vanity signups instead of activation/retention; trying all channels at once; over-engineering A/B infrastructure at 100 users (use feature flags, not a full experimentation platform). Skipping the activation fix to chase acquisition is the headline trap the whole playbook exists to prevent.

## Tools

- Claude Code (or Cursor / Codex / OpenCode)
- Install: `/plugin marketplace add whawkinsiv/solo-founder-superpowers && /plugin install solo-founder-superpowers@solo-founder-superpowers-marketplace`
- Optional project-root context files `ABOUT-ME.md` (voice) and `MY-ICP.md` (customer pain) — read first if present
