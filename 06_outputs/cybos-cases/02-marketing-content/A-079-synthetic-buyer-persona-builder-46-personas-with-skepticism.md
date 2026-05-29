---
id: A-079
tier: A
category: "Marketing & content"
kind: skill
title: "Synthetic buyer-persona builder — 4–6 personas with skepticism profile"
subtitle: "Problem solved: Persona workshops eat days and produce vague archetypes; a 30-minute web-research pass produces 4–6 named personas with concrete deal-breakers, language patterns, and reusable JSON for downstream skills."
source: https://www.cybos.ai/cases/A-079
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "marketer · product marketer · founder · CRO specialist · salesperson preparing a deal"
type: case
version: v0.1
---
# Synthetic buyer-persona builder — 4–6 personas with skepticism profile

> Problem solved: Persona workshops eat days and produce vague archetypes; a 30-minute web-research pass produces 4–6 named personas with concrete deal-breakers, language patterns, and reusable JSON for downstream skills.

## What

A Claude Code skill that researches a target company (homepage, product pages, pricing, "who it's for", reviews on G2 / Capterra / TrustRadius, "[company] vs" comparison queries, job posts) and builds **4–6 synthetic buyer personas**. Each persona is a specific individual — name, title, company profile, demographics, situation paragraph, ranked pain points, buying trigger, ranked decision criteria, **skepticism profile** (trust level, research style, key objections), **language they use** (how they describe the problem, what they search for, red-flag words, trust signals), and **evaluation behavior** (first visit, deep eval, deal breakers). Output is saved as `personas.json` (machine-readable), `personas.md` (prose), and `segments.md` (summary table), so sibling skills — landing-page CRO, copywriting, popup CRO, A/B test setup — can load personas directly.

## Why it matters

The "language they use" and "skepticism profile" dimensions are the load-bearing differentiators. A traditional persona says *"Marketing Manager, 30–45, cares about ROI"*; this skill says *"describes the problem as 'we need to consolidate our toolchain', red-flag words are 'revolutionary' and 'AI-powered', deal-breakers are SOC2 missing and no public changelog."* That is directly actionable for copywriters, ad teams, and salespeople — and feeds downstream skills as JSON, not as a slide. Diversity rule is enforced: at least one technical buyer, one business buyer, one skeptical profile, one junior/researcher. Output is a reusable client asset, not a one-off workshop deliverable.

## End-to-end

1. **Phase 1 — Company research.** WebFetch homepage + product / solutions / pricing / "who it's for" pages. WebSearch for *"[company] customers"*, *"[company] case studies"*, *"[company] reviews"*, *"[company] vs"*, *"[company] jobs"*. Extract: problem solved, pricing / ACV signals, industries served, company sizes, roles named in case studies, GTM motion (self-serve / sales-led / hybrid).
2. **Phase 2 — Identify 4–6 distinct segments.** For each: segment name, role / titles, company profile (size, stage, industry, tech stack), core pain, buying trigger, decision criteria ranked, sophistication, alternatives considered, size estimate (primary / secondary / emerging). Apply diversity rules: ≥1 technical buyer, ≥1 business buyer, ≥1 skeptical profile, ≥1 junior / researcher.
3. **Phase 3 — Build synthetic personas as JSON.** One persona per segment (1–2 for the largest). Each persona populates the full schema: `id`, `name` (specific, not "Marketing Manager"), `segment`, `title`, `company`, `demographics`, `situation` (one paragraph), `pain_points` (3+), `buying_trigger`, `decision_criteria_ranked`, `skepticism_profile`, `technical_sophistication`, `language`, `evaluation_behavior`.
4. **Phase 4 — Save artifacts.** Write `personas.json`, `personas.md`, `segments.md`. Sibling skills load `personas.json` directly — keep the schema stable.
5. **Output the summary table and coverage check.** Segment overview table + 2–3-sentence summary per persona + coverage check (did we hit one technical, one business, one skeptical, one researcher?) + next-step suggestions (e.g. *"run the landing-page audit against persona P3's skepticism profile"*).
6. **Re-run on quarterly cadence.** Personas drift as the target company's GTM shifts. Refresh quarterly or when material product / pricing changes.

## Prompts

Verbatim persona schema fragment from the skill (the two most load-bearing fields):

```
`{
 "skepticism_profile": {
 "trust_level": "Low — has been burned by vendor promises before",
 "research_style": "Deep dive. Reads docs, checks GitHub issues, asks peers in Slack communities",
 "key_objections": [
 "Will this actually scale or will we outgrow it in a year?",
 "What's the real implementation cost beyond the license?",
 "How good is the support when things break at 2am?"
 ]
 },
 "language": {
 "describes_problem_as": "We need to consolidate our toolchain and reduce operational overhead",
 "searches_for": [
 "engineering productivity platform",
 "developer tools consolidation",
 "[competitor] alternative enterprise"
 ],
 "red_flag_words": ["revolutionary", "AI-powered", "seamless"],
 "trust_signals": ["SOC2 badge", "customer logos in their industry", "transparent pricing", "public changelog"]
 }
}
`
```

Install (verbatim — keep distributor path runnable):

```
`npx gooseworks install --claude
# alternates: --cursor, --codex, --all
`
```

Trigger phrasing (verbatim from skill):

```
`Build buyer personas for [company URL]
Generate synthetic personas based on [company]'s actual customers
`
```

## Gotchas

- **Generic-archetype trap.** "Marketing Manager" alone fails the skill's specificity check. Each persona needs name, budget authority, recent buying trigger, and concrete deal breakers — otherwise downstream skills produce generic copy.
- **Missing skepticism profile.** Skepticism is the most-skipped and most-valuable layer; every persona needs an explicit "what would make them NOT buy." Without it, the copy review skill has nothing to push back on.
- **Real customer names in JSON.** The skill produces *synthetic* personas — don't paste real customer data into `personas.json`. Synthesize from public review data, don't transcribe.
- **One-and-done.** Personas drift; an annual workshop pretends they don't. Refresh quarterly or when product / pricing changes materially.

<hr/>

## Tools

- Claude Code (or Cursor / Codex, depending on the install target).
- WebFetch and WebSearch capabilities — no paid API keys required.
- Optional upstream: a pre-built content inventory from a sibling site-content-catalog skill.
- Downstream consumers of `personas.json`: page CRO, copywriting, popup CRO, A/B test setup skills in the same pack.
