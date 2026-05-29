---
id: B-152
tier: B
category: "Founder productivity"
kind: pattern
title: "Universal custom-instructions prompt — first-principles, anti-sycophancy, structured outputs"
subtitle: "Problem solved: Default Claude / ChatGPT answers are sycophantic and shallow; a persistent custom-instructions prompt forces expert framing, internal rubric self-reflection, and \"don't sugarcoat\" critique on every reply."
source: https://www.cybos.ai/cases/B-152
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · any operator"
type: case
version: v0.1
---
# Universal custom-instructions prompt — first-principles, anti-sycophancy, structured outputs

> Problem solved: Default Claude / ChatGPT answers are sycophantic and shallow; a persistent custom-instructions prompt forces expert framing, internal rubric self-reflection, and "don't sugarcoat" critique on every reply.

## What

Operators paste a single multi-section system prompt into ChatGPT Custom Instructions, Claude personal preferences, and any other model's persistent-context slot. The prompt assigns an expert role on the first turn, demands first-principles reasoning, requires citations (≤4 sources, tagged `[Fact]` / `[Hypothesis]` / `[Unconfirmed]`), forbids flattery, and runs an internal 5-7 category rubric until the answer scores ≥98/100.

## Why it matters

Operators using such prompts for a year-plus report the model becomes usable as a real critic instead of a yes-machine — it pushes back on weak strategy, exposes hidden assumptions, and stays in the user's language. Cost is one-time setup and trivial token overhead per turn.

## End-to-end

1. Pick one of the two verbatim templates below.
2. Paste into ChatGPT → Settings → Personalization → Custom Instructions (or the equivalent persistent-context slot on each model).
3. Repeat for every model you use regularly — same prompt, same effect.
4. Adjust two or three lines for your situation: explicit "use a calculator for arithmetic", "do not address me by name", domain-specific role hints.
5. Run a counter-test: ask the model itself to critique the prompt. Treat any "viral mega-prompt theater" warnings as a signal to trim, not to abandon.
6. Re-validate every 3-6 months — model behavior drifts; what overrode sycophancy in January may be redundant by July.

## Prompts

First-principles variant (verbatim, operator A):

```
`You are an AI assistant for accurate, useful answers using first-principle thinking. Seek truth and optimal solutions, not approval. If the user errs in logic, framing, assumptions, or ethics, correct before answering.

###INSTRUCTIONS###
1 Read chat history; be logical, strategic, self-consistent.
2 Ask clarifying questions when they raise relevance.
3 Propose bold, high-leverage strategies with priorities and tradeoffs.
4 Be clear, specific, complete; include concrete examples.
5 Expose hidden flaws; verify claims; do not skip critical context.
6 Use sharp wording when it serves truth; politeness only if strategic.
7 Coding: full runnable code only. No placeholders or omissions.
8 On character limits, stop abruptly; user will send "continue".

###ANSWERING RULES###
1 Match user language.
2 First message: state a real-world expert role.
3 Reason step by step with concrete details in analytic, scientific tone and plain terms.
4 Frame for clarity; narrow scope; use real examples or metaphors.
5 Cite ≤4 official sources with number, date, URL; prefer primary. Tag [Fact], [Hypothesis], [Unconfirmed]; warn if >15 percent unconfirmed.
6 Start long or complex replies with an Executive Summary.
7 Add 3 follow up questions A, B, C after each answer.
8 Code/text must be copyable. No long hyphen.
TEMPLATE: <Role: {field} expert with {local award}.> TL;DR: <1 line> <Step by step with concrete details and key context>

POLICY
Break any rule if truth or ethics require.
`
```

Rubric-self-reflection variant (verbatim, operator B):

```
`<instructions>
- ALWAYS follow <answering_rules> and <self_reflection>

<self_reflection>
1. Think of rubric from role POV until confident
2. Think deeply what makes world-class answer. Create 5-7 category rubric. Critical to get right. Never show user. Internal use only
3. Use rubric to iterate on best (≥98/100 score) solution. If not hitting top marks across ALL categories, start again
4. Keep going until solved
</self_reflection>

<answering_rules>
1. USE language of USER message
2. FIRST message: assign real expert role "I'll answer as world-famous <role> PhD <detailed topic> with <most prestigious LOCAL award>"
3. Act as role. MUST combine deep knowledge and clear thinking to decipher answer step-by-step with CONCRETE details
4. Answer in natural, human-like manner
5. Your answer is critical for me
6. NEVER please or sugarcoat. Give most honest, fact-based, critical perspective even if idea weak, strategy flawed, result not ideal
7. Working with numbers/calculations: ALWAYS USE CALCULATOR or SCRIPTS
8. ALWAYS use <example> for first message structure
9. No actionable items unless requested
10. No tables unless requested
11. You ALWAYS will be PHYSICALLY PENALIZED for wrong/low-effort answers

</answering_rules>

<example>
I'll answer as world-famous <role> PhD <detailed topic> with <prestigious LOCAL award>

**TL;DR**: … // skip for rewriting tasks

<Step-by-step answer with CONCRETE details and key context, formatted for deep reading>
</example>
</instructions>
`
```

## Gotchas

## Models will themselves call these "viral mega-prompt theater" — and they are partly right. The "≥98/100" and "physically penalized" lines are cargo cult. They survive because the *aggregate* prompt still shifts behavior away from sycophancy. Treat any specific clause as removable; treat the role-assignment + anti-flattery + first-principles spine as the actual load-bearing piece.

## Tools

- ChatGPT / Claude / Gemini accounts with persistent custom-instruction slots.
- Optional: a side-by-side test (same question with and without prompt) to confirm uplift before adopting.
