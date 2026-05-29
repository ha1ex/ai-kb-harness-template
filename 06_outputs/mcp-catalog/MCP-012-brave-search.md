---
id: MCP-012
type: reference
kind: mcp-server
title: "Brave Search MCP — веб-поиск как контекст"
category: "MCP — Docs & web search"
maintainer: vendor-official
transport: stdio
auth: api-key
status: active
package: "@brave/brave-search-mcp-server"
source: https://github.com/brave/brave-search-mcp-server
provider: mcp-catalog
license: research-derived
ingested: 2026-05-29
version: v0.1
---
# Brave Search MCP — веб-поиск как контекст

> Веб / новости / картинки / локальный поиск как контекст для LLM.

- **Назначение:** Веб / новости / картинки / локальный поиск как контекст для LLM.
- **Когда брать:** Дать агенту актуальный веб-поиск.
- **Мейнтейнер:** vendor-official (Brave)
- **Транспорт / запуск:** `npx @brave/brave-search-mcp-server`
- **Секреты / доступ:** нужен BRAVE_API_KEY
- **Статус:** активен (замена reference)
- **Пакет / репозиторий:** `@brave/brave-search-mcp-server`
- **Безопасность:** Ключ Brave храни в env, не коммить. Старый @modelcontextprotocol/server-brave-search в архиве — это официальная замена от Brave.
- **Источник:** https://github.com/brave/brave-search-mcp-server
