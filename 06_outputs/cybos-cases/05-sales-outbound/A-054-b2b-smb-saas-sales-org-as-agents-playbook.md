---
id: A-054
tier: A
category: "Sales & outbound"
kind: workflow
title: "B2B SMB SaaS sales-org-as-agents playbook"
subtitle: "Problem solved: B2B SMB SaaS sales teams at 30-100 person scale want to replace headcount with agents, but lack a single playbook covering the full funnel — cold outreach, enrichment, scoring, and follow-up across multiple channels."
source: https://www.cybos.ai/cases/A-054
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "founder · head of sales · RevOps lead · SDR team lead"
type: case
version: v0.1
---
# B2B SMB SaaS sales-org-as-agents playbook

> Problem solved: B2B SMB SaaS sales teams at 30-100 person scale want to replace headcount with agents, but lack a single playbook covering the full funnel — cold outreach, enrichment, scoring, and follow-up across multiple channels.

## What

Wire a multi-CLI agent stack against a unified messaging API and a LinkedIn scraping API so a small founder-led sales team runs cold outreach, enrichment, lead scoring, and follow-up across WhatsApp, LinkedIn DMs, and Instagram from one harness. The functional split: **unipile** (single API for WhatsApp + LinkedIn + Instagram DM send), **apify** (LinkedIn profile and post scraping — most parsers miss post text), and a multi-CLI orchestrator that runs Claude / Codex / Gemini in council mode for the judgment-heavy steps (territory selection, ICP debate, message tone). Per-stage agent roles — research, enrich, score, send, follow-up — each with its own skill and its own message log.

## Why it matters

The community-reference playbook (PDF + recording) covers the whole sales funnel for B2B SMB SaaS at AI-native ops cadence. Two reproduction signals from the chat within 48 hours of the recording dropping: one operator connected WhatsApp via unipile and "sent first messages through them"; Instagram DMs also worked. The playbook collapses what would otherwise be SDR + RevOps + tooling sprawl into a single agent harness running on a founder's laptop.

## End-to-end

1. **Lock the ICP and channels.** Pick the two or three messenger surfaces your buyers actually live on (typical SMB SaaS combo: LinkedIn + WhatsApp; sometimes Instagram for prosumer). Don't try to be everywhere at once.
2. **Connect unipile as the unified send layer.** One API key gets you WhatsApp, LinkedIn, and Instagram DM sending behind one interface. Wire it to your agent harness so messaging code is channel-agnostic — the agent decides which channel per lead, the harness handles the protocol.
3. **Connect apify for LinkedIn enrichment.** Apify scrapers pull profile fields *and* post text — most enrichment vendors stop at the profile. Post text is where you find a personalization hook that doesn't read as boilerplate.
4. **Split the funnel into per-stage agents.** One skill (or sub-agent) per stage: **research** (find accounts), **enrich** (pull profile + posts + signals), **score** (rank against ICP rubric), **send** (compose + deliver via unipile), **follow-up** (cadence + reply handling). Each agent has its own ~10-file context catalog — your ICP doc, sample winning messages, the playbook PDF.
5. **Wire a council layer for judgment calls.** For the steps where one model gets stuck on a single frame — "what's the right territory to open next quarter?", "is this message too aggressive?", "should we DM or wait?" — run Claude + Codex + Gemini in council mode (each answers blind, then a synthesis step). Reuse the existing council plugin pattern; do not invent a parallel one.
6. **Cap outreach volume per channel.** Especially LinkedIn — premium account upfront, 3–5 new contacts day 1 with delays between, vary messages across leads or you'll trip platform rate limits and burn the account.
7. **Log every conversation per lead.** One jsonl history file per contact, not one global feed. Otherwise the follow-up agent loses thread on which leads are warm vs cold and over-messages people who already replied.
8. **Daily review.** The founder still skims the warm-lead queue and reviews top-of-funnel volume before the system runs the next day's batch. Replace the SDR, not the judgment.

## Prompts

Reference video and PDF deck:

```
`AI in Action: Sales Org Autonomy — youtu.be/8BS2ZkrK5Ro
PDF: 20260224_EDU_AISales_OH_ColdOutreach.pdf (shared via Zoom office hours)
`
```

LinkedIn outreach rate-limit guidance:

```
`Premium LinkedIn account upfront.
Day 1: 3-5 new contact-initiations only, delays between each.
Vary every message — no two identical bodies.
`
```

## Gotchas

- **Don't auto-send from the scoring agent.** Keep send as its own stage; otherwise a misclassification cascades into a bad DM that hits 200 leads before you notice.
- **LinkedIn premium is not optional at scale.** Free-tier accounts get rate-limited or restricted within days of agent-driven outreach.
- **One global message log breaks the follow-up agent.** Per-lead jsonl files only. The follow-up agent needs to read "what did we say to this person last?" without scanning unrelated threads.
- **Multi-channel ≠ multi-message.** Don't pile on WhatsApp + LinkedIn + Instagram to the same prospect simultaneously. Pick one primary channel per lead; fall back to a second only after silence.
- **Community MCPs leak keys and break on retry.** Same lesson that surfaced in the SEO playbook: for production, have Claude write a thin CLI wrapper over the vendor API. MCP is fine for prototyping; switch to CLI when uptime matters.

<hr/>

## Tools

- unipile — unified WhatsApp / LinkedIn / Instagram DM send API
- apify — LinkedIn profile + post-text scraping (most parsers can't get post text)
- Claude Code / Codex / Gemini CLI — the three models you'll run in council on judgment calls
- A multi-CLI orchestrator (agent-tower-plugin or equivalent) — runs council/debate/deliberation modes across the three models
- Telegram or Slack as your operator interface — for daily review of warm leads
- An ICP rubric document + sample winning messages — agent-readable context for the score and send stages
