---
id: A-028
tier: A
category: "Engineering productivity"
kind: strategy
title: "100% AI adoption in engineering — VPN + agent CLI + CLAUDE.md unlock chain"
subtitle: "10-30% of devs use AI in shadow because the firewall blocks Claude. A $30K VPN unlocks 165 devs in two weeks."
source: https://www.cybos.ai/cases/A-028
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "Engineering lead · sponsor exec · head of InfoSec"
type: case
version: v0.1
---
# 100% AI adoption in engineering — VPN + agent CLI + CLAUDE.md unlock chain

> 10-30% of devs use AI in shadow because the firewall blocks Claude. A $30K VPN unlocks 165 devs in two weeks.

## What

A three-step unlock chain that takes engineering AI adoption from "scattered 10–30% shadow usage" to "every developer using the agent every day." Step one (the actual quick-win): deploy a corporate VPN isolated from the internal network so engineers can reach Claude Code, Cursor, ChatGPT without tripping the firewall — replaces a ~$500K-equivalent on-prem LLM project for 80% of use cases with a ~$10–30K VPN deployment. Step two: roll out paid Claude Code seats company-wide ($100–120/mo per dev) and any other approved tools; centralise billing. Step three: enforce a shared agent-config file (`CLAUDE.md` / `AGENTS.md`) in every repository plus weekly AI-pair-programming sessions and mandatory adoption metrics in performance review.

## Why it matters

At a large fintech, this chain was costed as 165 developers × +30% productivity = ~$1.3M-equivalent/year. The VPN quick-win alone (2–4 weeks, ~$30K) unlocked the entire downstream chain that the on-prem LLM project would have taken six months to provide. At a wealth-management firm running a parallel programme, the same chain delivered +50% YoY developer productivity in Q1 2026 vs. Q1 2025, measured by source-code volume shipped to production. At both companies the chart that landed with the board was simple: "each 1% of adoption is worth about $26K-equivalent/year — here's the line going up."

## End-to-end

1. **Diagnose the blocker.** Survey 20 engineers across teams: where does AI fail you? At companies behind a corporate firewall the answer is almost always "Claude Code / Cursor / ChatGPT are unreachable from the dev network."
2. **Deploy a corporate VPN isolated from the internal network.** Run it as a side-car: engineers connect to the VPN, then their machine can reach the agent endpoints; the VPN cannot reach internal production. Standard tools — OpenVPN / WireGuard / commercial (Tailscale, Cloudflare WARP for Teams) — all work. Budget ~$10–30K including a security review.
3. **Cost it next to the alternative.** The on-prem LLM project that "solves" the same problem typically lands around $500K-equivalent and 6 months. The VPN gets you 80% of the value at 5% of the cost and 10% of the time. Land this comparison with the sponsor before anyone funds the on-prem project.
4. **Roll out seats company-wide.** Centralise billing — no reimbursements, no individual procurement. Budget around 4% of payroll for AI tools (subscriptions + tokens combined) as a current benchmark; expect growth.
5. **Install `CLAUDE.md` / `AGENTS.md` in every repository.** The contents are covered in #110+#175 below. Make a PR template that fails CI if no `CLAUDE.md` exists.
6. **Run weekly AI pair-programming sessions.** Each team picks one real task per week and does it on a shared screen with the agent. The visible "huh, it just did that" moments are what move adoption past 50%.
7. **Make adoption visible.** Track three metrics per developer: AI-assisted commits (signed in the commit body), tokens consumed, AI-assisted task throughput. Publish a leaderboard. Don't punish low scores yet — measure for two months, then add to PR.
8. **Reward, don't mandate.** A three-tier bonus structure: adoption bonus (5–10% of salary for everyone using AI ≥10 h/mo); champion bonus (15–35% for those who ship reusable team skills); transformation-protection guarantee (18–24 months for innovators if AI-driven restructuring eliminates their role).
9. **Run a quarterly retro on the adoption curve.** Where did the curve flatten? Which teams are below the median? What's blocking them? Edit the rollout plan.

## Prompts

Pre-deployment cost-comparison memo template (one-pager, lands with the sponsor):

```
`Q: How do we give 165 developers safe access to the latest AI coding tools?

Option A — Corporate VPN
 Cost: 1–3M RUB. Time: 2–4 weeks.
 Solves: 80% of cases — dev terminals can reach Claude Code / Cursor / ChatGPT.
 Risks: outbound code-leak risk — mitigated via DLP, banned-repo lists, per-seat audit.

Option B — On-Prem LLM
 Cost: 50M RUB (independently re-costed at 12.3M — the vendor estimate is 4× inflated).
 Time: 6 months.
 Solves: cases where customer data cannot leave the perimeter (~20% of dev workload).

Decision: A in week 1 (unblocks 80%), B in Q3 for the residual 20%.
`
```

Minimal `CLAUDE.md` to seed in every repo (full version covered in #110+#175):

```
``
```

## Gotchas

- **Don't try to "build our own" agent platform first.** Every 6-month build delivers what the off-the-shelf chain delivers in 6 weeks. Treat on-prem only as a last-mile for the residual cases.
- **2026-02-26 lesson (named in one diagnostic):** a CEO showed API tokens via Telegram DM in front of 40 people. Replace any informal secret-sharing with `op://`, env files, or a managed secret store before rolling VPN access.
- **Don't bonus on raw token spend.** Power users will burn tokens to chase the bonus. Bonus on shipped output (signed commits, PRs merged, skills shared back).
- **2025-Q4 lesson:** a previous generic AI training programme produced "40% tried, only 15% kept using." Cure: function-specific weekly workshops where teams bring real tasks and leave with a working workflow — not abstract demos.
- **Don't centralise the on-prem LLM project under a "central AI team" queue.** Embed AI engineers in each direction; central queues become the bottleneck the diagnostic was meant to eliminate.

## Variations

- **Lighter:** For sub-30-person teams, skip the bonus structure and just centralise billing and require `CLAUDE.md` per repo.
- **Heavier:** Add an "AI Leaders Club" — one champion per team, bi-weekly challenges with cash prizes ($2K / $1K / $0.5K winners), monthly community demo day.
- **Vertical:** Regulated industries (banking, healthcare) — keep the VPN chain for non-customer-data work; pair with an on-prem fallback for the customer-data path.

## Tools

- Corporate VPN (Tailscale / Cloudflare WARP / WireGuard) deployed and approved by InfoSec
- Company-wide seats for one agent CLI (Claude Code recommended) plus optional Cursor / Codex
- A `CLAUDE.md` / `AGENTS.md` template committed to every repo
- A measurement script run weekly
- Sponsor at the exec level (otherwise the bonus structure doesn't get approved)
