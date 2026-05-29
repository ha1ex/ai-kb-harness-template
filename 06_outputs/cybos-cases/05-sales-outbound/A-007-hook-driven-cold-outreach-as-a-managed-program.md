---
id: A-007
tier: A
category: "Sales & outbound"
kind: workflow
title: "Hook-driven cold outreach as a managed program"
subtitle: "Problem solved: \"Stood out\", \"resonated\", \"would love to\" get deleted. A gated, warmed, hook-anchored, SLA-backed cold-email program gets answered — and you fix volume before you fix copy."
source: https://www.cybos.ai/cases/A-007
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "SDR · BD lead · recruiter · founder doing investor outreach"
type: case
version: v0.1
---
# Hook-driven cold outreach as a managed program

> Problem solved: "Stood out", "resonated", "would love to" get deleted. A gated, warmed, hook-anchored, SLA-backed cold-email program gets answered — and you fix volume before you fix copy.

## What

A 5-stage outreach generator that refuses to write generic email, now wrapped as a **managed program** with four merged operating layers from public cold-email skill packs. The core engine: stage 1 extracts verbatim "hooks" from the target's recent public output ranked by specificity score; stage 2 picks the highest-scoring hook of a type not already used for that prospect (anti-repeat); stage 3 writes with vertical-aware positioning and a per-user sender identity; stage 4 runs a deterministic regex gate that bans the AI-tell vocabulary; stage 5 fact-checks every claim against source. The four merged layers — each described in its own sidebar below — turn this from a message generator into an end-to-end program: a **prerequisite gate** (refuses to write until ICP, trigger, offer, list, and warmed infra all pass), a **sequence taxonomy** (4 sequence types with per-touch day/word-count/CTA), a **domain-warming schedule** (5-week ramp with health bands), and a **Smartlead orchestration** path (campaign config straight through an MCP). The counter-intuitive program rule, lifted verbatim: *volume beats copy at the same conversion rate — fix volume before copy unless open rate is already above 30%.*

## Why it matters

Three compounding effects. **Specificity beats volume per message**: a hook-anchored note gets answered; "I came across your work and it really resonated" gets deleted. **Anti-repeat lets you re-engage the same target with a different angle** without burning the relationship. **But the program math dominates the copy math**: a public GTM skill's "outbound math" funnel makes this concrete — *100 emails/day × 5 days × 5% reply × 50% positive × 50% book × 20% close ≈ 1–2 customers/week*. Two implications fall out: (1) below ~30% open rate, the bottleneck is deliverability and volume, not prose — which is why the warming layer and the prerequisite gate exist; (2) replies are perishable, so the program carries a response-SLA matrix (positive 5 min, curious 1 hr, objection same-day, hard-no 24 hr) with scripts. The engine that writes the email is necessary; the program around it is what produces customers.

## End-to-end

1. **Run the prerequisite gate first (CHECK).** Before any copy is written, the program refuses unless all pass: ICP defined (company type + headcount + buying trigger), decision-maker title named, pain in the buyer's exact words, offer passes the **Stranger Test** (explainable in 15 seconds without jargon), a list exists with verified <3% bounce, and sending infrastructure is warmed (separate domain, SPF/DKIM/DMARC, warmup tool). This is the prerequisite-gate merge; treat a failed check as a hard stop, not a warning.
2. **Warm the sending domain (5-week ramp).** Run the domain-warming schedule before volume: daily caps step from 5–10 to 100–200/day over five weeks. Watch the health bands — bounce <2% healthy / 2–5% warning / >5% critical; spam <0.1%; open >40%; reply >5%. Do not start the campaign on a cold domain. (Domain-warming merge.)
3. **Build the signal store.** One row per prospect: seed post, bio, profile data, optional enrichment, optional research memo. SQLite, WAL mode, no Postgres at <100K targets.
4. **Hook extraction + pick the best unused hook.** Sonnet emits up to 5 typed hooks each with verbatim `raw_evidence`, `specificity_score 1–10`, `why_personal`, `suggested_angle`. Reject score <6. `pick_best_hook` drops hook types already tried on this prospect.
5. **Pick the sequence type, then write.** Choose from the 4-sequence taxonomy (Classic Cold 7e / Fast-Track 5e / Long-Play 12–14e / Event-Based) — see sidebar for day/word-count/CTA per touch. Then the Opus writer call: signal context + selected hook + previously rejected openers + per-user sender identity + vertical-positioning block + Hook → Evidence → Offer framework (cold 50–90 words / follow-up 30–50 / breakup 20–40).
6. **Deterministic validate gate.** Pure regex: reject on any banned word, em-dash, semicolon, unfilled placeholder, reaction-commentary phrase, or length outside 80–800. One retry, then stop.
7. **Fact-check (advisory).** Sonnet tags each factual claim `verified | unverifiable | contradicted`. Never blocks send; surfaces `needs_review`.
8. **Orchestrate the send + reply SLA.** Either the Smartlead MCP path (see sidebar) or any email infra with inbound webhook. Inbound `message.received` flips CRM status, posts to a team channel, and starts the response-SLA clock. Final activation is gated behind an explicit human "yes" / `update_campaign_status → START`.

