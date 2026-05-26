---
id: A-058
tier: A
category: "Marketing & content"
kind: workflow
title: "Agentic SEO + GEO pipeline — 5-agent content factory, 4× organic in 30 days"
subtitle: "Problem solved: SEO writing-and-fix loop is the slowest founder bottleneck; an agent team multiplies organic traffic 4× in 30 days when the site is code — and a CORE-EEAT scorer plus a hard editorial bar keep the volume from being slop."
source: https://www.cybos.ai/cases/A-058
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "founder · marketing lead · SEO lead"
type: case
version: v0.1
---
# Agentic SEO + GEO pipeline — 5-agent content factory, 4× organic in 30 days

> Problem solved: SEO writing-and-fix loop is the slowest founder bottleneck; an agent team multiplies organic traffic 4× in 30 days when the site is code — and a CORE-EEAT scorer plus a hard editorial bar keep the volume from being slop.

## What

A 5-agent content pipeline on Claude Code with two MCPs — an SEO-tool MCP (keyword research + Site Audit error feed) and a Search Console MCP (performance data). Pipeline: **Manager → Research → Writer → Designer → Publisher**, with the Writer output passing 2–3 internal review-and-revise loops before any human sees it. Separately, the Site Audit error list feeds back as a fix-all-issues task; one site reached 100/100 technical SEO this way. Two source-16 merges add the quality spine the original lacked: a **CORE-EEAT 80-item benchmark** (16 high-weight constraints applied at draft time and scored Pass/Warn/Fail at the end) from a public Apache-2.0 SEO skill, and a **hard editorial bar** from a public content-writer skill that an article must clear before it can publish at all.

## Why it matters

One marketing-analytics SaaS team running this pipeline ~1 month: organic traffic up 4×, organic-source lead volume ~4×, 50 articles published. Surprising finding from their "How did you hear about us?" form: the primary referrer is no longer Google — it's ChatGPT and Perplexity. GEO matters as much as classic SEO. A separate operator on a young finance-vertical domain hit ~5,000 organic visits in February after starting in late November. The two merges address the failure mode that kills naive agent-content factories: volume without authority. Keyword-stuffed drafts that skip expertise/authority signals rank outside the top 20 forever; the CORE-EEAT scorer makes content quality a measured gate rather than a vibe, and the editorial hard-bar refuses to ship an article that is a bare keyword title with decorative stock photos.

## End-to-end

1. **Site must be code.** Framer/Webflow block programmatic content, auto-fix, IndexNow, and PR-based publishing. Migrate off the visual builder first.
2. **Connect the SEO-tool MCP and the Search Console MCP.** Keyword research + Site Audit errors + competitive backlinks; query performance + impressions. Give the agent repo write access (PR or content branch).
3. **Run the technical-SEO fix loop first.** Feed the Site Audit error list with "fix all of these." Iterate to 100/100. One-shot prep work.
4. **Define the 5 agent roles.** Manager (orchestrates, queues topics, budget caps), Research, Writer, Designer (graphics/ratings/video), Publisher (commit + deploy). Each a skill or sub-agent.
5. **Load CORE-EEAT constraints at draft time.** Before the Writer drafts, load the 16 high-weight items from the 80-item CORE-EEAT benchmark (the upstream dependency repo is `aaron-he-zhu/core-eeat-content-benchmark`). These bias the draft toward authority/expertise/experience signals rather than keyword density. (S16-MA-004 merge.)
6. **2–3 internal review loops, then the editorial hard-bar.** Writer output bounces to a critic 2–3 times. Then the article must clear the verbatim editorial bar before it is allowed to reach a human or publish (see prompts): hook title not a bare keyword; a featured image plus ≥3 inline images at meaningful points (not decorative stock); a table of contents; ≥1,000 words; an FAQ of 3–5 questions; JSON-LD Article + FAQPage. Apply the "last click" test: *would the reader need to search again? If yes, the content isn't done.* (S16-MA-036 merge.)
7. **Final CORE-EEAT review.** Step 9 of the merged workflow scores the draft Pass/Warn/Fail against the benchmark, auto-fixes small issues, and surfaces decisions that need the human. Memory handoff: write `memory/content/YYYY-MM-DD-<topic>.md`, promote conclusions to `memory/hot-cache.md` and open items to `memory/open-loops.md` so downstream skills inherit context.
8. **Pick topics that match "people-ask" queries, track lead source.** Long-form comparison topics with tables/ratings. Add a "How did you hear about us?" form field or you'll miss the GEO signal entirely. Optional open-source skill stacks for free-tool-research and blog-generation can seed the topic queue.

