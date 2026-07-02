---
type: synthesis
title: "Walkthrough: гипотезы пилота AI-ассистента поддержки"
date: 2026-06-30
confidence: medium
related:
  - /03_wiki/walkthrough-deflection-rate.md
tags: [walkthrough]
---

# Гипотезы пилота AI-ассистента поддержки

> **Walkthrough-пример.** Слой `04_synthesis` — интерпретация поверх источников: каждое
> утверждение несёт метку (`FACT`/`INFERENCE`/`UNKNOWN`…) и цитату на **более низкий** слой
> (provenance-гейт), FACT/DECISION без цитаты не пройдут claim-coverage в CI.

FACT: ~40% тикетов — повторяющиеся вопросы про интеграции и биллинг, средний тикет занимает
18 минут работы агента. [source: /02_sources/2026-06-30-walkthrough-interview-cto.md] [conf: high]

FACT: критерий успеха пилота — deflection rate ≥ 20% на типовых категориях при CSAT ≥ 4.5.
[source: /02_sources/2026-06-30-walkthrough-interview-cto.md]

INFERENCE: если ассистент закроет 25% повторяющихся тикетов, команда выиграет ~27 часов
в месяц (900 × 0.4 × 0.25 × 18 мин) — этого достаточно, чтобы пилот окупил себя по времени
команды уже в первый квартал. [source: /02_sources/2026-06-30-walkthrough-interview-cto.md] [conf: medium]

INFERENCE: ограничение «данные не покидают контур» при простаивающем GPU-сервере делает
локальную модель предпочтительнее облачного API с DPA — меньше юридических согласований.
[source: /02_sources/2026-06-30-walkthrough-interview-cto.md] [conf: low]

UNKNOWN: фактическое распределение тикетов по категориям — нет выгрузки из хелпдеска.
Закрыл бы: экспорт тикетов за 3 месяца с категориями (положить в `01_raw/`, саммари в `02_sources/`).
