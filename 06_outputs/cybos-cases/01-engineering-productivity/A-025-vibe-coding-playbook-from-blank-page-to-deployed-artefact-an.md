---
id: A-025
tier: A
category: "Engineering productivity"
kind: workflow
title: "Vibe-coding playbook — from blank page to deployed artefact (and back)"
subtitle: "Problem solved: Non-engineers stare at a blank prompt and never ship. Nine ordered phases get them to a deployed tool in one afternoon — now with the post-2025 design stack and a research-first guardrail."
source: https://www.cybos.ai/cases/A-025
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · PM · non-engineer operator · marketer · IC"
type: case
version: v0.1
---
# Vibe-coding playbook — from blank page to deployed artefact (and back)

> Problem solved: Non-engineers stare at a blank prompt and never ship. Nine ordered phases get them to a deployed tool in one afternoon — now with the post-2025 design stack and a research-first guardrail.

## What

A nine-phase ordered playbook that takes a non-engineer from "I have an idea for a small internal tool" to "I have a deployed, version-controlled, refactored artefact other people on the team are using." Each phase is one prompt-shape plus one gotcha. Phases compose: phase 0 (kickoff) → phase 1 (one-file HTML) → phase 2 (design ideation via ASCII or 5-direction preview) → phase 3 (interactive visuals) → phase 4 (reverse PRD) → phase 5 (productionise) → phase 6 (deploy) → phase 7 (safety rails) → phase 8 (mobile dispatch) → phase 9 (weekly retro that promotes recurring sequences into skills). The whole arc fits inside a single morning for an operator who has done it once.

