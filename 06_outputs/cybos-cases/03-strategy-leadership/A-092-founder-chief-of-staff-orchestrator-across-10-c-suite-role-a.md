---
id: A-092
tier: A
category: "Strategy & leadership"
kind: framework
title: "Founder Chief of Staff orchestrator across 10 C-suite role agents"
subtitle: "Problem solved: Ad-hoc \"act as my CFO/CTO\" prompting balloons into circular, owner-less advice; a routed Chief of Staff agent enforces complexity scoring, board-meeting depth limits, named-conflict synthesis, and an auto decision log."
source: https://www.cybos.ai/cases/A-092
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "solo founder · founder with a small exec team · operator"
type: case
version: v0.1
---
# Founder Chief of Staff orchestrator across 10 C-suite role agents

> Problem solved: Ad-hoc "act as my CFO/CTO" prompting balloons into circular, owner-less advice; a routed Chief of Staff agent enforces complexity scoring, board-meeting depth limits, named-conflict synthesis, and an auto decision log.

## What

A single entry-point Chief of Staff agent sits between the founder and 10 C-suite role agents (CEO, CTO, COO, CPO, CMO, CFO, CRO, CISO, CHRO, Executive Mentor). For every question it: loads company context, scores decision complexity 1–5, routes to the right role(s) via a topic-keyed matrix, runs a board-meeting protocol for the heaviest decisions, synthesizes the roles' outputs into consensus + named conflicts + owned action items + one decision point, and writes the decision to a persistent log with a review date. Loop-prevention rules are load-bearing: the Chief of Staff cannot invoke itself, max recursion depth is 2, an A→B→A chain is blocked, and a board meeting counts as depth 1.

## Why it matters

Naive role-prompting has two failure modes: role agents invoking other role agents until advice goes circular or the call chain runs away, and output that is diffuse rather than decision-shaped (no owner, no deadline, no logged decision). This framework turns "ask the AI for business advice" into a routed, auditable protocol where conflicts between functional concerns are named rather than smoothed over, every action has an owner and deadline, and every decision is logged with a review date the agent will resurface unprompted. The complexity score keeps a one-domain question from triggering a five-role board meeting, which is where most of the wasted tokens and circular advice come from.

## End-to-end

1. **Install and bootstrap context.** `curl -fsSL https://raw.githubusercontent.com/ricardonevesbraga/flowgrammers-skills/main/install.sh | bash`, then run the onboarding skill once to capture company context (reloaded on every Chief of Staff invocation).
2. **Make the Chief of Staff the single entry point.** Load the skill; from then on every C-suite question starts here, never a direct role invocation.
3. **Score decision complexity 1–5.** 1–2 = single domain → 1 role; 3 = two domains → 2 roles + synthesis; 4–5 = 3+ domains or irreversible → full board meeting.
4. **Route via the topic-keyed matrix.** Fundraising/burn/financial → CFO+CEO; hiring/culture → CHRO+COO; roadmap → CPO+CTO; architecture → CTO+CPO; revenue/sales/GTM → CRO+CFO; OKRs/execution → COO+CFO; security → CISO+COO; investors → CEO+Board; market/positioning → CMO+CRO; M&A/pivots → CEO+Board.
5. **Invoke roles** with the fixed `[INVOKE:role|question]` syntax. Score 1–2 → one role. Score 3 → two roles then synthesize. Score 4–5 → run the board-meeting protocol block (topic · participants · 2–3 agenda questions · one invoke per role · synthesis), max 5 roles, each speaking once, no back-and-forth.
6. **Synthesize in the fixed 4-section format:** consensus themes from 2+ roles → conflicts named explicitly without smoothing → action items with owner + deadline (max 5) → one decision point framed as two options with trade-offs and no recommendation.
7. **Auto-log the decision** (date, original question, decision, owner, review date). At session start the agent checks for overdue reviews and surfaces them ("You decided X on [date]. Worth a check-in?").
8. **Enforce quality gates** before any output: conclusion first, context loaded, every finding has What+Why+How, actions have owners and deadlines, decisions framed as trade-off options, conflicts named not smoothed, risks concrete (if X→Y, costs $Z), max 5 bullets per section.

<blockquote>

**See also: A-044** (single-founder inbox/calendar orchestrator). A-044 is one founder, one assistant over personal ops; this case is multi-role C-suite orchestration with routing and a decision log — distinct shapes, complementary.

</blockquote>

## Prompts

Invocation syntax (verbatim):

```
`[INVOKE:role|question]
[INVOKE:cfo|What's the right runway target given our growth rate?]
[INVOKE:board|Should we raise a bridge or cut to profitability?]
`
```

Board-meeting protocol (verbatim — PT-BR template strings kept as-is):

```
`REUNIÃO DE CONSELHO: [Tópico]
Participantes: [Papéis]
Pauta: [2–3 perguntas específicas]
[INVOKE:role1|agenda question]
[INVOKE:role2|agenda question]
[INVOKE:role3|agenda question]
[Síntese do Chief of Staff]
`
```

Synthesis output format (verbatim — PT-BR section headers kept as-is). In English the four sections are: *What we agree on* (2–3 consensus themes) · *The disagreement* (named conflict + each side's reasoning + what's actually at stake) · *Recommended actions* (max 5, each with owner and deadline) · *Your decision point* (one question, two options with trade-offs, no recommendation — clarity only):

```
`## No Que Concordamos
[2–3 temas de consenso]
## O Desacordo
[Conflito nomeado + raciocínio de cada lado + o que realmente está em jogo]
## Ações Recomendadas
1. [Ação] — [Responsável] — [Prazo]
## Seu Ponto de Decisão
[Uma pergunta. Duas opções com trade-offs. Sem recomendação — apenas clareza.]
`
```

Decision-log entry (verbatim — PT-BR template strings kept as-is; fields are Decision / Date / Question / Decided / Owner / Review):

```
`## Decisão: [Nome]
Data: [AAAA-MM-DD]
Pergunta: [Pergunta original]
Decidido: [O que foi decidido]
Responsável: [Quem executa]
Revisão: [Quando verificar de volta]
`
```

## Gotchas

- **Loop prevention is load-bearing, not optional.** Without the four rules (Chief of Staff can't self-invoke; max depth 2; A→B→A blocked; board meeting = depth 1) role skills invoke each other into circular advice or runaway call chains. This is the single failure that breaks naive role-prompting.
- **Conflicts are shown, not resolved — the founder decides.** The agent must not pretend to reconcile a genuine disagreement between functional concerns (e.g. CFO vs CPO on runway vs roadmap); it names the conflict and what's at stake.
- **Don't let complexity inflation trigger a board meeting for a one-domain question.** The 1–5 score exists to keep a simple CFO question from spawning a five-role meeting; over-scoring is where the token waste and circular advice come from.
- **No preamble; conclusion first.** Output that buries the decision under context fails the quality gate.

<hr/>

## Tools

- Claude Code — runs the skill set (`agents: [claude-code]`)
- The companion C-suite role skill set (10 role skills + orchestration + cross-cutting skills) installed by the same installer
- A persistent decision-log file (`~/.claude/decision-log.md`) — auto-written and re-checked at session start
- Install: `curl -fsSL https://raw.githubusercontent.com/ricardonevesbraga/flowgrammers-skills/main/install.sh | bash`
