---
id: B-019
tier: B
category: "HR & hiring"
kind: pattern
title: "JD template with affirmative essence + anti-patterns"
subtitle: "Generic JDs attract generic candidates. Affirmative essence + \"who we're NOT looking for\" filters before they apply."
source: https://www.cybos.ai/cases/B-019
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · hiring manager"
type: case
version: v0.1
---
# JD template with affirmative essence + anti-patterns

> Generic JDs attract generic candidates. Affirmative essence + "who we're NOT looking for" filters before they apply.

## What

A reusable markdown JD template with 12+ engineered sections that surface the right candidates and filter the wrong ones. Distinguishing features: an **affirmative essence** ("A person who builds growth through content — writes, packages, validates with users") instead of a bullet-list of responsibilities; an explicit **Who we're NOT looking for** (anti-pattern) list; an explicit **NOT KPI** line; **AI workflow fluency as a deal-breaker** must-have; Apply asking for a concrete AI usage example; a **Build Decisions Log** capturing review-time edits.

## Why it matters

Forces the hiring manager to declare anti-patterns before any candidate sees the JD — which dramatically improves screening signal and reduces founder-call no-gos. Aligns the JD with AI-native culture by making "daily AI user last year" a hard requirement instead of nice-to-have.

## End-to-end

1. Copy `examples/jd-template.md` into `Org/HR/hiring/{Company} {jd} [Role] – YYYY-MM-DD.md`.
2. Write the one-sentence affirmative essence first — verb-object, no negation stack.
3. Define 3 Functions with % split summing to 100.
4. Write Must-haves with junior/mid/senior thresholds; include AI workflow fluency as deal-breaker.
5. Write Who we're NOT looking for — at least 3 anti-patterns (e.g., "activity-in-chat performance", "career-senior-without-hands-on", "corporate-stability seekers").
6. Write KPI for first quarter AND an explicit NOT KPI line.
7. Compensation range in USD equiv; format; schedule.
8. Apply section asks for "how you use AI in work (concrete example, not 'I follow trends')".
9. Add Benchmarks table (per-region / comparable role).

## Gotchas

- **Don't reuse a generic JD template across roles.** The Build Decisions Log on a marketing-lead JD will not transfer to an engineering JD. Anti-pattern lists, must-haves, and the affirmative essence are all role-specific. A generic template that gets `sed`-ed across roles silently strips the signal that makes the JD work. Each new role: fresh JD pass.

<hr/>

## Tools

- Markdown; the JD template file; team review discipline
