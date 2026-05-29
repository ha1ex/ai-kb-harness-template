---
id: B-157
tier: B
category: "Infrastructure"
kind: pattern
title: "Self-healing agent fleet — Guardian, remediation skills, sudo discipline"
subtitle: "Problem solved: Personal-agent fleets running 24/7 break in predictable ways (compaction failures, dead heartbeats, broken harness); a Guardian agent on a separate VM plus sudo-disabled customer VMs keep the fleet alive without human pages."
source: https://www.cybos.ai/cases/B-157
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "B Medium — Solid coverage with concrete examples"
effort: "M · Weeks"
for: "ops lead · engineering lead"
type: case
version: v0.1
---
# Self-healing agent fleet — Guardian, remediation skills, sudo discipline

> Problem solved: Personal-agent fleets running 24/7 break in predictable ways (compaction failures, dead heartbeats, broken harness); a Guardian agent on a separate VM plus sudo-disabled customer VMs keep the fleet alive without human pages.

## What

Splits the fleet into two roles. Customer-facing agent VMs run with sudo disabled — they cannot break their own machines beyond recovery. A separate maintenance VM hosts a Guardian agent (Claude Code or equivalent) with elevated SSH access; when a customer VM's harness fails, Guardian shells in, diagnoses, fixes, and writes the new fix back as a remediation skill the rest of the fleet inherits.

## Why it matters

Multi-tenant personal-agent fleets compound failures: one bot that loses its loop or runs out of context burns operator pager hours. Splitting blast radius (no sudo for the agent that's actually running user workloads) plus a dedicated repair worker that learns each new failure mode flips the on-call from manual to autonomous. One operator runs a self-administering agent that, when the primary harness breaks, invokes Claude Code in `-p` mode on the same VM to bring it back.

## End-to-end

1. Disable sudo on every customer-facing VM. The agent has only the privileges it needs to serve its user; nothing destructive.
2. Stand up a separate maintenance VM with elevated SSH keys to the fleet.
3. Run Guardian as a long-running agent on the maintenance VM with read access to fleet logs and write access via SSH.
4. Define a remediation-skill format: each new fix Guardian discovers becomes a skill file (problem signature → diagnostic → repair commands).
5. For on-VM self-administration: install Claude Code as a separate user/process; when the primary bot's harness errors out (compaction failure, dead heartbeat), the bot shells out to `claude -p` to repair itself.
6. Reference a published self-healing-fleet architecture write-up if you need a vetted multi-VPS shape; one operator's public blog walks through a working topology.

## Gotchas

## Without sudo discipline on customer VMs, the first agent that "fixes" its own filesystem also nukes its peers. Anti-pattern: granting Guardian root on production VMs out of laziness so it can `apt-get` whatever it wants. Make Guardian the only sudo-capable surface; everything downstream is unprivileged.

## Tools

- A cloud provider hosting one maintenance VM plus N customer VMs (GCP, Hetzner, or similar)
- systemd unit files for the agent processes (so they restart on host reboot)
- Claude Code (or Codex) on both maintenance VM and customer VMs
- SSH key management; key rotation discipline
