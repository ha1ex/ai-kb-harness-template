---
type: index
kind: mcp-catalog
title: "Каталог базовых MCP-серверов"
provider: mcp-catalog
ingested: 2026-05-29
version: v0.1
---

# Каталог базовых MCP-серверов

> Курируемый набор из 12 MCP-серверов «dev-core», востребованных в повседневной разработке и
> AI-агентной работе. Отобран по research-отчёту (см. `_audit-report`-стиль first-source verification,
> май 2026). Это **external corpus** — зеркало внешних инструментов, не собственный синтез проекта
> (см. `AGENTS.md` § External corpus).

> **Важно (актуальность):** в 2025 Anthropic урезал эталонный репозиторий до 7 reference-серверов,
> остальные классические перенесены в `servers-archived`. Здесь учтены актуальные замены
> (GitHub → `github/github-mcp-server`, Brave → `@brave/brave-search-mcp-server`).

## Категории

- **Reference core** — filesystem, fetch, git, memory, sequential-thinking, time, everything
- **Browser automation** — playwright, chrome-devtools
- **Docs & web search** — context7, brave-search
- **Code & VCS** — github

## Все серверы

| ID | MCP | Назначение | Мейнтейнер | Секреты/доступ |
|---|---|---|---|---|
| `MCP-001` | [filesystem](./MCP-001-filesystem.md) | Безопасное чтение/запись файлов в явно разрешённых каталогах. | official reference (modelcontextprotocol/servers) | нет (обязателен allowlist каталогов) |
| `MCP-002` | [fetch](./MCP-002-fetch.md) | Загрузка URL и конвертация HTML→markdown для LLM. | official reference (modelcontextprotocol/servers) | нет |
| `MCP-003` | [git](./MCP-003-git.md) | Чтение, поиск, diff и коммиты в локальном git-репозитории. | official reference (modelcontextprotocol/servers) | нет |
| `MCP-004` | [memory](./MCP-004-memory.md) | Персистентная память в виде графа знаний между сессиями. | official reference (modelcontextprotocol/servers) | нет |
| `MCP-005` | [sequential-thinking](./MCP-005-sequential-thinking.md) | Структурированное пошаговое рассуждение с ревизиями и ветвлением мысли. | official reference (modelcontextprotocol/servers) | нет |
| `MCP-006` | [time](./MCP-006-time.md) | Текущее время и конвертация между таймзонами. | official reference (modelcontextprotocol/servers) | нет |
| `MCP-007` | [everything](./MCP-007-everything.md) | Эталонный сервер, демонстрирующий tools/prompts/resources — для отладки клиента. | official reference (modelcontextprotocol/servers) | нет |
| `MCP-008` | [playwright](./MCP-008-playwright.md) | Браузер-автоматизация через accessibility-tree (без скриншотов и vision-моделей). | vendor-official (Microsoft) | нет (Playwright сам ставит браузер) |
| `MCP-009` | [chrome-devtools](./MCP-009-chrome-devtools.md) | Доступ к живому Chrome: performance traces, network, console, debugging. | vendor-official (Google) | нет (нужен установленный Chrome) |
| `MCP-010` | [context7](./MCP-010-context7.md) | Подмешивает свежую version-specific документацию библиотек прямо в промпт. | vendor (Upstash) | API-ключ опционален (повышает rate-limit) |
| `MCP-011` | [github](./MCP-011-github.md) | Работа с репозиториями, issues, pull request, Actions и code search на GitHub. | vendor-official (GitHub) | OAuth (remote) или PAT (локально) |
| `MCP-012` | [brave-search](./MCP-012-brave-search.md) | Веб / новости / картинки / локальный поиск как контекст для LLM. | vendor-official (Brave) | нужен BRAVE_API_KEY |

## Базовый набор «из коробки» (keyless)

Готовый к копированию конфиг — [`baseline.mcp.json`](./baseline.mcp.json): keyless-серверы
(filesystem, fetch, git, memory, sequential-thinking, time, Playwright, Context7) плюс локальные
`kb-local` / `skillopt-local` этого репозитория.

```bash
# скопировать как активный конфиг MCP (перезапишет .mcp.json — сначала проверь diff)
cp 06_outputs/mcp-catalog/baseline.mcp.json .mcp.json
```

Серверы с ключами/OAuth (**GitHub**, **Brave Search**) в baseline НЕ включены намеренно —
добавляй их вручную, держа секреты в env, не в git. `everything` — демо-сервер, в baseline не входит.

## Реестры для дискавери

- Официальный MCP Registry — https://registry.modelcontextprotocol.io/
- PulseMCP — https://www.pulsemcp.com/servers (крупнейший каталог + оценка трафика)
- Smithery — https://smithery.ai · Glama — https://glama.ai/mcp/servers · mcp.so — https://mcp.so
