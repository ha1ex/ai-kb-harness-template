---
id: C-004
tier: C
category: "Sales & outbound"
kind: pattern
title: "Twitter → LinkedIn matching via LLM disambiguation over Harmonic"
subtitle: "Same X handle matches three Harmonic profiles. Two-call disambiguation grounded in the returned candidate IDs stops the model inventing a name."
source: https://www.cybos.ai/cases/C-004
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "M · Weeks"
for: "sourcing engineer"
type: case
version: v0.1
---
# Twitter → LinkedIn matching via LLM disambiguation over Harmonic

> Same X handle matches three Harmonic profiles. Two-call disambiguation grounded in the returned candidate IDs stops the model inventing a name.

## What

Given an X handle, a Haiku call extracts company signals, fetches a candidate set from Harmonic, and a second Haiku call disambiguates the correct (company, person) pair — but only against the actual returned candidate IDs, which prevents the second call from hallucinating a name not in the set.
