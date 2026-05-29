---
id: A-093
tier: A
category: "Strategy & leadership"
kind: framework
title: "Multi-framework compliance and audit-readiness engine"
subtitle: "Problem solved: A B2B SaaS founder facing a first enterprise deal that requires SOC 2 (then GDPR, then ISO 27001) needs a multi-framework program plan with cost anchors, control-mapping tables, and a readiness score before committing to a $20–80K audit."
source: https://www.cybos.ai/cases/A-093
provider: cybos
license: source-available
license_source: "https://www.cybos.ai/cases"
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "XL · Half-year+"
for: "founder/CISO preparing first SOC 2 · security lead · privacy officer · payments lead · compliance lead building a common control framework"
type: case
version: v0.1
---
# Multi-framework compliance and audit-readiness engine

> Problem solved: A B2B SaaS founder facing a first enterprise deal that requires SOC 2 (then GDPR, then ISO 27001) needs a multi-framework program plan with cost anchors, control-mapping tables, and a readiness score before committing to a $20–80K audit.

## What

An 11-phase compliance program builder — positioned as an in-house "AI compliance officer" — that takes a startup from zero to audit-ready across SOC 2 (Type I & II), ISO 27001:2022, GDPR, HIPAA, and PCI DSS 4.0. It ships a framework-selection matrix (who needs it / trigger / timeline / cost), a 16-week SOC 2 project plan, full Trust Services Criteria control checklists (CC1–CC9), a 15-policy template library, an ISO 27001 ISMS roadmap (clauses 4–10 + 93 Annex A controls), a SOC 2 ↔ ISO 27001 mapping table, the 12-requirement GDPR catalog, HIPAA's three safeguard categories, the PCI DSS 12 requirements + SAQ decision tree, an evidence-repository filesystem layout, a 90-day audit-prep checklist, a monthly continuous-compliance dashboard YAML, a compliance-debt tracker, and a 7-dimension readiness score (0–100). It is invoked with natural-language commands ("Assess our compliance readiness", "Create SOC 2 project plan", "Map controls across frameworks", "Score our compliance posture").

## Why it matters

The cost anchors are the load-bearing facts a founder needs *before* signing an auditor:

- SOC 2 Type I: 3–6 months, **$20K–$80K**. Type II: 6–12 months, **$30K–$100K**.
- ISO 27001: 6–12 months, **$40K–$120K**. GDPR: 1–3 months, **$5K–$30K**.
- HIPAA: 3–6 months, **$20K–$60K**. PCI DSS: 3–9 months, **$15K–$50K**. SOX: 12–18 months, **$100K–$500K**.

Three quantified savings drive the whole approach: a GRC platform from Day 1 costs $10–15K/year but saves **100+ hours**; the SOC 2 ↔ ISO 27001 mapping reuses **40–60%** of the work on the second framework (CC3 ↔ Clause 6.1 ≈ 90% overlap; CC6 ↔ A.5.15–5.18 + A.8.1–8.5 ≈ 85%); and PCI tokenization drops scope from SAQ D (**300+ controls**) to SAQ A (**22 controls**). The portable IP is the Common Control Framework pattern — write one control once, map it to all five frameworks, collect evidence once.

## End-to-end

1. **Phase 1 — Discovery.** Pick the framework using priority rules: customer asks for SOC 2 → start there; EU users → GDPR alongside; health data → HIPAA first then SOC 2; card data → PCI immediately; multiple frameworks → map common controls (40–60% overlap). Fill the Readiness Assessment Brief YAML (company profile, data types, customer segments, geographic scope, current state, drivers, target frameworks, target date, budget).
2. **Phase 2 — SOC 2 deep dive.** Run the 16-week sprint: Wk 1–2 scoping; 3–4 gap assessment; 5–6 policy writing; 7–8 control implementation; 9–10 process implementation; 11–12 evidence collection; 13–14 readiness assessment / mock audit; 15–16 Type I fieldwork. Cover all nine Common Criteria (CC6 = MFA + 12-char passwords + quarterly access reviews + AES-256 + TLS 1.2+; CC7 = weekly vuln scan, critical patch < 72h; CC9 = vendor BAAs/DPAs). Write the 15 required policies from the template library.
3. **Phase 3 — ISO 27001.** Implement the ISMS roadmap (Clause 4 Context → 5 Leadership → 6 Planning with Statement of Applicability mapping all 93 Annex A controls → 7 Support → 8 Operation → 9 Performance Evaluation → 10 Improvement). Use the SOC 2 ↔ ISO 27001 mapping table to reuse 70–90% of prior work.
4. **Phase 4 — GDPR.** Implement the 12 core requirements: Article 30 lawful-basis register, data-subject-rights 30-day SLA, privacy-by-design + DPIA, DPO decision, granular consent + cookie banner, sub-processor DPAs, international-transfer SCCs/adequacy/BCRs + TIA, 72-hour breach notification, ROPA YAML, privacy notice, retention schedule, mandatory annual training.
5. **Phase 5 — HIPAA.** Implement the three safeguard categories — Administrative (security management process, security officer, workforce security, BAAs), Physical (facility access, workstation, device/media), Technical (unique user ID + automatic logoff + encryption, audit controls, integrity, authentication, transmission security). Breach rule: ≤ 500 individuals → annual batch within 60 days of year-end; > 500 → within 60 days + media notification. Penalties $100–$50,000/violation up to $1.5M/year.
6. **Phase 6 — PCI DSS 4.0.** Apply scope reduction (tokenization, hosted payment pages, network segmentation) to drop from SAQ D (300+ controls) to SAQ A (22). Implement the 12 requirements only at applicable scope.
7. **Phase 7 — Tooling stack.** Pick tools per budget tier: GRC (Notion/Sheets → Vanta/Drata → ServiceNow); SIEM (ELK/Wazuh → Datadog → Splunk); endpoint (CrowdStrike Falcon Go → SentinelOne → CrowdStrike Enterprise); identity (Google Workspace + Okta → JumpCloud → Azure AD P2). Automate evidence collection, access reviews, vuln scanning, policy acknowledgment — saves 70%+ of audit prep. Compliance-as-code: Terraform + Sentinel, OPA/Rego, AWS Config, GitHub branch protection as change-management evidence; Snyk/Dependabot, Semgrep/CodeQL, Trivy/Grype, FOSSA in CI.
8. **Phase 8 — Audit prep.** Run the 90-day checklist (Days 90–60 Foundation: scope, system description, policies, training, vuln scan + remediation, pen test scheduled; Days 60–30 Evidence: per TSC/clause, access reviews, change-management samples, IR tabletop, DR test, vendor assessments, risk treatment, board minutes; Days 30–0 Final: mock-audit walkthrough, remediation, management assertion letter, auditor read-only access). Organize in the `/compliance-evidence/SOC2-2026/CCx-.../` layout. Stand up continuous compliance (Phase 9), build the Common Control Framework (Phase 10), and score readiness (Phase 11) on the 7-dimension rubric.

