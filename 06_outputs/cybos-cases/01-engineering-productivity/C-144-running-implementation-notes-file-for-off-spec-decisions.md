---
id: C-144
tier: C
category: "Engineering productivity"
kind: tactic
title: "Running implementation-notes file for off-spec decisions"
subtitle: "Problem solved: Coding agents make silent judgment calls implementing a spec; a running notes file surfaces every off-spec decision so you review the log, not the whole diff."
source: https://www.cybos.ai/cases/C-144
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
type: case
version: v0.1
---
# Running implementation-notes file for off-spec decisions

> Problem solved: Coding agents make silent judgment calls implementing a spec; a running notes file surfaces every off-spec decision so you review the log, not the whole diff.

## What

A one-prompt tactic: when handing a spec to a coding agent, tell it to keep a running `implementation-notes` file (HTML or markdown) logging decisions it made that weren't in the spec, things it had to change, tradeoffs, and anything else you should know. Review the notes file instead of re-reading the diff to catch scope drift and surprises early.
