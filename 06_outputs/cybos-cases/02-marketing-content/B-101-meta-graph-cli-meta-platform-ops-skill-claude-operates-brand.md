---
id: B-101
tier: B
category: "Marketing & content"
kind: skill
title: "meta-graph-cli + meta-platform-ops skill — Claude operates brand Instagram and Facebook"
subtitle: "Problem solved: SMB brand-social is a full-time job; a thin Python wrapper around the Meta Graph API plus a Claude Code skill lets agents handle routine posting, comment ops, and insights."
source: https://www.cybos.ai/cases/B-101
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "marketing lead · founder · agency operator"
type: case
version: v0.1
---
# meta-graph-cli + meta-platform-ops skill — Claude operates brand Instagram and Facebook

> Problem solved: SMB brand-social is a full-time job; a thin Python wrapper around the Meta Graph API plus a Claude Code skill lets agents handle routine posting, comment ops, and insights.

## What

Two-part stack: `meta-graph-cli` (a Python HTTP wrapper around Meta Graph API, MIT-licensed) and a paired Claude Code skill (`meta-platform-ops`). Together they let Claude post photos, videos, reels, carousels, and stories; read, reply, hide, and delete comments; pull insights; do hashtag search and business discovery. Supports both Facebook Login and Instagram Login (token-prefix detection).

## Why it matters

Brand social management at the SMB scale eats 10–20 hours a week of routine work — schedule posts, moderate comments, pull weekly engagement numbers, search hashtags. Skilled agent ops reduce that to review-and-approve. The MIT-licensed reference implementation is unusually concrete for marketing agentry; it ships with the skill alongside the CLI so prompts like "post this image with caption X" or "reply to every unanswered comment on the last reel" or "aggregate reach of the last 10 posts into a table" work out of the box.

## End-to-end

1. `pip install meta-graph-cli`
2. Authenticate against the Meta Graph API (Facebook or Instagram token; the CLI detects which).
3. `git clone https://github.com/crimeacs/meta-graph-cli`
4. Copy the bundled skill into Claude Code's skills directory: `cp -r meta-graph-cli/skills/meta-platform-ops ~/.claude/skills/`
5. Prompt Claude with brand-ops tasks ("post this with caption X", "answer all unanswered comments under the latest reel", "give me reach of the last 10 posts in a table").
6. Gate publish-side actions (post, reply, delete) behind human approval until you trust the agent on your brand voice.

## Prompts

```
`pip install meta-graph-cli
git clone https://github.com/crimeacs/meta-graph-cli
cp -r meta-graph-cli/skills/meta-platform-ops ~/.claude/skills/
`
```

## Gotchas

## Meta tokens expire and rate-limit silently; treat token refresh as a first-class agent skill rather than something the human notices when posts stop appearing. Also: never let an unsupervised agent run delete-comment in bulk — one prompt-injection in a hostile DM and you've moderated your own brand into the ground.

## Tools

- Python 3 + pip
- Claude Code with skills enabled
- Meta Graph API access token (Facebook Login or Instagram Login)
