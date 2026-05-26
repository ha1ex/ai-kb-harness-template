---
id: A-001
tier: A
category: "Sales & outbound"
kind: workflow
title: "AI sales-meeting auto-processor (transcript → dual prompts → Notion + Slack)"
subtitle: "Reps lose 10 minutes per call typing notes into Slack and CRM. Both get written for them in 90 seconds."
source: https://www.cybos.ai/cases/A-001
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "sales rep · VP sales · CRM admin · marketing for ICP analysis"
type: case
version: v0.1
---
# AI sales-meeting auto-processor (transcript → dual prompts → Notion + Slack)

> Reps lose 10 minutes per call typing notes into Slack and CRM. Both get written for them in 90 seconds.

## What

A script that pulls the latest meeting transcript from the team's transcription tool, runs it through **two parallel prompts**, and writes the outputs to the shared workspace. Prompt A produces a 1200-word-max internal Slack summary — emoji-structured, action-focused, with the canonical 80/20 rule (80% of content describes the client, 20% describes us). Prompt B produces a VP-of-Sales-lens CRM record: lead source, next step, ICP fit against codified criteria, engagement level, three positive reactions, three pain points, three objections, full Q&A breakdown, presentation-flow assessment, call quality. Both land as markdown files under `Sales Calls/[Client]/v01/` with auto-versioning; optional Notion DB push for teams not yet on filesystem-as-DB.

## Why it matters

One agency cut a sales-assistant headcount specifically because this script took over post-call CRM entry. **The Notion prompt itself is a strategic artifact**: it codifies the company's ICP and qualification framework as an audit-able document. Every meeting analysis becomes a check against that ICP — if a deal is moving forward against a non-ICP profile, the analysis flags it before sales-ops has to. The two-prompt pattern is the load-bearing idea: one prompt for humans (Slack, fast scan), one prompt for the system (CRM, structured fields). Don't try to do both with one prompt — the optimization functions are different.

## End-to-end

1. **Install the script.** Drop `demo-meeting-processor.py` + `prompt_internal.txt` + `prompt_notion.txt` into `scripts/sales-meeting-automation/` in the shared workspace.
2. **Configure env.** Set `FIREFLIES_API_TOKEN` (or your transcription source's token), `OPENAI_API_KEY` (or wire to Anthropic), optional `NOTION_TOKEN` + `NOTION_DATABASE_ID` for Notion push.
3. **Codify your ICP in `prompt_notion.txt`.** This is the most important step. The production version has, verbatim: ICP includes `B2C lead-gen (Roofing, Dental, Rental)`, `eCommerce with repeat purchases`, `SaaS self-service subscription`; non-ICP includes `Mobile app/MMP`, `Complex B2B`, `One-time eCommerce`, `Non-profit`, `<$20K ad budget`. Replace with your own ICP — be just as specific. Vague ICP = useless analysis.
4. **Codify the qualification framework in `prompt_internal.txt`.** The 80/20 rule, the emoji structure, the action-focus discipline. The rule "Focus on client, not us — 80% of content describes the client" is the difference between a useful summary and a brag sheet.
5. **Run the script.** `python demo-meeting-processor.py` — fetches the latest call via the transcription API, dispatches both prompts in parallel, writes `internal.md` and `notion.md` into `Docs/SalesAndMarketing/Sales Calls/[Client Name] v[NN]/`. Auto-versions: `v01`, `v02`, etc.
6. **Auto-detect workspace path.** Script walks the parent directories looking for a workspace marker (a specific folder name or a sentinel file) so the same script works from any rep's machine without per-machine config. Demo mode runs with mock data when no API keys are set — useful for showing the flow on stage.
7. **Optional Notion push.** If `NOTION_TOKEN` is set, the script creates a new Notion page using a template with fields (Name, Client, Meeting Date, Lead Source, Status, Next Step) and pastes the structured analysis as the page body. Pure filesystem teams skip this and live in markdown.
8. **Pair with the pre-call briefing skill (case [#13+#93]).** The recap from this script becomes the input to next time's brief. The flywheel: every call enriches every future brief.

## Prompts

The 80/20 rule that makes the internal recap useful (from `prompt_internal.txt`):

```
`Focus on the CLIENT, not us. ~80% of content describes the client
(their stack, their pain, their objections, their next move).
~20% describes our side (what we presented, what we committed to).

Emoji-structured headers. Action-focused. Max 1200 words.

Sections:
 🎯 Meeting purpose
 🧑 Client overview
 🧱 Tech stack
 💢 Pain points
 💬 Key discussion points
 🎬 Next steps
 ✅ Action items (owner, due-by)
`
```

The VP-of-Sales lens (from `prompt_notion.txt`, ICP block verbatim — replace with yours):

```
`ICP CRITERIA (codified — analysis MUST score against these):
 In-ICP: B2C lead-gen (Roofing, Dental, Rental,...)
 eCommerce with repeat purchases
 SaaS self-service subscription
 Non-ICP: Mobile app / MMP
 Complex B2B
 One-time eCommerce
 Non-profit
 <$20K ad budget

For this call, produce:
 - lead source, next step, contact role, business type, ad spend
 - decision-maker status
 - ICP fit verdict + reasoning (per the criteria above)
 - engagement level (1-5)
 - 3 positive reactions (verbatim quotes)
 - 3 pain points (verbatim quotes)
 - 3 objections (verbatim quotes)
 - detailed Q&A breakdown
 - presentation flow assessment (which slides worked, which didn't)
 - call quality (1-5 + one-line why)
`
```

Folder/version output discipline:

```
`Output path: Docs/SalesAndMarketing/Sales Calls/<Client Name> v<NN>/
Files: internal.md (Slack summary)
 notion.md (CRM record)
Versioning: auto-increment NN if folder exists.
`
```

## Gotchas

- **Vague ICP = useless analysis.** "B2B companies" is not an ICP; "B2B SaaS, 50–500 employees, paid Salesforce seats, security-conscious" is. The Notion prompt is only as good as the ICP it codifies.
- **Auto-versioning lives or dies on a deterministic folder name.** Always `<Client Name> v<NN>/`. No variant spellings, no parenthetical qualifiers. If a rep types "Acme Inc." in one call and "Acme" in the next, you have two folders and a broken flywheel.
- **Don't skip the action-items list.** The recap that doesn't end in owner-assigned action items just generates more meetings. The Slack summary's last block is a hard requirement.

## Tools

- Transcription source with API (Fireflies, TLDV, equivalent)
- LLM runtime (OpenAI / Anthropic / `claude -p` on Max)
- Shared workspace populated under `Docs/SalesAndMarketing/Sales Calls/`
- Optional: Notion API token + database with the expected schema
- `pip install` whatever client libs (`requests`, `openai`/`anthropic`)
