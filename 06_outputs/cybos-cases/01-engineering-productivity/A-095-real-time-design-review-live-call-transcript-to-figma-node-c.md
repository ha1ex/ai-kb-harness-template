---
id: A-095
tier: A
category: "Engineering productivity"
kind: workflow
title: "Real-time design review — live call transcript to Figma node comments"
subtitle: "Problem solved: Verbal design feedback given on a call is lost or hand-re-typed onto the canvas afterward; a background agent posts each comment onto the exact Figma node as you speak."
source: https://www.cybos.ai/cases/A-095
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · product lead · design reviewer"
type: case
version: v0.1
---
# Real-time design review — live call transcript to Figma node comments

> Problem solved: Verbal design feedback given on a call is lost or hand-re-typed onto the canvas afterward; a background agent posts each comment onto the exact Figma node as you speak.

## What

During a live design call, a background Claude Code `/loop` agent reads the meeting transcript in real time, classifies design comments, binds each to the specific Figma node you are clicking as you talk, and posts the comment — in your own words — directly onto that node. When the call ends the designer already has a mock-up marked up with your feedback, positioned at the exact components discussed. No post-call "please re-type your comments onto the canvas" chore, and nothing gets dropped.

## Why it matters

The standard loop is: discuss design on a call → call ends → designer asks you to transfer your comments to the canvas → you re-type them (or skip some, or the designer transcribes them and loses your exact wording, which for design feedback is often the decisive part). This collapses that loop to zero human steps after the call — feedback lands where the work actually happens, in your precise phrasing, while you simply talk and click. The signature property: the human did nothing extra and the result appeared.

## End-to-end

1. **Start the call recording with live transcription.** Use a meeting tool that transcribes in real time (e.g. Notion Meetings) so a running transcript exists as the call proceeds.
2. **Give the agent live access to the transcript.** Share the live meeting/transcript link with Claude Code so it ingests the conversation context as it goes, not after.
3. **Run a background `/loop` agent over the transcript.** It reads the transcript continuously rather than waiting for the call to end.
4. **Bind each comment to a node via your click.** As you speak about a component, you click that node in the shared Figma file. The click is the binding signal — the agent links the comment's context to that node's position.
5. **Post comments to Figma in your words.** The agent classifies design comments and posts them, under your name, as comments on the right node — preserving your exact phrasing.

## Prompts

The binding rule that makes it work — comment context is matched to the node under the cursor at the moment it is spoken:

```
`Watch the live meeting transcript. When I make a design comment, classify it,
then attach it as a Figma comment — in my exact words — to the node I am
clicking at the moment I say it. Post under my name. Run continuously until the
call ends.
`
```

## Gotchas

- **Hot off the press — still being tested.** Treat as a high-value pattern to pilot, not a hardened production workflow yet.
- **The click→node binding is the fragile part.** If clicks don't reliably map to the node under discussion, comments land in the wrong place; keep the cursor on the component you're talking about.
- **Transcript latency** can lag fast back-and-forth; the agent attaches on the comment it parsed, so very rapid topic switches can mis-bind.

<hr/>

## Tools

- Claude Code with `/loop` — the background agent loop
- A live-transcription meeting tool (Notion Meetings or equivalent) with a shareable real-time transcript
- Figma with comment access via MCP or the Figma API
- Screen-share of the Figma file so your clicks map to nodes
