---
id: MCP-009
type: reference
kind: mcp-server
title: "Chrome DevTools MCP — живой Chrome для агента"
category: "MCP — Browser automation"
maintainer: vendor-official
transport: stdio
auth: none
status: active
package: "chrome-devtools-mcp"
source: https://github.com/ChromeDevTools/chrome-devtools-mcp
provider: mcp-catalog
license: research-derived
ingested: 2026-05-29
version: v0.1
---
# Chrome DevTools MCP — живой Chrome для агента

> Доступ к живому Chrome: performance traces, network, console, debugging.

- **Назначение:** Доступ к живому Chrome: performance traces, network, console, debugging.
- **Когда брать:** Диагностика производительности и сети реальной страницы.
- **Мейнтейнер:** vendor-official (Google)
- **Транспорт / запуск:** `npx -y chrome-devtools-mcp@latest`
- **Секреты / доступ:** нет (нужен установленный Chrome)
- **Статус:** активен
- **Пакет / репозиторий:** `chrome-devtools-mcp`
- **Безопасность:** Полный контроль над Chrome — изолируй профиль.
- **Источник:** https://github.com/ChromeDevTools/chrome-devtools-mcp
