---
id: A-002
tier: A
category: "Sales & outbound"
kind: skill
title: "End-to-end network outreach builder (Telegram + Gmail → curated workbook)"
subtitle: "A year of DMs hides 70 worth-emailing contacts. Stop spending three days finding them by hand."
source: https://www.cybos.ai/cases/A-002
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · GP · partner · head of BD · SDR running a launch"
type: case
version: v0.1
---
# End-to-end network outreach builder (Telegram + Gmail → curated workbook)

> A year of DMs hides 70 worth-emailing contacts. Stop spending three days finding them by hand.

## What

A Claude Code skill that turns the user's own Telegram DMs (and optionally Gmail) into a curated outreach list for a specific announcement (fund launch, program intake, product release). It runs a two-layer pipeline — a deterministic conversation-quality filter, then a Claude-driven relevance curation against an audience definition — and emits a styled `.xlsx` with three sheets (Outreach / Excluded / Legend) plus an optional auto-write into a shared team Google Sheet with multi-rule dedup against existing rows. One prompt in, ~70 well-targeted contacts and a team-sheet update out.

## Why it matters

A test run on a partner's account at an early-stage investor moved **2,064 raw dialogs → 409 active in the last 12 months → 253 passing the deterministic gate → ~70 in the final Outreach sheet**, in 30–45 minutes wall-clock. That replaces a multi-day manual triage of a year's worth of DMs and email. The most expensive failure it prevents is the embarrassing-but-common one of sending an "AI-native fund launch" note to a great pure-DeFi founder or to an unrelated personal contact — the kind of error that costs a relationship for zero return.

## End-to-end

1. **Install the skill.** Drop the skill folder into Claude Code's skill directory:

```
`mkdir -p ~/.claude/skills
cp -r outreach-builder ~/.claude/skills/
`
```

1. **One-time setup.** Get Telegram API ID/hash from `my.telegram.org/auth → API development tools`; copy `.env.example` to `~/.config/outreach-builder/.env`; install Python deps; log in once to mint a Telethon session.

```
`mkdir -p ~/.config/outreach-builder
cp ~/.claude/skills/outreach-builder/templates/env.example ~/.config/outreach-builder/.env
python3 -m pip install --user telethon openpyxl httpx
python3 ~/.claude/skills/outreach-builder/scripts/telegram_login.py
`
```

1. **(Optional) Portfolio blocklist.** Drop a `portfolio.txt` (one substring per line) in `~/.config/outreach-builder/` so group-chat extraction skips your own portfolio companies' communities.
2. **Run the pipeline.** In Claude Code, the single prompt is `Build the AI-native fund outreach list.` The skill then runs, in order: preflight → list Telegram dialogs → filter to last 12 months → batched enrichment (bio + last 30 messages, rate-limited at 5 req/min/account with 350ms inter-request delay) → render compact view → **Layer 1** deterministic filter → **Layer 2** Claude curation → workbook scaffold → CSV ingest → group-chat extraction → team-sheet capability check → dedup → write or paste.
3. **Layer 1 — deterministic filter (OR logic).** A contact passes if it has ≥10 messages in the last-30 sample OR ≥2 distinct calendar days with at least one message. The OR is load-bearing: a single intense day is real signal, and a sparse multi-day exchange is real signal; one-shot cold pitches get cut. Defaults: `--min-msgs 10 --min-days 2`.
4. **Layer 2 — Claude curation against audience.** Claude reads the compact qualified file and decides INCLUDE / EXCLUDE per contact. INCLUDE if any of: AI-native founder (agentic, infra, dev-tools, AI×crypto crossover); peer VC backing AI rounds; high-leverage amplifier (editor-in-chief, EF-tier researcher). EXCLUDE pure-crypto-no-AI-tie, internal, applicant, cold-sales, personal/family/medical. **Hard rule: when in doubt, EXCLUDE with a reason. You can promote from Excluded in a click; you cannot un-send a message.**
5. **Team-sheet capability check (7 states).** Before offering auto-write, the skill returns one of `ready / partial / schema_mismatch / needs_share / no_credentials / no_sheet_id / lib_missing`, each with the exact fix and time cost printed. No silent failure modes.
6. **Dedup with ambiguous-surfacing.** Four rules in order: TG-handle match (normalized) → exact full-name match → multi-word primary-name match (token sets equal) → single-word match only if Org tokens overlap. Anything hitting rule 4 with weak overlap is **surfaced as ambiguous**, not silently dropped. Single-first-name collisions are the most common false-positive class.
7. **Write safely.** Auto-write uses `values().update()` with an explicit row range computed from the Name column only — **never `append()`** (it jumps past orphan cells in other columns and writes to the wrong row). `valueInputOption=RAW`, never `USER_ENTERED`, so a display name like `=HYPERLINK(...)` can't be parsed as a formula. Both bugs cost real time in the first run; both are now permanent guardrails.
8. **Hand-off.** Skill prints the xlsx path + counts by tier and owner + the **5 most surprising excludes** so the user can spot-check before sending.

