---
id: C-003
tier: C
category: "Sales & outbound"
kind: pattern
title: "Cookie-auth Twitter scraping (free, ban-aware)"
subtitle: "Twitter API costs $5K/mo at sub-100K-tweet scale. Cookie-auth + rate guards + multi-account round-robin keeps it free without account bans."
source: https://www.cybos.ai/cases/C-003
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "M · Weeks"
for: "sourcing engineer"
type: case
version: v0.1
---
# Cookie-auth Twitter scraping (free, ban-aware)

> Twitter API costs $5K/mo at sub-100K-tweet scale. Cookie-auth + rate guards + multi-account round-robin keeps it free without account bans.

## What

Free X/Twitter scraping by calling internal GraphQL endpoints with browser cookie auth (`auth_token` + `ct0`) plus a public bearer token, defended by multi-account round-robin, 5 req/min/account, 350ms delay, follower-count guards, quiet hours, a kill-switch flag file, and UNIQUE constraints. Saves ~$5K/mo at sub-100k-tweet/day scale.
