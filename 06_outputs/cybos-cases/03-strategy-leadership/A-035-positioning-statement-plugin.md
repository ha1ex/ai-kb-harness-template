---
id: A-035
tier: A
category: "Strategy & leadership"
kind: skill
title: "Positioning-statement plugin"
subtitle: "A consultant charges $5-25K and three weeks to write your positioning. This does it in 90 minutes with team alignment built in."
source: https://www.cybos.ai/cases/A-035
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "founder · PMM · accelerator program manager"
type: case
version: v0.1
---
# Positioning-statement plugin

> A consultant charges $5-25K and three weeks to write your positioning. This does it in 90 minutes with team alignment built in.

## What

A Claude Code plugin runs a 7-phase positioning exercise that turns a vague "what does your startup do?" into a sub-30-word positioning statement, backed by competitive research and cross-team alignment. It researches competitors *before* asking strategic questions so the founder cannot hide from reality. It forces a single choice on each strategic question — no "all of the above". It collects answers independently from 3–8 teammates and then surfaces alignment vs contradiction maps. It outputs a coaching diff between the founder's pre-research gut draft and the team-synthesized final.

## Why it matters

Replaces a typical $5K–$25K consulting engagement with a 1–2 hour facilitated session that produces a sub-30-word statement plus four reusable strategic artifacts (customer test, honest gap, core bet, market scope). The statement feeds downstream: website hero copy, pitch-deck slide 1, cold-email subject lines, sales objection handling, the marketing commitment card (case #24). The team contradictions it surfaces are usually disagreements the founder did not know existed.

## End-to-end

1. **Install.** `/plugin marketplace add Gerstep/positioning-plugin`, then `/plugin install positioning@positioning-plugins`. Invoke with `/positioning:positioning`.
2. **Phase 1 — Context.** Free-text: what the company does (2–3 sentences, plain language), who the target customer is today, stage and team size (forced options: pre-seed solo/duo, pre-seed with team, seed, Series A+), and any existing website/deck/memo to ingest.
3. **Phase 2 — Competitive research.** The skill calls `ListMcpResourcesTool` to discover which research MCPs are connected (Perplexity research, Perplexity search, Exa, Parallel Search preview, Parallel Task deep research, Firecrawl) and composes per-tool instructions dynamically. It then launches **two sub-agents in parallel**: Agent 1 maps 3–5 direct competitors and flags what they ALL say (table stakes) vs what NONE say (white space); Agent 2 maps 2–3 adjacent companies (related problem / same customer) and 2–3 lateral analogs ("we're like X but for Y"). Both return as a markdown table + bullet summary.
4. **Phase 3 — Four forced-choice questions plus a draft.** Every question names real competitors from Phase 2 and lists banned answers upfront. Q1 the customer test: why does your ideal customer pick you over [TOP COMPETITOR 1] vs [TOP COMPETITOR 2]? Banned: "price", "better tech without specifics", "customer service". Q2 the honest gap: the single biggest reason your ideal customer says no today (not "we're early stage" — cop-out). Q3 the core bet: pick ONE direction to invest in for 6 months. Q4 market scope: narrow → broad market definitions. Q5 immediately after Q4 — the founder writes a 30-word gut-reaction positioning statement, saved verbatim.
5. **Phase 4 — Team collection.** The skill generates a copy-pasteable Markdown questionnaire customized with real competitor names. Each teammate answers independently — no group discussion first, max 10 minutes, gut reactions over polished answers. The founder pastes all replies back when collected.
6. **Phase 5 — Synthesis.** Four axes: alignment map (where everyone agrees — use these), contradiction map (disagreements — these are the strategic decisions), surprise findings (one person said something nobody else did but is clearly right), gap analysis (questions nobody answered well — sign the team hasn't thought it through). Each contradiction becomes a forced binary choice for the founder.
7. **Phase 6 — Final output.** Fixed markdown template: customer test (2–3 sentences), honest gap (1–2 sentences, brutally honest), core bet (what exists vs what's planned), market scope (1 sentence including what it excludes), positioning statement under 30 words using the template `We help [WHO] achieve [WHAT] through [HOW], unlike [ALTERNATIVE]`, plus the "founder draft vs final / what changed" diff block.
8. **Phase 7 (optional) — iterate.** Identify the weakest section, re-run only that section with tighter constraints.

## Prompts

Direct-competitor sub-agent prompt, verbatim:

```
`Research the competitive landscape for: [company description from Phase 1].
[INSERT DETECTED TOOL INSTRUCTIONS]
Find:
 1. The 3-5 closest competitors (same customer, same problem)
 2. For each: one-liner positioning, pricing, key differentiator, weakness
 3. What do ALL of them say? (common claims = table stakes, not differentiators)
 4. What does NONE of them say? (potential white space)
Output as a markdown table + 3 bullet summary.
`
```

Customer-test question, verbatim:

```
`Your ideal customer is evaluating you against [TOP COMPETITOR 1] and [TOP COMPETITOR 2].
They can only pick one. Why do they pick you?
Rules:
 - Don't say 'price' or 'we're cheaper'
 - Don't say 'better technology' without specifics
 - Don't say 'customer service' (everyone says this)
`
```

Quality rules enforced on the final pass (reusable as a standalone copy editor — absorbs #32):

```
`- No sentence over 20 words.
- Strip unverifiable adjectives: innovative, cutting-edge, world-class, unique.
- Every claim is either (a) true today or (b) explicitly marked as a bet.
- Aspirational items phrased "By [date], we plan to..." not "We are...".
- Total length under 200 words across all sections.
- Final positioning statement under 30 words.
`
```

Worked example output (the plugin's own README example):

```
`We help DevOps teams resolve incidents before customers notice,
through causal root-cause analysis,
unlike dashboard-first monitoring tools.
`
```

## Gotchas

- Solo positioning is explicitly called an "echo chamber" in the anti-patterns. The team round is the point of the exercise — do not skip it.
- "All of the above" answers are forbidden. The pain of choosing IS the exercise.
- The founder-draft diff (case #31 — forced-choice questionnaire pattern) can feel exposing. The skill phrases "what changed" as observational, not corrective. Present gently.
- Tool-name detection is hardcoded prefix-matching; non-standard MCP names won't be detected. Extend the table if you add new providers.

## Variations

- **Lighter:** run solo for a quick gut-check, skipping Phases 4–5; mark explicitly as "echo-chamber draft, needs team round before commitment".
- **Heavier:** chain into the marketing commitment card (case #24) immediately after, with the validated WHO/WHAT/HOW/ALTERNATIVE feeding Phase 0.
- **Internal-rollout:** pre-cache competitor research per portfolio company and skip re-running Phase 2 each iteration.

## Tools

- Claude Code with plugin support and `AskUserQuestion`, `ListMcpResourcesTool`, parallel sub-agent spawning.
- Built-in `WebSearch` + `WebFetch` always work as fallback. Richer research with Perplexity / Exa / Parallel Search / Parallel Task / Firecrawl MCP.
- 3–8 teammates willing to spend 10 minutes each.
