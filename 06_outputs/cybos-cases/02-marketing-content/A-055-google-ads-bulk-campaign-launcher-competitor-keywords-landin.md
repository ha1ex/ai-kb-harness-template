---
id: A-055
tier: A
category: "Marketing & content"
kind: workflow
title: "Google Ads bulk campaign launcher — competitor keywords → landing-page mapping → CSV → Ads Editor"
subtitle: "Problem solved: Performance-marketing teams launching 5-10 keyword-themed Google Ads campaigns per week burn hours per campaign on manual setup; this workflow compresses 7 new campaigns into ~1 hour by piping SemRush competitor exports through Claude Code into Google Ads Editor's CSV bulk-import path."
source: https://www.cybos.ai/cases/A-055
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "founder · growth lead · performance-marketing lead"
type: case
version: v0.1
---
# Google Ads bulk campaign launcher — competitor keywords → landing-page mapping → CSV → Ads Editor

> Problem solved: Performance-marketing teams launching 5-10 keyword-themed Google Ads campaigns per week burn hours per campaign on manual setup; this workflow compresses 7 new campaigns into ~1 hour by piping SemRush competitor exports through Claude Code into Google Ads Editor's CSV bulk-import path.

## What

End-to-end flow that turns a competitor's paid-keyword footprint into 7 ready-to-launch Google Ads campaigns inside an hour. Step 1: in SemRush (or Ahrefs), pick a competitor, export all their paid keywords + landing pages as CSV. Step 2: hand the CSV to Claude Code, which already has read access to your own landing-page repo, and ask it to map each competitor keyword to one of your existing landers. Step 3: Claude flags keywords without a matching lander and proposes new landing pages (or generates them inline). Step 4: ask Claude to emit campaign data in Google Ads Editor's bulk-import CSV format. Step 5: open Google Ads Editor desktop, upload the CSVs, push 7 campaigns to your account in one batch. Optional: connect the dataforseo MCP for search volume + CPC analysis *before* keyword selection — useful when you want to filter the competitor's list rather than copy it wholesale.

## Why it matters

Google Ads is foundational for B2B and DTC growth, and campaign setup is the manual-toil step that scales linearly with channel investment. One operator reports the first run took ~1 hour to figure out the prompt + CSV format; repeats are measured in minutes. The deeper insight is that Claude Code's read access to your landing-page repo is the leverage — the model can map competitor terms to your own URLs (the part Google Ads Editor's UI can't help with) and generate missing landers in the same session.

## End-to-end

1. **Pick a competitor + export their paid keywords from SemRush.** Filter to paid search, all live ads, last 90 days. Export as CSV — keywords, landing pages, ad copy if available.
2. **(Optional) Pre-filter via dataforseo MCP.** Connect dataforseo MCP to Claude Code; ask Claude to filter the competitor's keyword list by minimum search volume + max CPC against your target ROAS. Drop the ones outside your envelope before the mapping step.
3. **Hand the CSV to Claude Code with landing-page repo access.** Prompt: map these competitor ads to our existing landing pages; flag keywords that have no matching lander. Claude reads your repo's URL structure and proposes one-to-one mappings.
4. **Ask Claude to add missing landers.** For keywords with no match, Claude proposes (or generates) new landing pages with the right H1/body/meta to match the keyword intent. Review + accept the inline diffs the same way you'd accept any PR.
5. **Generate Google Ads Editor bulk-import CSVs.** Ask Claude to output one CSV per campaign in Google Ads Editor's expected schema (campaign name, ad group, keyword match types, final URL, headlines, descriptions). Google Ads Editor's docs are well-indexed — Claude gets the columns right on the first pass.
6. **Import via Google Ads Editor desktop.** Open Editor, paste the CSVs into the bulk-import dialog, review the campaign tree, push live. Editor surfaces errors per row before you publish — fix in Claude, re-export, re-import.
7. **Repeatable in minutes.** First run is ~1 hour (prompt engineering + CSV-format discovery). Subsequent competitors are minutes per campaign batch.
8. **Optional deeper variant — edit Google Ads Editor's SQLite DB directly.** Google Ads API access is hard to get; Google Ads Editor's local SQLite database is sitting on disk. One operator reads + writes the SQLite file directly (Claude generates the SQL), then previews changes in Editor's UI before pushing to prod. Pair with Ahrefs MCP ($129/mo Lite plan) as a cheaper alternative to SemRush ($5k/yr).

## Prompts

The operator's workflow:

```
`1. Went to SemRush, found a competitor, took all their paid-search keywords
 and landing pages.
2. Exported as CSV.
3. Gave the CSV to Claude Code (which has access to our landing-page code)
 and asked it to map those ads to our landing pages.
4. Some landers were missing — I asked Claude to add them.
5. Asked it to create Google Ads campaigns in bulk format.
6. It recommended CSV + Google Ads Editor (desktop app).
7. Generated CSVs with the required campaigns.
8. I uploaded 7 new campaigns via those CSVs.
9. The whole thing took ~1 hour to figure out the first time. Now I can do
 bulk campaigns in minutes.
10. I also connected the dataforseo MCP, so I can do keyword analysis
 (volumes, CPC) before creating ads.
`
```

## Gotchas

- **Google Ads API access is genuinely hard to get.** Don't plan a workflow that requires it unless you already have approval. The Ads Editor CSV path (and the deeper SQLite-edit path) are the working alternatives.
- **Pair with the SQLite-edit variant for full automation.** Editing Google Ads Editor's local SQLite DB directly (Claude writes the SQL) lets you preview every change in the Editor UI before pushing — closer to a proper review-before-publish loop than CSV roundtrips. Beware: the schema is undocumented and Google can change it in any Editor release.
- **Don't blanket-import a competitor's keyword list.** Filter through dataforseo MCP (or manual review) — competitors include keywords that are profitable for them but not for you (different LTV, different lander conversion). The map-to-existing-landers step catches some of this; the volume/CPC filter catches the rest.
- **Skip community MCPs for production.** One operator's broader lesson on MCPs: community MCPs break on 2nd/3rd retry, leak keys, and add a token tax. dataforseo and Ahrefs MCPs are vendor-published and fine; for anything more obscure, have Claude write a thin CLI wrapper over the vendor API.

<hr/>

## Tools

- SemRush account (paid keyword export) — alternative: Ahrefs ($129/mo Lite plan + MCP)
- Google Ads Editor (desktop) — the bulk-import target
- Claude Code with read access to your landing-page repo
- dataforseo MCP (optional, for pre-filter on search volume + CPC)
- Google Ads account with editing permissions
