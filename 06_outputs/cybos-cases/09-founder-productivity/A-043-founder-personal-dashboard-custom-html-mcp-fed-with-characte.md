---
id: A-043
tier: A
category: "Founder productivity"
kind: workflow
title: "Founder personal dashboard — custom HTML, MCP-fed, with character variants"
subtitle: "Morning standups mean opening 8 apps. One screen shows calendar + inbox + tasks + transcripts + sessions."
source: https://www.cybos.ai/cases/A-043
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "Founder · later · each team member builds their own variant"
type: case
version: v0.1
---
# Founder personal dashboard — custom HTML, MCP-fed, with character variants

> Morning standups mean opening 8 apps. One screen shows calendar + inbox + tasks + transcripts + sessions.

## What

A single-screen HTML dashboard the founder opens every morning. It aggregates: today's calendar, Telegram/Slack inbox (live or recently fetched), Linear/task-tracker open items, latest call transcripts from the last 24 hours, current Claude Code sessions, an attention budget (Pomodoro / focus blocks), and — optionally — a small animated tamagotchi-style character figure that surfaces reminders ("you have a partnership call in 12 minutes", "you haven't processed yesterday's transcript"). All data comes from MCP connectors and the local vault; the dashboard itself is a vibe-coded HTML file that gets rebuilt or refreshed via a single skill.

## Why it matters

It is the founder's first daily ritual that is *not* a list. Lists scale linearly with how many systems you have; this dashboard collapses all of them into one screen. Reported effects across multiple builders: morning standup compressed from ~30 min of system-hopping to ~5 min of single-screen review; team members who built their own variant report higher follow-through on "small tasks that fall through the cracks." Engagement is materially higher than tables-of-tasks dashboards — the character makes people open it.

## End-to-end

1. **Decide your "five panels"** — the canonical set is: (a) today's calendar with attendees, (b) recent inbox aggregation (Telegram saved-messages + last 10 work-DM threads), (c) open Linear/GitHub items grouped by project, (d) yesterday's call transcripts with one-paragraph summaries and unanswered tasks, (e) Claude Code sessions sorted by last-touched. Add or remove panels later; do not start with eight.
2. **Wire the MCPs once.** Telegram MCP (read saved messages + selected chats), Google/Apple Calendar MCP, Linear or GitHub Issues MCP, file-watcher over the transcripts folder, Claude Code session JSON file watcher. The MCPs return JSON; the dashboard reads JSON files written by a scheduled scraper script, not direct live calls — this makes the dashboard work offline.
3. **Generate the first HTML in one prompt.** Use the vibe-coding kickoff: "Build me a single-page dashboard with five panels [list]. Read data from `~/Dashboards/data/*.json`. Use Tailwind via CDN, shadcn-style cards, neutral palette, en dash separator in headers. No build step — single file. Include a `last_refreshed` timestamp."
4. **Schedule the data fetch.** A cron or `launchd` job runs every 5–10 minutes: each MCP scraper writes its panel's JSON to `~/Dashboards/data/<panel>.json`. Dashboard polls those files every 30s and re-renders.
5. **Add the character (optional).** Vibe-code a small SVG sprite or canvas animation that reacts to dashboard state: green idle, yellow when a meeting is <15 min away, red when an unprocessed transcript is >24h old. The character is what makes the team adopt the pattern.
6. **Share as a skill, not as code.** Package the prompt + data-fetcher scripts + dashboard template into a Claude Code skill named `personal-dashboard`. Anyone on the team can run `/personal-dashboard init` and get their own variant in one prompt — different panels, different character, different colour scheme. Federation, not template enforcement.
7. **Iterate via voice.** "Add a panel showing unread Granola summaries from this morning"; "make the character snarkier when I have >5 calls today"; "swap the calendar panel for a heat-map of the week." Every iteration is one prompt against the existing HTML.

## Prompts

Dashboard generator prompt (run once, then iterate):

```
`Build a single-file dashboard at ~/Dashboards/index.html.

