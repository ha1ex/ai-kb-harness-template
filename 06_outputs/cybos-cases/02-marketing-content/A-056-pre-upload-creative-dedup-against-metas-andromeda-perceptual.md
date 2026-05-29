---
id: A-056
tier: A
category: "Marketing & content"
kind: workflow
title: "Pre-upload creative dedup against Meta's Andromeda — perceptual hashing + 70% similarity cutoff"
subtitle: "Problem solved: Meta's Andromeda auction silently demotes ad creatives that look like minor variations of existing ones; a pre-upload pipeline exports current creatives via the Marketing API, computes pairwise perceptual-hash similarity, and ships only assets above a 70% novelty cutoff."
source: https://www.cybos.ai/cases/A-056
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · growth lead · performance-marketing lead"
type: case
version: v0.1
---
# Pre-upload creative dedup against Meta's Andromeda — perceptual hashing + 70% similarity cutoff

> Problem solved: Meta's Andromeda auction silently demotes ad creatives that look like minor variations of existing ones; a pre-upload pipeline exports current creatives via the Marketing API, computes pairwise perceptual-hash similarity, and ships only assets above a 70% novelty cutoff.

## What

On Meta paid acquisition above ~$10k/mo, the old "copy-paste with a hook swap" creative ladder stopped working in mid-2025 when Andromeda rolled to 100% — Meta now de-prioritizes creatives that hash too closely to ones already in your account, because it can't tell them apart for auction purposes either. Workflow: export ~1,300 of your best-performing creatives via the Meta Marketing API, drop exact duplicates, compute a perceptual hash per asset (image and video), score pairwise similarity, set a **70% cutoff** — any pair above 70% is treated as the same concept, and only one is allowed into rotation. The rest of the budget goes into genuinely different concepts. Pair this with Meta's published `thingerprinting` libraries so your similarity scoring matches the way Andromeda sees your account.

## Why it matters

One mobile-app operator running this against a ~10M-user consumer app reports **"record month for purchases and revenue within a week"** of switching to the hashed-dedup pipeline. The mechanism: out of 150 creatives shipped into 3 ad sets in a week, **one video carries the entire campaign** — the rest are statistical crumbs. Without the dedup pipeline, you spend most of those slots on assets Meta has already collapsed into one concept on its side, and you starve the actual variety the auction is asking for. The strategic shift this case codifies: your effort moves from "make our hero creative" to "generate a stable flow of genuinely different concepts at scale."

## End-to-end

1. **Pull current top performers via the Marketing API.** Export the last N best-performing creatives (one operator pulls ~1,300). Capture image + video URLs and the metadata you'll need to map back into ad sets.
2. **Drop exact duplicates first.** Cheap pre-filter before the expensive hashing pass.
3. **Compute a perceptual hash per asset.** Use Meta's published `thingerprinting` libraries (recommended — they're what Andromeda uses on its side) or a standard pHash/dHash implementation. Hash both images and video frames; for video, hash a representative frame set, not just the cover frame.
4. **Score pairwise similarity.** For every pair, compute % similarity against every other asset in the account.
5. **Apply the 70% cutoff.** Any pair with ≥70% similarity is one concept — keep one representative, mark the others "blocked from this campaign." Tune the cutoff against your own funnel; 70% is the working default in source, but the right number depends on how much you've seasoned the account.
6. **Enforce diversity inside each ad set.** When pushing 50 creatives/day per platform, the launcher must select across hash families — never two assets from the same family in the same ad set.
7. **Turn on every Meta AI checkbox.** Targeting 18+ all-genders, ASC, every Advantage+ option Meta offers. Let the creative carry the targeting; the platform-level optimizer is what auctions your hash-diverse pool.
8. **Daily kill loop on Hook Rate + Hold Rate.** Hook Rate and Hold Rate dominate Andromeda's ranking signal (top-of-funnel quality). Run a daily script that pulls spend + Hook Rate + Hold Rate per asset, flags underperformers, and after operator approval switches the losers off. Out of every 150-creative batch, expect ~1 to carry the campaign.

## Prompts

The operator's published reference docs from Meta engineering:

```
`https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/
https://engineering.fb.com/2025/11/10/ml-applications/metas-generative-ads-model-gem-the-central-brain-accelerating-ads-recommendation-ai-innovation/
`
```

Similarity-cutoff pseudocode:

```
`# Pull creatives via Meta Marketing API
creatives = meta_marketing_api.export_top_performers(n=1300)
creatives = drop_exact_duplicates(creatives)

# Hash + pairwise similarity
hashes = {c.id: perceptual_hash(c.asset) for c in creatives}
families = [] # each family = list of creative IDs that are >=70% similar

for c in creatives:
 placed = False
 for fam in families:
 if max(similarity(hashes[c.id], hashes[m]) for m in fam) >= 0.70:
 fam.append(c.id); placed = True; break
 if not placed: families.append([c.id])

# Pick one representative per family for the next ad set push
representatives = [pick_best_by_hook_rate(fam) for fam in families]
`
```

## Gotchas

- **"Variations" don't count as new concepts.** Hook swapped, button color changed, CTA text replaced — all hash too close to the original and get rolled up into one family by Andromeda. Your dedup pipeline must catch them before upload, not after spend.
- **Don't keep targeting tight.** Targeting 25-35 M/F killed performance for one operator's account. Andromeda wants 18+ all-genders with language + country only; the **creative carries the targeting** signal in the new world. Old "I'll pick the audience myself" instincts work against the auction.
- **Some Ads Manager toggles aren't in the API yet.** One unsolved gap: the "App store details (Off)" toggle is not exposed via the Marketing API at time of source. You will hit at least one piece of manual UI work per campaign push until Meta closes the gap.
- **AI-disclosure labels can drop CTR ~33%.** Meta has signaled it may auto-label AI-generated content. Research cited in chat suggests disclosure labels drop CTR by roughly a third. Pre-plan a budget reallocation, and pivot AI-generated portions toward "actor portrayal" framings where applicable.
- **AI-video creatives are not universally winning yet.** One operator on consumer apps + web subscriptions: top creatives are mostly AI-generated. A different operator on e-commerce $1M+ brands: no AI-generated video in top 20. The split is by category, not by talent — pick your stack to your funnel.

<hr/>

## Tools

- Meta Marketing API access (with full creative export permissions)
- Meta `thingerprinting` libraries or pHash/dHash (perceptual hashing for image + video)
- Python in Cursor / Claude Code (operator wrote the entire pipeline this way)
- Live spend ≥ $10k/mo on Meta — below this the variance per asset swamps the dedup signal
- Daily kill-script with operator-approval step (don't auto-kill)
