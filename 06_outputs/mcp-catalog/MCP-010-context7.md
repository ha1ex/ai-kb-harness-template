---
id: MCP-010
type: reference
kind: mcp-server
title: "Context7 MCP — свежая документация библиотек"
category: "MCP — Docs & web search"
maintainer: vendor
transport: stdio / remote
auth: optional-key
status: active
package: "@upstash/context7-mcp"
source: https://github.com/upstash/context7
provider: mcp-catalog
license: research-derived
ingested: 2026-05-29
version: v0.1
---
# Context7 MCP — свежая документация библиотек

> Подмешивает свежую version-specific документацию библиотек прямо в промпт.

- **Назначение:** Подмешивает свежую version-specific документацию библиотек прямо в промпт.
- **Когда брать:** Писать код против актуального API библиотеки (борьба с устаревшими знаниями LLM).
- **Мейнтейнер:** vendor (Upstash)
- **Транспорт / запуск:** `npx -y @upstash/context7-mcp  (или remote https://mcp.context7.com/mcp)`
- **Секреты / доступ:** API-ключ опционален (повышает rate-limit)
- **Статус:** активен
- **Пакет / репозиторий:** `@upstash/context7-mcp`
- **Безопасность:** Только чтение публичной документации.
- **Источник:** https://github.com/upstash/context7
