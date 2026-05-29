---
id: C-119
tier: C
category: "Infrastructure"
kind: tactic
title: "Visible Chrome on a headless VPS — Xvfb + Fluxbox + x11vnc + noVNC"
subtitle: "Problem solved: Playwright headless \"worked every other time\" for some flows; agents need to drive a real visible browser on a Linux VPS with a window manager and live human observability."
source: https://www.cybos.ai/cases/C-119
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "C Catalog — Pattern outlined, candidates for deeper work"
effort: "S · Days"
type: case
version: v0.1
---
# Visible Chrome on a headless VPS — Xvfb + Fluxbox + x11vnc + noVNC

> Problem solved: Playwright headless "worked every other time" for some flows; agents need to drive a real visible browser on a Linux VPS with a window manager and live human observability.

## What

Stack: Xvfb (virtual display) + Fluxbox (window manager) + Chrome 145 + x11vnc + noVNC web client on port 6080 + xdotool for mouse/keyboard automation + scrot for screenshots. Wrap as a `gui-browser` systemd service for autostart. To watch live from your laptop: `ssh -L 6080:localhost:6080 root@server`, then open [http://localhost:6080/vnc.html](http://localhost:6080/vnc.html).