Layered onto the original nine phases: seven post-launch principles (stray-dog, context-as-gift, compound-vs-select, founder-must-code, wow→4-rewrites, image-of-future, recursive simplification), plus a 2026-Q1 design stack that materially changed phase 2/3 (Anthropic's `frontend-design` skill, Google AI Studio handoff, `claude.ai/design` one-shot, Magic Patterns via MCP, the 5-direction local-host design plugin, Kiro-style spec-first generation), and one new anti-pattern: **research existing OSS first** before vibe-coding (an operator re-implemented Handy from scratch before discovering it already existed).

## Why it matters

The first time a non-engineer in your company vibe-codes a working internal tool and ships it to a public URL, two things happen at once. (1) The cost of one-off internal tools collapses — instead of "let's wait six months for engineering capacity," the marketing lead has a dashboard by Thursday. At one cohort, ~30 micro-products were built in two months by non-engineers; one team-member migrated a partner workflow off Notion entirely in a weekend. One operator shipped a Canny replacement and migrated all data in **3 days, 183 commits**. Another shipped a native dictation app across **three platforms (macOS, iOS, Android keyboard) in three weeks**, in two languages he'd never written in. A third shipped a basketball-training app via Claude Opus over 3 weeks of one resumed session. (2) The team's sense of what is possible changes irreversibly. Once people see a sales funnel rebuilt as a custom node-editor over a small database, no one asks "should we buy [SaaS]?" without first asking "should we vibe-code our own version?" — and the answer is sometimes correct.

## End-to-end

##### Phase 0 — Five-question kickoff prompt (anti-blank-page)

Force the agent to interview you. Five sequential multiple-choice questions, one at a time, whose answers most strongly determine what goes into the artefact.

**Key prompt** (paste verbatim into the agent in a fresh folder):

```
`I want to assemble a management dashboard for my business process.
Output: one HTML file. Before writing any code, ask me five questions
whose answers most strongly determine what goes into the dashboard.

Rules:
- one question per message, one at a time
- do not guess, ask after my answers
- for each question give me three answer options
- after I answer all five, summarise my answers and only then generate the HTML
`
```

**Variation — "image of the future" kickoff.** Describe the desired *end state* in vivid detail; let the agent propose the path. Works when you have a clear mental image but not clear sub-questions.

**Gotcha — research before generating.** Before phase 1, add one step: *"is there an existing open-source project that already does this? Search GitHub. If yes, list top 3 and tell me what's missing before I build."* An operator vibe-coded a local STT app over a weekend and only then discovered Handy already existed. Make the agent prove the gap exists.

**Gotcha — reasoning effort.** Run agents on `medium` reasoning by default. `extra-high` goes into "loops of over-caution" on simple UI work.

##### Phase 1 — HTML-first with Tailwind via CDN + shadcn/ui

```
`Use Tailwind via CDN. Use shadcn/ui for components. Single index.html file.
No build step. Don't bundle. Don't init a project.
`
```

##### Phase 2 — Design ideation: ASCII variants, 5-direction preview, or reference-driven

Three increasingly-rich options:

**(a) ASCII variant previews in chat.** Ask for three UI directions with ASCII previews rendered in chat. Pick one, then code.

```
`Propose three variants of what should happen when the user clicks on a graph node.
For each variant, render the resulting interface as ASCII visualisation directly
in this chat. Do not write code yet. After I pick one, implement only that variant.
`
```

**(b) 5-direction local-host preview**. Use a design-exploration plugin: from a brief or current screens, the plugin generates five design alternatives viewable on localhost. Pick by clicking through, not by reading code.

**(c) Reference-driven design.** Collect 10–30 screenshots from public design galleries (Behance, template marketplaces) — show the agent as a grid, mark likes/dislikes, then ask the agent to design in the style of the liked references.

**Gotcha:** generic AI landings all look the same. Install Anthropic's `frontend-design` skill — it bakes in design-thinking guidelines and produces noticeably better landings than naked Claude.

##### Phase 3 — Interactive visuals with D3, Mermaid, Remotion

Pin the visualisation stack via keywords so the agent doesn't roulette through alternatives every run.

```
`Visualise my departments using D3, via CDN. Visualise their connections.
Then add click-to-open for each department; show their tasks below.
`
```

```
`Use Mermaid diagrams for any process or flow drawings in this repo's Markdown files.
`
```

```
`Use Remotion to record a 15-second walkthrough of this dashboard as MP4.
`
```

##### Phase 3.5 — Three-screen design dance (Claude ↔ AI Studio ↔ Claude)

When the look-and-feel is the blocker, route through a vision-focused frontend:

```
`1. In Claude Code: "fold all components into one file" — produces a single self-contained artefact.
2. Paste into Google AI Studio with a one-line brief: "make it cyberpunk" / "make it editorial Stripe-clean".
3. Copy the restyled artefact back into Claude Code: "I redesigned this — integrate the styles back into the codebase."
4. Iterate per component as needed.
`
```

Adjacent variants in the same family:

- **`claude.ai/design` one-shot**. Upload a Figma design system or React kit; describe the artefact (deck, landing, one-pager); one-shot generates. One operator one-shot a usable site from an internal React kit; another generated pitch-deck candidates from deep-research data. Reverse-engineered system prompt floats around, but the harness has additional non-prompt logic so cloning is imperfect.
- **Magic Patterns + Claude Code via MCP**. Magic Patterns exposes an MCP; Claude can request UI variants from Magic Patterns and integrate the chosen one. Useful when you want a richer component palette than `frontend-design` alone.
- **Kiro-style spec-first generation**. AWS Kiro IDE forces writing a formal spec before code-gen. The pattern transfers to Claude Code: write the spec file first, then prompt against it. Heavier than the kickoff prompt but transferable across model swaps.

##### Phase 4 — Reverse PRD from a working artefact

```
`Compile a PRD from the current dashboard.
Sections: Problem, Product goal, Users & scenarios, Functional requirements,
Constraints, Risks, Dependencies, Open questions, Symptoms / pre-conditions.
Output one Markdown file next to the dashboard.
`
```

##### Phase 5 — Refactor to React + Vite + TypeScript with AGENTS.md

```
`Plan-mode. Break this into components. Use Vite + React + TypeScript.
Create project documentation in AGENTS.md.
Create a PRD with a functional description of the product, no tech details.
Show me the plan before writing any code.
`
```

##### Phase 6 — GitHub (private) + Vercel deploy

```
`Help me deploy.
- Create a new private repository on GitHub.
- Check that.env and keys are gitignored.
- Push the repo using gh CLI. If gh isn't installed, install it and walk me through.
- Add a robots.txt that disallows search-engine indexing (URL is technically public).
- Log into Vercel via the gh OAuth integration. Add the repo as a project. Deploy.
- Print the public URL.
`
```

##### Phase 7 — Agent rules / hooks as safety rails

```
``
```

## Prompts

(All key prompts inlined above per phase.)

Recursive-simplification debug pattern:

```
`I do not understand what you just said. Explain it on the level of
"matches as architecture" — literal, concrete, baby-terms. If you used
any word longer than 6 letters, replace it. Do not summarise; re-explain
step by step.
`
```

Context-as-gift kickoff (the anti-trimming pattern):

```
`I have <paste large context dump — transcripts, notes, files, all of it>.

Do NOT ask me to summarise or trim. Treat this as the full briefing you
would receive from a paying client who is paying you $1000/hour. You have
no time to ask for less. Use the whole thing.

My actual question: <one sentence>.

Begin by quoting the 3 most decision-relevant passages back to me with
[REF: line N] tags so I know what you anchored on. Then answer.
`
```

## Gotchas

- **Don't skip phase 0.** Without the five-question kickoff (or image-of-the-future variant), operator and agent both guess; artefact ends up generic.
- **Don't go to React on day one.** HTML-with-CDN is the right tool for the first three prototypes.
- **Don't generate the PRD before the prototype.** Vibe-coding inverts the old order; the prototype is cheaper than the PRD.
- **Don't deploy without phase 7.** Repos going public + secrets leaking has happened to real teams.
- **Reasoning effort:** `medium` by default, `high` only at planning, never `extra-high` for everything.
- **Stray-dog mental model.** Treat the agent as "a smart stray dog you took home — very smart in some rooms, will shit in other rooms; without firm boundaries it adds tons of garbage." Templates, gates, and fixed output formats are the antidote.
- **Context-as-gift, not context-as-burden.** Stop sanitising / trimming. Paste the whole transcript; let the model decide what matters.
- **Founder-must-code thesis.** The spec evolves only when the operator is the one iterating. Handing the spec to engineering mid-build produces an obsolete spec shipped months later.
- **Wow → 4 rewrites → working.** Budget for v1, v2, v3 failing; v4 sticks. Pick ONE branch when v3 looks promising.
- **Recursive-simplification learning loop.** When stuck, ask "explain simpler" recursively until you understand. Don't pretend.
- **NEW — Research existing OSS first**. One operator rebuilt Handy from scratch before realising it existed; another caught himself reimplementing a published Plaud library. Add a research step before phase 1. Cheap to check; expensive to redo.
- **NEW — Beware "crypto-aesthetic" output from AI-Studio restyle**. The flashy/animated output from the three-screen dance suits some brands but not all. If you want minimal taste, prompt for it explicitly.

## Variations

- **Single-file → one-platform native app**. The same loop ships native macOS/iOS/Android apps via Cursor/Claude Code in 2–3 weeks per platform. One operator built a local STT Mac app vibe-coded in hours via Gemini 3, self-deployed via GCP CLI without leaving the terminal.
- **3-week solo-built vertical app**. One operator shipped a basketball-training app via Claude Code Opus in a single resumed session over weeks, with a parallel "smart content scraper" that found best diagrams online and redrew each in brand style via image generation.
- **Internal-tool replacement of SaaS**. One operator vibe-coded a Canny replacement and migrated all data in 3 days / 183 commits. Pair with phase 9's retro to compound.

<hr/>

## Tools

- Coding agent — Codex / Cursor / Claude Code (pick one canonical; the playbook works in any)
- GitHub account, `gh` CLI authenticated
- Vercel account (free tier)
- Anthropic `frontend-design` skill installed for phase 2/3 (drops generic-AI-landing risk)
- Optional: `claude.ai/design` for one-shot generation; Magic Patterns MCP for richer component palette; a design-exploration plugin for 5-direction localhost preview
- Optional: Google AI Studio (Gemini) as the visual-restyle middleman in the three-screen dance
- Optional: ChatGPT Pro with the Codex tab for phase 8
- A local folder with prefix convention (`corp-pulse/`, `corp-health/`, etc.) so the agent can route by prefix
- Wispr Flow or equivalent dictation tool
