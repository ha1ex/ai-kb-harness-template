# Лог изменений KB

> Каждое значимое обновление (новый источник, новая wiki-страница, новое решение) — одна строка.
> Формат: `YYYY-MM-DD | <слой> | <краткое описание>`.
> Шаг 9 из ingest workflow в AGENTS.md.

## 2026-05-26

- (init) Создан репозиторий из шаблона `ai-kb-harness-template`.
- tools/viewer | generic Viewer (Vite + React + Tailwind 4): дизайн-система, 6 страниц, API, граф.
- scripts/skillopt | Phase 1–3: regression-тесты SKILL.md (multi-provider LLM), optimization loop (reflect/diff/apply/revert) + 2 graders, read-only MCP-сервер + страница /skillopt.
- README | TL;DR: 4 слоя, 4 сценария, границы ответственности.
- 06_outputs/cybos-cases | зеркало cybos.ai/cases — 418 кейсов в 11 категориях + scrapers.

## 2026-05-27

- 06_outputs/anthropics-skills | пилот anthropic agent skills — 12 Apache-2.0 + категория Design.
- 06_outputs/{fabric-patterns,claude-cookbooks} | +fabric 218 patterns +claude-cookbooks 84 notebooks +3 promoted SKILL.md → 732 единиц / 4 источника.
- 06_outputs | dedup + source-available cards + quality-probes (18/18 PASS), затем расширены до 42/42 PASS на 14 категорий.
- .claude/skills | interviewer-agent (auto-trigger «интервью» / «interview»).

## 2026-05-29

- 06_outputs/_audit-report-2026-05-29.md | всесторонний аудит (двойная оптика «шаблон / реальная KB»), 6 измерений, scorecard + backlog.
- harness + контент | фиксы аудита: supply chain (`protobufjs` override), viewer security (allowlist .md + bind 127.0.0.1), сужены permissions + наполнен deny, онбординг (`.nvmrc`/`engines`/`setup`/CI), таймауты на `spawnSync`, path-guard в skillopt MCP, заполнен semantic invariant, задокументирован external-corpus, cybos licensing (provider/license ×418), помечены 7 fabric-стабов. Детали — в `CHANGELOG.md`.
- 06_outputs/mcp-catalog/ | каталог базовых MCP — 12 серверов (7 reference + Playwright, Chrome DevTools, Context7, GitHub, Brave Search) + `baseline.mcp.json` (keyless-набор). Отобрано по deep-research май 2026.
