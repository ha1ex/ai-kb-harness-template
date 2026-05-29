---
id: A-086
tier: A
category: "Operations"
kind: skill
title: "Multi-jurisdiction contract and proposal drafting skill"
subtitle: "Problem solved: Founders signing dev, consulting, and partnership deals across US, EU, UK, and DACH need jurisdiction-correct first drafts in minutes instead of paying $200–2,000 per document for paralegal time."
source: https://www.cybos.ai/cases/A-086
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "L · Quarter"
for: "founder · COO · finance/ops lead · agency operator · sales lead"
type: case
version: v0.1
---
# Multi-jurisdiction contract and proposal drafting skill

> Problem solved: Founders signing dev, consulting, and partnership deals across US, EU, UK, and DACH need jurisdiction-correct first drafts in minutes instead of paying $200–2,000 per document for paralegal time.

## What

A drafting skill that produces freelance/dev contracts, project proposals, SOWs, NDAs (mutual + one-way), MSAs, SaaS partnership agreements (reseller/referral/white-label/integration), and GDPR Art. 28 Data Processing Addenda — each one jurisdiction-aware across US (Delaware), EU (GDPR/DSGVO), UK, and DACH (German law including Urheberrecht / Nutzungsrechte). It bundles a clause library, seven document templates, a 10-item pre-send review checklist, and three Python helper scripts, then converts the markdown draft to DOCX or PDF via Pandoc.

## Why it matters

Each engagement that would otherwise cost $200–2,000 in paralegal/attorney drafting becomes a 5-minute first draft that is jurisdiction-correct and audit-ready. The bigger win is error elimination: a missing IP-assignment clause leaves work-product ownership with the freelancer; no DPA for EU personal data exposes up to 4% of global revenue in GDPR fines; a missing liability cap means unlimited exposure. The skill enforces all of these by checklist rather than memory.

## End-to-end

1. **Install the skill.** `claude plugin marketplace add borghei/Claude-Skills` then enable it, or `npx @borghei/claude-skills add contract-and-proposal-writer`.
2. **Requirements gathering.** The skill asks: document type? jurisdiction (US-Delaware / EU / UK / DACH)? engagement model (fixed-price / hourly / retainer / revenue-share)? parties' legal names + registered addresses? scope (1–3 sentences)? total value? timeline? IP / white-label / subcontractor / non-compete terms? personal data involved (this triggers a DPA)?
3. **Select the template** from the matrix: dev contract fixed-price = Template A; dev contract hourly/retainer = Template B; partnership rev-share = Template C; mutual NDA = NDA-M; one-way = NDA-OW; SOW = Template SOW; proposal = Template P.
4. **Fill every `[BRACKETED]` placeholder.** Missing information is flagged as `[REQUIRED - description]`, never left blank — an incomplete contract is more dangerous than no contract.
5. **Apply the clause library.** Payment terms keyed to engagement model (fixed = 50/25/25 upfront/beta/acceptance; hourly = net-30 monthly; retainer = prepaid first month with overflow rate; rev-share = net-30 after month close with audit rights; 1.5%/month late interest). IP per jurisdiction (US work-for-hire across 9 categories; EU separate written assignment; UK explicit assignment for contractors; DACH Nutzungsrechte transfer with scope/duration, Urheberrecht itself never transferable). Liability standard 1× / high-risk 3× / enterprise uncapped-mutual, always excluding indirect/incidental/consequential damages. The reusable backbone is the **3-option IP clause** — Transfer / License / Shared (full verbatim text below) — because most online templates force the Transfer option and silently misfit consultant work.
6. **Add jurisdiction-specific musts and the GDPR DPA block.** DACH: Schriftformklausel, statutory notice periods, max 2-year non-compete with compensation per HGB §74. EU: 14-day B2C withdrawal. UK: electronic-signature equivalence. The Art. 28 DPA block carries controller/processor roles, 8 processor obligations, sub-processor table, and cross-border transfer mechanism (SCCs / adequacy / BCRs).
7. **Run the pre-send checklist (10 items)** then convert: `pandoc contract.md -o contract.docx --reference-doc=template.docx`.
8. **Optionally run the bundled scripts** for a clause gap scan, proposal cost model, or version diff.

## Prompts

IP clause — 3 options (verbatim from the skill's clause library):

```
`Option A — Full IP Transfer (most common for client work):
Upon full payment, all work product created under this Agreement
("Work Product") shall be the exclusive property of Client. Provider
assigns all rights, title, and interest in the Work Product to Client.

Option B — License (provider retains ownership):
Provider retains all rights to the Work Product and grants Client a
perpetual, non-exclusive, worldwide license to use, modify, and
distribute the Work Product for Client's business purposes.

Option C — Shared (split ownership):
Client owns the final deliverables. Provider retains the right to
reuse general techniques, methodologies, and non-client-specific
components ("Provider Tools") in future work.
`
```

Termination clause (verbatim):

```
`Either party may terminate this Agreement:
(a) For convenience: with [30] days written notice;
(b) For cause: if the other party materially breaches and fails to
 cure within [15] days of written notice;
(c) Immediately: if the other party becomes insolvent or bankrupt.
`
```

Pandoc conversion + bundled scripts (verbatim):

```
`pandoc contract.md -o contract.docx --reference-doc=template.docx
pandoc contract.md -o contract.docx --number-sections -V fontsize=11pt
pandoc contract.md -o contract.pdf -V geometry:margin=1in -V fontsize=11pt
for f in contracts/*.md; do
 pandoc "$f" -o "${f%.md}.docx" --reference-doc=template.docx
done

python scripts/contract_clause_checker.py contract.json --jurisdiction us-delaware
python scripts/proposal_cost_estimator.py --hourly-rate 150 --hours 200 --phases 4
python scripts/contract_comparison_analyzer.py contract_v1.json contract_v2.json
`
```

## Gotchas

- **Never ship with blanks.** Unfilled placeholders are flagged `[REQUIRED - …]`; an incomplete contract is more dangerous than no contract. Surface every bracket to the user before send.
- **Jurisdiction mismatch makes clauses unenforceable.** US work-for-hire language pasted into a DACH contract does not transfer rights — DACH needs an explicit Nutzungsrechte clause; Urheberrecht (the moral right) never transfers.
- **No DPA for EU personal data → up to 4% of global revenue in fines.** The skill forces a DPA whenever the intake reports personal data; do not skip it for "small" engagements.
- **Oral amendments are unenforceable.** Require written amendments signed by both parties; DACH additionally needs an explicit Schriftformklausel.
- **This is a starting point, not legal advice.** The skill's hard disclaimer stays in every output: have an attorney review engagements over $50K or anything with complex IP/equity/regulatory exposure.

<hr/>

## Tools

- Claude Code / Cursor or another SKILL.md-capable agent — runs the skill
- Pandoc — DOCX/PDF conversion (`brew install pandoc` / `apt install pandoc`)
- Python 3 — for the three bundled scripts (`contract_clause_checker.py`, `proposal_cost_estimator.py`, `contract_comparison_analyzer.py`)
- Install: `claude plugin marketplace add borghei/Claude-Skills` or `npx @borghei/claude-skills add contract-and-proposal-writer`
