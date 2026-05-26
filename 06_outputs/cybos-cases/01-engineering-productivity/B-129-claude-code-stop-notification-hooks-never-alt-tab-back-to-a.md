---
id: B-129
tier: B
category: "Engineering productivity"
kind: pattern
title: "Claude Code Stop / Notification hooks — never alt-tab back to a frozen CC again"
subtitle: "Problem solved: Claude Code stalls silently mid-task waiting for a permission prompt; users lose minutes per context switch checking on it; native macOS notifications fire the moment CC needs attention."
source: https://www.cybos.ai/cases/B-129
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · engineer"
type: case
version: v0.1
---
# Claude Code Stop / Notification hooks — never alt-tab back to a frozen CC again

> Problem solved: Claude Code stalls silently mid-task waiting for a permission prompt; users lose minutes per context switch checking on it; native macOS notifications fire the moment CC needs attention.

## What

Configure Claude Code's `Stop` and `Notification` hooks in `~/.claude/settings.json` to shell out to `osascript` (or a TTS script, Hammerspoon, Starcraft sound effects — pick your aesthetic) whenever CC finishes a task or asks for input. Result: you alt-tab away to other work and get a native banner the second CC needs you back, instead of discovering 8 minutes later that it was idle the whole time.

## Why it matters

The default failure mode for heavy CC users is to launch a long task, switch tabs, and come back 20 minutes later to find CC stuck on a permission prompt at minute 2. Hooks reclaim those minutes per task — directly proportional to how many parallel CC sessions you run.

## End-to-end

1. Open `~/.claude/settings.json` (or create it). Add hooks for `Stop` and `Notification` that shell out to `osascript -e 'display notification "..."'` with the message and the project path.
2. Optionally make the notification clickable — deep-link to the project folder so a click takes you back to the right terminal/tab.
3. Pick a variant that fits how you work: native macOS notifications (default), TTS via `claude-code-tts` so you can hear which agent finished while looking elsewhere, Hammerspoon corner-of-screen notifications (less intrusive than TTS), or Starcraft sound effects (memorable per-event sounds for parallel sessions).
4. Reference recipe: search for current community write-ups on Claude Code hooks for macOS notifications — for the exact JSON shape.
5. Test by running a CC command that prompts for permission; confirm the notification fires.
6. Stack with an outer-loop "promise tag" pattern (Stop hook re-prompts CC until output contains a `<promise>COMPLETE</promise>` sentinel) if you want CC to grind on long tasks without supervision.

## Gotchas

- The Claude Code VSCode extension doesn't fire the hooks reliably as of late 2025 (anthropics/claude-code issue #11156). Run CC in terminal — the same hooks work, the notifications fire, and multiple operators independently report this as one more reason to switch back to the terminal.

<hr/>

## Tools

- macOS + Claude Code CLI in terminal (not the VSCode extension — known bug, GitHub issue 11156)
- `osascript` (built into macOS), or Hammerspoon / a TTS CLI for the variants
