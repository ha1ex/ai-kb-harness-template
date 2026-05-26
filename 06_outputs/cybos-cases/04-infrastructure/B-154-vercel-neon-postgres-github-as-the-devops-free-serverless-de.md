---
id: B-154
tier: B
category: "Infrastructure"
kind: pattern
title: "Vercel + Neon Postgres + GitHub as the DevOps-free serverless default"
subtitle: "Problem solved: Solo founders shipping AI-generated apps without learning Ansible / Terraform / AWS need a default stack that handles deploy, DB, and CI on git push — and stays inside one person's mental model."
source: https://www.cybos.ai/cases/B-154
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "S · Days"
for: "founder · vibecoder · solo engineer"
type: case
version: v0.1
---
# Vercel + Neon Postgres + GitHub as the DevOps-free serverless default

> Problem solved: Solo founders shipping AI-generated apps without learning Ansible / Terraform / AWS need a default stack that handles deploy, DB, and CI on git push — and stays inside one person's mental model.

## What

Default stack for any vibecoded web app: code in a GitHub repo, Vercel watches the repo and auto-builds + auto-deploys preview and production environments on push, Neon as the Postgres backend (serverless, branchable per PR), no separate CI infrastructure, no servers to configure, no firewall rules, no `terraform apply`. The agent (Claude Code / Cursor / Codex) ships features and the stack ships them to production.

## Why it matters

Eliminates the entire class of "agent ran a partial fallback and now my port-5432 is on the public internet" failures — there is no port-5432 because there is no server. Operators report it covers 90% of real web-app needs; the failure mode is well-defined (it does not scale to 100%-CPU workloads like video transcoding, where bare-metal or AWS+spot is still 10× cheaper).

## End-to-end

1. Create a GitHub repo for the project.
2. Sign up for Vercel; connect the repo. Every push → preview deploy on a branch URL; merge to `main` → production.
3. Sign up for Neon; create a Postgres database. Use Neon's branch-per-environment feature so preview deploys get their own DB branch.
4. Wire the Neon connection string into Vercel as an environment variable (one for production, one for preview).
5. Tell Claude Code / Cursor / Codex: "this project deploys to Vercel on push, DB is Neon, no other infra exists, do not generate Dockerfiles or `terraform` configs". The agent stops trying to spin up servers.
6. For background jobs / scheduled work, prefer Vercel Cron or a Neon-side function before reaching for a separate worker tier.
7. When you hit the 90/10 cliff (heavy compute, sustained CPU, real-time video), add one purpose-specific bare-metal or cloud-VM tier rather than re-platforming the whole app.

## Gotchas

## Agents asked to "configure the server" while operating in this stack will sometimes generate Ansible roles or Dockerfiles "as a fallback" — and silently expose services that should be private. The fix is upstream: state explicitly in your project's `CLAUDE.md` / `AGENTS.md` that the stack is Vercel + Neon + GitHub, that no servers exist, and that any generated `docker-compose.yml`, `terraform/`, or `ansible/` directory is a hallucination to be deleted. Alternative for solo projects that don't need DB / Postgres at all: Cloudflare Workers (one operator's move-everything-to-Workers preference for scrape-analyze-enrich micro-pipelines).

## Tools

- GitHub account.
- Vercel (free tier sufficient for many side-projects; Pro for production).
- Neon Postgres.
- One of: Claude Code, Cursor, Codex — configured to know the stack.