## Prompts

The technical-fix prompt that produced 100/100 (paraphrased — source describes the action, no verbatim prompt):

```
`You have access to the SEO-tool MCP and write access to this site's repo.
Pull the full Site Audit error and warnings list for this domain.
Fix every issue in the repo. Open one PR per category of fix
(redirects, meta, canonical, image alt, structured data, etc.).
Aim for 100/100 technical score.
`
```

CORE-EEAT load + final-review steps (verbatim shape from a public Apache-2.0 SEO skill, repo `aaron-he-zhu/seo-geo-claude-skills`):

```
`Step 2 Load CORE-EEAT Constraints — apply the 16 high-weight items from the
 companion 80-item benchmark before drafting.
Step 9 Run Final SEO + CORE-EEAT Review — score the draft Pass/Warn/Fail,
 auto-fix small issues, surface decisions needing the user.
On user confirmation: write memory/content/YYYY-MM-DD-<topic>.md;
 promote to memory/hot-cache.md and memory/open-loops.md.
`
```

Editorial hard-bar (verbatim shape from a public content-writer skill, repo `nowork-studio/toprank`) — an article publishes only if ALL pass:

```
`[ ] hook title — NOT a bare keyword
[ ] featured image + >=3 inline images at meaningful points
 (NOT decorative stock; no stock-photo handshakes)
[ ] table of contents present
[ ] >= 1,000 words
[ ] FAQ section, 3-5 questions
[ ] JSON-LD: Article + FAQPage
"Last click" test: would the reader need to search again? If yes, not done.
Image-prompt discipline: specify subject + style + composition + color +
 mood + what-to-avoid. Image fallback: Codex native > NotFair MCP > prompt-only.
`
```

## Gotchas

- **Programmatic SEO does not work on Framer/Webflow.** Migrate to a code-controlled site first.
- **Volume without an authority gate ranks nowhere.** The CORE-EEAT scorer exists precisely because high-throughput agent content that skips expertise/authority signals stays outside the top 20. Make quality a measured Pass/Warn/Fail gate, not a reviewer's gut feel.
- **The editorial hard-bar is a publish gate, not a suggestion.** A bare-keyword title with decorative stock images and 600 words is the default agent-content failure. If the article can't clear all the boxes, it does not publish — apply the "last click" test as the final arbiter.
- **Decorative stock images fail the bar.** Inline images must sit at meaningful points and carry real information; stock-photo handshakes are an automatic fail. Follow the image-prompt discipline (subject + style + composition + color + mood + avoid).
- **Don't trust single-pass Writer output.** The 2–3 internal review loops are what make human review fast.
- **GEO is the hidden channel.** Without the form question you'll misattribute generative-engine referrals to "direct" and conclude the pipeline isn't working when it is.
- **Skip community MCPs for production.** They break on retry, leak keys, add a token tax. Have Claude write a thin CLI wrapper over the vendor API for production; MCP is fine for prototyping.

<hr/>

## Tools

- Claude Code with skill system
- An SEO-tool subscription + its MCP (e.g. Ahrefs); Search Console access + GSC MCP
- Site as code in a git repo (no Framer/Webflow); auto-deploy pipeline
- "How did you hear about us?" form field for GEO attribution
- Optional public SEO skill for CORE-EEAT scoring (Apache-2.0, free SurferSEO alternative): `/plugin marketplace add aaron-he-zhu/seo-geo-claude-skills` (the CORE-EEAT 80-item benchmark is the upstream dependency)
- Optional public content-writer skill for the editorial hard-bar
- Optional: open-source growth-marketing skill repo for free-tool-research + blog generation
