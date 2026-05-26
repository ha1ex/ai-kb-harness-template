---
id: C-087
tier: C
category: "Engineering productivity"
kind: tactic
title: "Audit suspicious \"100% on benchmark\" AI products with Claude Code"
subtitle: "Problem solved: Viral AI products often inflate benchmark claims; before trusting one, point an agent at the source code and ask it to surface benchmark manipulation, eval cheating, or hardcoded answers."
source: https://www.cybos.ai/cases/C-087
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "anyone evaluating AI tools / integrations before adopting"
type: case
version: v0.1
---
# Audit suspicious "100% on benchmark" AI products with Claude Code

> Problem solved: Viral AI products often inflate benchmark claims; before trusting one, point an agent at the source code and ask it to surface benchmark manipulation, eval cheating, or hardcoded answers.

## What

Clone the repo and prompt Claude Code: *"find anything that's actually benchmark manipulation, eval cheating, hardcoded answers, or marketing hype not backed by code."* One operator did exactly this on a viral "100% on memory bench" repo and published the manipulation findings publicly. Companion check for vendor-API claims: GitHub-search `<product-name> api`, filter by stars and last-commit; if only <30-star repos exist, the vendor doesn't actually have a usable API.
