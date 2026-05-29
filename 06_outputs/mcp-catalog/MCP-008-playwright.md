---
id: MCP-008
type: reference
kind: mcp-server
title: "Playwright MCP — браузер через accessibility-tree"
category: "MCP — Browser automation"
maintainer: vendor-official
transport: stdio
auth: none
status: active
package: "@playwright/mcp"
source: https://github.com/microsoft/playwright-mcp
provider: mcp-catalog
license: research-derived
ingested: 2026-05-29
version: v0.1
---
# Playwright MCP — браузер через accessibility-tree

> Браузер-автоматизация через accessibility-tree (без скриншотов и vision-моделей).

- **Назначение:** Браузер-автоматизация через accessibility-tree (без скриншотов и vision-моделей).
- **Когда брать:** E2E-проверка веб-UI, навигация, заполнение форм, «а работает ли в реальном браузере».
- **Мейнтейнер:** vendor-official (Microsoft)
- **Транспорт / запуск:** `npx @playwright/mcp@latest`
- **Секреты / доступ:** нет (Playwright сам ставит браузер)
- **Статус:** активен
- **Пакет / репозиторий:** `@playwright/mcp`
- **Безопасность:** Даёт агенту реальный браузер — используй изолированный профиль, не открывай чувствительные сессии.
- **Источник:** https://github.com/microsoft/playwright-mcp
