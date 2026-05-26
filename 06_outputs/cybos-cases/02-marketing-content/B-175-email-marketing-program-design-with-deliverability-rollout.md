---
id: B-175
tier: B
category: "Marketing & content"
kind: workflow
title: "Email marketing program design with deliverability rollout"
subtitle: "Problem solved: Marketing email lands in spam after the Feb 2024 Gmail/Yahoo bulk-sender rules; a program-design skill sequences the subdomain split, the SPF→DKIM→DMARC rollout, the content mix, and an SEO-synergy article cadence."
source: https://www.cybos.ai/cases/B-175
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "founder · lifecycle marketer · growth engineer"
type: case
version: v0.1
---
# Email marketing program design with deliverability rollout

> Problem solved: Marketing email lands in spam after the Feb 2024 Gmail/Yahoo bulk-sender rules; a program-design skill sequences the subdomain split, the SPF→DKIM→DMARC rollout, the content mix, and an SEO-synergy article cadence.

## What

A markdown skill that any SKILL.md-compatible agent auto-invokes when a user mentions email marketing, EDM, newsletter, deliverability, or SPF/DKIM/DMARC. It produces a tailored program covering the EDM-vs-newsletter balance, five content types (onboarding / campaign / announcement / features / newsletter), domain-deliverability setup, send cadence, and an SEO-synergy pattern that emails Retention/ToFu/MoFu blog articles to subscribers to drive both engagement and Search Console signal.

## Why it matters

Any sender doing 5,000+/day to Gmail/Yahoo without SPF, DKIM, and DMARC has been junked since Feb 2024 — domain config is now mandatory, not optional. The skill turns a generic "send a newsletter" request into a sequenced rollout with the ordering that actually works, and wires email into the SEO program rather than running it as a side channel. The skill itself cites email ROI of ~$36 per $1.

## End-to-end

1. Read `.claude/project-context.md` or `.cursor/project-context.md` for audience/strategy; if absent, the skill asks.
2. Identify goal (retention / conversion / brand reach / SEO) and list size — Gmail/Yahoo bulk rules trigger at 5,000+/day.
3. Set the EDM-vs-newsletter balance (EDM for push, newsletter for nurture) and allocate the five content types; onboarding is a 5–7 email behavior-triggered series driving the "Aha!".
4. Configure deliverability: marketing on a subdomain (`mail.example.com`), transactional on root; deploy SPF first, then DKIM, then DMARC stepping `p=none → quarantine → reject` over 60–90 days; add TLS-RPT, MTA-STS, BIMI; enroll in Google Postmaster Tools.
5. Apply list hygiene: segment by behavior/source/stage, welcome series within hours of signup, one-click unsubscribe honored within 48h, keep complaint rate <0.3%.
6. Build SEO-synergy delivery: pick Retention/ToFu/MoFu articles, email them, then measure GA4 email-source traffic to those pages and watch Search Console rank/click changes.
7. Set cadence (weekly/biweekly baseline; Tue–Thu 8–11am or 2–4pm; daily risks an unsubscribe spike).
8. Output the content mix, deliverability checklist, article-delivery list with SEO targets, and a KPI plan.

## Prompts

```
`Order: SPF first, then DKIM, then DMARC. Gmail/Yahoo require all three for
bulk senders (5,000+/day) since Feb 2024.
`
```

## Gotchas

## The skill does not generate the actual email bodies — it produces the program, not the copy. It also assumes a `project-context.md` exists; without one the output is generic. Best installed as part of the wider pack (it leans on companion content-marketing and analytics-tracking skills) rather than solo.

## Tools

- Any agent that reads agent-skills spec markdown (Claude Code, Cursor, OpenClaw, Lovable, v0, Bolt)
- A project-context file; domain DNS access; GA4 + Google Postmaster Tools; an ESP
- Install: `npx skills add kostja94/marketing-skills --skill email-marketing`
