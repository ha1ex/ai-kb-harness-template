---
id: A-061
tier: A
category: "Marketing & content"
kind: pattern
title: "AI-driven design — claude.ai/design + design-system input + frontend-design skill"
subtitle: "Problem solved: Naked Claude Code or Cursor on a blank lander produces \"AI slop\" — identical ShadCN-default layouts. Feeding a real design system (Figma library or React kit) into claude.ai/design, or invoking the Anthropic frontend-design skill on top of a reference, yields production-grade output one-shot."
source: https://www.cybos.ai/cases/A-061
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "S · Days"
for: "founder · marketing lead · designer-orchestrator · solo engineer"
type: case
version: v0.1
---
# AI-driven design — claude.ai/design + design-system input + frontend-design skill

> Problem solved: Naked Claude Code or Cursor on a blank lander produces "AI slop" — identical ShadCN-default layouts. Feeding a real design system (Figma library or React kit) into claude.ai/design, or invoking the Anthropic frontend-design skill on top of a reference, yields production-grade output one-shot.

## What

Three converging surfaces moved the design-from-prompt category from toy to production within a single quarter:

- **claude.ai/design** — Anthropic's web app that ingests a Figma design system (or a React component kit) as the input style basis, then one-shots landing pages, pitch decks, and design-system artifacts that match the input. Multiple operators report it beats Lovable for this category once a design system is in the prompt.
- **Anthropic's official frontend-design skill** — a Claude Code skill that biases output toward production-grade layouts via reference images and structured prompts. Pairs with the [official guide](https://claude.com/blog/improving-frontend-design-through-skills) and the `awesome-claude-skills` index.
- **Magic Patterns + Claude Code via MCP** — alternative for code-first teams: Magic Patterns generates the landing visually, the MCP brings the result into the agent's codebase directly.

The pattern: don't ask the agent to invent style; give it a style and ask it to apply.

## Why it matters

Concrete operator outcomes from source-15: one founder fed an entire internal React kit into claude.ai/design and got a usable site one-shot. Another used it to one-shot pitch-deck candidates from his factory's deep-research output. A third operator's personal hobby site was built end-to-end by Claude with no human designer involvement and reported as praised by users. A fourth replicated a Stripe-quality session-summary card "one shot, then tuned with agents". Operator framing: this is *"a new milestone in vibe-coding sites and decks — it assembles a design system out of Figma and then ships any artifact"*. Lovable's positioning in this category collapsed visibly after the launch.

## End-to-end

1. **Prepare a design system as input.** Either (a) a Figma library with brand tokens (colors, fonts, spacing), components, and component descriptions; or (b) a working React component kit you already ship. The richer the input, the less the agent has to invent.
2. **Pick the surface for the artifact.** Decks and landings: `claude.ai/design`. Codebase-integrated landings: Magic Patterns + Claude Code MCP. Repo-resident React landings: Claude Code with the Anthropic frontend-design skill installed.
3. **Feed the design system in.** For claude.ai/design: paste or upload the Figma URL / React kit. For frontend-design skill: drop reference images and a one-line brand brief into the prompt directory the skill reads.
4. **Describe the artifact concretely.** "Pricing page with 3-tier table, founder testimonial below, FAQ accordion bottom." Not "make a SaaS site." Concrete component requests collide less with the design system's constraints.
5. **One-shot, then tune with agents.** First pass gets you 80%. Open the result in Claude Code or Cursor and run targeted agent passes for the remaining 20% (responsive breakpoints, copy variants, accessibility tags). One operator: *"one shot, then tuned with agents."*
6. **Optionally export to git for downstream use.** claude.ai/design can produce React components you can drop into a repo and iterate on with Claude Code.
7. **Pair with a hooks-enforced "no rectangles" rule.** When the agent is allowed to compose raw shapes instead of approved components, the design system collapses on session 3. One operator hard-enforces this via a `PreToolUse` hook (see ): the agent literally cannot assemble a slide from non-library primitives.
8. **Onboarding new clients still takes a day.** The pipeline assumes one canonical design system. Each new client requires re-encoding their brand into the "for-robots" format. One operator reports standardizing this onboarding so it takes a day per client rather than a sprint.

## Prompts

Reverse-engineered claude.ai/design system prompt (community-maintained reference) — verbatim repo cited:

```
`https://github.com/Trystan-SA/claude-design-system-prompt
`
```

Anthropic's official guide on the frontend-design skill — verbatim URLthread:

```
`https://claude.com/blog/improving-frontend-design-through-skills
`
```

Working artifact-brief shape, one paragraph each:

```
`1) Design system: link or paste of Figma library / React kit.
2) Artifact: deck | landing | pricing page | one-pager | dashboard mock.
3) Sections: ordered list of 3–8 concrete sections (hero / feature grid / pricing / FAQ / etc.).
4) Constraints: brand voice in 2 lines; required components from the library.
5) Out of scope: explicit list of what NOT to invent.
`
```

## Gotchas

- **No design system → ShadCN-default slop.** One operator's app-factory landings were "identical to the much-discussed compiler / browser articles" because the agent fell back to ShadCN defaults; the fix was forcing a design-system input on every run.
- **Reverse-engineered prompts are imperfect clones.** The harness behind claude.ai/design has non-prompt logic; community reverse-engineering reproduces 70% of the result, not 100%.
- **Cloning the surface in your own skills is hard.** "We tried to reproduce claude.ai/design with skills and context, but there's something else baked into the harness; need to dig deeper" — operator at. Use the hosted surface for one-shots; use the skill for repo work; don't try to merge them.
- **Designer pushback is real on niche apps.** One designer's critique of a Claude-built personal site: "overwhelming, no hierarchy — works for a niche where you have no competition, fails where you need retention via design." Use this pattern for landings, decks, and infrastructure marketing; pair with a designer for retention-critical product surfaces.
- **Anthropic owns the vertical now.** Lovable went quiet immediately after claude.ai/design launch. If you've invested in the prior generation of design-vibecoder tools, plan migration.

<hr/>

## Tools

- A Claude Pro / Max subscription for claude.ai/design access
- A design system in Figma (preferred) or a React component kit
- Claude Code with the Anthropic frontend-design skill installed (for repo-resident workflows)
- Optional: Magic Patterns + its MCP for codebase-integrated landings
- Optional: a `PreToolUse` hook enforcing "only compose approved components, never raw rectangles" (see )
