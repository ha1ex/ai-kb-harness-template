---
id: A-011
tier: A
category: "Marketing & content"
kind: workflow
title: "Stylistic ContentVoice writer (multi-channel + fact-check)"
subtitle: "Founder content stalls because typing is slow. Three channels publish in the founder's voice with no embarrassing wrong stats."
source: https://www.cybos.ai/cases/A-011
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "founder-marketer · content lead · anyone with multiple publishing surfaces"
type: case
version: v0.1
---
# Stylistic ContentVoice writer (multi-channel + fact-check)

> Founder content stalls because typing is slow. Three channels publish in the founder's voice with no embarrassing wrong stats.

## What

A Claude Code skill writes posts in distinct voices per channel — a measured corporate channel, an "AI-native" builder channel, a deliberately raw "gonzo" channel with profanity, etc. — synthesizing each voice from a corpus of the founder's own past posts. Composable parameters select channel, optional folk/raw twist, and matching cover banner. Web-search MCP fact-checks claims before publishing. The skill knows which folder to save the draft to based on the chosen channel.

## Why it matters

Founder content is the single biggest growth lever for early-stage B2B but the bottleneck is the founder's typing time. Synthesizing the founder's voice once and dispatching across 3–5 channels with channel-specific tone cuts raw writing time roughly in half while keeping each channel's audience contract intact. Fact-checking inline kills the "AI-written post embarrassed us with a wrong stat" failure mode.

## End-to-end

1. **Voice synthesis from the founder's corpus.** Drop ~10 of the founder's strongest past posts into a folder (e.g., `voice-samples/{channel-name}/`). Ask the agent: "Read these 10 posts. Summarize the voice along these axes — register, sentence length distribution, vocabulary tics, opening patterns, closing patterns, emoji policy, taboo phrases, signature moves. Output a `content-voice-{channel}.md` file I can review." Have the founder edit it; the file becomes the canonical style rule.
2. **Per-channel rules.** Maintain `content-voice-{channel-A}.md`, `content-voice-{channel-B}.md`, etc., as independent files. Each file declares: audience contract, voice axes, length envelope, taboo list, signature opener / closer patterns, allowed media types, save-to folder. Optional `folk:true` substyle adds a raw / gonzo twist.
3. **Skill scaffold.** Create a Claude Code skill `content-voice/SKILL.md` with a single command that takes parameters: `--channel=X`, `--folk=true|false`, `--topic="..."`, `--length=short|long`, and optionally `--banner=true`. The skill reads the matching rule file, drafts the post, runs the fact-check sub-agent, attaches a matching cover via the banner skill (case #26 — auto-banner), and writes the draft to the channel-specific folder.
4. **Fact-check sub-agent.** Before returning the draft, the skill extracts every numerical claim, named entity, and quoted phrase. For each, it spawns a web-search sub-agent: "Verify this exact claim with a primary source. Return 'verified + URL', 'contested', or 'unverifiable'." Any non-verified claim is replaced with `[CLAIM NEEDS VERIFICATION]` in the draft.
5. **Founder review.** Single human-review pass before publish. The draft contains the fact-check log appended so the founder sees exactly which claims passed and which were softened.
6. **Publish.** Optional: wire the skill to a publishing MCP (Telegram MCP for channel broadcasts; Twitter/LinkedIn MCP for social) so "publish to channel X" is a one-line follow-up.

## Prompts

Voice-synthesis prompt to bootstrap a new channel rule:

```
`Read every file under voice-samples/{channel}/.
Produce a content-voice-{channel}.md file with these sections, filled from the corpus:
 - Audience contract (who reads this and what do they want)
 - Register (formal / informal / raw — with example phrases from the corpus)
 - Sentence length distribution (median, p90)
 - Opening patterns (top 5 ways posts begin)
 - Closing patterns (top 5 ways posts end)
 - Vocabulary tics (recurring words/phrases)
 - Taboo list (words/phrases never to use in this voice)
 - Emoji policy
 - Signature moves (3-5 distinctive structural patterns)
 - Length envelope (min, max words)
 - Save-to folder
For each axis cite 2-3 verbatim examples from the corpus.
`
```

Fact-check loop, verbatim instruction inside the skill:

```
`For every numerical claim, named entity, and quoted phrase in the draft,
launch a web-search sub-agent with this instruction:
"Verify the exact claim against a primary source.
Return one of: VERIFIED + source URL, CONTESTED + alternative, UNVERIFIABLE.
Do not paraphrase the claim — verify it verbatim."
Replace any non-VERIFIED claim in the draft with [CLAIM NEEDS VERIFICATION: <original>].
Append the verification log at the end of the draft.
`
```

Skill invocation examples:

```
`/content-voice --channel=mindset --topic="why we killed Confluence" --length=long
/content-voice --channel=ainative --folk=true --topic="claude code first hour" --banner=true
`
```

## Gotchas

- Don't generate the voice rule by hand — synthesize from the corpus or it drifts toward generic AI-blog cadence. The corpus is the ground truth.
- One voice per channel; don't compose channels at runtime. Cross-pollinating voices destroys the audience contract.
- Fact-check MUST be a separate sub-agent call per claim, not a single "fact-check this whole post" pass — the latter hallucinates approval at the post level.
- Save the verification log inline in the draft; never strip it before the founder review.

## Variations

- **Lighter:** skip the banner step and the publishing wire-up; use the skill only for drafting, paste into the channel manually.
- **Heavier:** add a per-channel performance feedback loop — pull engagement data weekly, identify the highest-performing openings/closings, regenerate the voice rule from the top-30 posts every quarter.
- **Multi-author:** maintain `content-voice-{channel}-{author}.md` so co-founders can each publish in the same channel without collapsing into one voice.

## Tools

- Claude Code skill format.
- A folder of ~10 founder posts per channel (the larger the corpus, the more accurate the synthesis).
- Web-search MCP for fact-check (Parallel Search, Perplexity, Exa, or built-in WebSearch).
- Optional: image-gen MCP (Recraft / DALL-E) for matching covers.
- Optional: Telegram MCP / publishing MCP for one-click publish.
