# Skills

> Скиллы — это явно описанные рабочие процедуры с триггерами.
> Когда Claude видит триггер (фразу или паттерн файла), он открывает соответствующий SKILL.md
> и следует ему пошагово.

## Формат

Каждый скилл — отдельный markdown-файл с frontmatter:

```yaml
---
name: skill-имя
triggers:
  phrases: ["короткая фраза", "ещё одна"]
  files: ["паттерны файлов"]
  events: ["события"]
description: что скилл делает
inputs: какие артефакты читает
outputs: какие артефакты создаёт
---
```

## Текущие скиллы

- [`skill-ingest.md`](./skill-ingest.md) — обработка нового артефакта по 9-шаговому workflow из AGENTS.md
- [`skill-decision-log.md`](./skill-decision-log.md) — добавление решения с rationale и evidence

## Как добавлять

1. Создайте `skills/skill-<name>.md` с frontmatter (см. формат выше)
2. Опишите процедуру явными шагами — Claude будет следовать им буквально
3. Добавьте ссылку на скилл в этот README
4. Если скилл часто запускается — пропишите его триггеры в `scripts/enrich-on-trigger.mjs` (опциональный UserPromptSubmit hook)
