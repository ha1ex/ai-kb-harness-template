---
id: C-123
tier: C
category: "Infrastructure"
kind: tactic
title: "Residential IP for agent scrapers — home Raspberry Pi + WireGuard tunnel"
subtitle: "Problem solved: datacenter IPs (Hetzner, GCP, AWS) get blocked by YouTube and other major sites, killing scraper agents running on cloud VPS."
source: https://www.cybos.ai/cases/C-123
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "M · Weeks"
type: case
version: v0.1
---
# Residential IP for agent scrapers — home Raspberry Pi + WireGuard tunnel

> Problem solved: datacenter IPs (Hetzner, GCP, AWS) get blocked by YouTube and other major sites, killing scraper agents running on cloud VPS.

## What

Put a Raspberry Pi on a home network with a residential IP, run WireGuard server on it; the cloud-VPS scraper tunnels browser traffic through the home Pi. Restores residential-IP egress without a paid proxy provider. Risk: the home connection is now your single point of failure for production scraping.
