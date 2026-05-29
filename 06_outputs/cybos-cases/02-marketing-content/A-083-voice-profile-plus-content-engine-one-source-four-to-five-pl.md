---
id: A-083
tier: A
category: "Marketing & content"
kind: workflow
title: "Voice profile plus content engine — one source, four to five platform-native outputs"
subtitle: "Problem solved: Repurposing one asset across X, LinkedIn, short video, YouTube, and a newsletter eats 1–3 hours per asset and the LLM smooths every output into the same paste; a derived voice profile plus atomic-claim extraction ships native outputs that still sound like the operator."
source: https://www.cybos.ai/cases/A-083
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · marketer · content lead · anyone who writes as a specific identity"
type: case
version: v0.1
---
# Voice profile plus content engine — one source, four to five platform-native outputs

> Problem solved: Repurposing one asset across X, LinkedIn, short video, YouTube, and a newsletter eats 1–3 hours per asset and the LLM smooths every output into the same paste; a derived voice profile plus atomic-claim extraction ships native outputs that still sound like the operator.

## What

A two-layer Claude Code workflow combined from a three-skill chain. **Layer 1 (voice extraction):** read 5–20 of the operator's real prior samples — recent X posts/threads, essays/memos/launch notes, outbound that worked, docs/changelogs — and emit a structured, short **VOICE PROFILE** (rhythm, compression vs explanation, capitalization norms, parenthetical use, question frequency, claim sharpness, how often numbers/mechanisms/receipts appear, transition style, *what the author never does*). It refuses to derive voice from generic platform exemplars. **Layer 2 (content engine):** take one source asset (article, podcast, demo, doc, transcript, screenshot, prior post), extract 3–7 atomic claims, rank by sharpness/novelty/proof, **assign one claim per output** (never spray the same claim across platforms), adapt structure per platform, strip platform-shaped filler, and run a quality gate. Layer 2 consumes the VOICE PROFILE verbatim — it does not re-derive style per output. An absorbed companion contributes a six-dimension public-content variant of the extractor (Tone / Vocabulary / Sentence / Formatting / Content-structure / Persona) for when the source is a company's published pages rather than the operator's own writing.

## Why it matters

Cross-channel repurposing has two costs: the hour-per-platform rewrite, and voice drift — each platform's "best practices" pull the copy toward the platform stereotype until nothing sounds like the founder. Deriving the voice once and reusing the token amortizes the analysis across N outputs and stops the drift. The one-claim-per-output rule is the rule most teams break: the same idea spammed five ways reads as a content mill, while five sharp claims from one essay reads as a campaign. The hard-banned-pattern catalogs ("not X, just Y", "Excited to share", forced lowercase, engagement-bait closing questions, "In today's rapidly evolving landscape") are what prevent the LLM from smoothing the output back into slop.

## End-to-end

1. **Install the skill pack.** `/plugin marketplace add https://github.com/affaan-m/everything-claude-code` then `/plugin install ecc@ecc`.
2. **Derive the VOICE PROFILE (run once per identity).** Gather 5–20 real samples in priority order: (1) recent original X posts/threads, (2) essays/memos/launch notes/newsletters, (3) outbound emails or DMs that worked, (4) docs/changelogs/site copy. Prefer recent over old unless the user says older writing is more canonical. If the source set clearly splits, separate "public launch voice" from "private working voice."
3. **Extract the voice dimensions and emit a structured profile.** Capture rhythm and sentence length, compression vs explanation, capitalization norms, parenthetical use, question frequency and purpose, claim sharpness, frequency of numbers/mechanisms/receipts, transition style, and what the author never does. Output it short enough to keep in session context — operational reuse, not literary criticism. Do not auto-create repo-tracked voice fingerprints; persist only if asked.
4. **Pick the anchor asset.** Choose the single source to derive everything from (article, podcast, demo, doc, transcript, screenshot, prior post).
5. **Extract and rank atomic claims.** Pull 3–7 atomic claims or scenes from the anchor; rank them by sharpness, novelty, and proof.
6. **Assign one strong claim per output.** Map each platform target to a different claim — X, LinkedIn, short-form video, YouTube, newsletter. Never reuse one claim across all platforms.
7. **Adapt structure per platform, then strip filler.** X opens with the strongest claim/artifact/tension and each thread tweet must advance the argument; LinkedIn expands just enough for outside-niche readers and bans corporate-inspiration cadence; short video scripts around the visual sequence with result/problem/punch up front; YouTube leads with result/tension and is organized by argument not filler sections; newsletter opens with the point/conflict/artifact. Then strip "In today's rapidly evolving landscape", "game-changer/cutting-edge", fake casualness, and engagement-bait closers.
8. **Run the quality gate and ship the deliverable.** Each draft sounds like the author not the platform stereotype, carries a real claim/proof/observation, has no duplicated copy unless requested, and any CTA is earned and explicitly approved. Return: the short voice profile (if voice-matching matters), the core angle, the platform-native drafts, posting order only if it helps execution, and gaps that must be filled before publishing.

## Prompts

Voice dimensions to extract (verbatim):

```
`What to Extract
- rhythm and sentence length
- compression vs explanation
- capitalization norms
- parenthetical use
- question frequency and purpose
- how sharply claims are made
- how often numbers, mechanisms, or receipts show up
- how transitions work
- what the author never does
`
```

Hard bans — delete and rewrite any of these (verbatim):

```
`- fake curiosity hooks
- "not X, just Y"
- "no fluff"
- forced lowercase
- LinkedIn thought-leader cadence
- bait questions
- "Excited to share"
- generic founder-journey filler
- corny parentheticals
`
```

Content-engine non-negotiables and repurposing flow (verbatim):

```
`Non-Negotiables
1. Start from source material, not generic post formulas.
2. Adapt the format for the platform, not the persona.
3. One post should carry one actual claim.
4. Specificity beats adjectives.
5. No engagement bait unless the user explicitly asks for it.

Repurposing Flow
1. Pick the anchor asset.
2. Extract 3 to 7 atomic claims or scenes.
3. Rank them by sharpness, novelty, and proof.
4. Assign one strong idea per output.
5. Adapt structure for each platform.
6. Strip platform-shaped filler.
7. Run the quality gate.
`
```

Install (verbatim — keep runnable):

```
`/plugin marketplace add https://github.com/affaan-m/everything-claude-code
/plugin install ecc@ecc
`
```

## Gotchas

- **One claim sprayed across all platforms is the failure pattern.** It is exactly what makes repurposed content read as a mill. Assign one claim per output.
- **Don't run a second style-analysis inside the content layer.** If the voice profile already exists, re-deriving voice per output drifts it. Consume the profile, don't regenerate it.
- **Don't pad context the X audience already has.** That kills the compression that made the source voice work in the first place.
- **Fewer than ~10 samples (or pages, for the public variant) is not enough variation; more than ~25 is cost without signal.** Blog posts beat landing pages as voice indicators; sudden tonal shifts usually mean ghost-written content — flag it rather than averaging it in.
- **The banned-pattern list is hard-coded.** If the operator's real voice genuinely uses one of those patterns, override it explicitly in the VOICE PROFILE, not by ignoring the gate.

<hr/>

## Tools

- Claude Code with the skill pack installed
- 5–20 real prior writing samples from the identity whose voice you're deriving (the engine refuses generic exemplars)
- Optional: a live-X-pull skill from the same pack for sourcing recent posts
- For the public-content variant (absorbed): WebFetch capability to pull 10–20 of a company's published pages — no API keys or paid tools
