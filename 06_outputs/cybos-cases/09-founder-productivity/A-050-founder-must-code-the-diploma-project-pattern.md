---
id: A-050
tier: A
category: "Founder productivity"
kind: tactic
title: "Founder must code — the diploma-project pattern"
subtitle: "\"Founders should code\" is rhetoric until someone ships a real internal system. 120 staff hours saved per event proves the thesis."
source: https://www.cybos.ai/cases/A-050
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "Founder personally — non-delegable. Optional: a junior coder / intern who executes the founder's evolving voice-specs once v3 is stable."
type: case
version: v0.1
---
# Founder must code — the diploma-project pattern

> "Founders should code" is rhetoric until someone ships a real internal system. 120 staff hours saved per event proves the thesis.

## What

A concrete operational system, end-to-end built by the founder in Claude Code, that proves the "founder-must-code" thesis with numbers rather than rhetoric. The reference instance: a Telegram-based event-booking system for a kids' education franchise that runs two large offline franchisee gatherings per year (tour-style multi-day events). Each franchisee, plus their staff and families, fills the whole booking by voice (surnames, birthdates, dietary preferences including vegetarians and kids' food, kids count, flight preferences, hotel preferences, transfer routes, master-class selection, excursion selection). The bot confirms by chat. The system orchestrates the trip.

The founder wrote it in 60 hours of code time + ~100 hours of voice-spec revisions, across **four full rewrites** (v1, v2, v3 all "fell apart in production"; v4 stuck). The internal IT team had quoted a minimum of 3 months for v1's original spec — by which point v1's spec was obsolete. The pattern is the case: a founder-built operational system as deployment-quality proof point for "the founder must code, even at enterprise scale."

## Why it matters

**Saves ~120 staff hours per event.** Twice-yearly events × 120 hours saved per event = ~240 staff hours/year on this one workflow. The founder's own time on the first event was greater than the hours saved that event — but the artefact compounds across every future event, every franchisee onboarded later, and every adjacent feature (the same chassis now handles franchisee tech support, course booking, and a sales-qualifier financial-model bot in the same Telegram surface).

The deeper claim — and the load-bearing one — is **spec evolution**. The v4 product is "so far from the initial spec that the dev team would never have built it." Voice-input for filling forms was discovered mid-build because the founder, sitting in Claude Code, hit the keyboard-on-mobile friction directly and asked the agent to add voice — a feature his IT team would have called "über-engineering" and refused. Specs do not survive contact with operational reality; only the operator running both roles ("the customer of the spec" and "the writer of the spec") can iterate fast enough for them to converge.

The complementary thesis (from the same operator across two cohort weeks): in a peer business club of large-scale founders, the recurring debate is "should the at-scale founder code or hire a specialist?" The answer, demonstrated by the diploma project: **categorically yes, the founder must code.** Even when the absolute hour-cost is higher than a developer's, the spec-evolution-rate is what determines whether v4 ever happens — and v1 through v3 never ship value.

## End-to-end

1. **Pick the right diploma project.** Three criteria, all required:

