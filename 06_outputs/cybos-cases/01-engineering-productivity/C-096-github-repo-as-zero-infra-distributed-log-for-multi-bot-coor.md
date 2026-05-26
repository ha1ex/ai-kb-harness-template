---
id: C-096
tier: C
category: "Engineering productivity"
kind: pattern
title: "GitHub repo as zero-infra distributed log for multi-bot coordination"
subtitle: "Problem solved: Two bots added to the same Telegram group can't see each other's messages through the Telegram API; without a coordination layer they talk past each other forever."
source: https://www.cybos.ai/cases/C-096
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
for: "operator running multiple personal agents in shared chat surfaces"
type: case
version: v0.1
---
# GitHub repo as zero-infra distributed log for multi-bot coordination

> Problem solved: Two bots added to the same Telegram group can't see each other's messages through the Telegram API; without a coordination layer they talk past each other forever.

## What

Shared GitHub repo acts as the distributed event log. Each group maps to a `chats/<group_id>/chat.md` file; before replying a bot does `git pull` to read full context (including peer-bot messages), then appends its reply and `git push`. Onboarding new bots is one-message — drop the SSH deploy key in the group and the bot self-installs via `curl | bash`. Zero server infrastructure; GitHub becomes the free, audit-logged transport.
