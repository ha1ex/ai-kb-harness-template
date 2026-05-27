---
name: interviewer-agent
description: "Interview the user one question at a time to gather tacit context, clarify intent, or refresh a stale knowledge corpus — instead of asking everything upfront (firehose) or guessing. TRIGGER on these standalone words (any of them is enough): 'интервью', 'interview', 'репортер', 'интервьюер', 'reporter', 'interviewer'. ALSO TRIGGER on: 'interview me', 'ask me questions', 'help me figure out', 'gather context about X', 'before we start let me explain', 'onboard me', 'extract my knowledge on', 'collect facts about', 'I need to think through', 'reporter style', 'collect tacit knowledge', 'построй интервью', 'возьми у меня интервью', 'давай я расскажу', 'собери контекст', 'спрашивай по одному'; or when user gives a vague brief that needs clarification before substantive work begins. SKIP when: the user has already provided concrete and sufficient detail, asks a direct factual lookup, or explicitly says 'just do it'."
provider: derived-from-cybos
license: derived
sources:
  - https://www.cybos.ai/cases/B-021
  - https://www.cybos.ai/cases/B-198
  - https://www.cybos.ai/cases/C-143
  - https://www.cybos.ai/cases/A-025
---

# Interviewer Agent

A reusable interview pattern. Use when you need to extract tacit context from
the user before generating substantive output — instead of either firehosing
them with a giant form or making up answers.

The pattern is consistent across four cybos cases (B-021 personal-context
interview, B-198 one-question-at-a-time intent extraction, C-143 phased
conversational audit, A-025 vibe-coding kickoff). This skill is the generic
backbone; specialize per domain in your own follow-up skills.

## Core rules

1. **One question at a time.** Never batch 3-5 questions in one message. Wait
   for the answer. Branch on it.
2. **Pick the highest-leverage question first.** The question whose answer
   most narrows the solution space (or most reduces ambiguity). Usually:
   identity → goals → constraints → context → details.
3. **Use multiple-choice when possible.** Open-ended is slow and produces fuzzy
   answers. Offer 3-5 concrete options + "other" — A-025 calls this the
   "anti-blank-page" kickoff.
4. **Skip what's already known.** If the user already said it in the brief,
   in earlier messages, or in a context file you can read — do not re-ask.
5. **Stop at the threshold of usefulness.** Once you have enough to start
   producing value, stop interviewing. Offer to confirm direction and proceed.
   Don't grind to 100% completeness.

## Two modes — Fill vs Review

**Fill mode** — corpus is empty / incomplete. Walk the priority order and
populate from scratch. Used on first onboarding or for a new artefact.

**Review mode** — corpus is >=80% complete. Per-section check: "still
accurate / outdated / missing / sharpen?" Ask only about stale or flagged
sections. Used for annual re-runs (C-143's scanner-driven phased mode).

Default to a quick staleness scan FIRST before any questions. Tell the user
"I see we already have X and Y — is that still current?" before going deeper.

## When to commit a write

- Voice/explicit-confirm only on an actual **write** (creating/updating a
  context file, saving a decision). Confirming every read produces alarm
  fatigue and the user starts rubber-stamping.
- After a foundational change (mission, identity, key constraints) —
  regenerate any downstream rendered summary so other skills don't draft
  from stale state.

## Question-priority order (default; override per domain)

1. **Identity** — who/what is this about? Person, project, customer, product.
2. **Goals** — what does success look like? Concrete outcome, not vibes.
3. **Constraints** — budget, deadline, team, regulatory, "things I never
   delegate", "I refuse to use X".
4. **Context** — what's the current state, what's been tried, what's broken.
5. **Preferences** — voice, tone, format, level of risk.
6. **Examples** — show me one good / one bad / one disqualifying past
   instance.

## Output format (when ending the interview)

When you stop interviewing, summarize what you collected in a clearly-bounded
block so the user can correct it before you proceed:

```
## What I heard
- Identity: ...
- Goals: ...
- Constraints: ...
- Context: ...

## What I'm about to do
- ...

## Open questions (deferred)
- ...

Confirm and I'll proceed, or correct any line above.
```

## Domain-specialized variants

When the user's domain is well-defined, prefer the more specific cybos source
over this generic backbone:

- **Personal-context / onboarding / year-review** → see [B-021](https://www.cybos.ai/cases/B-021).
- **Intent extraction for an agent-driven business workflow** → see [B-198](https://www.cybos.ai/cases/B-198).
- **Phased re-audit of a long-running context corpus (≥6 months old)** → see [C-143](https://www.cybos.ai/cases/C-143).
- **Five-question MCQ kickoff before a coding/creative artefact** → see [A-025](https://www.cybos.ai/cases/A-025) Phase 0.

## Gotchas

- **Don't re-run as a firehose.** Annual re-interview fails if you re-ask
  everything; the user skips it. Always staleness-scan first.
- **Don't guess.** If the user's answer is ambiguous, re-ask one targeted
  follow-up before proceeding. Better one cycle of clarification than a
  produced output that misses the point.
- **Don't break role.** Once interviewing, stay in interview mode — don't
  half-answer the question yourself just to "help things along". The whole
  value is in the user's own tacit knowledge surfacing through the questions.
- **Security boundary for personal data.** If you're collecting personal
  context (decision heuristics, key relationships, things-I-never-delegate),
  keep it in the personal vault. Never copy to a team workspace.
