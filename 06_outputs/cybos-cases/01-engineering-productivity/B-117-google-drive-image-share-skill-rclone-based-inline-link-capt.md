---
id: B-117
tier: B
category: "Engineering productivity"
kind: skill
title: "Google Drive image-share skill — rclone-based inline-link captures"
subtitle: "Problem solved: Read-tool inline thumbnails are illegible at chat resolution; a Claude Code skill uploads PNG/MP4 artifacts to Google Drive via rclone and pastes a lh3.googleusercontent.com link that renders inline in the chat."
source: https://www.cybos.ai/cases/B-117
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "engineer · founder · anyone running Claude Code in a devcontainer or remote SSH"
type: case
version: v0.1
---
# Google Drive image-share skill — rclone-based inline-link captures

> Problem solved: Read-tool inline thumbnails are illegible at chat resolution; a Claude Code skill uploads PNG/MP4 artifacts to Google Drive via rclone and pastes a lh3.googleusercontent.com link that renders inline in the chat.

## What

A Claude Code skill, triggered whenever the agent or user wants to share a visual artifact (screenshot, screencast, MCP capture), runs `rclone copy` to a configured Google Drive folder, fetches the file's share link, transforms the Drive URL into the `lh3.googleusercontent.com/d/{FILE_ID}` form that renders inline in chat clients, and pastes that URL in the response.

## Why it matters

Solves the "I'm Claude-Coding from my phone over SSH" workflow — the operator never has to leave the chat client to see what the agent is looking at. End-to-end test artifacts (Playwright screencasts, archive runs) appear as clickable previews instead of unreadable Read-tool dumps.

## End-to-end

1. Install rclone in the devcontainer / VPS / Mac mini where Claude Code runs.
2. Run `rclone config` once; authorize a Google Drive remote (cache the OAuth token in a bind-mounted config dir so it survives container rebuilds).
3. Create a target Drive folder (e.g. `Screenshots/`).
4. Drop the verbatim SKILL.md below into `~/.claude/skills/share-screenshot/` (or your project skills dir).
5. Adapt three paths: the rclone config location, the Drive folder name, and any host-side SCP source if you mirror in artifacts from a separate machine.
6. Test once: ask Claude to "show me the screenshot at /tmp/foo.png" — it should upload and reply with a single `lh3.googleusercontent.com/d/...` URL that the chat client renders inline.

## Prompts

Verbatim SKILL.md (trimmed to the operational core):

```
`---
description: Upload a local screenshot/screencast to Google Drive and return a clickable link the user can open. Use whenever the user asks to see an image/video that lives outside the conversation (test archives on host, MCP captures, run artifacts). Read-tool inline thumbnails are illegible at chat resolution — always upload + share a link instead.
---

# Share Screenshot / Screencast

## Workflow

1. Stage the file inside the devcontainer.
 - If devcontainer-side: use the path as-is.
 - If host-side: scp dt@host.docker.internal:/path/to/file.png /tmp/$(basename file.png). Don't keep the SCP'd copy after upload — /tmp is volatile.

2. Upload to Drive.
 - Config: /workspace/.claude-config/dev/rclone/rclone.conf. Remote name: gdrive. Target folder: Screenshots/.
 - rclone --config.../rclone.conf copy /tmp/file.png "gdrive:Screenshots/".
 - Bulk: pass a directory to copy. Don't sync — destructive on the remote folder.

3. Get the public link.
 - rclone --config.../rclone.conf link "gdrive:Screenshots/file.png" → returns https://drive.google.com/open?id={FILE_ID}.
 - Extract {FILE_ID}.

4. Transform to the renderable form.
 - Images: https://lh3.googleusercontent.com/d/{FILE_ID} (NOT uc?export=view).
 - Videos / non-images: leave as https://drive.google.com/open?id={FILE_ID} — lh3 only serves images.

5. Paste in chat. Single image: just the lh3 URL on its own line with a one-line caption. Screencast: drive.google.com link with a "video" tag in caption.
`
```

## Gotchas

## `rclone link` on a folder returns a folder-share URL, not a file URL — the `lh3` transform will not work. Always link the individual file. Three other landmines from production: filename collisions silently keep both copies with different IDs (rename with a timestamp before re-upload); spaces in target folder names must be quoted in shell; if the filename contains a PHI marker (`.PHI.`), do not upload to a shared folder — redact + rename, or ask the user where it should go first.

## Tools

- rclone with a Google Drive remote configured.
- Claude Code with skills support; bind-mounted config dir if you run in a devcontainer.
- A Drive folder you own (or a shared folder you have write access to).
