---
id: A-047
tier: A
category: "Infrastructure"
kind: tactic
title: "Personal AI ergonomics — Wispr Flow, Raycast micro-shortcuts, voice-driven install, path-copy"
subtitle: "Typing prompts is the throttle on adoption. Voice (150 wpm vs 40), one-key launcher, voice-install — under $30/mo total."
source: https://www.cybos.ai/cases/A-047
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "Every employee. Especially founders · engineers · content people."
type: case
version: v0.1
---
# Personal AI ergonomics — Wispr Flow, Raycast micro-shortcuts, voice-driven install, path-copy

> Typing prompts is the throttle on adoption. Voice (150 wpm vs 40), one-key launcher, voice-install — under $30/mo total.

## What

A bundle of four micro-ergonomic upgrades that collectively make AI feel like a typing speed multiplier rather than a context-switch. (1) **Wispr Flow** for voice-to-prompt anywhere on the OS — hold a hotkey, speak, release, cleaned text appears in whatever input is focused. (2) **Raycast** as the launcher replacing Spotlight, with custom extensions for "open in Cursor / Obsidian / Claude Code" plus a path-copy extension. (3) **Voice-driven install** — instead of reading docs, say to your agent "install [tool], wire it to my naming conventions, don't conflict with [existing tools]"; agent does it. (4) **Cmd-Shift-P path-copy** — system-wide shortcut that copies the path of the currently-focused file in Finder / browser tab / Obsidian doc and writes it to clipboard, ready to paste into a prompt. Adoption theorem: **"if AI is more than one click away, it dies."**

## Why it matters

Multiple founders across the source corpus cite these four as the single biggest "small thing I picked up". Quantitatively: voice input runs ~150 wpm vs ~40 wpm typed; a 5-minute spoken context-dump produces a 750-word prompt versus 200-word typed. Across a team, this is the difference between "I sometimes write a careful prompt" and "I use the agent every five minutes". Total install cost: under one hour and ~$15/mo per seat. The adoption gain matters more than the productivity gain — it's what makes the rest of this playbook actually run.

## End-to-end

1. **Wispr Flow** — install from `https://wisprflow.ai/`. Pay for the personal plan (~$12/mo at time of writing). Bind a global hotkey you can hold easily — `Fn` on macOS is the workshop-host's choice. Test: hold `Fn`, talk for 10 seconds about something you'd type, release; cleaned text appears in any focused input — Cursor, Telegram, Slack, email. Adjust to your accent in settings.
2. **Raycast** — install from `https://raycast.com/`. Set as Spotlight replacement (System Settings → Keyboard → Shortcuts → Spotlight → disable; bind Raycast to Cmd-Space). Install extensions: "Open in Cursor", "Open in Obsidian", "Visual Studio Code", "Claude AI" (community extension). Search for "claude code sessions" — a community extension lists your local Claude Code sessions for quick re-open.
3. **Path-copy custom shortcut** — bind Cmd-Shift-P system-wide via Raycast (or BetterTouchTool). The script:

- in Finder: copy path of selected file.
- in browser: copy URL of active tab.
- in Obsidian: copy the vault-relative path of the active note plus the active heading anchor.
Then any prompt is one keystroke away from "here's the file I'm talking about, attached as `@<path>`".

1. **Voice-driven install pattern** — once Wispr Flow is set, the next tool you add is dictated, not clicked. Sample dictation:

```
`I want to install Char for live transcription. Use my.env for keys.
Make sure it doesn't conflict with Granola which I have already running.
Save transcripts to ~/notes/transcripts/ following my naming convention.
Skip the GUI setup wizard if possible.
`
```

Your agent (Claude Code or Cursor with shell access) will brew install / npm install / curl / configure / write the right env vars / move the file landing.

5. **Finder toolbar shortcut "Open in Claude"** — right-click Finder toolbar → Customise Toolbar → drag in "New Terminal at Folder". Pair with a small wrapper script `~/bin/open-claude` that launches Warp/iTerm at the current directory and runs `claude` automatically.

6. **macOS Text Replacement** — System Settings → Keyboard → Text Replacement. Map: `ddate` → today's ISO date, `tt` → `transcript`, `myemail` → your email, `vault` → `~/notes/`, `claude` → `claude --model opus`. The workshop host calls these "the single biggest productivity upgrade if you don't already use them."

7. **Roll-out across the team** — Don't just send people a link. Run a 30-minute workshop. Walk through each of the four. Adoption follows demo. Without a session, the average uptake is <20% in the first month; with a session, it's >70%.

## Prompts

Wispr Flow install (homebrew on macOS):

```
`brew install --cask wispr-flow
`
```

## Gotchas

- **Don't roll out without a live demo.** People genuinely cannot picture "voice prompt anywhere". A 30-minute live session converts at >70%; a link converts at <20%.
- **Don't use the OS dictation built-in.** Apple's built-in dictation is markedly worse than Wispr Flow on accents and on punctuation. The $12/mo is the highest-leverage subscription in this playbook per seat.
- **Don't use Cmd-Shift-P if you have IDE conflict.** It collides with VS Code's command palette by default. Pick a free chord (Cmd-Ctrl-P, Cmd-Shift-Y, etc.) if you live in VS Code/Cursor.
- **Don't dictate sensitive PII.** Wispr Flow uploads audio to its cloud. For HIPAA / privileged-attorney work, use a local Whisper variant.
- **Don't skip Text Replacement.** It is the single most under-used built-in feature on macOS. Two weeks in, you'll wonder how you typed `transcript` letter by letter before.

## Variations

- **Linux variant:** `whisper.cpp` running locally with a hotkey daemon (`xdotool` or `wtype`), `rofi` or `wofi` as the launcher.
- **Heavier (full keyboard-driven OS):** add a tiling window manager (Yabai on macOS, Hyprland on Linux), BetterTouchTool for trackpad gestures (two-finger swipe to switch desktop, three-finger pinch to snap window), Stream Deck for 9 physical hotkeys mapped to your top entities.
- **Phone variant:** the founder's mobile equivalent is the mobile Telegram-bridge case below — voice → Whisper transcription → Telegram message → Claude Code working in your repo.
- **Team standard:** publish a one-page "your laptop on day 1" install doc that's just these four items plus `team-hr` and `vibe-coding` skill installs. New hires are productive on day 1.
- **Realistic voice-bot workaround variant.** When Wispr Flow / SuperWhisper isn't available or isn't installed yet: use the standard ChatGPT (or Claude) voice-input on phone with a global hotkey to copy the last bot output, then Cmd-V into the terminal where Claude Code is running. Crude but works on day 1 with no install. A cosmetics co-owner ran this pattern as his bridge while waiting for proper ergonomics tooling. Demote as the proper voice tooling lands.

## Tools

- macOS (most of the corpus is Mac; Linux equivalents exist — `whisper.cpp` + `wofi` / `rofi` cover the same surface).
- Wispr Flow subscription (~$12–15/mo) — `https://wisprflow.ai/`.
- Raycast — `https://raycast.com/` (free tier sufficient).
- Optional: BetterTouchTool (~$10 one-time) for trackpad gestures and richer keybinds.
- Optional: Stream Deck for 9-button physical shortcut mapping if you really lean into snippets.