##### Sidebar — Sequence taxonomy (from a public GTM plugin's outbound-email-strategy skill)

4 sequence types, picked by deal velocity and trigger:

```
`Classic Cold 7 emails / 2 weeks — Intro → Value Proof → Different Angle →
 Social Proof → Resource Share → Direct Ask → Breakup
Fast-Track 5 emails / 1 week — compressed Classic for hot triggers
Long-Play 12-14 emails / 4-6 weeks — for enterprise / long buying cycles
Event-Based 3-5 emails — anchored to a launch / raise / hire / conference
`
```

3-tier personalization with time budgets: Basic 30s / Researched 2–3 min / Deep 10–15 min.

Subject lines look like a colleague wrote them: 2–4 words, lowercase, no punctuation — e.g. `reply rates`, `hiring ops`, `Q2 forecast`. Banned opener: "Hope this email finds you well." Diagnostic: *if you remove the personalization and the email still makes sense, the personalization isn't working.*

Response-SLA matrix with scripts: Positive 5 min · Curious 1 hr · Objection same-day · Timing same-day · Referral 1 hr · Hard No 24 hr.

##### Sidebar — Domain warming (from a public claude-marketing cold-email-outreach skill)

```
`Week 1: 5-10/day Week 2: 20-30/day Week 3: 40-60/day
Week 4: 70-100/day Week 5+: 100-200/day (steady state)
Health bands: bounce <2% ok / 2-5% warn / >5% STOP
 spam <0.1% · open >40% · reply >5%
`
```

5 subject-line formulas by typical open rate: Mutual connection (very high) > Question (high) ≈ Specific result (high) > Curiosity (medium-high) > Direct (medium). Compliance: CAN-SPAM (US — opt-out, physical address, honest header) vs GDPR legitimate-interest (B2B EU — documented basis, opt-out, no special-category data) side by side.

##### Sidebar — Smartlead MCP orchestration (from a public goose-skills cold-email-outreach skill)

```
`get_email_accounts → walk ACTIVE/STARTED campaigns
detect free mailboxes: is_smtp_success=true AND is_imap_success=true AND not assigned
save_campaign_sequences (blank-subject to preserve the thread)
import leads in batches of 100
schedule: days_of_the_week:[1,2,3,4,5], start_hour:"08:00", min_time_btw_emails:10
GATE: mcp__smartlead__update_campaign_status → START only after explicit "yes"
`
```

Copy rule: Hook → Evidence → Offer, under 150 words, no "just checking in".

##### Sidebar — Prerequisite gate (from a public gated cold-email skill)

CHECK / DO / VERIFY skeleton. Refuses to write copy until: ICP defined · buying trigger named · decision-maker title named · pain in buyer's verbatim words · offer passes the **Stranger Test** (15-second jargon-free explanation) · verified list <3% bounce · warmed sending infra. Target metrics with remediation: open ≥30%, reply ≥1%, meeting ≥0.25%. Counter-intuitive rule (verbatim): *volume beats copy at the same conversion rate; fix volume before copy unless open rate is already above 30%.* Writing rules: no em-dashes, no buzzwords, sentences <20 words, first person, plain language.

## Prompts

Hook-extraction system prompt (excerpt, verbatim from production):

