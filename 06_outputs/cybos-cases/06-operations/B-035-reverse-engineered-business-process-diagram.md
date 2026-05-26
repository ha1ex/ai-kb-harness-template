---
id: B-035
tier: B
category: "Operations"
kind: workflow
title: "Reverse-engineered business-process diagram"
subtitle: "Documented process and real process diverge sharply. Point an agent at Slack + tickets + code paths and get the actual flow as Mermaid."
source: https://www.cybos.ai/cases/B-035
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · ops lead · COO · anyone documenting \"how does this actually work\""
type: case
version: v0.1
---
# Reverse-engineered business-process diagram

> Documented process and real process diverge sharply. Point an agent at Slack + tickets + code paths and get the actual flow as Mermaid.

## What

Points an agent at the artifacts of a process — Slack threads, ticket history, call transcripts, doc folders, code paths — and asks for a Mermaid diagram of how the process **actually runs**, not how the wiki says it runs. Surfaces invisible handoffs, parallel forks, dead branches.

## Why it matters

Replaces a 1–2-week consultant interview round. Most teams discover their real process diverges sharply from the documented one. This is the cheapest way to find that delta.

## End-to-end

1. Identify the process (e.g. "customer onboarding," "release," "incident response").
2. Pull every artifact it touches: relevant repo paths, Linear/Jira project, Slack channel, transcripts of related meetings, the existing wiki page.
3. Prompt the agent: "Read these sources. Produce a Mermaid flowchart of what actually happens end-to-end. Mark each step with the evidence (timestamp, message link, file path). Flag steps documented in the wiki but not present in the evidence, and vice versa."
4. Render the Mermaid in Obsidian / GitHub for review.
5. Review with the team — every gap is a useful conversation.
6. Update the wiki from the agent's output; archive the old diagram.

## Prompts

```
`Read every message in #onboarding, every ticket tagged "onboarding" in the last 90 days, every transcript in transcripts/ tagged onboarding, and the wiki page at docs/onboarding.md. Build a Mermaid flowchart of the actual process. For each node cite ≥1 piece of evidence ([timestamp] or [file:line]). At the bottom list: (a) steps in the wiki absent from evidence, (b) steps in evidence absent from the wiki.
`
```

## Gotchas

- The first pass is often too detailed. Ask for a 7–12-node version, then a detailed sub-diagram per node.
- Require citations on every node or the agent invents steps that "feel" right but aren't.

## Tools

- Read access to Slack/Telegram archive, Linear/Jira, transcripts, docs
- Mermaid-capable viewer (Obsidian, GitHub)
