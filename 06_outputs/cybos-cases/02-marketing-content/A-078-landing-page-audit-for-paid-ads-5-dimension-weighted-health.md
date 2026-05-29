---
id: A-078
tier: A
category: "Marketing & content"
kind: skill
title: "Landing-page audit for paid ads — 5-dimension weighted health score"
subtitle: "Problem solved: Performance marketers waste budget on landing pages with hidden conversion leaks; a fixed 5-dimension rubric scores any page in 10 minutes and outputs ranked fixes with impact ranges per fix."
source: https://www.cybos.ai/cases/A-078
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "performance-marketing lead · growth manager · founder running paid acquisition"
type: case
version: v0.1
---
# Landing-page audit for paid ads — 5-dimension weighted health score

> Problem solved: Performance marketers waste budget on landing pages with hidden conversion leaks; a fixed 5-dimension rubric scores any page in 10 minutes and outputs ranked fixes with impact ranges per fix.

## What

A Claude Code skill that grades any landing page used by a paid-ads campaign on **five weighted dimensions** — message match 25%, page speed 25%, mobile experience 20%, trust signals 15%, form quality 15% — producing a 0–100 health score, an A–F letter grade, and a prioritized quick-wins list with quantified impact ranges. Triggers on natural-language signals like "landing page audit" or "conversion rate review" (not a slash command). Output is a `LANDING-PAGE-REPORT.md` with bar-chart-style scores per dimension and platform-specific notes for Google, Meta, LinkedIn, TikTok, and Microsoft Ads. Built on public Google standards (Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1) and the click-ID set for paid-ads attribution (gclid, fbclid, ttclid, msclkid). Reads only — does not run Lighthouse itself; the operator or Claude views the page (e.g. via WebFetch) and the skill scores from the rubric.

## Why it matters

The skill replaces "we should improve our landing page" with **ranked actions and impact ranges per fix**. Sample quick-wins shipped with the skill: primary CTA above the fold = +15–25% CVR; reduce form fields to essential only = +10–20% CVR; trust badges near CTA = +5–15% CVR; image optimization = –1 to –2s load time. Page-speed rule of thumb baked in: ~7% CVR drop per 1s delay. The fixed weighted rubric forces the operator to argue with the dimensions — *"trust is only 15% of CVR? Then stop spending two sprints on testimonials"* — instead of argue about subjective taste. Demoable in 5 minutes against any live page.

## End-to-end

1. **Collect landing-page URLs** from active ad campaigns. One page per audit; the rubric is built for atomic scoring.
2. **Load the skill's reference files** — the bundled `benchmarks.md` (per-industry CVR ranges) and `conversion-tracking.md` (per-platform click-ID and pixel checks).
3. **Score message match (25%).** Does H1, offer, CTA, and hero visual match the ad creative and keyword? Scored 0% (mismatch), 30% (partial), 60% (close), 100% (mirror).
4. **Score page speed (25%).** Apply Google's public Core Web Vitals thresholds: LCP <2.5s, INP <200ms, CLS <0.1; plus TTI <3s and page weight <2MB.
5. **Score mobile experience (20%).** Tap targets ≥48×48px, body text ≥16px, form fields keyboard-typed appropriately, full-width CTA, no horizontal scroll, no interstitial popups blocking primary action, `tel:` links where appropriate.
6. **Score trust signals (15%) and form quality (15%).** Trust: logo, named-and-photographed testimonials, security badges near CTA, case-study metrics. Form: length sweet spot 1–3 fields (highest CVR); 9+ fields lowest; multi-step for 5+; pre-fill, inline validation, specific submit copy ("Get my estimate" beats "Submit").
7. **Audit consent banner and tracking.** Flag any banner that covers the CTA, delays interaction >1s, or pushes content below fold. Verify Consent Mode V2 status; verify click-ID capture (gclid, fbclid, ttclid, msclkid); verify conversion-tracking fires.
8. **Output the ranked quick-wins table.** Each row: priority, fix, expected impact range. Cap at 5–7 fixes; ranking by weighted-impact × ease, not by dimension.

## Prompts

Weighted health-score formula (verbatim):

```
`Landing Page Health Score
 = (Message Match × 0.25)
 + (Page Speed × 0.25)
 + (Mobile × 0.20)
 + (Trust × 0.15)
 + (Form × 0.15)
`
```

Sample quick-wins table (verbatim from skill):

```
`| Priority | Fix | Expected Impact |
| 1 | Move primary CTA above the fold on all devices | +15-25% CVR |
| 2 | Reduce form fields to essential only (name, email, one qualifier) | +10-20% CVR |
| 3 | Add trust badges near CTA (security, guarantee, reviews) | +5-15% CVR |
`
```

Install (verbatim — keep author path runnable):

```
`/plugin marketplace add AgriciDaniel/claude-ads
/plugin install claude-ads@agricidaniel-claude-ads
`
```

## Gotchas

- **Auditing without seeing the page.** The skill scores from what it observes; if the operator pastes only a URL and Claude can't fetch it, the report is rubric-quality not page-quality. Confirm WebFetch succeeded.
- **Consent-banner blind spot for non-EU traffic.** The consent-banner section assumes EU/EEA context. For US-only traffic, skip the banner check or it drags the score artificially.
- **Treating the 5-dimension weights as universal.** Weights reflect average B2C-paid-ads benchmarks. For high-trust B2B (legal, healthcare, fintech), trust signals deserve more than 15% — adjust weights consciously, don't fight the rubric blindly.
- **Quick-win impact ranges are *ranges*, not promises.** "Move CTA above fold = +15–25% CVR" assumes the prior state was below-fold; a page already compliant gains zero from that fix. Compose fixes against the current state, not the maximum.

<hr/>

## Tools

- Claude Code with the plugin marketplace enabled.
- A way to view the page content — WebFetch in-session, or a browser handoff. The skill does not run Lighthouse itself.
- No API keys required.
- Bundled references: `benchmarks.md`, `conversion-tracking.md`.
