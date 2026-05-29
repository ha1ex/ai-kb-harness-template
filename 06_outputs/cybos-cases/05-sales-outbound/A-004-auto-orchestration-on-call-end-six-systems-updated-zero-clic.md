---
id: A-004
tier: A
category: "Sales & outbound"
kind: workflow
title: "Auto-orchestration on call end (six systems updated, zero clicks)"
subtitle: "Every customer call needs Jira, Notion, Slack, CRM, and a health score updated. One webhook does all six."
source: https://www.cybos.ai/cases/A-004
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "RevOps · sales-ops engineer · customer-success ops · head of customer-success"
type: case
version: v0.1
---
# Auto-orchestration on call end (six systems updated, zero clicks)

> Every customer call needs Jira, Notion, Slack, CRM, and a health score updated. One webhook does all six.

## What

A single webhook from the call-recording platform triggers a coordinated fan-out across six downstream systems — with zero manual handling. (A) Sentiment-alert into the CS chat when the call falls below a sentiment threshold. (B) Jira tickets created and routed to the right engineering owner for every product issue mentioned. (C) Notion follow-up tasks with full call context for the account team. (D) Knowledge-graph nodes for product-feedback and feature-requests get appended. (E) Account health-score refreshed with the latest signals. (F) Expansion-opportunity flag raised on the account for the AE. All six fire from one event, all six write through a single MCP layer that holds credentials.

## Why it matters

