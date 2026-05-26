---
id: C-051
tier: C
category: "Infrastructure"
kind: tactic
title: "One-time GCP setup script for service-account writes"
subtitle: "Every team writes the same gcloud-auth-login → service-account → key-JSON installer three times. Ship the 15-minute script once."
source: https://www.cybos.ai/cases/C-051
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "any engineer integrating Google Sheets / Drive"
type: case
version: v0.1
---
# One-time GCP setup script for service-account writes

> Every team writes the same gcloud-auth-login → service-account → key-JSON installer three times. Ship the 15-minute script once.

## What

Walks the user through `gcloud auth login` → pick/create project → enable Sheets + Drive APIs → create service account → download key JSON `chmod 600` → print share-email. 5 minutes if `gcloud` already installed, 15 from a clean machine. The kind of installer most teams write three times before someone documents it.
