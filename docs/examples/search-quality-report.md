---
type: report
title: Skills search — quality probes
ingested: 2026-06-17
version: v0.1
---

# Skills search — quality probes

> Батарея из 42 тестовых запросов через гибридный поиск (vector + BM25 + RRF) по объединённой KB из 4 источников. Для каждого запроса проверяется, попадает ли top-3 в ожидаемую категорию и провайдер.

**Итог:** ✅ 42 pass · ⚠️ 0 partial · ❌ 0 miss из 42.

> **Метрика (честно):** PASS = релевантное в **top-3** по OR-логике (категория ИЛИ провайдер) — это **recall@3**, а не **precision@1**.
> Для recall@5 / MRR / разбивки по категориям и детекции регрессий — `node scripts/semantic/eval.mjs`.

## Probes

### ✅ PASS — `build mcp server claude tools`

Expected: provider ∈ {anthropic|fabric|cybos}, category ∈ {Engineering productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `COB-010` | anthropic-cookbooks | Engineering productivity | The SRE Incident Response Agent | Step 1b: The MCP Server |
| 2 | `B-040` | cybos | Engineering productivity | MCP integration with task tracker | Tools |
| 3 | `B-182` | cybos | Marketing & content | Programmatic SEO page factory with thin-content guardrails | Tools |
| 4 | `COB-009` | anthropic-cookbooks | Engineering productivity | 02 - The Observability Agent | Define our git MCP server (installed via |
| 5 | `A-060` | cybos | Marketing & content | Brand-consistent slide-deck pipeline — Figma Team Library +  | Tools |

### ✅ PASS — `prompt caching cost reduction claude api`

Expected: provider ∈ {anthropic-cookbooks|cybos}, category ∈ {Engineering productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `COB-038` | anthropic-cookbooks | Engineering productivity | Prompt caching with the Claude API | Prompt caching with the Claude API |
| 2 | `COB-011` | anthropic-cookbooks | Engineering productivity | Migrating from the OpenAI Agents SDK | Tracing |
| 3 | `ANT-001` | anthropic | Engineering productivity | Building LLM-Powered Applications with Claude | Quick Task Reference |
| 4 | `COB-042` | anthropic-cookbooks | Engineering productivity | Speculative Prompt Caching | Speculative Prompt Caching |
| 5 | `C-080` | cybos | Operations | Migrate agent prompts from non-English to English for 30-40% | What |

### ✅ PASS — `code review skill for pull requests`

Expected: provider ∈ {fabric|cybos}, category ∈ {Engineering productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-031` | fabric | Engineering productivity | Summarize Pull-Requests | Summarize Pull-Requests |
| 2 | `A-083` | cybos | Marketing & content | Voice profile plus content engine — one source, four to five | Tools |
| 3 | `COB-029` | anthropic-cookbooks | Engineering productivity | Build an SRE Incident Response Agent with Claude Managed Age | 2. Create the agent |
| 4 | `B-091` | cybos | HR & hiring | Franchise / team onboarding skill (first-day Claude Code ski | End-to-end |
| 5 | `B-112` | cybos | Operations | Cyber Essentials / SOC 2 questionnaire automation — Claude C | End-to-end |

### ✅ PASS — `parallel multi-agent dev workflow worktrees`

Expected: provider ∈ {cybos|fabric}, category ∈ {Engineering productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-065` | cybos | Engineering productivity | Parallel-agent dev workflow — 4–6 subsystem agents in worktr | Parallel-agent dev workflow — 4–6 subsys |
| 2 | `C-085` | cybos | Engineering productivity | Global port-registry CLI for parallel agents on the same mac | Global port-registry CLI for parallel ag |
| 3 | `A-089` | cybos | Engineering productivity | Six-pattern delegation framework with a two-tier light/full  | Why it matters |
| 4 | `B-042` | cybos | Engineering productivity | Multi-Agent Dev Pipeline (4 agents) | Multi-Agent Dev Pipeline (4 agents) |
| 5 | `A-067` | cybos | Engineering productivity | Subsystem-specialized agent teams — orchestrator + 4-12 para | What |

### ✅ PASS — `write essay in paul graham style`

Expected: provider ∈ {fabric}, category ∈ {Marketing & content}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-058` | fabric | Marketing & content | Write Micro Essay | Output instructions |
| 2 | `FAB-057` | fabric | Marketing & content | Write Essay Pg | Output instructions |
| 3 | `FAB-134` | fabric | Knowledge management | Extract Insights | End-to-end |
| 4 | `COB-059` | anthropic-cookbooks | Engineering productivity | RAG Pipeline with LlamaIndex | Download Data |
| 5 | `FAB-123` | fabric | Knowledge management | Extract Alpha | Output instructions |

### ✅ PASS — `newsletter writing prompts`

Expected: provider ∈ {fabric|cybos}, category ∈ {Marketing & content}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-160` | fabric | Knowledge management | Summarize Newsletter | What |
| 2 | `FAB-040` | fabric | Marketing & content | Create Newsletter Entry | Create Newsletter Entry |
| 3 | `FAB-018` | fabric | Engineering productivity | Improve Prompt | What |
| 4 | `COB-014` | anthropic-cookbooks | Engineering productivity | Frontend Aesthetics: A Prompting Guide | Isolated Prompting |
| 5 | `COB-036` | anthropic-cookbooks | Engineering productivity | Metaprompt | @title Metaprompt Text |

### ✅ PASS — `blog post landing page conversion copy`

Expected: provider ∈ {cybos|fabric}, category ∈ {Marketing & content}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `B-166` | cybos | Marketing & content | Landing-page copy generator — 7-block structure + 5-objectio | Landing-page copy generator — 7-block st |
| 2 | `B-177` | cybos | Marketing & content | Page-type mismatch diagnosis via reverse-engineered SERPs | End-to-end |
| 3 | `A-055` | cybos | Marketing & content | Google Ads bulk campaign launcher — competitor keywords → la | End-to-end |
| 4 | `A-078` | cybos | Marketing & content | Landing-page audit for paid ads — 5-dimension weighted healt | Landing-page audit for paid ads — 5-dime |
| 5 | `COB-014` | anthropic-cookbooks | Engineering productivity | Frontend Aesthetics: A Prompting Guide | Example 1: SaaS Landing Page |

### ✅ PASS — `competitive positioning swot analysis framework`

Expected: provider ∈ {fabric|cybos}, category ∈ {Strategy & leadership}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `B-104` | cybos | Marketing & content | Competitive-landing-analysis skill — 100 competitors → hypot | Why it matters |
| 2 | `A-035` | cybos | Strategy & leadership | Positioning-statement plugin | End-to-end |
| 3 | `B-174` | cybos | Marketing & content | Competitor profiling with Firecrawl + DataForSEO | Competitor profiling with Firecrawl + Da |

### ✅ PASS — `prepare 7s mckinsey strategy`

Expected: provider ∈ {fabric}, category ∈ {Strategy & leadership}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-081` | fabric | Strategy & leadership | Prepare 7S Strategy | Prepare 7S Strategy |
| 2 | `C-036` | cybos | Strategy & leadership | Leadership-communication reference frameworks | Leadership-communication reference frame |
| 3 | `A-036` | cybos | Strategy & leadership | Diagnostic-to-Dashboard methodology | End-to-end |

### ✅ PASS — `analyze business risk decision`

Expected: provider ∈ {fabric|cybos}, category ∈ {Strategy & leadership}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-065` | fabric | Strategy & leadership | Analyze Risk | Analyze Risk |
| 2 | `FAB-008` | fabric | Engineering productivity | Create Loe Document | End-to-end |
| 3 | `B-062` | cybos | Founder productivity | Sales pipeline data extraction — durable entities | Why it matters |
| 4 | `COB-055` | anthropic-cookbooks | Engineering productivity | Claude Skills for Financial Applications | 3.2 Investment Committee Presentation {# |
| 5 | `COB-051` | anthropic-cookbooks | Engineering productivity | Basic Workflows | Process impact analysis for multiple sta |

### ✅ PASS — `terraform plan iac infrastructure analysis`

Expected: provider ∈ {fabric|cybos}, category ∈ {Infrastructure}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-084` | fabric | Infrastructure | Analyze Terraform Plan | What |
| 2 | `COB-008` | anthropic-cookbooks | Engineering productivity | 01 - The Chief of Staff Agent | 3. Prevent file-writing so we can captur |
| 3 | `COB-079` | anthropic-cookbooks | Engineering productivity | Threat Intelligence Enrichment Agent | Threat Intelligence Enrichment Agent |

### ✅ PASS — `self-installable claude code skill via http server`

Expected: provider ∈ {cybos}, category ∈ {Infrastructure}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `B-067` | cybos | Infrastructure | Self-installable Claude Code skill via HTTP | Self-installable Claude Code skill via H |
| 2 | `A-030` | cybos | Knowledge management | Skills knowledge-graph visualization | Tools |
| 3 | `B-182` | cybos | Marketing & content | Programmatic SEO page factory with thin-content guardrails | Tools |
| 4 | `A-077` | cybos | Sales & outbound | Anonymous-visitor → outbound pipeline with suppression, revi | Tools |
| 5 | `ANT-003` | anthropic | Engineering productivity | Skill Creator | Cowork-Specific Instructions |

### ✅ PASS — `analyze sales call transcript scoring`

Expected: provider ∈ {fabric|cybos}, category ∈ {Sales & outbound}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-085` | fabric | Sales & outbound | Analyze Sales Call | Analyze Sales Call |
| 2 | `A-023` | cybos | Operations | Voice transcription + categorisation foundation | What |
| 3 | `A-006` | cybos | Sales & outbound | Call scoring (sales + QA): same engine, two consumers | End-to-end |
| 4 | `B-139` | cybos | Knowledge management | Long-context analytical synthesis over a transcript corpus — | Long-context analytical synthesis over a |

### ✅ PASS — `cold outbound email prospect personalize`

Expected: provider ∈ {cybos|fabric}, category ∈ {Sales & outbound}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-007` | cybos | Sales & outbound | Hook-driven cold outreach as a managed program | Tools |
| 2 | `A-076` | cybos | Sales & outbound | Recursive 10-expert-panel cold-email optimizer | Recursive 10-expert-panel cold-email opt |
| 3 | `A-077` | cybos | Sales & outbound | Anonymous-visitor → outbound pipeline with suppression, revi | Tools |

### ✅ PASS — `create hormozi grand slam offer`

Expected: provider ∈ {fabric}, category ∈ {Sales & outbound}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-087` | fabric | Sales & outbound | Create Hormozi Offer | End-to-end |

### ✅ PASS — `meeting summary auto crm slack`

Expected: provider ∈ {cybos|fabric}, category ∈ {Operations|Sales & outbound}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-001` | cybos | Sales & outbound | AI sales-meeting auto-processor (transcript → dual prompts → | AI sales-meeting auto-processor (transcr |
| 2 | `A-008` | cybos | Sales & outbound | Risk-of-churn case worker embedded in the CRM | End-to-end |
| 3 | `B-033` | cybos | Operations | Meeting transcription + follow-up auto-tasks | Meeting transcription + follow-up auto-t |
| 4 | `A-003` | cybos | Sales & outbound | Real-time sales copilot during calls (in-call prompts + auto | End-to-end |
| 5 | `B-063` | cybos | Founder productivity | Morning brief | What |

### ✅ PASS — `transcribe minutes board meeting`

Expected: provider ∈ {fabric|cybos}, category ∈ {Operations}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-098` | fabric | Operations | Summarize Board Meeting | What |
| 2 | `FAB-101` | fabric | Operations | Transcribe Minutes | What |
| 3 | `A-092` | cybos | Strategy & leadership | Founder Chief of Staff orchestrator across 10 C-suite role a | End-to-end |
| 4 | `B-033` | cybos | Operations | Meeting transcription + follow-up auto-tasks | Meeting transcription + follow-up auto-t |

### ✅ PASS — `agility user story epic agile`

Expected: provider ∈ {fabric|cybos}, category ∈ {Operations}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-088` | fabric | Operations | Agility Story | What |
| 2 | `FAB-117` | fabric | Knowledge management | Create Story About People Interaction | Create Story About People Interaction |
| 3 | `FAB-169` | fabric | HR & hiring | Identify Job Stories | What |
| 4 | `FAB-012` | fabric | Engineering productivity | Create User Story | Create User Story |

### ✅ PASS — `extract wisdom from podcast or video`

Expected: provider ∈ {fabric}, category ∈ {Knowledge management}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-148` | fabric | Knowledge management | Extract Wisdom | Extract Wisdom |
| 2 | `FAB-124` | fabric | Knowledge management | Extract Article Wisdom | Extract Article Wisdom |
| 3 | `FAB-152` | fabric | Knowledge management | Extract Wisdom With Attribution | Extract Wisdom With Attribution |
| 4 | `FAB-151` | fabric | Knowledge management | Extract Wisdom Nometa | Extract Wisdom Nometa |
| 5 | `FAB-122` | fabric | Knowledge management | Extract All Quotes | What |

### ✅ PASS — `summarize research paper academic`

Expected: provider ∈ {fabric|cybos}, category ∈ {Knowledge management}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-104` | fabric | Knowledge management | Analyze Paper Simple | Output instructions |
| 2 | `FAB-103` | fabric | Knowledge management | Analyze Paper | Tools |
| 3 | `FAB-036` | fabric | Marketing & content | Create Academic Paper | Tools |
| 4 | `COB-005` | anthropic-cookbooks | Engineering productivity | Summarization with Claude | We import from our data directory to sav |
| 5 | `FAB-018` | fabric | Engineering productivity | Improve Prompt | What |

### ✅ PASS — `extract book ideas highlights reading`

Expected: provider ∈ {fabric}, category ∈ {Knowledge management}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-125` | fabric | Knowledge management | Extract Book Ideas | End-to-end |
| 2 | `FAB-151` | fabric | Knowledge management | Extract Wisdom Nometa | End-to-end |
| 3 | `FAB-148` | fabric | Knowledge management | Extract Wisdom | End-to-end |
| 4 | `FAB-126` | fabric | Knowledge management | Extract Book Recommendations | End-to-end |

### ✅ PASS — `candidate cv resume analysis hire`

Expected: provider ∈ {fabric|cybos}, category ∈ {HR & hiring}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-014` | cybos | HR & hiring | Two-stage AI hiring pipeline (screening + full evaluation) | Prompts |
| 2 | `A-012` | cybos | HR & hiring | Flat-file ATS for small teams | End-to-end |
| 3 | `A-013` | cybos | HR & hiring | All-in-one HR skill for small teams | End-to-end |

### ✅ PASS — `interview question preparation answer`

Expected: provider ∈ {fabric|cybos}, category ∈ {HR & hiring}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-167` | fabric | HR & hiring | Answer Interview Question | Answer Interview Question |
| 2 | `FAB-060` | fabric | Strategy & leadership | Analyze Answers | Output instructions |
| 3 | `FAB-113` | fabric | Knowledge management | Create Quiz | Output instructions |
| 4 | `C-143` | cybos | Founder productivity | Phased conversational audit of a long-running context corpus | What |
| 5 | `COB-036` | anthropic-cookbooks | Engineering productivity | Metaprompt | @title Metaprompt Text |

### ✅ PASS — `analyze personality from text behavior`

Expected: provider ∈ {fabric}, category ∈ {HR & hiring}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-166` | fabric | HR & hiring | Analyze Personality | Analyze Personality |
| 2 | `B-163` | cybos | Sales & outbound | Behavior-first B2B buyer persona + champion-risk + multi-thr | Behavior-first B2B buyer persona + champ |
| 3 | `FAB-074` | fabric | Strategy & leadership | Extract Bd Ideas | What |
| 4 | `FAB-172` | fabric | Founder productivity | T Analyze Challenge Handling | T Analyze Challenge Handling |
| 5 | `FAB-170` | fabric | HR & hiring | Predict Person Actions | What |

### ✅ PASS — `tony robbins year in review self reflection`

Expected: provider ∈ {fabric|cybos}, category ∈ {Founder productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-045` | cybos | Founder productivity | Year-review system — 9-history Context Lab playbook | Year-review system — 9-history Context L |
| 2 | `B-152` | cybos | Founder productivity | Universal custom-instructions prompt — first-principles, ant | Prompts |
| 3 | `FAB-171` | fabric | Founder productivity | Provide Guidance | End-to-end |
| 4 | `B-141` | cybos | Knowledge management | Session-open / session-close skills — accumulate institution | "Self-learning during the work itself" d |

### ✅ PASS — `find blindspots dunning kruger thinking`

Expected: provider ∈ {fabric}, category ∈ {Founder productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-173` | fabric | Founder productivity | T Check Dunning Kruger | End-to-end |
| 2 | `FAB-180` | fabric | Founder productivity | T Find Blindspots | T Find Blindspots |

### ✅ PASS — `daily focus top priorities founder`

Expected: provider ∈ {cybos|fabric}, category ∈ {Founder productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-019` | cybos | Operations | Daily Focus skill — intentional manual morning ritual | Daily Focus skill — intentional manual m |
| 2 | `B-106` | cybos | Marketing & content | Solo-founder marketing stack on autopilot — Claude Code + MC | Solo-founder marketing stack on autopilo |
| 3 | `A-043` | cybos | Founder productivity | Founder personal dashboard — custom HTML, MCP-fed, with char | What |
| 4 | `B-017` | cybos | HR & hiring | 1:1 & review prep skill | Why it matters |

### ✅ PASS — `analyze product feedback users complaints`

Expected: provider ∈ {fabric|cybos}, category ∈ {Customer success}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-188` | fabric | Customer success | Analyze Product Feedback | Analyze Product Feedback |
| 2 | `ANT-003` | anthropic | Engineering productivity | Skill Creator | Step 5: Read the feedback |
| 3 | `FAB-023` | fabric | Engineering productivity | Review Code | End-to-end |
| 4 | `A-006` | cybos | Sales & outbound | Call scoring (sales + QA): same engine, two consumers | Prompts |

### ✅ PASS — `saas churn prevention retention onboarding`

Expected: provider ∈ {cybos}, category ∈ {Customer success}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `B-186` | cybos | Customer success | SaaS churn-prevention system — cancel flow + dunning + save- | SaaS churn-prevention system — cancel fl |
| 2 | `B-091` | cybos | HR & hiring | Franchise / team onboarding skill (first-day Claude Code ski | Gotchas |
| 3 | `B-052` | cybos | Data & BI | Churn prediction — start rule-based, mature into ML | What |
| 4 | `A-008` | cybos | Sales & outbound | Risk-of-churn case worker embedded in the CRM | Prompts |
| 5 | `B-187` | cybos | Customer success | Mobile-app onboarding optimization — activation event + perm | Mobile-app onboarding optimization — act |

### ✅ PASS — `build dashboard chart with claude`

Expected: provider ∈ {cybos|fabric}, category ∈ {Data & BI}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `B-093` | cybos | Data & BI | AI-built financial dashboards over CRM + ERP + bank APIs | End-to-end |
| 2 | `A-084` | cybos | Marketing & content | Full GTM launch playbook — motion by ACV, ORB channels, mult | Tools |
| 3 | `B-212` | cybos | Data & BI | Data-visualization critique and design with Tufte principles | Tools |
| 4 | `A-043` | cybos | Founder productivity | Founder personal dashboard — custom HTML, MCP-fed, with char | Prompts |
| 5 | `COB-045` | anthropic-cookbooks | Engineering productivity | Giving Claude a Crop Tool for Better Image Analysis | Demo: Chart Analysis |

### ✅ PASS — `natural language analytics over warehouse`

Expected: provider ∈ {cybos}, category ∈ {Data & BI}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `B-051` | cybos | Data & BI | Natural-language analytics over your warehouse | Natural-language analytics over your war |
| 2 | `A-029` | cybos | Data & BI | One-prompt BI agent that builds a dashboard from a sentence | What |
| 3 | `A-032` | cybos | Knowledge management | Token metabolism — knowledge graph as company memory | Tools |
| 4 | `A-037` | cybos | Strategy & leadership | Eliminate-role unlock chain — the prerequisite map for repla | End-to-end |
| 5 | `B-093` | cybos | Data & BI | AI-built financial dashboards over CRM + ERP + bank APIs | Gotchas |

### ✅ PASS — `classification embeddings text categories`

Expected: provider ∈ {anthropic-cookbooks}, category ∈ {Engineering productivity|Data & BI}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `COB-075` | anthropic-cookbooks | Engineering productivity | Extracting Structured JSON using Claude and Tool Use | Example 4: Text Classification |
| 2 | `COB-001` | anthropic-cookbooks | Engineering productivity | Classification with Claude: Insurance Support Ticket Classif | RAG with Chain-of-Thought Reasoning |
| 3 | `COB-082` | anthropic-cookbooks | Engineering productivity | Tool Search with Embeddings: Scaling Claude to Thousands of  | Test with one tool |

### ✅ PASS — `apply anthropic brand colors typography`

Expected: provider ∈ {anthropic}, category ∈ {Design}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `ANT-009` | anthropic | Design | Anthropic Brand Styling | Anthropic Brand Styling |
| 2 | `FAB-197` | fabric | Design | Create Design System | End-to-end |
| 3 | `COB-056` | anthropic-cookbooks | Engineering productivity | Building Custom Skills for Claude | Test Brand Guidelines skill with PowerPo |
| 4 | `ANT-008` | anthropic | Design | Algorithmic Art | ⚠️ STEP 0: READ THE TEMPLATE FIRST ⚠️ |
| 5 | `B-094` | cybos | Marketing & content | Brand-style ingestion into Claude Design (2-month maturation | End-to-end |

### ✅ PASS — `design system tokens for frontend`

Expected: provider ∈ {anthropic|cybos}, category ∈ {Design}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-061` | cybos | Marketing & content | AI-driven design — claude.ai/design + design-system input +  | Prompts |
| 2 | `ANT-011` | anthropic | Design | Frontend Design | Frontend Design |
| 3 | `COB-014` | anthropic-cookbooks | Engineering productivity | Frontend Aesthetics: A Prompting Guide | The Prompt |
| 4 | `A-037` | cybos | Strategy & leadership | Eliminate-role unlock chain — the prerequisite map for repla | End-to-end |
| 5 | `B-094` | cybos | Marketing & content | Brand-style ingestion into Claude Design (2-month maturation | Tools |

### ✅ PASS — `algorithmic art generative design pattern`

Expected: provider ∈ {anthropic}, category ∈ {Design}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `ANT-008` | anthropic | Design | Algorithmic Art | Algorithmic Art |

### ✅ PASS — `analyze malware threat report`

Expected: provider ∈ {fabric}, category ∈ {Cybersecurity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-204` | fabric | Cybersecurity | Analyze Threat Report Cmds | Analyze Threat Report Cmds |
| 2 | `FAB-205` | fabric | Cybersecurity | Analyze Threat Report Trends | Analyze Threat Report Trends |
| 3 | `FAB-202` | fabric | Cybersecurity | Analyze Malware | Analyze Malware |
| 4 | `COB-079` | anthropic-cookbooks | Engineering productivity | Threat Intelligence Enrichment Agent | Step 6: Generate structured threat repor |

### ✅ PASS — `write hackerone bug bounty report`

Expected: provider ∈ {fabric}, category ∈ {Cybersecurity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-217` | fabric | Cybersecurity | Write Hackerone Report | Write Hackerone Report |
| 2 | `FAB-216` | fabric | Cybersecurity | Extract Poc | End-to-end |
| 3 | `COB-013` | anthropic-cookbooks | Engineering productivity | The Vulnerability Detection Agent | Quality tiers: what to report |
| 4 | `COB-023` | anthropic-cookbooks | Engineering productivity | Orchestrate: from issue to merged PR | Orchestrate: from issue to merged PR |

### ✅ PASS — `stride threat model security review`

Expected: provider ∈ {fabric}, category ∈ {Cybersecurity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-211` | fabric | Cybersecurity | Create Stride Threat Model | Create Stride Threat Model |
| 2 | `COB-013` | anthropic-cookbooks | Engineering productivity | The Vulnerability Detection Agent | Threat model |

### ✅ PASS — `create powerpoint deck slides from data`

Expected: provider ∈ {anthropic|cybos}, category ∈ {Engineering productivity|Operations}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `B-110` | cybos | Operations | Install Anthropic's pdf / xlsx / pptx skills to ship client- | End-to-end |
| 2 | `COB-054` | anthropic-cookbooks | Engineering productivity | Introduction to Claude Skills | Introduction to Claude Skills |
| 3 | `COB-055` | anthropic-cookbooks | Engineering productivity | Claude Skills for Financial Applications | 2.2 Executive PowerPoint {#executive-ppt |
| 4 | `C-076` | cybos | Marketing & content | Claude-in-PowerPoint to reformat rough decks against a corpo | Claude-in-PowerPoint to reformat rough d |
| 5 | `ANT-015` | anthropic | Engineering productivity | PPTX (PowerPoint) — create, read, edit slide decks | PPTX (PowerPoint) — create, read, edit s |

### ✅ PASS — `extract tables from pdf form fill`

Expected: provider ∈ {anthropic}, category ∈ {Engineering productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `ANT-014` | anthropic | Engineering productivity | PDF processing — extract, merge, split, OCR, fill forms | PDF processing — extract, merge, split,  |
| 2 | `COB-049` | anthropic-cookbooks | Engineering productivity | Using Haiku as a sub-agent | Step 5: Extract information from PDFs |
| 3 | `B-008` | cybos | Sales & outbound | Headless deck unwrapping (DocSend / Pitch / Notion → PDF → s | End-to-end |
| 4 | `COB-005` | anthropic-cookbooks | Engineering productivity | Summarization with Claude | Data Preparation |
| 5 | `COB-048` | anthropic-cookbooks | Engineering productivity | Working with Charts, Graphs, and Slide Decks | Now let's pass the document directly to  |

### ✅ PASS — `edit excel spreadsheet formulas xlsx`

Expected: provider ∈ {anthropic}, category ∈ {Engineering productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `ANT-016` | anthropic | Engineering productivity | XLSX (Excel) — read, edit, create spreadsheets with formulas | XLSX (Excel) — read, edit, create spread |
| 2 | `COB-054` | anthropic-cookbooks | Engineering productivity | Introduction to Claude Skills | Example: Monthly Budget Spreadsheet |
| 3 | `COB-055` | anthropic-cookbooks | Engineering productivity | Claude Skills for Financial Applications | 💡 Best Practices for Excel Generation |

### ✅ PASS — `word document docx generate report`

Expected: provider ∈ {anthropic}, category ∈ {Engineering productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `ANT-013` | anthropic | Engineering productivity | DOCX (Microsoft Word) creation, editing, and analysis | When to use |
| 2 | `FAB-069` | fabric | Strategy & leadership | Create Ai Jobs Analysis | Tools |
| 3 | `COB-005` | anthropic-cookbooks | Engineering productivity | Summarization with Claude | Summary Indexed Documents: An Advanced R |
| 4 | `FAB-067` | fabric | Strategy & leadership | Check Agreement | Tools |
| 5 | `COB-055` | anthropic-cookbooks | Engineering productivity | Claude Skills for Financial Applications | Step 3: Create PDF Documentation |

