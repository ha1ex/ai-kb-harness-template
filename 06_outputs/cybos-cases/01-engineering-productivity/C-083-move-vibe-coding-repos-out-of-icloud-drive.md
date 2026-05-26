---
id: C-083
tier: C
category: "Engineering productivity"
kind: tactic
title: "Move vibe-coding repos out of iCloud Drive"
subtitle: "Problem solved: High-velocity agent-driven coding produces file changes faster than iCloud can sync; stale files get pushed to git and break the working tree."
source: https://www.cybos.ai/cases/C-083
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "any Mac operator running parallel agents"
type: case
version: v0.1
---
# Move vibe-coding repos out of iCloud Drive

> Problem solved: High-velocity agent-driven coding produces file changes faster than iCloud can sync; stale files get pushed to git and break the working tree.

## What

Move every vibe-coding repo out of `~/Library/Mobile Documents/...` into a plain local folder before turning agents loose. Operator hit this after iCloud desynced an in-flight session and committed yesterday's version of a file.
