---
id: MCP-002
type: reference
kind: mcp-server
title: "Fetch MCP — загрузка веб-контента в markdown"
category: "MCP — Reference core"
maintainer: official-reference
transport: stdio
auth: none
status: active
package: "mcp-server-fetch (PyPI)"
source: https://github.com/modelcontextprotocol/servers/tree/main/src/fetch
provider: mcp-catalog
license: research-derived
ingested: 2026-05-29
version: v0.1
---
# Fetch MCP — загрузка веб-контента в markdown

> Загрузка URL и конвертация HTML→markdown для LLM.

- **Назначение:** Загрузка URL и конвертация HTML→markdown для LLM.
- **Когда брать:** Дать агенту читать веб-страницы и онлайн-документацию.
- **Мейнтейнер:** official reference (modelcontextprotocol/servers)
- **Транспорт / запуск:** `uvx mcp-server-fetch`
- **Секреты / доступ:** нет
- **Статус:** активен (reference)
- **Пакет / репозиторий:** `mcp-server-fetch (PyPI)`
- **Безопасность:** Может обращаться во внутреннюю сеть (SSRF-риск) — ограничивай среду запуска.
- **Источник:** https://github.com/modelcontextprotocol/servers/tree/main/src/fetch
