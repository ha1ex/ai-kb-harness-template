---
id: B-052
tier: B
category: "Data & BI"
kind: workflow
title: "Churn prediction — start rule-based, mature into ML"
subtitle: "\"We need ML to predict churn\" is a multi-quarter project. Rule-based v1 (volume drop, tickets up, logins declining) captures most of the 1% lift today."
source: https://www.cybos.ai/cases/B-052
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "data analyst · CS lead · growth"
type: case
version: v0.1
---
# Churn prediction — start rule-based, mature into ML

> "We need ML to predict churn" is a multi-quarter project. Rule-based v1 (volume drop, tickets up, logins declining) captures most of the 1% lift today.

## What

A scoring job that runs daily over the warehouse, flagging accounts at elevated churn risk. V1 is a rule stack: transaction volume drop > 40%, support tickets up 3×, login frequency declining 2 weeks running. V2 layers a light gradient-boosted model trained on historical churn labels. Output writes to the CRM as a `churn_risk` field that triggers a retention workflow.

## Why it matters

A mid-size payments group sized 1% churn reduction at ~$1.4M/year on an 80K-merchant base; even rule-based v1 is enough to capture most of it. Crucially, you do NOT need a warehouse to ship v1 — a few SQL queries against the production billing DB plus a CRM API write are enough to validate before investing in DWH.

## End-to-end

1. **List 3–5 signals you can compute today** from billing + product DB.
2. **Hand-tune thresholds** with one CS lead over a week — calibrate to historical churners.
3. **Schedule a daily SQL job** that writes churn_risk_score into the CRM.
4. **Wire a retention play per tier.** Low risk = nothing. Medium = automated email + CS heads-up. High = call from named manager within 24h.
5. **Track outcomes for 60 days.** Compare retention of flagged-and-acted vs flagged-and-ignored.
6. **Once you have 6+ months of labels**, train a gradient-boosted model on the same features; ship the model output as an additional CRM field side-by-side with rules.
7. **Retire rules selectively** as the model proves stable per segment.

## Gotchas

- "We can't build churn until we have a warehouse" is a six-month delay disguised as engineering hygiene. Start rule-based against the prod DB; the warehouse build runs in parallel.

## Tools

- Production DB read access
- CRM with custom-field write API
- A scheduler (cron / dbt / Airflow)
- For v2: a hosted notebook (Hex, Mode) and gradient-boosting library