```
`You extract verbatim hooks from a founder's recent public output.
Output up to 5 hooks. Each hook has:
- type: one of [technical-claim, launch-detail, insight-question,
 pivot-reason, prior-work]
- raw_evidence: a VERBATIM quote from the source. NEVER paraphrase.
- source: tweet | l3_memo | harmonic | bio
- specificity_score: 1-10. Reject if < 6 before output.
- why_personal: why this hook is about THIS person, not "founders" generically.
- suggested_angle: one sentence on how to open with it.

If nothing in the source is specific enough, output {"hooks": []}.
Better to write nothing than to write generic.
`
```

Banned-word list parsed by the deterministic validator:

```
`stood out, caught my eye, following your work, impressive, incredible,
would love to, reach out, in the space, resonated, journey, thesis,
at the intersection, game-changing, cutting-edge, disruptive,
paradigm shift, hope this finds you, truly, genuinely, authentically,
fascinating, compelling, aligns with, came across
`
```

Plus: no em-dashes (`—`), no semicolons (`;`), no placeholders (`[name]`, `{role}`, `<X>`), no reaction-commentary regex, length in [80, 800].

## Gotchas

- **Fix volume before copy.** The single most counter-intuitive merged rule: at the same conversion rate, more warmed sends beat better prose. Only invest in copy once open rate is already ≥30%. Teams that obsess over personalization on a cold, unwarmed domain are optimizing the wrong variable.
- **The prerequisite gate is a hard stop, not a warning.** If the offer fails the Stranger Test or the list is unverified, the program must refuse to generate copy. Softening the gate re-introduces the exact spray-and-pray the engine exists to prevent.
- **Warm the domain or expect the spam folder.** Skipping the 5-week ramp blows the bounce/spam bands within days and burns the domain — there is no copy good enough to recover a domain in the >5% bounce band.
- **Empty hook output is the right output sometimes.** If nothing scores ≥6, return `{"hooks": []}` and refuse. Don't soften the threshold.
- **Fact-checker is advisory, not blocking.** Treat `unverifiable` as a yellow flag for human review.
- **One retry on the validator, then stop.** A second failure usually means the underlying signal is too thin.
- **The send-activation gate is non-negotiable.** Smartlead `update_campaign_status → START` (or any infra's send) fires only after an explicit human "yes". The skill configures; the human launches.
- **Don't reuse a template across verticals.** The vertical-positioning map is mandatory; the same opener lands very differently on different personas.
- **Reply-back mode skips hook extraction.** When a target replies, switch to the reply pipeline — the founder's actual question is the hook now.

## Variations

- **Reply-back mode.** Skip hook extraction. Load the full thread oldest→newest plus a `voice_doc.md` with canonical Q&A pairs, banned phrases, and example threads. Reply latency drops from ~30 min to ~2 min per reply.
- **Recruiter version.** Replace the vertical-positioning map with a role-positioning map. Same engine, anti-repeat, validator, gate.
- **Investor outreach.** Anchor hooks on the investor's most recent thesis tweet; sender identity is the founder's; positioning block carries round size, lead/co-lead status, and a traction one-liner. Use the Long-Play sequence.

## Tools

- Claude (Sonnet for extraction + fact-check, Opus for the writer) — runnable via `claude -p` at flat-rate cost
- SQLite for the prospect + attempt store
- A warmed, separate sending domain with SPF/DKIM/DMARC and a warmup tool
- Email infra with inbound webhook (AgentMail or equivalent) **or** Smartlead via MCP
- Per-user sender profile (name, role, signature, default tone)
- Optional public skill packs for the merged layers (install commands kept verbatim):
- sequence taxonomy + SLA matrix: `claude plugin marketplace add manojbajaj95/claude-gtm-plugin`
- domain warming + health bands: `git clone https://github.com/thatrebeccarae/claude-marketing.git && cp -r claude-marketing/skills/cold-email-outreach ~/.claude/skills/`
- Smartlead orchestration: `npx gooseworks install --claude`
- prerequisite gate: `curl -fsSL https://raw.githubusercontent.com/markster-public/markster-os/master/install.sh | bash` then `markster-os install-skills --skill cold-email`