Concrete impact at one reference deployment: **four expansion opportunities found in a single call** with one of its enterprise customers, after the upsell-flag module surfaced specific product references and usage signals that the account team would otherwise have missed. The qualitative wins compound: (A) churn signals get caught *before* they become churn (the team's framing: sentiment ≥35 used to be missed until quarterly review); (B) Jira tickets that used to take 2–3 hours of manual routing per call now fire in seconds with the right assignee; (C) Notion follow-ups that used to be forgotten now appear with full call context attached; (D) the company's knowledge graph gets fed automatically rather than maintained by hand; (E) account health-scores stop being a quarterly artifact; (F) AEs see expansion signals same-day, not next-quarter. The orchestration *itself* is a force multiplier — six 30-minute-per-call manual tasks collapse into one event.

## End-to-end

1. **Pick the event source.** The "call ends" webhook from the call-recording platform. Most enterprise platforms expose this; you'll receive a payload with call ID, participants, duration, recording URL, and (depending on platform) a sentiment score.
2. **Build the central orchestrator.** A single endpoint (or a serverless function) that receives the webhook and triggers the fan-out. Don't build six independent pipelines that each subscribe to the webhook — one orchestrator that owns the fan-out gives you a single audit log, a single retry policy, and a single place to add the seventh action when you need it.
3. **MCP layer for credentials.** Every downstream write — Jira API, Notion API, Slack/Chat, knowledge-graph DB, CRM, health-score store — goes through a single MCP gateway that holds credentials. The agent code never touches a raw token. This is the same architectural pattern the original deployment calls "Hands" (write access to every system, mediated). It's what makes adding the seventh, eighth, twentieth integration tractable without re-auditing security every time.
4. **Action A — sentiment alert.** Compute or read the sentiment score from the call payload; if `≥ threshold` (the team uses 35 as the alert floor — needs calibration to your customer base), post a structured card into the CS Chat with the call deep-link, sentiment number, top three negative phrases, and an @-mention of the account owner. Acknowledge button on the card.
5. **Action B — Jira tickets.** A Sonnet pass extracts every product issue mentioned in the call. For each, route to the right engineering team using your existing product-area-to-team map (in the source reference agency's case this lives in the knowledge graph; in most teams it lives as a YAML in the repo). Create the Jira ticket with: title, repro from the call transcript, deep link to the relevant minute, assignee, severity guess.
6. **Action C — Notion follow-ups.** A second pass extracts every follow-up commitment ("send the architecture doc by Friday", "schedule the security review", "introduce them to the data team"). Each becomes a Notion task in the account's project, with owner, due-by, and the full surrounding context from the transcript.
7. **Action D — knowledge-graph update.** Product feedback and feature-request mentions get routed to the relevant product node in the company's knowledge graph (or to your equivalent — a product-feedback Notion DB, a feature-request table, etc.). Each entry includes the verbatim quote and the link back to the call minute (ground-truth citation).
8. **Action E — account health-score.** The latest signals from this call get folded into the account's health score. Sentiment, churn-risk markers, expansion markers, support-issue density. The score is now refreshed per-call, not per-quarter.
9. **Action F — upsell flag.** A third Sonnet pass looks for expansion triggers: explicit interest in new modules, mentions of related product lines, growth signals in their team or budget. If any fire, raise an upsell flag on the account with the verbatim signal attached, routed to the AE who owns the account.
10. **Single audit log.** Every action by the orchestrator writes a row to one log table with `call_id`, `action`, `status`, `error_if_any`. This is what lets you trust the system in three months when somebody asks "did Jira-action B fire for the Genesis call last Tuesday?"

## Prompts

Fan-out skeleton (the orchestrator's main loop — illustrative pseudocode):

```
`def on_call_ended(payload):
 call = fetch_call(payload["call_id"])
 transcript = fetch_transcript(call.id)

 # All six actions run; failures are logged but don't block siblings.
 safe(action_a_sentiment_alert, call, transcript)
 safe(action_b_jira_tickets, call, transcript)
 safe(action_c_notion_followups, call, transcript)
 safe(action_d_kg_update, call, transcript)
 safe(action_e_health_score, call, transcript)
 safe(action_f_upsell_flag, call, transcript)
`
```

Extraction prompt for the Jira pass (Action B):

```
`Read this customer call transcript. Extract every PRODUCT ISSUE the customer
mentioned, even briefly. For each, output:
{
 "issue": "<one-sentence summary>",
 "verbatim_quote": "<exact phrase>",
 "severity_guess": "low" | "medium" | "high" | "critical",
 "product_area": "<one of: connectors | dashboards | semantic | etl |
 api | other>",
 "minute_offset": <int>
}

If no issues are mentioned, output [].
`
```

Sentiment threshold (calibratable — the source's deployment uses 35 on a 0–100 scale; calibrate to your customer base before going live):

```
`sentiment_alert:
 threshold: 35 # below this, post to CS chat
 channel: "#cs-sentiment-alerts"
 cooldown_per_account_hours: 24 # don't double-alert
`
```

Upsell-flag extraction prompt (Action F):

```
`Read this call transcript. Identify EXPANSION TRIGGERS:
 - explicit interest in a new module / product line
 - team growth ("we're hiring 10 more analysts")
 - budget growth ("we just got board approval for...")
 - integration requests for systems we support
 - competitor pain ("our current tool X doesn't handle Y")

For each, output the verbatim quote, the type, and the implied size of opportunity.
If none, output [].
`
```

## Gotchas

- **One orchestrator, not six pipelines.** The biggest design mistake is having six separate webhook subscribers that each parse the call independently. You'll diverge on transcript-fetching, retry behavior, and prompt versions within a month. Centralize.
- **Sentiment thresholds need calibration.** The source uses 35 because their customer base shapes the distribution that way; yours will differ. Spend a week in shadow mode (compute the score, log it, don't alert) before turning on the chat post.
- **Don't write back without an MCP-style credential layer.** Six integrations × per-developer tokens × no audit trail is exactly how the "one prompt deletes the CRM" incident happens. Centralize credentials behind a gateway that holds the secrets and logs every write.
- **Ground-truth citations are non-negotiable.** Every knowledge-graph node update must carry a deep link to the call minute that produced it. Without this, the graph rots into uncited claims and the team stops trusting it. The reference agency builds this as a hard rule: every claim traceable to a source event.
- **Don't fan out to "and also email me a summary".** Email summary is a different case (cf. case [#12] auto-recap). Adding a seventh "and also" to this orchestrator creates duplication; let the recap case own the summary, this case owns the system-of-record writes.
- **Failures in one action must not block the others.** Wrap each in a `safe()` (try/except → log → continue). The orchestrator's job is to fire six independent writes, not to be an atomic transaction.
- **Privacy / data residency.** Transcripts contain customer-private information. The MCP-credential pattern plus region-pinned LLM endpoints + row-level security on the warehouse is the only way this works for regulated industries. Plan it on day one, not as a retrofit.

## Variations

- **Lighter (three-action MVP).** Sentiment alert + Notion follow-ups + Jira tickets. Skip the knowledge graph, the health score, and the upsell flag for the first 4 weeks. Most of the value, a quarter of the build.
- **Heavier (closed-loop on engineering).** Add a seventh action that runs an Opus pass to draft a PR description from the Jira ticket + relevant repo context; route to the engineer with the ticket. This is the cousin pattern from the same source — feedback-to-code-change in <30 min — applied to call-driven tickets.
- **Without an enterprise call-recording platform.** Replace the webhook source with a poller against the team's TLDV/Fireflies/Granola account; the rest of the architecture is unchanged. Latency goes from seconds to a few minutes.
- **B2B SaaS sales-call variant.** Same six-action fan-out, but Action F (upsell flag) drives the bulk of the ROI in a sales (vs CS) context. Tune the expansion-trigger prompt to your sales motion (PLG vs sales-led).

## Tools

- A call-recording platform that emits a "call ended" webhook with a recording URL and (ideally) a sentiment score
- An MCP-style credential layer (or a vault + scoped tokens per integration)
- Jira / Notion / Slack-or-Chat / a knowledge-graph store (or a Notion DB substitute) / CRM
- LLM runtime (Sonnet-class for all three extraction passes; Haiku acceptable for the sentiment-card composition)
- A small orchestrator (FastAPI / Cloud Function / Lambda — the code is <500 lines)
- A single audit-log table