- **You are the customer.** You personally feel the pain monthly or more often. ("I'm the one drowning in the process" — the operator's own line.)
- **It is operationally serious.** Real money, real users, real consequences if it breaks. Not a personal dashboard.
- **It is something your existing IT team would push back on, or quote 3+ months for.** That's the diagnostic — if IT would happily build it in a sprint, it's a normal feature request, not a diploma project.

1. **Build v1 in Claude Code.** Sit down. Open the project folder. Speak the spec into the agent (voice → ChatGPT → Cmd-C → Cmd-V into terminal is fine; see ergonomics). Ship v1 to a small audience — ideally one real user (in the reference case: the founder himself, role-playing a franchisee). Use Opus on max-effort settings — the diploma project is not the time to economise on tokens.
2. **Expect v1 to be sloppy.** It will be. The operator's own assessment: "v1 was sloppy. v2 sloppy. v3 wrong direction. v4 unrecognisable from v1." Budget for 4 full rewrites. The friction is the discovery — every rewrite is a spec correction the founder made in real time that no external developer could have made.
3. **Voice-spec revisions, not written specs.** In the reference case, ~100 hours of voice-spec versus 60 hours of code. Speak the changes into the agent. The agent rewrites. Read what came out. Speak corrections. Repeat. Don't write a Confluence page; do not hold a kickoff meeting. The voice-spec is the spec — and it lives in the project's chat history + handoff files (see A-027 / handoff case).
4. **Use yourself as the user-test.** Don't recruit testers for v1–v3; you are the testing harness. The cost of asking your team to test v1 of an unstable system is higher than the cost of testing it yourself.
5. **Hire interns/students as executors once v3 is stable.** The pattern after the v3 → v4 transition: hire junior coders who can take a voice-spec from the founder and translate it into Claude Code prompts. They have coding fluency but no product vision; the founder keeps both seats (customer + spec-author). This scales the build-rate after the founder has done the hard part (the first 3 rewrites where the spec was wrong).
6. **Pair the build with operational re-instrumentation.** As the system stabilises, every prior workflow that touched the same problem (in the reference case: travel-booking spreadsheets shared among 2–3 staff members) gets retired. The hours saved show up as a real headcount-or-headroom decision within one event cycle.
7. **Once v4 stabilises, productise carefully.** Same chassis, adjacent features. The reference operator extended the booking system into a sales pre-qualifier (deep-Q&A on franchise financial models) and tech-support entry-point on the same surface within months. Adjacent features benefit from all the spec-evolution already paid for.

## Prompts

Voice-spec-friendly kickoff (paste into the agent at v1 start):

```
`I want to build a chat bot for franchisee event booking.

Two large offline events per year, tour-style. Each franchisee plus 1-3
staff plus 1-3 family members. They book: flights, hotel choice, room
type, transfers airport↔hotel, dietary preferences (incl. kids' food,
vegetarians), kids' count + ages, master-class selection (4 options),
excursion selection (3 options).

Stack: Python + a chat-bot framework. SQLite for now. No Docker.
Whisper transcription for voice input fields.

Build v1 as a minimal happy path: one franchisee, one event, all the
fields filled by chat. Do NOT add voice input yet — we'll do that in v2
once the flow is clear. Do NOT integrate flights/hotels APIs yet — for
v1 store the user's choices, that's it.

Plan-mode first. Show me the conversation flow as a Mermaid diagram
before writing code.
`
```

Spec-evolution prompt mid-build (voice-transcribed, pasted in):

```
`The franchisee on his phone can't type long location names twice — too easy
to mistype. Add voice input for any free-text field. Use Whisper. After
transcription, show the candidate text in chat with "yes / fix" buttons.
If "fix", let them re-record. Don't auto-correct silently.

Also: the kids' food selection is wrong — vegetarians can have kids who
are not vegetarians. Split into per-person dietary preferences, with
kids inheriting parent's default that they can override.
`
```

End-of-rewrite gate (paste before considering v(N+1) done):

```
`Before we call this v4, run the full happy path end-to-end on a fake
franchisee with: 2 staff, 1 child (age 7), vegetarian mother, regular
father, kid wants kids' food. Trace every confirmation message. Output
the database state at every step.

Then list every promise we made in the v3 handoff doc that v4 actually
fulfils. List every one that's still open. Don't ship yet.
`
```

## Gotchas

- **Budget for 3–4 full rewrites.** The "wow → frustrations → v2 → v3 → v4" arc is the case, not a side effect. Operators who try to "get v1 right" stall at v1. Pick a branch when v3 looks promising and drill down; resist the urge to fork sideways.
- **Don't hand the spec to the dev team mid-build.** It is unfinished by design. The spec is the build. The dev team can take v4 and harden it; nothing earlier.
- **Don't run this on a side project.** The "I am the customer" condition is what makes the spec evolution converge — without operational stakes, the rewrites are unmotivated and v4 never arrives.
- **One-event ROI is negative.** One operator honestly states: "on one event I didn't save money — my hours cost more than staff hours." Multiple events make it net positive. If the workflow only fires once, this is the wrong project — pick something recurring.
- **Spec-rewriting is the moat.** The operator's IT team would have shipped v1's original spec in 3 months — and v1's spec is wrong. The compound-vs-select tradeoff applies: you can only do this depth on 1–3 processes given finite time. Pick the one where deep beats wide.
- **Vendor lock-in risk is real but deferred.** The reference operator notes a planned migration to self-hosted local LLMs to escape vendor-side limit reductions; not yet started. Don't optimise for portability before v4 stabilises.

## Variations

- **Lighter (3-hour proof-of-concept):** pick one screen of the booking flow — say, "kids' food selection" — and build only that, end-to-end, in 3 hours. Show the founder of a similar-stage company. The "wait, that's it?" reaction is the win.
- **Heavier (productised diploma project):** same chassis, adjacent features added — sales pre-qualifier, tech support entry, franchisee onboarding skill. Within ~6 months the chat surface becomes the franchise's primary operating interface. The diploma project was a stepping stone, not the destination.
- **For B2B SaaS founders:** the diploma project is a customer-onboarding flow, not an event booking. Same constraints: founder is the customer (you watched onboarding fail), IT team would push back, operational stakes are real.
- **For regulated industries:** if the project touches kid-facing content under data residency regulation, regulatory rules force specific LLM/data-storage choices (a local LLM is the standard answer for kids' content compliance in some jurisdictions). Plan for it in v1; do not let v4 stabilise on a stack you'll have to migrate off.

## Tools

- Claude Code on Opus (the reference operator used the $200/mo plan, max-effort on every tab — see the counter-stance case on token economy)
- A chat-bot API (for the reference instance — replace with whatever surface your customers actually live in)
- Whisper or equivalent for voice input (the cheap win that made v4 work)
- A real operational problem that your IT team would refuse or under-scope
- A founder calendar with ~60 hours over ~2–4 weeks blocked for build + spec time
- Optional after v3: a junior coder / intern who can execute voice-specs without product input
