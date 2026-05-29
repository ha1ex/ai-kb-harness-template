---
id: B-011
tier: B
category: "Marketing & content"
kind: workflow
title: "Blog pipeline as an agent production line (state in GitHub Issue comments)"
subtitle: "Multi-step content pipelines lose state between sessions. Issue comments are the state machine; any agent resumes any step."
source: https://www.cybos.ai/cases/B-011
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "L · Quarter"
for: "Content lead · founder running a personal-brand pipeline · marketing engineer"
type: case
version: v0.1
---
# Blog pipeline as an agent production line (state in GitHub Issue comments)

> Multi-step content pipelines lose state between sessions. Issue comments are the state machine; any agent resumes any step.

## What

A multi-stage agent pipeline for writing public blog posts: Research → Questions → Writing → Critique → Draft → Deploy. State persists as comments on a single GitHub Issue per article; each stage's agent appends a comment with its output and a step number. The next stage's agent picks up from the latest comment. The shipped artifact is a public blog with ~3K visitors/month.

## Why it matters

"Agents forget" is the universal failure mode of multi-step content pipelines. Treating a GitHub Issue as the durable memory makes the pipeline observable (the Issue is the audit trail), restartable (any stage can re-read all prior comments), and human-pausable (a human can append guidance at any step).

## End-to-end

1. Define the pipeline skeleton as JSON: list of stages, expected inputs/outputs per stage, agent prompt path per stage.
2. Trigger: when a lecture transcript hits the inbox folder (or any source event), open a new GitHub Issue with the topic in the title.
3. Stage 1 (Research): agent reads the trigger context, runs web research, appends a comment with findings and `step: research`.
4. Stage 2 (Questions): agent reads all prior comments, drafts clarifying questions, appends.
5. Stages 3–5 (Writing, Critique, Draft): same pattern. Each agent reads everything below it.
6. Stage 6 (Deploy): publish to the public blog, append the live URL as the final comment, close the Issue.
7. Each agent's instructions explicitly say: "read every prior comment, then append yours — do not rely on conversation memory."

## Gotchas

- Don't let agents edit prior comments. Append-only is what makes the audit trail trustworthy; once edits are allowed, an LLM will silently rewrite a step-2 finding to match a step-4 conclusion.

## Tools

- GitHub repo + Issues with API access
- Claude Code / Codex agents per stage (one prompt file per stage)
- A simple orchestrator (cron or webhook) that picks up new Issues and advances them
