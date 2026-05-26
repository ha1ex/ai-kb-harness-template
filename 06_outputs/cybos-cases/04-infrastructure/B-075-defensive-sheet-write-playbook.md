---
id: B-075
tier: B
category: "Infrastructure"
kind: pattern
title: "Defensive sheet-write playbook"
subtitle: "\"Wrote to row 412 instead of 109\" because a stray cell shifted append(). Four explicit defences against the classic shared-sheet failure modes."
source: https://www.cybos.ai/cases/B-075
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "engineer · anyone writing to a shared Google Sheet (or Notion DB · or Linear) from an agent"
type: case
version: v0.1
---
# Defensive sheet-write playbook

> "Wrote to row 412 instead of 109" because a stray cell shifted append(). Four explicit defences against the classic shared-sheet failure modes.

## What

A bundle of four small defenses that together prevent the classic "automated write to shared sheet went sideways" failure mode:

1. **Use `values().update()` with an explicit row range, never `append()`.** `append()` jumps past stray cells in non-primary columns and mis-aligns rows. Compute the last data row from the primary column (e.g., `Name`) only.
2. **Set `valueInputOption=RAW`, never `USER_ENTERED`.** User-controlled display names like `=HYPERLINK(...)` get parsed as formulas under `USER_ENTERED` — classic formula-injection class.
3. **Four-rule dedup before writing** (first-match wins): (a) handle match (normalized: lowercased, leading `@` stripped); (b) exact full-name match (case-insensitive, whitespace-collapsed); (c) multi-word primary-name match — both sides ≥2 tokens AND token sets equal; (d) single-word match only if Org tokens overlap ≥1. Anything matching rule (d) with weak Org overlap surfaces as `ambiguous`, not silently dropped.
4. **Auto-discovery of existing sessions / configs** in common paths before nagging the user to re-login. Print reuse instructions.

## Why it matters

Each defense was learned the hard way. The first run of a founder-discovery sheet wrote to row 412 instead of row 109 because of a stray cell in another column. Telegram display names like `=HYPERLINK(...)` would have parsed as formulas. "Konrad" + "Konrad Smith" caused the most common dedup false positives in test runs. And the "ugh, I have to re-login from scratch" friction was killing onboarding.

## End-to-end

1. **Replace any `values().append()` calls** with `values().update(range=...)`. Compute the range explicitly from the primary column.
2. **Audit every call site for `valueInputOption`**; default to `RAW`.
3. **Implement dedup as four ordered rules**; emit `_deduped.csv`, `_dropped.csv` (with reason), `_ambiguous.csv` (treat as new unless user confirms).
4. **In your preflight script, auto-scan for existing sessions/configs** in `~/.config/`, `~/.local/share/`, `~/Documents/`. If found, print the copy command for reuse.

## Gotchas

- Reusing a colleague's service-account JSON authenticates as the colleague, not you. Every installer runs the setup script on their own machine and shares the sheet with their own service-account email.

## Tools

- Google Sheets API client (or Notion / Linear equivalent)
- Service-account JSON (one per installer; never shared)
