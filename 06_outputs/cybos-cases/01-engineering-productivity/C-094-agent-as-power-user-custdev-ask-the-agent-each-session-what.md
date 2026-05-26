---
id: C-094
tier: C
category: "Engineering productivity"
kind: tactic
title: "Agent-as-power-user CustDev — ask the agent each session what to improve about your tools"
subtitle: "Problem solved: Internal MCPs, CLIs, and skills accumulate friction that human users never report because the friction shows up at agent-tool-call boundaries the human never sees."
source: https://www.cybos.ai/cases/C-094
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "PM / DX engineer / anyone shipping internal MCPs · CLIs · or skills"
type: case
version: v0.1
---
# Agent-as-power-user CustDev — ask the agent each session what to improve about your tools

> Problem solved: Internal MCPs, CLIs, and skills accumulate friction that human users never report because the friction shows up at agent-tool-call boundaries the human never sees.

## What

At the end of every session where an agent used your custom tooling, prompt: *"Describe what you would improve about the tools you used. What was confusing / slow / missing?"* Treat the agent as a power-user customer doing CustDev on your internal platform. One operator running a vibe-code platform uses this as a continuous roadmap input. Noise rate is real — ~50% of suggestions need glasses-on human curation before becoming work.
