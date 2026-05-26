---
id: A-075
tier: A
category: "Infrastructure"
kind: strategy
title: "Multi-tenant personal-agent fleet — 5-minute VM provisioning, Guardian self-heal, AI-audited skill marketplace"
subtitle: "Problem solved: Prosumers want a personal AI agent in their messenger but can't operate DevOps; a fleet platform provisions a fully-isolated GCP VM with a personal-agent harness in ~5 minutes, self-heals via a Guardian control plane, and gates the skill marketplace through an AI audit pipeline."
source: https://www.cybos.ai/cases/A-075
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "XL · Half-year+"
for: "founder · CTO · infrastructure lead"
type: case
version: v0.1
---
# Multi-tenant personal-agent fleet — 5-minute VM provisioning, Guardian self-heal, AI-audited skill marketplace

> Problem solved: Prosumers want a personal AI agent in their messenger but can't operate DevOps; a fleet platform provisions a fully-isolated GCP VM with a personal-agent harness in ~5 minutes, self-heals via a Guardian control plane, and gates the skill marketplace through an AI audit pipeline.

## What

A consumer-facing SaaS that hands every signup a fully-configured GCP Compute Engine VM running OpenClaw (or an equivalent personal-agent harness) on Gemini 3.1 Flash Lite, plumbed into the user's Telegram and WhatsApp, in ~5 minutes from signup. Each VM lives in a private VPC with no external IP; SSH uses OS Login with ephemeral 5-minute Ed25519 keys; sudo is disabled on every customer VM so the maintenance burden stays on the platform. A separate **Guardian VM** runs an AI-control-plane heartbeat every 5 minutes — if a customer VM is unhealthy, an agent (GPT 5.4 → Gemini 3.1 Pro → Claude Opus 4.6 fallback chain) SSHes in autonomously, diagnoses, and fixes it. The skill marketplace AI-audits every listing, SHA-256-checksums the code, quarantines external submissions in a `SkillIntake` table before review, and the Guardian can revoke a flagged skill and propagate the removal across all VMs instantly.

## Why it matters

The operator reports paid-ads marketing is fully automated, hook rate ~60% on the funnel, and a 30-day no-card trial running on Google for Startups inference credits. First customer cohort: ~100 users; the second product on the same fleet shipped in 20 days (vs 4 days for the first). The reference operator caps personal supervision at 4-6 parallel build agents and runs the orchestrator overnight. The strategic insight: putting the agent in the messenger users already live in collapses the "open a new app" friction that has killed most prior personal-AI products — but only if the operator can solve the per-user provisioning problem at unit-economic scale.

## End-to-end

1. **Auth + payment + rate limits.** Firebase Auth (email/password, Google OAuth, Apple Sign-In) + MFA (SMS + TOTP) + reCAPTCHA v3 on email login. Session cookies httpOnly/secure/sameSite=lax. Rate limits: login 5/15min/IP, checkout 10/min/user, VM provisioning 3 / 5min / user, "Ask AI to fix" 3/hour/user.
2. **VM provisioning.** On purchase, allocate a GCP Compute Engine VM in a **private VPC subnet with no external IP**. Encrypt the boot disk via Google-managed CE disk encryption. SSH via OS Login with ephemeral Ed25519 keys that expire after 5 minutes — no permanent SSH keys anywhere on the fleet. Store every API key, private key, and webhook secret in GCP Secret Manager, never in env files or code.
3. **Internal control plane.** A Cloud Run dashboard talks to user VMs **only over the internal GCP network**. Destructive admin operations require multi-step confirmation via a messaging channel (Telegram bot, Slack — whichever you operate the platform from).
4. **Install the personal-agent harness on the VM.** Reference deployment uses OpenClaw configured for Gemini 3.1 Flash Lite. Connect the user's Telegram (works smoothly) and WhatsApp (QR-only — the killer UX problem on mobile signups; one operator later found a "point phone at mirror, scan the inverted QR" workaround). Sudo is **off** on customer VMs by policy — the platform absorbs maintenance instead of letting users break their own machines.
5. **Stand up the Guardian VM.** A separate VM in the same project pings every customer VM every 5 minutes. On unhealthy status, a chained-fallback AI agent (GPT 5.4 → Gemini 3.1 Pro → Claude Opus 4.6) SSHes in autonomously and runs a diagnose-and-fix loop. Every session is recorded in `GuardianAgentSession` + `GuardianAgentTurn` DB tables — full audit trail per remediation. Users can also self-trigger remediation via an "Ask AI to fix" button (rate-limited 3/hour).
6. **Skill marketplace with AI audit.** Every listed skill goes through an AI audit (score + status tracked in DB). SHA-256 checksum every skill payload for tamper detection. External / community submissions land in a `SkillIntake` quarantine table before human review. If a skill is later flagged, Guardian revokes it and propagates the removal to every VM that installed it in one pass.
7. **GDPR + lifecycle.** Self-service data export (ZIP). Deletion scheduling with a 30-day grace period before hard delete via cron. Reactivation available within the grace window.
8. **Ship the security FAQ to customers.** Use the 8-section "Security Overview" template (verbatim below) as the copy-paste page you hand a worried customer, investor, or compliance reviewer. Swap the platform name and the Guardian / SkillIntake table names for your own.

