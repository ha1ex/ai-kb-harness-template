---
id: A-017
tier: A
category: "Customer success"
kind: workflow
title: "Support Agent Copilot (single-pane multi-system context)"
subtitle: "Support agents switch across 12 systems per ticket. One pane pulls every system + drafts the reply."
source: https://www.cybos.ai/cases/A-017
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "head of customer support · support operations lead"
type: case
version: v0.1
---
# Support Agent Copilot (single-pane multi-system context)

> Support agents switch across 12 systems per ticket. One pane pulls every system + drafts the reply.

## What

A copilot that lives in front of the support agent and pulls context across every system the agent currently switches between — helpdesk, billing, CRM, telephony, accounting — without the agent leaving the copilot pane. It suggests an answer from the knowledge base, drafts a response, auto-categorises the ticket, and recommends a next-best action. The pilot starts with the simplest 50% of tickets where AI drafts and the human agent confirms. Later phases add auto-categorisation, AI summarisation of long threads, and progressively more autonomous handling.

## Why it matters

At a large fintech analysed in the source corpus, support agents switch across **12 systems per case** to assemble context for one customer answer. Eliminating system-switching is the single largest cost lever in customer support. Concrete sizing from that deployment: 69 support FTE × 12 systems × 16,900 tickets/month at a low single-digit-dollar cost per ticket. North-Star target: −80% cost. Mid-term effect: 20–35 of 69 FTE freed, worth a low-seven-figures USD-equivalent annually. Pilot cost: low-six-figures USD-equivalent. Timeline 3–6 months. The economics make this almost always the highest-ROI support project in any 30–1000 person company with multi-system support.

## End-to-end

1. **Inventory the systems.** Walk one experienced agent through a real ticket and list every system they open: helpdesk (HDE), telephony (call recordings), billing, accounting / ERP, CRM, escalation queue, internal wiki, etc. The corpus benchmark is 12 systems per case — yours may be 6 or 20.
2. **Build the unified context layer first.** Before any copilot UI, get each system addressable by a single ticket key. Options: a thin orchestration service that fans out parallel reads to all systems (REST/GraphQL where available; screen-scrape for legacy), or an MCP wrapper per system. The agent's pane will eventually receive a single composite "ticket context" object — but the data layer must exist first.
3. **Knowledge base unification.** Most companies have 3+ knowledge bases (public site, internal helpdesk articles, an internal wiki). Without unification, the copilot hallucinates. Merge or front them with a single retrieval layer. Tag every retrievable chunk with `last-updated`, `owner`, and `source-system` so the copilot can cite and the team can spot stale content.
4. **Phase 1 pilot — draft-and-confirm on simple consults.** Start with the simplest ~50% of tickets (informational consults: "what's the status of my payment?", "how do I X?"). The copilot's only job: pull context, draft an answer using the KB, present to the agent. The agent reads, edits, sends. Measure: drafting time, edit rate, customer CSAT. Target after 4 weeks: drafting time < 30 seconds, edit rate < 30%.
5. **Phase 2 — auto-categorisation and summarisation.** Add: (a) automatic ticket categorisation on intake; (b) for long threads, an AI summary at the top of the agent's pane ("3-line summary of the last 14 messages"). Categorisation is the foundation for routing — wrong category at intake costs 2–3× downstream.
6. **Phase 3 — next-best-action recommendation.** The copilot suggests: "Issue a refund (under small-amount authority — auto)" / "Schedule a callback" / "Escalate to L2 with this context bundle". Each action template is a parameterised tool call the agent confirms.
7. **Phase 4 — selective autopilot on the simplest categories.** Once Phase 1 agent-edit-rate drops below ~10% on a category (e.g., "where is my receipt?"), allow auto-resolve on that category with a 5-second agent "veto" window before send. The agent owns the queue, not every ticket.
8. **Voice-channel readiness (parallel track).** ~70% of customer contacts at the cited fintech are voice. Voice transcription (Whisper / Deepgram via the telephony API) feeds the same copilot context — same KB retrieval, same draft logic, but the agent reads it during the call instead of typing the answer.

## Prompts

Copilot context-aggregation pseudo-config (one ticket → one composite context object):

