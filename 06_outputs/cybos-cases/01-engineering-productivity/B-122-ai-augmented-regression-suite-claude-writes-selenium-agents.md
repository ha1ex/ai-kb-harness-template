---
id: B-122
tier: B
category: "Engineering productivity"
kind: workflow
title: "AI-augmented regression suite — Claude writes Selenium, agents validate output"
subtitle: "Problem solved: Hand-written regression tests rot faster than dev velocity allows; letting an agent walk the UI live each release is brittle; the middle path is agent-authored deterministic tests plus agent-driven output validators."
source: https://www.cybos.ai/cases/B-122
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "engineer · QA lead"
type: case
version: v0.1
---
# AI-augmented regression suite — Claude writes Selenium, agents validate output

> Problem solved: Hand-written regression tests rot faster than dev velocity allows; letting an agent walk the UI live each release is brittle; the middle path is agent-authored deterministic tests plus agent-driven output validators.

## What

Two-track regression for AI-heavy products. (1) For codified user journeys, have Claude generate Selenium tests from the live site and re-author them per release — the test code is cheap to regenerate, so let it rot and rebuild. (2) For non-deterministic outputs (chat replies, generated images, voice responses), add a validator agent that checks each output against a rubric, plus simulated-conversation corpora for voice. Don't have Claude itself click through the UI per release — that's the anti-pattern.

## Why it matters

Stable QA without paying for a brittle Playwright test suite that needs constant babysitting. Lets a small team keep regression coverage growing in lockstep with feature velocity.

## End-to-end

1. With Claude, describe the user personas and draft user journeys from the live site.
2. Validate the journeys with a human; document test cases and expected behaviors.
3. For stable journeys, have Claude write Selenium tests. Run them in CI per release. When the UI shifts, regenerate the tests rather than patch them.
4. For non-deterministic outputs, build a validator-agent prompt scoring each output against a rubric (matches expected tool calls, schema, tone, factuality vs. ground truth).
5. For voice-AI: build a simulated-conversation corpus with ElevenLabs simulate-conversations or equivalent; replay against your agent each release; score with the validator agent.
6. For image-ad outputs: a self-check agent inspects each generated asset for off-brand or off-spec failures before promotion to live.

## Gotchas

- Don't ship "Claude clicks the UI live every release" as your regression strategy. It looks magical in a demo and breaks in week 3 when a button moves. Stable journeys belong in deterministic test code; let Claude rewrite the test, not run the test.

<hr/>

## Tools

- Claude Code, Chrome MCP or browser-use, Selenium
- ElevenLabs simulate-conversations (voice corpus), Retell.ai if evaluating that platform
- A rubric for each non-deterministic surface (chat, voice, image)
