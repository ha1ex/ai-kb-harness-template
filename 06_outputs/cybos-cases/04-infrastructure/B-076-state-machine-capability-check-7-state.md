---
id: B-076
tier: B
category: "Infrastructure"
kind: pattern
title: "State-machine capability check (7-state)"
subtitle: "\"Why is the integration broken?\" eats 20-minute Slack threads. Seven precise states, each with the exact fix and time cost printed."
source: https://www.cybos.ai/cases/B-076
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "engineer · ops lead · any tool that integrates with a shared resource"
type: case
version: v0.1
---
# State-machine capability check (7-state)

> "Why is the integration broken?" eats 20-minute Slack threads. Seven precise states, each with the exact fix and time cost printed.

## What

Before offering an auto-write to a shared Google Sheet (or Notion DB, or Linear project, or any team-owned external resource), the tool runs a capability check that returns one of seven precise states, each with the exact fix and a realistic time estimate:

<table><thead><tr><th>State</th><th>Meaning</th><th>Fix (with time)</th></tr></thead><tbody><tr><td>`ready`</td><td>Both targets auto-writable</td><td>Proceed</td></tr><tr><td>`partial`</td><td>One target works, other doesn't</td><td>Auto-write the good one, manual paste for the other</td></tr><tr><td>`schema_mismatch`</td><td>Required headers missing</td><td>Set `*_TAB` env vars (~30s)</td></tr><tr><td>`needs_share`</td><td>Creds exist but resource 403/404s</td><td>Share resource with printed service-account email (~30s)</td></tr><tr><td>`no_credentials`</td><td>No service-account JSON</td><td>Run `setup_google_sheets.sh` (~5–15min)</td></tr><tr><td>`no_id`</td><td>`TEAM_SHEET_ID` env var unset</td><td>Set it in `.env`</td></tr><tr><td>`lib_missing`</td><td>Required Python library missing</td><td>`pip install <name>`</td></tr></tbody></table>

The user picks based on time cost; nothing is forced.

## Why it matters

"Why is the integration broken" is the #1 support burden for any tool that touches a shared external resource. Every failure mode having a printed fix with a realistic time cost converts a 20-minute Slack thread into a 30-second self-service. A founder-discovery CLI uses this pattern; users go from "I'm stuck" to "I picked manual paste" in seconds.

## End-to-end

1. **Enumerate every failure mode** in the integration. Group into 5–9 states.
2. **For each state, document**: the exact symptom, the exact fix command, a realistic time estimate.
3. **Implement `tool check`** that runs probes in order (cheapest first: env vars → library import → API auth → resource read → schema match).
4. **Return early on the first failing state**; print the state name, fix, time.
5. **Support `--json` output** for scripting.
6. **In SKILL.md, document the state table** so the agent surfaces the right choice without re-discovering it.

## Gotchas

- Don't gate the entire tool on `ready`. Many states have valid fallback modes (manual paste, partial auto-write); surface them as menu options, don't force the auto path.

## Tools

- Whatever the integration uses (Google API libs, Notion SDK, etc.)
- A YAML / JSON definition of the schema you require
