---
id: C-054
tier: C
category: "Infrastructure"
kind: pattern
title: "Privacy / local-only data architecture"
subtitle: "\"Where does my CLI's data go?\" Single root directory; nothing uploaded;.gitignore blocks secrets. Revoke = rm -rf."
source: https://www.cybos.ai/cases/C-054
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "anyone shipping a CLI that touches user data"
type: case
version: v0.1
---
# Privacy / local-only data architecture

> "Where does my CLI's data go?" Single root directory; nothing uploaded;.gitignore blocks secrets. Revoke = rm -rf.

## What

Single root `OUTREACH_HOME` directory holds all sensitive artefacts; nothing uploaded anywhere; Telegram + Gmail read-only; `.gitignore` blocks sessions, OAuth tokens, data, xlsx. "Delete the directory to revoke." Privacy via a `rm -rf`.
