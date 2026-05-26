---
id: C-044
tier: C
category: "Infrastructure"
kind: pattern
title: "Embedded RAG-style chatbot over a consulting deliverable"
subtitle: "A static HTML deliverable can't answer follow-up questions. Embed an MD_CHUNKS array + chat widget; one-off becomes queryable."
source: https://www.cybos.ai/cases/C-044
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "M · Weeks"
for: "consultant · anyone shipping a one-off HTML deliverable"
type: case
version: v0.1
---
# Embedded RAG-style chatbot over a consulting deliverable

> A static HTML deliverable can't answer follow-up questions. Embed an MD_CHUNKS array + chat widget; one-off becomes queryable.

## What

A diagnostic dashboard ships its own RAG "ask anything" chatbot embedded directly in the HTML as `` + an MD_CHUNKS array (chunks of the source diagnostic markdown indexed for retrieval, plus a small chat UI overlay). Turns a static deliverable into a queryable artifact.
