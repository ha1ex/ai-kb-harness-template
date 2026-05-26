---
id: A-082
tier: A
category: "Marketing & content"
kind: workflow
title: "Autonomous marketing experimentation harness with statistical auto-promotion"
subtitle: "Problem solved: Marketers run \"experiments\" by feel and call a winner after a week of eyeballing dashboards; an experiment engine logs every variant, applies real statistics, and only promotes a winner when it clears both significance and lift thresholds."
source: https://www.cybos.ai/cases/A-082
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "growth lead · head of marketing · content/email/SEO operator · marketing-team founder"
type: case
version: v0.1
---
# Autonomous marketing experimentation harness with statistical auto-promotion

> Problem solved: Marketers run "experiments" by feel and call a winner after a week of eyeballing dashboards; an experiment engine logs every variant, applies real statistics, and only promotes a winner when it clears both significance and lift thresholds.

## What

A Python-backed Claude Code skill that runs marketing experimentation the way an autoresearch loop runs (the source calls out Karpathy's "autoresearch" pattern by name). It manages A/B and multivariate tests per channel (content, email, LinkedIn, SEO, blog), logs data points as content publishes, scores each experiment with **bootstrap CI + Mann-Whitney U**, and **auto-promotes a winner to a living playbook only when p<0.05 AND lift ≥15%** — either condition alone will not promote. It supports batch mode up to 10 variants, emits a weekly cross-channel scorecard, runs pacing alerts against CRM/email/recruiting APIs, and suggests the next variable to test after a winner lands. The absorbed companion skill contributes a structured hypothesis template that the engine's `--hypothesis` flag is meant to carry.

## Why it matters

The standard marketing-experiment failure is stopping the test the moment the favored variant looks ahead — peeking, no sample-size discipline, no significance test, then "we learned X" written into the deck. This harness makes the rigor non-optional: low-volume channels (SEO, LinkedIn, blog) need 30 samples/variant before `score` returns anything but `running`, so there is no early call. Winners that clear the dual gate become reusable playbook rules that the next experiment loads *before* drafting, so proven patterns compound instead of being re-learned. The weekly cross-channel scorecard replaces an analyst's manual review pass; pacing alerts (exit code 1 = off pace) replace someone noticing a campaign is behind three weeks late.

## End-to-end

1. **Install and apply proven rules first.** Before creating any content for a channel, run `python3 experiment-engine.py playbook --agent <agent_name>` so already-promoted winners are applied — you do not re-test settled questions.
2. **Write a grounded hypothesis, then create the experiment.** Use the structured template (absorbed from the companion A/B skill): *"Because [observation/data], we believe [change] will cause [expected outcome] for [audience]. We'll know this is true when [metrics]."* Reject weak hypotheses ("button color might increase clicks") in favor of data-grounded ones. Then `python3 experiment-engine.py create --agent <agent_name> --hypothesis "..." --variable "..." --variants '["a","b"]' --metric "..." --cycle-hours 24`. Add `--batch-mode` for 3–10 variants.
3. **Log on every publish.** When each variant ships, log its result: `python3 experiment-engine.py log --agent <agent_name> --experiment-id <EXP-ID> --variant "..." --metrics '{"metric_name": value}'`.
4. **Score on schedule, never on impulse.** `python3 experiment-engine.py score --agent <agent_name> --experiment-id <EXP-ID>`. Status moves running → trending → keep (winner) / discard. Low-volume agents need 30 samples/variant before scoring is meaningful; scoring earlier just returns `running`. Winners auto-promote to the playbook when p<0.05 AND lift ≥15%.
5. **Run the weekly cross-channel scorecard.** `python3 autogrowth-weekly-scorecard.py [--weeks N] [--output file.md]` to produce a single review artifact across all channels.
6. **Wire pacing alerts.** `python3 pacing-alert.py [--json]` against the configured pipeline/email/recruiting APIs flags off-pace campaigns; exit 0 = on pace, exit 1 = alerts. Without the env vars set the script is a no-op, not an error.
7. **Pick the next test.** After a winner promotes, `python3 experiment-engine.py suggest --agent <agent_name>` recommends the next variable to vary so the loop continues.
8. **Maintain a continuous program (absorbed).** Score a prioritized backlog with ICE = (Impact + Confidence + Ease)/3, run highest-scoring first, target 4–8 experiments/month, expect a mature win rate of 20–30%, and audit the playbook quarterly. Sustained win rates well above 30% usually mean hypotheses are too conservative, not that execution is great.

## Prompts

Core engine commands (verbatim):

```
`python3 experiment-engine.py playbook --agent <agent_name>

python3 experiment-engine.py create \
 --agent <agent_name> \
 --hypothesis "What you expect to happen" \
 --variable "<variable_name>" \
 --variants '["variant_a", "variant_b"]' \
 --metric "<primary_metric>" \
 --cycle-hours 24

python3 experiment-engine.py log --agent <agent_name> --experiment-id <EXP-ID> --variant "..." --metrics '{"metric_name": value}'
python3 experiment-engine.py score --agent <agent_name> --experiment-id <EXP-ID>
python3 experiment-engine.py suggest --agent <agent_name>
python3 autogrowth-weekly-scorecard.py [--weeks N] [--output file.md]
python3 pacing-alert.py [--json]
`
```

Structured hypothesis template (verbatim, absorbed from the companion A/B-testing skill):

```
`Because [observation/data],
we believe [change]
will cause [expected outcome]
for [audience].
We'll know this is true when [metrics].

ICE Score = (Impact + Confidence + Ease) / 3
`
```

Install (verbatim — keep runnable):

```
`git clone https://github.com/ericosiu/ai-marketing-skills.git && cd ai-marketing-skills/growth-engine && pip install numpy scipy && cp SKILL.md <your-project>/.claude/skills/growth-engine.md
`
```

## Gotchas

- **Peeking is the headline failure mode.** Stopping a test before sample size is reached produces false positives. The 30-sample floor on low-volume agents is the guardrail — do not raise `--cycle-hours` pressure into early calls.
- **Both gates or no promotion.** p<0.05 alone, or ≥15% lift alone, will not promote. A statistically significant 4% lift is not worth shipping; a 30% lift at p=0.2 is noise.
- **Pacing alerts silently no-op without env vars.** If `PIPELINE_API_URL` etc. are unset the script exits clean — you will think pacing is monitored when nothing is wired. Verify the env block before relying on alerts.
- **Not for one-off content.** This tracks experiments only — it is not an analytics tool and does not configure campaigns in external platforms.
- **Win rate far above 30% is a smell, not a trophy.** It usually means the hypotheses are too safe to learn anything.

<hr/>

## Tools

- Claude Code — runs the skill
- Python 3.9+ with `numpy` and `scipy` — the statistical scoring (`pip install numpy scipy`)
- Env config: `GROWTH_ENGINE_DATA_DIR`, `GROWTH_ENGINE_AGENTS` (default `content,email,linkedin,seo,blog`)
- Tunable thresholds with defaults: `P_WINNER=0.05`, `P_TREND=0.10`, `LIFT_WIN=15.0`, `BOOTSTRAP_ITERATIONS=1000`, `BATCH_MODE_MAX_VARIANTS=10`, `LOW_VOLUME_AGENTS` 30 samples/variant, `HIGH_VOLUME_AGENTS` 10 samples/variant
- For pacing alerts only: `PIPELINE_API_URL`/`PIPELINE_AUTH_TOKEN`, `EMAIL_API_URL`/`EMAIL_AUTH_TOKEN`, `RECRUITING_API_URL`/`RECRUITING_AUTH_TOKEN`, `DAILY_LEAD_TARGET` (default 10)
