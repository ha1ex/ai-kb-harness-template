---
id: C-131
tier: C
category: "Marketing & content"
kind: tactic
title: "Dark-traffic attribution hygiene"
subtitle: "Problem solved: \"Direct traffic\" inflates because TikTok / Slack / Discord / WhatsApp referrals strip referrer headers and land in Direct; a UTM-hygiene + GA4 channel-grouping protocol surfaces the real source."
source: https://www.cybos.ai/cases/C-131
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
type: case
version: v0.1
---
# Dark-traffic attribution hygiene

> Problem solved: "Direct traffic" inflates because TikTok / Slack / Discord / WhatsApp referrals strip referrer headers and land in Direct; a UTM-hygiene + GA4 channel-grouping protocol surfaces the real source.

## What

A traffic-analysis skill ships a misattribution lookup table (where dark-social actually lives in GA4), a UTM-tag convention, and a custom GA4 default-channel-grouping rule set so dark social separates from true direct.