## Prompts

User-facing invocation (everything else is automatic):

```
`Build the AI-native fund outreach list.
`
```

Layer-1 deterministic filter — the actual command, with tunable thresholds:

```
`python3 scripts/conversation_filter.py --min-msgs 10 --min-days 2 # defaults
python3 scripts/conversation_filter.py --min-msgs 5 --min-days 1 # wider net
python3 scripts/conversation_filter.py --min-msgs 20 --min-days 3 # tighter net
`
```

Layer-2 audience definition baked into the skill (verbatim, used as Claude's curation criteria):

```
`INCLUDE if any of:
- AI-native founder (agentic AI, AI infra, AI tooling/dev-tools, AI-native apps,
 AI×crypto crossover). Test: would this person plausibly fit a 12-week elite accelerator?
- AI-investing peer VC: partner-level investor known to back AI / AI-crypto rounds.
- High-leverage amplifier: editor-in-chief or social lead at crypto/tech press;
 EF-tier researcher who would actually retweet or cover the launch.

EXCLUDE if any of: pure-crypto-no-ai-tie, internal, applicant, cold-sales,
personal/family/medical/banking, unclear-ai-fit.

When in doubt, EXCLUDE and put them in the Excluded sheet with a reason.
False positives in the Outreach sheet are worse than misses — you can promote
from Excluded in a few clicks; you cannot un-send a message.
`
```

Team-sheet machine-readable capability check (the friend-onboarding moment):

```
`python3 scripts/team_sheet.py check --json
`
```

## Gotchas

- **Override-by-handle, never by list position.** When Claude builds per-contact override structures, key them by `@username` or `user_id` — never by list index. The moment a filter tightens mid-run, list positions shift and overrides silently rebind to the wrong rows. This is the worst class of curation bug because outputs still look plausible. (2026-05-04 lesson, baked into the skill.)
- **Never `append()` into a shared sheet.** First production run wrote to row 412 instead of row 109 because an orphan cell in column F shifted Google Sheets' notion of "last row". Always compute the last row from a known clean column (Name) and use `values().update()` with an explicit range. (2026-05-05 lesson.)
- **`USER_ENTERED` is formula-injection.** Telegram display names are user-controlled; someone with a name like `=HYPERLINK(http://evil,click)` gets that parsed as a live formula. Use `valueInputOption=RAW`.
- **Pure-crypto founders you know well are still EXCLUDE for an AI-native list.** The most-counterintuitive rule; restate it explicitly so curation doesn't drift halfway through a batch.
- **Read the messages, not just the bio.** A "Co-founder at X" bio is irrelevant if the last 30 messages are all about the user's medical issues.
- **Layer-2 batching with check-ins is mandatory, not polite.** For >100 qualified contacts, batch by ~40 and summarize counts + surprising includes/excludes between batches. Silent dumps lose user trust and let bad calls accumulate.
- Telegram group scraping is rate-limited and ToS-sensitive. Use one account per workspace, throttle ≤ 30 requests/min, never scrape private groups, and store nothing about members who haven't opted into your surface.

## Variations

- **Lighter (single-machine, no team sheet).** Stop after step 6 and produce only the local xlsx. Skips all GCP setup; works in 15 minutes from cold install.
- **Heavier (Gmail-included).** Add the Gmail OAuth fallback (or a Gmail MCP if available); useful for email-native networks where Telegram coverage is partial.
- **Per-launch generic version.** Replace the hardcoded "AI-native fund" audience definition with a runtime arg so the same machine can run "developer tools program outreach", "design partner round outreach", etc. — see the sibling `outreach-builder` skill pattern.
- **Telegram-group source variant.** Instead of (or in addition to) starting from Telegram saved-messages and Gmail, scrape selected public Telegram groups for lead surface. An agency built this against 7 industry-relevant Telegram groups (~11 000 members combined) and produced 600+ ICP-scored leads in 2 days. Steps: (a) scrape group rosters via the Telegram client API (rate-limit aware); (b) hydrate each member with public profile + bio + recent activity; (c) run the same ICP / CBI scoring you already use for inbox sources; (d) feed survivors into the outreach builder. Source-attribution: inspired by a previous-cohort speaker's prior workflow.

## Tools

- Python 3.9+, `telethon`, `openpyxl`, `httpx` — core pipeline
- Telegram API ID/hash from `my.telegram.org/auth` — free, 5 minutes
- Claude Code with the skill installed — Layer-2 curation cost is paid in the user's session, no separate API key
- Optional: `google-api-python-client` + `google-auth` + service-account JSON for team-sheet auto-write
- Optional: Gmail MCP or Gmail OAuth deps for the email-native pass
