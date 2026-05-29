---
id: MCP-003
type: reference
kind: mcp-server
title: "Git MCP — операции с локальным репозиторием"
category: "MCP — Reference core"
maintainer: official-reference
transport: stdio
auth: none
status: active
package: "mcp-server-git (PyPI)"
source: https://github.com/modelcontextprotocol/servers/tree/main/src/git
provider: mcp-catalog
license: research-derived
ingested: 2026-05-29
version: v0.1
---
# Git MCP — операции с локальным репозиторием

> Чтение, поиск, diff и коммиты в локальном git-репозитории.

- **Назначение:** Чтение, поиск, diff и коммиты в локальном git-репозитории.
- **Когда брать:** Агенту нужно работать с историей, диффами, ветками, коммитами.
- **Мейнтейнер:** official reference (modelcontextprotocol/servers)
- **Транспорт / запуск:** `uvx mcp-server-git --repository <path>`
- **Секреты / доступ:** нет
- **Статус:** активен (reference)
- **Пакет / репозиторий:** `mcp-server-git (PyPI)`
- **Безопасность:** Операции записи (commit) ограничены указанным репозиторием.
- **Источник:** https://github.com/modelcontextprotocol/servers/tree/main/src/git