```
`ticket_context:
 ticket_id: required
 pulls:
 - source: helpdesk
 fields: [subject, body, history, customer_id, priority, sla_state]
 - source: crm
 fields: [customer_name, tier, lifetime_value, account_owner, recent_notes]
 - source: billing
 fields: [last_invoice, payment_status, ARPPU, plan]
 - source: telephony
 fields: [last_5_call_transcripts, last_call_date]
 - source: accounting
 fields: [open_disputes, refund_history]
 retrieval:
 knowledge_base:
 query: ticket.subject + ticket.body
 top_k: 5
 filter: [language=customer.language, product=customer.product]
 include_metadata: [source_url, last_updated, owner]
 output: composite_context.md # single markdown blob given to the drafting LLM
`
```

Drafting prompt (Phase 1):

```
`You are a support drafting assistant for [COMPANY].
You will produce ONE response draft to the customer's most recent message.

Inputs:
 - composite_context.md (system-aggregated ticket context)
 - kb_chunks: top-5 retrieved knowledge-base chunks with [source_url, last_updated, owner]
 - customer's latest message (verbatim)
 - agent style guide (length, tone, salutation, sign-off)

Hard rules:
 - Cite the kb_chunk source_url for every factual claim.
 - If no kb_chunk supports a needed claim, write [NEEDS HUMAN INPUT: <gap>].
 - Never invent a refund amount, deadline, or policy. If unknown, defer to the agent.
 - If the customer is tier="VIP" or sla_state="breached", flag at top of draft.
 - Max length 200 words unless the customer asked a multi-part question.
 - Tone: warm, specific, no apologies-as-padding.

Output:
 - The draft response.
 - A 2-line "rationale" block citing which kb_chunks were used.
 - A "confidence" tag: HIGH / MEDIUM / LOW.
 - If confidence < HIGH, list the gaps that would lift it.
`
```

Categorisation prompt (Phase 2):

```
`Read the ticket subject + body + first customer message.
Output a JSON object:
 {
 "primary_category": one of [PAYMENT, ACCOUNT, TECHNICAL, INTEGRATION, BILLING_DISPUTE, GENERAL_INFO, COMPLAINT, OTHER],
 "subcategory": free string (max 5 words),
 "sentiment": one of [POSITIVE, NEUTRAL, FRUSTRATED, ANGRY],
 "complexity": one of [SIMPLE, MEDIUM, COMPLEX],
 "suggested_route": one of [SELF_SERVE, L1, L2, BILLING_TEAM, ENGINEERING],
 "first_response_sla_minutes": integer,
 "confidence": float [0..1]
 }
Hard rule: if confidence < 0.7, set suggested_route to L1 regardless.
`
```

## Gotchas

- **Don't deploy the copilot before unifying the knowledge base.** A previous attempt at a similar deployment failed because three KBs were updated independently and the copilot hallucinated answers using stale content. The KB unification (or single retrieval layer) is non-negotiable.
- **Don't treat voice as a deflection target by default.** At the cited fintech, voice is itself a revenue stream — 85% of merchants prefer voice; revenue-generating interactions happen on calls. AI on L1 informational calls is fine; AI on revenue calls without explicit business-owner sign-off is a revenue risk.
- **Categorisation MUST hard-route low-confidence tickets to a human.** If confidence < 0.7, the prompt forces L1 routing. Without this, mis-categorised tickets balloon downstream cost.
- **Don't ship "auto-resolve" without a 5-second agent veto window.** Even for the simplest categories. The veto is what keeps the agent in the loop and the trust intact.
- **Data residency regulation.** If your company operates in a jurisdiction with personal-data restrictions, the LLM stack must be on-prem or in a compliant region. The corpus shows a low-six-figure on-prem build (4× NVIDIA L40S 48GB on 2 servers, vLLM, ChromaDB RAG) replacing a vendor-quoted stack roughly 4× more expensive — confirm cost independently.
- **Don't unify by replacing 12 systems with 1.** That is a multi-year ERP project. Unify by *reading* across the 12 with a thin layer; replacement, if ever, comes later.

## Tools

- Read-API access (or screen-scrape paths) to every system in the agent's workflow. Without unified read, no copilot.
- A retrievable knowledge base (or a unification layer over fragmented KBs).
- Voice transcription pipeline if voice is a significant channel (Whisper / Deepgram).
- A telephony provider with API for transcript fetching on call-end (the corpus cites a provider serving 70% voice traffic).
- A pilot team of 3–5 willing support agents and one engineering lead.
- Multi-channel intake: a CRM + Telegram + WhatsApp + any regional messenger — all routed into one queue. (Region-specific channel routing is documented separately; principle generalises.)
