---
type: decision
title: "Walkthrough: решение о рамке пилота AI-ассистента"
date: 2026-06-30
status: accepted
related:
  - /04_synthesis/walkthrough-pilot-hypotheses.md
tags: [walkthrough]
---

# Решение: пилот AI-ассистента — локальная модель, две категории, месяц

> **Walkthrough-пример.** Слой `05_decisions` — принятое решение с rationale: метка `DECISION:`
> обязательна (хук `check-decisions`), цитаты — только на более низкие слои (04 и ниже).

DECISION: запускаем пилот на один месяц на двух категориях (интеграции, биллинг) на локальной
модели; guardrail — CSAT ≥ 4.5, при просадке пилот останавливается немедленно.
[source: /04_synthesis/walkthrough-pilot-hypotheses.md]

## Rationale

- Повторяющиеся категории дают наибольший эффект при наименьшем риске: это 40% потока.
  [source: /02_sources/2026-06-30-walkthrough-interview-cto.md]
- Локальный хостинг снимает вопрос DPA и укладывается в ограничение по данным.
  [source: /02_sources/2026-06-30-walkthrough-interview-cto.md]

## Отклонённые варианты

- Облачный API с DPA — дольше юридический цикл, чем длится сам пилот.
- Все категории сразу — размывает метрику и растит риск просадки CSAT.