Panels (left to right, top to bottom):
1. Today — calendar events for today with attendee names; highlight next event.
2. Inbox — top 10 threads from ~/Dashboards/data/telegram.json; one line each.
3. Open work — Linear issues grouped by project from ~/Dashboards/data/linear.json.
4. Yesterday's calls — one card per transcript from ~/Dashboards/data/transcripts.json; show
 summary line + 2 extracted action items.
5. Active Claude sessions — from ~/Dashboards/data/claude_sessions.json; sort by recency.

Style: Tailwind via CDN. Neutral palette. En dash in headers. Lowercase
labels. No emoji. No build step. Single file. Auto-refresh data files every 30s.
Render a `last_refreshed` line in the footer.

After generating, also generate three small per-panel scrapers under
~/Dashboards/scrapers/{calendar,inbox,linear,transcripts,sessions}.py
that read from MCP/local sources and write the corresponding JSON file.
`
```

Character-mode prompt (additive):

```
`Add a small character figure to the upper-right of the dashboard. SVG sprite, three states:
- idle (green eyes) when nothing urgent
- alert (yellow eyes, slight wobble) when next event <15 minutes away OR an unprocessed
 transcript is >24h old
- urgent (red eyes, faster wobble) when a meeting starts in <5 minutes

The figure speaks in a small speech bubble — one short line, lowercase, en dash separator. Phrases
come from ~/Dashboards/data/character_phrases.json (allow me to override later).
`
```

Scheduled data fetch (sample launchd job — runs every 5 min on macOS):

```
`<dict>
 <key>Label</key><string>local.dashboard.refresh</string>
 <key>ProgramArguments</key>
 <array>
 <string>/bin/bash</string>
 <string>-lc</string>
 <string>cd ~/Dashboards && python3 -m scrapers.run_all</string>
 </array>
 <key>StartInterval</key><integer>300</integer>
 <key>StandardOutPath</key><string>~/Dashboards/logs/refresh.log</string>
</dict>
`
```

## Gotchas

- **Don't start with eight panels.** Five is the limit before the dashboard becomes another inbox.
- **Don't fetch live on every render.** Hammering MCP endpoints from a re-render makes the dashboard slow and your accounts rate-limited. Cron writes JSON, dashboard reads JSON.
- **Don't share one team-wide dashboard.** Federation principle: each member's panels reflect their work. A shared dashboard inevitably becomes a CRM nobody updates.
- **Anti-pattern (template-before-dashboard rule from the workshop hub):** "A dashboard only after the template survives 3 weeks of manual filling." If your transcript summaries aren't already happening as `.md` files, do that first; only then wrap them in a dashboard.
- **Don't put compensation, NDA, or sensitive HR data on the dashboard.** It is the most-screenshared surface in your day.

## Variations

- **Lighter version:** kill the character figure entirely if it distracts, just a 5-panel static HTML re-rendered every morning by a single prompt. Adoption is still high, no animation needed.
- **Mobile variant:** same dashboard, deployed to Netlify behind a per-user URL with basic auth, optimised for phone. Reuses the same `~/Dashboards/data/*.json` files synced via Dropbox/iCloud. Pairs with the Telegram-mobile case below for full off-laptop access.
- **Team variant ("federation"):** each member runs `/personal-dashboard init` on day one; one shared "team status" panel reads from a small SQLite or a shared JSON in the team vault. Nobody sees anyone else's full dashboard.
- **Gamified variant:** the character earns coins for completed Linear items, builds a tiny visible world. One workshop participant built this in game/RPG aesthetic and reported their team's adoption of the dashboard jumped from "I sometimes open it" to "I open it before email."

**Addendum (incremental-13-14):**

A cohort participant who shipped the gamified RPG-aesthetic variant reports 56 features across 13 000 files in the dashboard repo — a useful sizing anchor for operators who are about to underestimate the surface area. The artifact is not a weekend project; treat the dashboard like a product.

## Tools

- Claude Code or Cursor for the build.
- MCP connectors: Telegram, calendar, Linear/GitHub, transcript folder watcher.
- A local skills folder where the `personal-dashboard` skill lives.
- ~/Dashboards/ directory with `index.html`, `data/`, `scrapers/`, `logs/`.
- Optional: Netlify deploy if you want phone access (then guard with HTTP basic auth or a personal subdomain).
