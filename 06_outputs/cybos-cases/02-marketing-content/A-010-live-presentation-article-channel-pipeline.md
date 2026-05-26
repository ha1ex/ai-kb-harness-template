---
id: A-010
tier: A
category: "Marketing & content"
kind: workflow
title: "Live presentation → article → channel pipeline"
subtitle: "Every talk you give could be an article. Most aren't, because rewriting takes 6 hours. This cuts it to 5 minutes."
source: https://www.cybos.ai/cases/A-010
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder · head of content · anyone giving regular talks"
type: case
version: v0.1
---
# Live presentation → article → channel pipeline

> Every talk you give could be an article. Most aren't, because rewriting takes 6 hours. This cuts it to 5 minutes.

## What

A pipeline that turns a single live talk into three artifacts with one human-review step: (1) the slide deck itself is generated from the speaker's working docs as context; (2) during the talk, a live transcript captures everything said into a context-loop file; (3) immediately after the talk, a content skill writes a publishable article from the talk + slides + transcript, attaches a matching cover via the banner skill, and posts to the founder's channel after one human approval. End-to-end: a 5-minute review window between "talk ended" and "post published".

## Why it matters

A founder who gives a one-hour talk normally spends 4–8 hours converting it into a publishable article — and most never do. The compounding cost is enormous: every talk that doesn't become an article is wasted distribution. This pipeline reduces the article step to ~5 minutes of human time and reliably produces an article with the speaker's verbatim voice (because the transcript is the source, not a paraphrase). Over a year of monthly talks, that is ~50 hours of founder time and 10+ extra published posts.

## End-to-end

1. **Pre-talk: deck from context.** The speaker drops research notes, working docs, and prior posts on the topic into a folder (`talks/{date}-{topic}/context/`). Run a skill: "Generate a 12-slide HTML/web presentation on `{topic}` using only facts in `context/`. Mark anything not in context as `[PLACEHOLDER]`. Style per `presentation-style.md`." Output: an HTML deck the founder can open in a browser and edit.
2. **During talk: live transcript loop.** Use a live transcription tool (Krisp, Whisper-based local transcribe, or any browser-based live captioner) configured to write a rolling transcript to `talks/{date}-{topic}/transcript.md` once per minute. This file becomes the single source-of-truth for what was actually said — not what the slides claimed would be said.
3. **Post-talk: article skill.** Invoke `aim-content` (or equivalent) with the talk folder. The skill reads `transcript.md`, the slide deck, and `context/`, and produces `articles/{date}-{topic}.md` shaped as a long-form post: headline, hook, structured sections matching the talk's actual arc, embedded pull-quotes from the transcript, calls-to-action.
4. **Voice rule.** The article skill reads `content-voice-{channel}.md` (case #27) so the published voice matches the channel, not the talk's spoken cadence.
5. **Cover banner.** The same skill triggers the banner skill (case #26) with the article title + topic, producing a cover that matches the channel's visual brand.
6. **Single human review.** Founder opens `articles/{date}-{topic}.md`, the cover, and the preview. One pass to catch hallucinations and tighten the lead. Edits go straight into the file.
7. **Publish.** Skill posts to the channel (Telegram MCP, Substack, LinkedIn, or plain HTML on a static site) with the cover, the article, and an OG-preview verified before posting.
8. **Archive loop.** The talk folder (`context/`, `transcript.md`, `articles/{date}.md`, deck HTML, cover PNG) stays in the workspace as future context for the next talk on a related topic — this compounds the speaker's content graph.

- **3-hour presentation prep workflow.** When the article exists already, presentation prep collapses to: (a) talk file → outline (15 min); (b) outline → slide structure (30 min, Claude); (c) Reveal.js render (10 min); (d) operator-edit pass on visuals (1 hour); (e) speaker-notes rehearsal (1 hour). The discipline is to NOT iterate the article during prep — freeze the article first, then prep.

## Prompts

Deck generation prompt:

```
`Generate a 12-slide HTML presentation on {topic}.
Use only facts from the files under talks/{date}-{topic}/context/.
For any claim you cannot ground in those files, write [PLACEHOLDER: <claim>].
Style: read talks/presentation-style.md.
Output: talks/{date}-{topic}/deck.html
Each slide is a section with id="slide-N"; speaker notes go in <aside class="notes">.
`
```

Article skill instruction:

```
`Read:
 - talks/{date}-{topic}/transcript.md (verbatim)
 - talks/{date}-{topic}/deck.html (structure)
 - talks/{date}-{topic}/context/ (factual grounding)
 - content-voice-{channel}.md (voice rule)

Produce articles/{date}-{topic}.md as a long-form post:
 - Headline (matches the talk's strongest claim).
 - Hook (200 words, drawn from the transcript's actual opening).
 - 4-6 sections matching the talk's actual arc, not the slide titles.
 - At least 3 verbatim pull-quotes from the transcript.
 - Closer that previews the next talk in this series.

After writing, run fact-check loop per content-voice protocol.
Then trigger banner-skill with title + 3-word topic, save cover to articles/covers/.
`
```

## Gotchas

- The transcript is the source of truth for the article, not the slides. If the speaker improvised, the article should reflect that — do not have the skill "smooth over" improvised sections back into the deck's outline.
- Don't auto-publish. One human review pass is non-negotiable — talks routinely contain off-the-cuff claims the founder would not put in writing.
- Don't generate the article from the deck alone (no transcript). The output is generic and loses the voice. The transcript file is the differentiating asset.
- Anonymize any client/customer references in the transcript before the article step if the talk was internal-flavoured.

## Variations

- **Lighter:** drop the deck generation step; only run the post-talk article pipeline on transcripts from existing talks. Wins ~80% of the value.
- **Heavier:** for a podcast series, chain three talks → three articles → a synthesis post that cross-links them, generated weekly.
- **Internal-only:** instead of publishing externally, save the article to the company wiki / internal knowledge folder. Every team meeting becomes a searchable artifact.
- **Reveal.js in-code variant.** Instead of (or in addition to) PPT export, generate Reveal.js HTML directly from the structured talk file. The skill takes the same input and outputs a `slides.html` runnable in any browser, with a `--style` parameter (e.g. `editorial`, `keynote`, `cli-deck`). Replaces a separate slide-design step for technically-comfortable presenters and integrates cleanly into the static-host flow (Netlify / Vercel). A franchise founder used this to ship 3 presentations in one week.

## Tools

- A live transcription source writing to a markdown file during the talk (Krisp, Wispr Flow with continuous capture, or a browser captioner exporting to a watched file).
- Claude Code with the article skill, banner skill, and voice rule file in place.
- A channel publishing MCP (Telegram, Substack, etc.) or a static-site repo with one-command deploy.
- The talk's `context/` folder populated *before* the talk — this is the bottleneck if missed.