## Prompts

Framework-selection matrix, verbatim:

```
`| Framework | Who Needs It | Trigger | Timeline | Cost Range |
| SOC 2 Type I | Any B2B SaaS | Enterprise prospect asks | 3-6 months | $20K-$80K |
| SOC 2 Type II| Established SaaS | After Type I, or direct | 6-12 months | $30K-$100K |
| ISO 27001 | Global/EU-facing SaaS | EU enterprise deals | 6-12 months | $40K-$120K |
| GDPR | Anyone with EU users | Day 1 if EU data | 1-3 months | $5K-$30K |
| HIPAA | Health data handlers | Before first PHI | 3-6 months | $20K-$60K |
| PCI DSS | Payment processors | Before card data | 3-9 months | $15K-$50K |
| SOX | Public companies | IPO prep | 12-18 months| $100K-$500K |
`
```

Common Control Framework — single control mapped to all five frameworks, verbatim:

```
`control:
 id: "CCF-AC-001"
 title: "Multi-Factor Authentication"
 description: "MFA required for all access to production systems and sensitive data"
 owner: "Security Team"
 framework_mapping:
 soc2: ["CC6.1", "CC6.6"]
 iso27001: ["A.8.5"]
 gdpr: ["Article 32"]
 hipaa: ["§164.312(d)"]
 pci_dss: ["Req 8.4"]
 evidence:
 - type: "Configuration screenshot"
 source: "Okta MFA policy"
 frequency: "Quarterly"
 - type: "Access review"
 source: "Okta user report"
 frequency: "Quarterly"
 test_procedure: "Verify MFA policy is enforced, test with non-MFA login attempt"
`
```

PCI SAQ decision tree, verbatim:

```
`SAQ Decision:
- Fully outsourced (Stripe Checkout) → SAQ A (22 controls, simplest)
- API-based (Stripe Elements) → SAQ A-EP (~140 controls)
- You store/process card data → SAQ D (300+ controls, avoid this)
`
```

## Gotchas

- **Zero-compliance startup:** do the security basics first (MFA, encryption, access control, backups) before adopting *any* framework. "Documented and improving" beats "undocumented and perfect." Budget $20–40K for the first SOC 2 Type I.
- **GDPR triggers on EU *users*, not an EU office.** Founders frequently mis-scope this. Several other jurisdictions impose their own data-residency rules — scope to where your users actually are, not where you're incorporated.
- **Multi-cloud / hybrid:** map the shared-responsibility model per provider; use AWS Audit Manager / Azure Compliance Manager rather than treating the cloud as one perimeter.
- **Acquired-company integration:** run a compliance gap assessment within 30 days of close and a 90-day baseline plan — do not assume their posture matches their claims.
- **Regulated industries layer on top of SOC 2/ISO:** FinTech adds PCI + state MTLs + FinCEN; HealthTech adds HIPAA + possibly FDA SaMD; EdTech adds FERPA + COPPA (if under 13).

<hr/>

## Tools

- No published install pipeline. Fetch the SKILL.md directly into your skills directory (note: `master` branch, not `main`):

```
`curl -sL https://raw.githubusercontent.com/aAAaqwq/AGI-Super-Team/master/skills/afrexai-compliance-engine/SKILL.md \
-o ~/.claude/skills/compliance-engine/SKILL.md
`
```

- Recommended tooling referenced inside the skill (all public infra): a GRC platform (Vanta or Drata, ~$10–15K/year for startups), Okta for MFA, Stripe/Braintree for PCI tokenization, AWS Audit Manager or Azure Compliance Manager, Terraform + Sentinel, Semgrep/CodeQL for SAST, Trivy/Grype for container scanning, FOSSA for license compliance.
