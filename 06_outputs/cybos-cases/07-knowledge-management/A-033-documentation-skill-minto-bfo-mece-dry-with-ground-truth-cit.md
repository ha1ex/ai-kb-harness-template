---
id: A-033
tier: A
category: "Knowledge management"
kind: skill
title: "Documentation skill — Minto + BFO + MECE + DRY with ground-truth citations"
subtitle: "Every author writes docs in a different shape, so wikis rot. One enforced shape: conclusion first, claims cited, readable in 15 seconds."
source: https://www.cybos.ai/cases/A-033
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Founder · engineering lead · PM · anyone authoring or reading internal docs"
type: case
version: v0.1
---
# Documentation skill — Minto + BFO + MECE + DRY with ground-truth citations

> Every author writes docs in a different shape, so wikis rot. One enforced shape: conclusion first, claims cited, readable in 15 seconds.

## What

A reusable Claude skill (installable per repo or globally) that enforces a single documentation format for every internal doc: one-sentence headline (Minto Pyramid), up to three diagrams using BFO continuants/occurrents buckets, MECE bullets, DRY references instead of repetition, and ground-truth citations on every factual claim. Result: any doc in the company is digestible in ~15 seconds because the first line is always the conclusion, and any claim can be traced to its source event (call minute, commit, invoice, message). Authored at one reference deployment as an open-sourceable skill; the same pattern is used to digest external content (1-hour YouTube → one-page structured note).

## Why it matters

Internal wikis rot because each author invents their own shape. Readers spend 90 seconds orienting before they extract anything; agents spend tokens "summarizing" what should already be skimmable. Fixing the *shape* of writing is a higher-leverage move than any tooling investment, and it makes agents better the same way it makes humans better: predictable structure = cheap retrieval.

## End-to-end

1. **Install the skill.** Drop `SKILL.md` and `documentation.md` into `~/.claude/skills/documentation/` (or repo-local `.claude/skills/documentation/`). Trigger phrases: "doc this", "write up", "minto-fy", "/docskill".
2. **Adopt the doc shape.** Every doc has six sections in this order: **Headline** (one sentence, decision/recommendation/key finding), **Why now** (3 bullets on context), **What it is** (BFO continuants — atemporal nouns: customer, product, role, system), **How it works** (BFO occurrents — processes: trigger → action → outcome, drawn as one diagram), **MECE bullets** (claims must be Mutually Exclusive and Collectively Exhaustive; if two bullets overlap, merge), **References** (every claim is `[REF: source-url]` or `[CANONICAL: this-doc]`).
3. **Configure the citation rule.** Every fact in the doc must end with one of: `[REF: gong.io/call/8829?t=37m12s]`, `[REF: github.com/org/repo/commit/abc]`, `[REF:./pricing-model.md#tier-2]`, `[CANONICAL: this-doc-defines-it]`, `[PLACEHOLDER: owner-to-verify]`. No bare claims.
4. **Build the digest sub-skill.** Variant for incoming content: paste YouTube URL / PDF / long Notion page; skill produces the same six-section structure with citations to timestamps / page numbers.
5. **Enforce via review.** Add a one-line PR rule: "documentation PRs that don't follow `/skills/documentation/SKILL.md` get bounced." Agent can self-check before submitting.
6. **Use the same skill on retrospectives.** Friday retro → skill produces a Minto-shaped retro doc; the headline is the decision/next-week-bet.

## Prompts

`~/.claude/skills/documentation/SKILL.md`:

```
`---
name: documentation
trigger_phrases: ["doc this", "minto-fy", "write up", "/docskill"]
calls: []
rules: [./documentation.md]
mcps: []
owner: founder
status: production
---
`
```

## Gotchas

- **Don't let "headline" become a teaser.** It is the *conclusion*. If your reader stops at line 1 they should know the call to action. Teaser-headlines are the most common failure.
- **MECE is hard.** Expect 2–3 review rounds before bullets are truly non-overlapping. The skill should self-check with: "Are any two bullets compatible only when the other is false?"
- **BFO is a bucket, not a philosophy thesis.** Don't get academic. Continuants = nouns that persist; occurrents = things that happen. Two buckets is enough.
- **Citations on every claim is non-negotiable.** Doc reviews where someone says "trust me, this is true" are the leading indicator that the doc will rot in 6 months.
- **Don't apply this to short comms.** Slack messages, single-paragraph announcements — let them be. The skill is for docs that survive longer than a week.

## Variations

- **Lighter:** Use only the 6-section template; skip the BFO terminology in your team's vocabulary if it's a distraction.
- **Heavier:** Add an "eval" sub-skill that scores any doc against the rules (T/R/C: text shape / rules followed / citations complete — binary pass/fail). Three fails in a row on the same author → schedule a 15-min coaching session.
- **Vertical:** For regulated industries, add a `[COMPLIANCE-REF: regulation-id#clause]` citation type and enforce its presence on policy docs.

## Tools

- Claude Code or any agent supporting `SKILL.md` registration
- Shared Workspace with `CLAUDE.md` referencing the skill
- A naming convention (#161) for filing the outputs
- Optional: a Mermaid renderer for the diagrams (Obsidian has it; GitHub renders inline)
