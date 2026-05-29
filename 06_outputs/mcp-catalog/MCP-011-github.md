---
id: MCP-011
type: reference
kind: mcp-server
title: "GitHub MCP — repos, issues, PR, Actions"
category: "MCP — Code & VCS"
maintainer: vendor-official
transport: remote / docker
auth: oauth
status: active
package: "github/github-mcp-server"
source: https://github.com/github/github-mcp-server
provider: mcp-catalog
license: research-derived
ingested: 2026-05-29
version: v0.1
---
# GitHub MCP — repos, issues, PR, Actions

> Работа с репозиториями, issues, pull request, Actions и code search на GitHub.

- **Назначение:** Работа с репозиториями, issues, pull request, Actions и code search на GitHub.
- **Когда брать:** Агенту нужно действовать в GitHub без ручного копирования.
- **Мейнтейнер:** vendor-official (GitHub)
- **Транспорт / запуск:** `remote https://api.githubcopilot.com/mcp/  (или Docker ghcr.io/github/github-mcp-server)`
- **Секреты / доступ:** OAuth (remote) или PAT (локально)
- **Статус:** активен (reference-версия в архиве)
- **Пакет / репозиторий:** `github/github-mcp-server`
- **Безопасность:** Remote с OAuth — выдавай минимальный scope. Reference-сервер @modelcontextprotocol/server-github в архиве; официальный — у самого GitHub (Go).
- **Источник:** https://github.com/github/github-mcp-server
