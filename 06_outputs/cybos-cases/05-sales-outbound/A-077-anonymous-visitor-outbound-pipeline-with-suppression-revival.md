---
id: A-077
tier: A
category: "Sales & outbound"
kind: workflow
title: "Anonymous-visitor → outbound pipeline with suppression, revival, and ICP learner"
subtitle: "Problem solved: B2B teams running cold email plus website tracking waste anonymous web traffic and a graveyard of closed-lost deals; an integrated pipeline routes identified visitors into sequences, revives champions at their new company, and learns ICP from approve/reject patterns."
source: https://www.cybos.ai/cases/A-077
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "RevOps · SDR lead · founder running outbound · sales operations engineer"
type: case
version: v0.1
---
# Anonymous-visitor → outbound pipeline with suppression, revival, and ICP learner

> Problem solved: B2B teams running cold email plus website tracking waste anonymous web traffic and a graveyard of closed-lost deals; an integrated pipeline routes identified visitors into sequences, revives champions at their new company, and learns ICP from approve/reject patterns.

## What

A six-script Python harness wired as a Claude Code skill that joins a website visitor de-anonymization vendor, HubSpot CRM, the Instantly cold-email sender, Brave Search, and a Postgres prospect database into one routing pipeline. Anonymous visitors hit a webhook → intent score on the page they landed on → 5-layer suppression (existing customers, do-not-contact, recent contact, current sequence, blocked domains) → classification (e.g. agency vs end-buyer) → enrollment into the right Instantly campaign. In parallel, three sibling tools run on schedule: a 3-layer **dead-deal resurrector** (time decay + point-of-contact expansion + champion-follows-to-new-company tracking), a **trigger prospector** that monitors web signals (new hires, funding, agency searches) via Brave Search, and an **ICP learning analyzer** that reads approve/reject patterns from the prospect DB and recommends ICP filter changes.

## Why it matters

The pipeline collapses four common manual loops — anonymous-traffic triage, weekly closed-lost revival, fresh-prospect harvesting, ICP refinement — into scheduled scripts with explicit handoffs. The most differentiated and most-likely-to-misfire feature is **champion-follow**: when a known contact leaves their old company, the resurrector picks them up at their new role and re-enters them via a context-aware sequence. Combined with 5-layer suppression running on every routed visitor, the net effect is that anonymous web traffic becomes enrolled sequences within minutes — not after the next quarterly list cleanup — and the closed-lost CRM tail goes from inert to a weekly revenue motion. Useful only if the deployer already runs this stack; not a tool to adopt the stack for.

## End-to-end

1. **Stand up the de-anonymization webhook.** Run `python3 rb2b_webhook_ingest.py --serve --port 4100`. Edit `PAGE_INTENT_SCORES` in the script to match URL patterns of the deployer's site (pricing pages, demo pages, doc pages score higher than blog).
2. **Switch on the full automated router.** `python3 rb2b_instantly_router.py --serve --port 4100` chains score → suppress → classify → enroll in one pipeline. Edit `data/campaigns.json` with the deployer's Instantly campaign UUIDs and `AGENCY_KEYWORDS_*` for their classification logic.
3. **Validate the 5-layer suppression manually.** Before enabling live enrollment, run `python3 rb2b_suppression_pipeline.py --email user@example.com` on a known existing customer to confirm all 5 layers fire.
4. **Schedule weekly dead-deal revival.** `python3 deal_resurrector.py --top 10 --dry-run` first — review drafts and loss-reason tagging. Edit `LOSS_REASON_BONUS` for the local CRM's close reasons. Drop `--dry-run` only after a clean dry-run pass; live mode sends emails.
5. **Schedule weekly trigger prospecting.** `python3 trigger_prospector.py --days 7 --top 15` harvests fresh prospects from web signals via Brave Search. Edit `SEARCH_QUERIES` to match the target market.
6. **Periodically run the ICP analyzer.** `python3 icp_learning_analyzer.py` reads approve/reject patterns from the Postgres prospect DB and emits filter recommendations. Treat the output as a proposal — apply selectively, never auto-overwrite ICP config.
7. **Operate the suppression layers as code.** All 5 layers (existing customers, do-not-contact list, recent contact, in-current-sequence, blocked domains) are programmatic; manual review queues exist only for the dead-deal resurrector and the trigger prospector, not for the live visitor router.

## Prompts

Commands (verbatim):

```
`python3 rb2b_webhook_ingest.py --serve --port 4100
python3 rb2b_suppression_pipeline.py --email user@example.com
python3 rb2b_instantly_router.py --serve --port 4100
python3 deal_resurrector.py --top 10 --dry-run
python3 trigger_prospector.py --days 7 --top 15
python3 icp_learning_analyzer.py
`
```

Data flow (verbatim from skill):

```
`RB2B Webhook → Ingest (score) → Suppress (5 layers) → Route (classify) → Instantly
HubSpot CRM → Deal Resurrector (score + draft emails) → Review Queue
Brave Search → Trigger Prospector (score + enrich) → Outreach Queue
Prospect DB → ICP Analyzer (learn patterns) → Filter Recommendations
`
```

Install (verbatim — keep author path runnable):

```
`git clone https://github.com/ericosiu/ai-marketing-skills.git \
 && cd ai-marketing-skills/sales-pipeline \
 && pip install -r requirements.txt \
 && cp.env.example.env \
 && cp SKILL.md <your-project>/.claude/skills/sales-pipeline.md
`
```

Required env vars (verbatim from `.env.example`):

```
`HUBSPOT_API_KEY= # deal resurrector + suppression
INSTANTLY_API_KEY= # router + suppression
BRAVE_API_KEY= # trigger prospector
DATABASE_URL= # ICP analyzer (Postgres)
`
```

## Gotchas

- **Champion-follow misfires.** Following a known contact to their new company is the highest-yield feature *and* the most likely to embarrass the sender if loss-reason tagging is sloppy (e.g. lost-to-competitor reasons routed as champion-departures). Audit loss reasons before turning revival live.
- **Dry-run discipline.** Deal resurrector's `--dry-run` flag is essential for first runs; live mode sends emails on the first script invocation. Treat the flag as a hard gate, not an option.
- **Intent scoring and agency classification drift.** Both are config-driven, not learned. They need manual upkeep as the market shifts — a new ICP segment can sit unrouted for weeks if URL patterns aren't refreshed.
- **Heavy external dependency surface.** Five paid/external services. Adopt only if the deployer already runs the stack — this is not a workflow to adopt the stack for.

<hr/>

## Tools

- Claude Code — skill host.
- Python 3.9+, `requests`, `psycopg2-binary` (ICP analyzer only). Scripts use stdlib HTTP server — no Flask.
- HubSpot CRM (deal resurrector + suppression).
- Instantly v2 cold-email sender (router + suppression).
- RB2B (anonymous-visitor de-anonymization).
- Brave Search API (trigger prospector).
- Postgres (prospect DB for the ICP learner).
