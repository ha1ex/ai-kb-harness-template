---
id: A-062
tier: A
category: "Marketing & content"
kind: framework
title: "Andromeda-aware creative ladder — audience-first, concept-first, no micro-variations"
subtitle: "Problem solved: Performance marketers still designing creative variations the old way (swap hook, change button color) get demoted by Meta Andromeda audience-segment auctions; this is the framework Meta itself describes for how to ship creative that survives the new auction."
source: https://www.cybos.ai/cases/A-062
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · growth lead · creative director"
type: case
version: v0.1
---
# Andromeda-aware creative ladder — audience-first, concept-first, no micro-variations

> Problem solved: Performance marketers still designing creative variations the old way (swap hook, change button color) get demoted by Meta Andromeda audience-segment auctions; this is the framework Meta itself describes for how to ship creative that survives the new auction.

## What

Andromeda no longer optimizes across your entire ad account against one ranking pool — it optimizes inside **audience-segment-level auctions**. Two creatives competing for "men 30-45" with only minor differences (hook word swapped, button color changed) get de-prioritized because Andromeda treats them as one concept inside that segment's auction. The framework: start from the audience profile → write a creative-concept brief for **each** audience → if a talking-head spokesperson is used, build a persona profile (age, voice, look, accent) per concept → generate concept-tied assets via your AI image+video pipeline. **Micro-variations are banned.** Each new asset has to be a different concept end-to-end, not a cosmetic edit of an existing one.

## Why it matters

This framework is the operational answer to *why* the perceptual-hash dedup pipeline ( ) works. Pair them: dedup catches micro-variations *before* upload; the ladder structures the brief so your creative team doesn't produce micro-variations in the first place. Meta's own engineering posts on Andromeda (the retrieval engine) and GEM (the generative ad model) are the canonical reference — this case is the operator-translated playbook for working inside Meta's new design. Multiple operators in source confirm the audience-segment auction is the dominant ranking surface in 2025+; one notes the entire effort of a performance marketer now sits in "ability to generate genuinely different concepts at scale" rather than in targeting.

## End-to-end

1. **Define audience segments at Andromeda's granularity.** Not "men 25-44" but the segment grain Andromeda actually auctions inside — work backwards from your account's segment-level performance reports, not from your demographic intuitions. Each segment becomes a creative-concept brief.
2. **Write one creative-concept brief per segment.** Story, persona, hook, location, time of day, emotional arc. Treat each as a separate ideation — not as a variation of one master concept. If two briefs feel like they could share a hook, they're the same concept and you've collapsed the segment grain.
3. **If using talking-head video, persona-profile per concept.** Build a persona spec for each spokesperson: age, voice, look, accent, why they care about the product. The persona is part of the concept — switching personas on the same hook is a different concept; switching hooks on the same persona is a micro-variation.
4. **Generate concept-tied assets via the AI pipeline.** nano-banana for keyframes, Veo / Kling for video, voice generation per persona. Each concept's assets stay within its concept family — do not cross-pollinate, that's how micro-variations sneak back in.
5. **Ban cosmetic edits.** No "let's try the same creative with a different CTA button". If you want to A/B that, you're below Andromeda's resolution and you're spending budget on slots Meta has already collapsed.
6. **Set every Meta AI checkbox to on.** Targeting 18+ all-genders with language + country only. The creative carries the segment signal; Andromeda routes it. Old "I'll force my audience" targeting actively fights the auction.
7. **Validate against the published Meta engineering posts.** When you're stuck on whether a new concept is "different enough", re-read the two engineering.fb.com posts (linked below) and ask: would Andromeda's retrieval engine pick this asset for a *different* segment auction than the parent? If no, it's a micro-variation.

## Prompts

The canonical Meta engineering references this framework is built against:

```
`Andromeda — retrieval engine that powers next-gen personalized ads:
https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/

GEM — Generative Ads Model, the central brain accelerating ads recommendation AI:
https://engineering.fb.com/2025/11/10/ml-applications/metas-generative-ads-model-gem-the-central-brain-accelerating-ads-recommendation-ai-innovation/
`
```

The audience-first framework:

```
`1. Audience profile (segment-level grain Andromeda auctions inside)
2. Creative concept per audience (story, hook, location)
3. Persona profile per concept (when a talking-head spokesperson is used)
4. Concept-tied assets (no cross-pollinating hooks across concepts)

Banned: hook-swap, button-color, CTA-text — Andromeda collapses these into
 one concept inside the segment auction.
`
```

## Gotchas

- **Old "I'll force my audience" targeting fights the auction.** Tight demographics + interest stacking made sense when Meta couldn't auction on creative; now they actively starve the algorithm. 18+ all-genders + language + country is the working default in source.
- **Hook swap = same concept.** A creative with the original hook replaced is not a new concept — Andromeda hashes it together with the parent. If you would have called it "variation B" under the old playbook, don't ship it.
- **AI-generated video isn't yet universally winning.** One operator on consumer apps + web subscriptions: AI-generated video dominates the top of their ranking. A different operator on e-commerce $1M+ brands: zero AI-generated video in their top 20. Pick your stack to your category, not to the chat consensus.
- **FTC fake-review rule applies to AI testimonials.** Generating an AI "person who never used the product" testimonial is a regulatory violation in the US (FTC's 2024 final rule). Static images, b-rolls, variations, animated visuals are all fine; **imitating a real customer who never had the experience is not**. One operator's framing: "where you can use AI, use it — where you legally can't is testimonial fabrication."
- **AI-disclosure labels can drop CTR ~33%.** Meta has signaled it may auto-label AI-generated content. Plan a budget reallocation if the rollout hits, and pivot AI-generated portions toward "actor portrayal" framings where applicable.

<hr/>

## Tools

- Meta Ads Manager + Marketing API
- Audience-segmentation source (your own analytics, Meta's segment reports, or a CDP)
- AI image + video stack: nano-banana (Gemini 3 Image Pro), Veo, Kling, ElevenLabs (for persona voices), Suno (if persona has a music cue)
- Pairs with (perceptual-hash dedup) — this is the upstream design discipline; that is the downstream gate
