---
id: C-121
tier: C
category: "Infrastructure"
kind: tactic
title: "Railway as managed catalog for vibecoded side-projects"
subtitle: "Problem solved: a single operator accumulates dozens of small AI-built services and loses track of what's running where."
source: https://www.cybos.ai/cases/C-121
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
type: case
version: v0.1
---
# Railway as managed catalog for vibecoded side-projects

> Problem solved: a single operator accumulates dozens of small AI-built services and loses track of what's running where.

## What

Pin all hobby/vibecoded services to a single Railway account; hand Claude the Railway API key; ask the agent for inventory and inactivity reports ("what's running here", "when was this last logged into"). Cautionary anecdote in source: an operator had a server named "sandbox-3" that was actually hosting a paid course — found out only when a customer reported the site broken.
