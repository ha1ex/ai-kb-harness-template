---
id: B-212
tier: B
category: "Data & BI"
kind: skill
title: "Data-visualization critique and design with Tufte principles"
subtitle: "Problem solved: Chart and dashboard review is vibes-based (\"looks fine\"); a skill turns it into a principled, repeatable critique with a falsifiable integrity metric."
source: https://www.cybos.ai/cases/B-212
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · analyst · marketer · anyone shipping charts or dashboards"
type: case
version: v0.1
---
# Data-visualization critique and design with Tufte principles

> Problem solved: Chart and dashboard review is vibes-based ("looks fine"); a skill turns it into a principled, repeatable critique with a falsifiable integrity metric.

## What

A Claude Code skill that applies Edward Tufte's data-visualization principles both to design new charts and to critique existing ones. It supplies evaluation checklists rather than code: a 7-question Tufte Test, a 14-question Extended Tufte Test, the Lie Factor calculation, and the Eraser Test, plus reference docs on data-ink ratio, chartjunk elimination, graphical integrity, small multiples, sparklines, and information density.

## Why it matters

Most chart review stops at "looks fine." This replaces that with a checklist and a falsifiable integrity metric — the Lie Factor (size of effect shown in the graphic ÷ size of effect in the data; 1.0 = truthful). It catches misleading axes, decorative chartjunk, and low information density before a chart ships in a board deck, investor update, or marketing report.

## End-to-end

1. **Install the skill.** Fetch its `SKILL.md` plus the two reference docs into `.claude/skills/`.
2. **For a new visualization:** clarify the data story and audience → pick the viz type → design with the minimum necessary elements → run the evaluation checklist before shipping.
3. **For a critique:** compute the Lie Factor to verify graphical integrity → list decorative/chartjunk elements → assess the data-ink ratio → output specific, ranked improvements.
4. **Gate on the Tufte Test** (7 questions) or the Extended Tufte Test (14 questions) as a publish check.

## Gotchas

- **Checklist, not code** — it guides judgment, it doesn't render charts; pair with your existing charting tool.
- **Critique quality depends on the agent actually seeing the chart** — paste the image, not just a description.

<hr/>

## Tools

- Claude Code
- The skill files (SKILL.md + two reference docs), installable from the public gist:

```
`# fetch SKILL.md + references from the gist into.claude/skills/tufte-viz/
https://gist.github.com/aparente/e48c353755958621b3c0004593105a90
`
```

- Image input when critiquing an existing chart (the agent must see the chart)
