---
id: A-080
tier: A
category: "Marketing & content"
kind: skill
title: "Senior copywriter skill — VoC-grounded drafting and a Seven Sweeps editing pass"
subtitle: "Problem solved: Founder-written copy reads like AI marketing voice — feature dumps, vague value props, weak CTAs; a VoC-grounded skill drafts from positioning and edits in seven single-purpose passes instead of \"make it better\" in one swing."
source: https://www.cybos.ai/cases/A-080
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder writing their own landing pages · solo marketer · sales team refining cold-email copy · product team writing UX microcopy"
type: case
version: v0.1
---
# Senior copywriter skill — VoC-grounded drafting and a Seven Sweeps editing pass

> Problem solved: Founder-written copy reads like AI marketing voice — feature dumps, vague value props, weak CTAs; a VoC-grounded skill drafts from positioning and edits in seven single-purpose passes instead of "make it better" in one swing.

## What

A Claude Code skill that runs as a senior copywriter + copy editor. Every output is grounded in three things: an explicit positioning intake, **voice-of-customer (VoC) research** (it forces the agent to mine support tickets, sales calls, reviews, and user interviews for verbatim phrases before writing), and the **Hormozi Value Equation**. New copy follows the "Outcome → Benefit → Feature" hierarchy and a Hero Section Formula. Existing copy gets the **Seven Sweeps**: Clarity → Voice & Tone → So What → Prove It → Specificity → Heightened Emotion → Zero Risk — one dimension per pass, re-checking earlier sweeps weren't undone, rather than fixing everything at once. A project context file is loaded on every invocation so brand voice stays consistent across surfaces. The absorbed companion contributes hard SEO caps for any blog/landing title work: 60-char title, 155-char meta description, keyword in the first 40 characters.

## Why it matters

The dominant failure of AI copy is generic competence: it scans fine and converts nothing because it is invented, not harvested. This skill encodes the hard rule *"Pros don't invent copy — they harvest it from real humans. Don't write without VOC. Ever."* — if the context file is missing it asks before writing rather than confabulating a voice. The Seven Sweeps decompose "this copy is weak" into seven diagnosable, separately-fixable problems, which is what turns copy editing from taste into a repeatable checklist. One bootstrap of the positioning + VoC context amortizes across every landing page, email, and product surface the team ships.

## End-to-end

1. **Install the GTM skill pack.** `claude plugin marketplace add manojbajaj95/claude-gtm-plugin` then `claude plugin install gtm-skills@gtm-plugins`. (Or `npx skills add manojbajaj95/claude-gtm-plugin --skill copywriting-core`.)
2. **Bootstrap brand context once.** Run the pack's bootstrap step; it interviews you about brand, audience, and voice and writes a project context file (`.agents/product-marketing-context.md`). Every later invocation loads it so voice doesn't drift between pieces.
3. **New copy path — fill positioning, then mine VoC.** Invoke with a brief. The agent first completes the positioning intake (audience / primary pain / desired outcome / value prop / alternatives / primary CTA / key objections), then triggers VoC research — pulling verbatim phrases from tickets, calls, reviews, interviews — *before* drafting. It matches awareness level (problem-aware → solution-aware → product-aware) and applies the Hero Section Formula.
4. **Run the 3-second test on the hero.** Can a visitor answer "What is this? Who is it for? Why care now?" If not, rewrite the hero before going further.
5. **Editing path — run the Seven Sweeps in order.** Invoke with existing copy. The agent passes through Clarity, Voice & Tone, So What, Prove It, Specificity, Heightened Emotion, Zero Risk — one sweep at a time, re-checking that an earlier sweep wasn't compromised. Sweep 3 ("So What") inserts explicit "which means…" bridges from feature to benefit.
6. **Word-level quick pass.** Cut `very / really / extremely / just / actually / basically / in order to`; replace `utilize → use`, `leverage → use`, `facilitate → help`, `seamless → smooth`, `robust → strong`; enforce active voice; one idea per sentence.
7. **Diagnose against the seven critical failures.** Feature dump, clever curse, me-monster, jargon jungle, vague value prop, weak CTA, no proof — score the draft against each and fix the worst first.
8. **Enforce SEO caps for any titled asset (absorbed).** For blog posts and landing pages with metadata: title ≤60 chars with the keyword in the first 40, meta description ≤155 chars; the model retries until under cap rather than shipping over.

## Prompts

Positioning intake (verbatim):

```
`Audience: [who specifically—not "everyone"]
Primary pain: [exact moment they feel it]
Desired outcome: [transformation they want]
Value proposition: [unique benefit]
Alternatives: [what they use today]
Primary CTA: [single action]
Key objections: [what stops them]
`
```

Hero Section Formula (verbatim):

```
`Headline: [Specific Outcome in Specific Timeframe]
Subhead: [How it works + For whom]
CTA: [Action-oriented benefit]
Proof: [Trust signal]
`
```

Seven Sweeps order (verbatim):

```
`Clarity · Voice and Tone · So What · Prove It · Specificity · Heightened Emotion · Zero Risk
`
```

Title formulas + completion summary for titled assets (verbatim, absorbed):

```
`Title formula options:
- Number + Adjective + Keyword + Promise: "7 Proven Ways to [Keyword] Without [Pain Point]"
- How to + Keyword + Benefit: "How to [Keyword]: A Step-by-Step Guide for [Audience]"
- Question format: "Why Does [Keyword] Matter? [Provocative Answer]"
- Contrarian: "[Common Belief] Is Wrong. Here's What [Keyword] Actually Means"

Title: [title] ([character count] chars) ← retry until ≤60
Meta description: [description] ([character count] chars) ← retry until ≤155
`
```

Install (verbatim — keep runnable):

```
`claude plugin marketplace add manojbajaj95/claude-gtm-plugin
`
```

## Gotchas

- **No VoC, no copy.** The skill's hardest rule is that copy is harvested, not invented. If the context file is missing it should ask, not write. Skipping the VoC step is what produces the generic AI voice the skill exists to kill.
- **Don't run the Seven Sweeps as one pass.** The whole point is one dimension at a time — collapsing them re-introduces the "make it better" vagueness.
- **A later sweep can undo an earlier one.** Heightened-emotion edits can break clarity; the re-check step is not optional.
- **The banned-word list is mechanical, not absolute.** If the brand's real VoC voice genuinely uses one of the banned words, override it explicitly in the context file rather than letting the quick pass strip it.
- **Hard SEO caps mean retry, not truncate.** Letting the model ship a 64-char title because it "ran out of room" defeats the keyword-in-first-40 rule.

<hr/>

## Tools

- Claude Code (or any runtime supporting the Agent Skills spec) — runs the skill
- Project context file (`.agents/product-marketing-context.md`) written once by the bootstrap step
- Real VoC source material: support tickets, sales-call notes, reviews, user-interview transcripts
- Shipped references the skill loads: PAS/AIDA/BAB/FAB patterns, sharp-edges diagnostic, validations, Hormozi Value Equation methodology, landing-page workflow, plain-English alternatives
