---
id: MCP-001
type: reference
kind: mcp-server
title: "Filesystem MCP — файловые операции с allowlist"
category: "MCP — Reference core"
maintainer: official-reference
transport: stdio
auth: none
status: active
package: "@modelcontextprotocol/server-filesystem"
source: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
provider: mcp-catalog
license: research-derived
ingested: 2026-05-29
version: v0.1
---
# Filesystem MCP — файловые операции с allowlist

> Безопасное чтение/запись файлов в явно разрешённых каталогах.

- **Назначение:** Безопасное чтение/запись файлов в явно разрешённых каталогах.
- **Когда брать:** Агенту нужен доступ к локальным файлам проекта без shell.
- **Мейнтейнер:** official reference (modelcontextprotocol/servers)
- **Транспорт / запуск:** `npx -y @modelcontextprotocol/server-filesystem <разрешённые-каталоги>`
- **Секреты / доступ:** нет (обязателен allowlist каталогов)
- **Статус:** активен (reference)
- **Пакет / репозиторий:** `@modelcontextprotocol/server-filesystem`
- **Безопасность:** Передавай только нужные каталоги — НЕ корень FS и не $HOME; сервер ограничен переданным allowlist.
- **Источник:** https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