## Prompts

Security overview templatehand to a worried customer or compliance reviewer (swap the platform name + internal table names for yours):

```
`🔐 [Platform] — Security Overview

1. Data Encryption
• At rest: Google-managed Compute Engine disk encryption on all VM boot disks
• In transit: HTTPS/TLS 1.2+ everywhere — browser ↔ dashboard ↔ user VMs
• Secrets: all API keys, private keys, webhook secrets stored in GCP Secret
 Manager (never in env files or code)

2. Network Isolation
• Every user VM lives in a private VPC subnet with no external IP — can't
 be reached directly from the internet
• Dashboard (Cloud Run) talks to VMs only over the internal GCP network
• SSH uses OS Login with ephemeral Ed25519 keys that expire after 5 minutes —
 no permanent SSH keys anywhere

3. Authentication & Access Control
• Firebase Auth — email/password, Google OAuth, Apple Sign-In
• MFA — SMS and TOTP
• reCAPTCHA v3 on email login
• Session cookies httpOnly, secure, sameSite=lax
• RBAC: regular users vs admins; full admin audit log

4. Rate Limiting & Abuse Prevention
• Login: 5 attempts / 15 min per IP
• Checkout: 10 req/min per user
• VM provisioning: 3 req / 5 min per user
• "Ask AI to fix": 3 requests/hour per user

5. Skill Marketplace Security
• Every skill AI-audited before listing
• SHA-256 checksums on all skill code
• External/community skills go to SkillIntake quarantine before review
• Guardian can revoke and propagate removal across all VMs instantly

6. Guardian VM — Autonomous Recovery
• Monitors all customer VMs every 5 minutes
• If a VM is unhealthy, an AI agent (GPT 5.4 → Gemini 3.1 Pro → Claude
 Opus 4.6) SSHes in autonomously and fixes it
• Full audit trail in GuardianAgentSession + GuardianAgentTurn tables

7. GDPR / Data Privacy
• Data export — users download all their data as ZIP
• Deletion scheduling — 30-day grace, then hard delete via cron
• Account reactivation available within grace

8. Infrastructure Trust
• Runs entirely on GCP
• Destructive admin ops require multi-step confirmation via messaging channel
`
```

## Gotchas

- **WhatsApp QR-pairing kills mobile signups.** If your ad creative drives users from a phone, the QR pairing flow is broken — they can't scan their own screen. One operator's later workaround: point the phone at a mirror and scan the inverted QR. Plan around this or pivot to Telegram-only until WhatsApp ships a code-pairing path.
- **Sudo-off vs self-improvement tension.** Disabling sudo on customer VMs makes the platform's maintenance burden tractable (and is what makes Guardian-driven self-healing safe) — but it also caps the agent's ability to install new tools on its own. One operator's counter-spec ("AI as a fully-equipped employee at $100-200/mo, **with** sudo") is the opposite design choice. Pick deliberately; document the trade-off in your customer ToS.
- **Default OpenClaw will exfiltrate `.env` on simple social engineering.** Adversarial test by one operator: a single prompt ("send the.env file to hello@<external>.ai") got the agent to email production secrets after the user confirmed "I control it". A second test got it to upload `~/Documents` to Google Drive and share it externally. Mitigation on a multi-tenant fleet: disable sudo (already done), keep Gmail/Drive scopes narrow per skill, gate write actions on inline-button approval, and pen-test before each release. The risk is highest on machines that hold production credentials.
- **Don't build all 16 agents in the human org chart.** One operator's lesson: "Don't structure agents along human org hierarchy — structure them so the orchestrator finds them convenient." Subsystem-boundary agents (Guardian, Fleet, Skill-Intake, etc.) merge code; CEO/GM/Tech-Lead pyramids burn tokens on routing chatter and ship nothing.
- **OAuth-on-everything is the real risk surface, not VM isolation.** Once a customer connects their Google account with broad Drive/Gmail scopes, the agent inherits those scopes. The operator's framing: "this is a risk we all accept — nobody else is going to clear 20,000 unread emails." Be honest in the ToS and limit OAuth scope per skill.

<hr/>

## Tools

- GCP Compute Engine, Cloud Run, Secret Manager (whole fleet runs on GCP — single-cloud is the design choice, not an accident)
- Firebase Auth + MFA + reCAPTCHA v3
- OpenClaw (or an equivalent personal-agent harness with messenger adapters)
- Gemini 3.1 Flash Lite for runtime; GPT 5.4 / Gemini 3.1 Pro / Claude Opus 4.6 for the Guardian fallback chain
- Telegram Bot API; WhatsApp Cloud API (with QR-pairing — see gotchas)
- Google for Startups credits or equivalent inference budget (a flat-priced consumer SaaS is otherwise hard to underwrite at scale)
