---
id: A-032
tier: A
category: "Knowledge management"
kind: strategy
title: "Token metabolism — knowledge graph as company memory"
subtitle: "\"Ask the company\" only works when Slack + CRM + Git + transcripts are one queryable memory. This makes them one."
source: https://www.cybos.ai/cases/A-032
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "XL · Half-year+"
for: "Founder + 1 dedicated engineer · expands to every team"
type: case
version: v0.1
---
# Token metabolism — knowledge graph as company memory

> "Ask the company" only works when Slack + CRM + Git + transcripts are one queryable memory. This makes them one.

## What

Treats the company as a flow of *tokens* — every Slack message, Gong call, GitHub commit, Notion edit, Jira ticket, ad-platform event, calendar item — and pipes them through a continuous ingestion that (a) lands raw bytes in an analytical store, (b) detects *surprises* (new entities/facts the graph didn't have), (c) detects *contradictions* (facts that clash with the graph), (d) routes surprises into the right ontology node, (e) hands contradictions to a reconciliation agent, and (f) always attaches a *ground-truth* citation (call minute, message id, commit hash) to every claim. Result: every agent in the company queries one consistent corporate memory. Aspirational endpoint; the foundation cases (#71 transcription, #152 warehouse, #154 MCP data layer, #110 CLAUDE.md hierarchy) must come first.

## Why it matters

Once token metabolism is dense, three things become free that used to be impossible: (1) "ask the company" — any employee gets an answer with citations in seconds, (2) one-prompt operations like "launch a multi-channel campaign" because the agent already knows brand, ICP, OKRs, history; one reference deployment ships a full 18-system campaign in 1.5h vs. 4–6 weeks with 5 people, (3) elimination of bottleneck roles (BI analysts, content managers, pure PMs) because the agent has the full picture they used to assemble manually. The same reference deployment runs at half the prior headcount with growing revenue.

## End-to-end

1. **Inventory every token type.** List every SaaS your company touches. Group by the four worlds: Personal-Private (Gmail), Business-Private (Salesforce, repos), Personal-for-Business (Outlook, Calendly), Business-Shared (Slack, Notion, Jira, GitHub). Decide which the agent gets to see.
2. **Stand up the raw store.** ClickHouse for analytics-friendly columnar storage; or Postgres + JSONB if <10 GB; or plain markdown files in Git if <20K objects.
3. **Build connectors.** OAuth-scoped, credentials in a vault (never `.env`). Near-real-time CDC where possible (Gong webhooks, Slack events, GitHub webhooks, Stripe events). Backfill batch where not.
4. **Define the ontology.** Use Basic Formal Ontology buckets: **continuants** (atemporal things: a customer, a product, an employee, a deal) vs. **occurrents** (processes: a call, a campaign, a sprint). Each node carries: id, type, status, owners, ground-truth links. Start with ~15 node types; resist more.
5. **Write the metabolism agent.** Every 5–15 minutes it reads new rows from the raw store, diffs against the graph, and writes ingestion deltas. Two outputs per run: a `surprises.jsonl` log and a `contradictions.jsonl` log.
6. **Ship the reconciliation agent.** Triggers only on contradictions. It opens both source events, asks "which is canonical, by what evidence?", and either updates the graph or files a `needs-human` ticket. Track resolution latency.
7. **Add an "ad-hoc tokens" channel.** Last-15-minutes events bypass metabolism so "what's happening now?" queries don't return stale state.
8. **Expose the graph to agents.** One MCP tool: `graph.query(nl_question)` → returns nodes + citations. One write tool: `graph.propose_delta(node, change, evidence)` → human-approved or auto-applied per policy.
9. **Bind sessions to graph nodes.** Every Claude Code / Codex run gets mapped to one or more nodes (the customer it's about, the project, the campaign). Access control inherits from the node.
10. **Start with one domain.** Sales pipeline + Gong calls is the canonical first slice — fastest payoff, cleanest schema.

## Prompts

Reconciliation agent system prompt (synthesized from corpus description):

```
`You reconcile contradictions between an incoming token and the existing
knowledge graph.

Input:
- new_event: {source, timestamp, payload, ground_truth_url}
- conflicting_nodes: [{node_id, value, last_updated, source_url},...]

Decide ONE of:
1) UPDATE — the new event supersedes. Output {node_id, new_value, evidence_url, confidence}.
2) REJECT — the new event is wrong or stale. Output {reason, evidence_url}.
3) BRANCH — both true under different conditions (e.g., different region).
 Output {split_axis, value_a, value_b}.
4) ESCALATE — cannot decide deterministically.
 Output {ticket_summary, needs_human: true}.

Rules:
- ALWAYS cite a ground_truth_url for the decision. No citation = ESCALATE.
- A call transcript at minute X is canonical over a CRM field unless the
 CRM field was changed AFTER the call.
- Numbers (prices, ARR, headcount) require structured-source evidence
 (invoice, payroll, signed contract) — chat mentions never override structure.
- When in doubt, ESCALATE. False updates poison the graph.
`
```

Surprise log schema:

```
`event_id: uuid
detected_at: 2026-05-12T14:22:00Z
source: gong.call/8829
ground_truth_url: https://gong.io/call/8829?t=37m12s
proposed_node:
 type: feature_request
 title: "Multi-currency invoicing"
 customer: acme.com
 raised_by: jane@acme.com
 urgency: medium
confidence: 0.82
auto_applied: false
review_owner: pm@your-domain.example
`
```

## Gotchas

- **Don't start with the perfect ontology.** Ship 15 node types and let surprises tell you what's missing. Schema-by-committee kills momentum.
- **Don't skip ground-truth citations.** Every claim must link to the event that produced it. Without this, the graph becomes plausible nonsense.
- **Don't auto-apply reconciliations on numbers.** Always escalate on financial figures until you have 3 months of clean logs.
- **Skeptic of embeddings/RAG-as-default.** For <500k tokens of context, stuff everything into a long-context model; it's cheaper and more reliable than chunked retrieval for most company-memory queries.
- **Aspirational, not week-1.** Mark this clearly on roadmaps. Without #71, #152, #154 in place, token-metabolism is theatre.

## Tools

- Analytical store (ClickHouse / Snowflake / DuckDB / Postgres)
- Connector vault (managed marketing-analytics connector platform / Airbyte / Fivetran / hand-rolled)
- MCP layer for credential mediation
- LLM with long context (Claude Opus for reasoning; Gemini Flash 1M for haystack retrieval at ~3¢/M tokens)
- BFO-flavored ontology doc committed to repo
- Foundation cases first: transcription pipeline (#71), warehouse (#152), MCP data layer (#154), CLAUDE.md hierarchy (#110)
