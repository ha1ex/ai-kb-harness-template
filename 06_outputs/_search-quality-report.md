---
type: report
title: Skills search — quality probes
ingested: 2026-05-27
version: v0.1
---

# Skills search — quality probes

> Батарея из 18 тестовых запросов через гибридный поиск (vector + BM25 + RRF) по объединённой KB из 4 источников. Для каждого запроса проверяется, попадает ли top-3 в ожидаемую категорию и провайдер.

**Итог:** ✅ 18 pass · ⚠️ 0 partial · ❌ 0 miss из 18.

## Probes

### ✅ PASS — `build mcp server claude tools`

Expected: provider ∈ {anthropic|fabric|cybos}, category ∈ {Engineering productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `COB-010` | anthropic-cookbooks | Engineering productivity | The SRE Incident Response Agent | Step 1b: The MCP Server |
| 2 | `B-040` | cybos-cases | Engineering productivity | MCP integration with task tracker | Tools |
| 3 | `B-182` | cybos-cases | Marketing & content | Programmatic SEO page factory with thin-content guardrails | Tools |
| 4 | `COB-009` | anthropic-cookbooks | Engineering productivity | 02 - The Observability Agent | Define our git MCP server (installed via |
| 5 | `A-060` | cybos-cases | Marketing & content | Brand-consistent slide-deck pipeline — Figma Team Library +  | Tools |

### ✅ PASS — `prompt caching cost reduction claude api`

Expected: provider ∈ {anthropic-cookbooks|cybos}, category ∈ {Engineering productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `COB-038` | anthropic-cookbooks | Engineering productivity | Prompt caching with the Claude API | Prompt caching with the Claude API |
| 2 | `COB-011` | anthropic-cookbooks | Engineering productivity | Migrating from the OpenAI Agents SDK | Tracing |
| 3 | `ANT-001` | anthropic | Engineering productivity | Building LLM-Powered Applications with Claude | Quick Task Reference |
| 4 | `COB-042` | anthropic-cookbooks | Engineering productivity | Speculative Prompt Caching | Speculative Prompt Caching |
| 5 | `C-080` | cybos-cases | Operations | Migrate agent prompts from non-English to English for 30-40% | What |

### ✅ PASS — `code review skill for pull requests`

Expected: provider ∈ {fabric|cybos}, category ∈ {Engineering productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-031` | fabric | Engineering productivity | Summarize Pull-Requests | Summarize Pull-Requests |
| 2 | `A-083` | cybos-cases | Marketing & content | Voice profile plus content engine — one source, four to five | Tools |
| 3 | `COB-029` | anthropic-cookbooks | Engineering productivity | Build an SRE Incident Response Agent with Claude Managed Age | 2. Create the agent |
| 4 | `B-091` | cybos-cases | HR & hiring | Franchise / team onboarding skill (first-day Claude Code ski | End-to-end |
| 5 | `B-112` | cybos-cases | Operations | Cyber Essentials / SOC 2 questionnaire automation — Claude C | End-to-end |

### ✅ PASS — `write essay in paul graham style`

Expected: provider ∈ {fabric}, category ∈ {Marketing & content}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-058` | fabric | Marketing & content | Write Micro Essay | Output instructions |
| 2 | `FAB-057` | fabric | Marketing & content | Write Essay Pg | Output instructions |
| 3 | `FAB-134` | fabric | Knowledge management | Extract Insights | End-to-end |
| 4 | `COB-059` | anthropic-cookbooks | Engineering productivity | RAG Pipeline with LlamaIndex | Download Data |
| 5 | `FAB-104` | fabric | Knowledge management | Analyze Paper Simple | Output instructions |

### ✅ PASS — `newsletter writing prompts`

Expected: provider ∈ {fabric|cybos}, category ∈ {Marketing & content}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-160` | fabric | Knowledge management | Summarize Newsletter | What |
| 2 | `FAB-040` | fabric | Marketing & content | Create Newsletter Entry | Create Newsletter Entry |
| 3 | `FAB-018` | fabric | Engineering productivity | Improve Prompt | What |
| 4 | `C-132` | cybos-cases | Marketing & content | Newsletter operating template | What |
| 5 | `COB-014` | anthropic-cookbooks | Engineering productivity | Frontend Aesthetics: A Prompting Guide | Isolated Prompting |

### ✅ PASS — `analyze sales call transcript scoring`

Expected: provider ∈ {fabric|cybos}, category ∈ {Sales & outbound}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `FAB-085` | fabric | Sales & outbound | Analyze Sales Call | Analyze Sales Call |
| 2 | `A-023` | cybos-cases | Operations | Voice transcription + categorisation foundation | What |
| 3 | `A-006` | cybos-cases | Sales & outbound | Call scoring (sales + QA): same engine, two consumers | End-to-end |
| 4 | `B-139` | cybos-cases | Knowledge management | Long-context analytical synthesis over a transcript corpus — | Long-context analytical synthesis over a |

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

### ✅ PASS — `apply anthropic brand colors typography`

Expected: provider ∈ {anthropic}, category ∈ {Design}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `ANT-009` | anthropic | Design | Anthropic Brand Styling | Anthropic Brand Styling |
| 2 | `FAB-197` | fabric | Design | Create Design System | End-to-end |
| 3 | `COB-056` | anthropic-cookbooks | Engineering productivity | Building Custom Skills for Claude | Test Brand Guidelines skill with PowerPo |
| 4 | `ANT-008` | anthropic | Design | Algorithmic Art | ⚠️ STEP 0: READ THE TEMPLATE FIRST ⚠️ |
| 5 | `B-094` | cybos-cases | Marketing & content | Brand-style ingestion into Claude Design (2-month maturation | End-to-end |

### ✅ PASS — `design system tokens for frontend`

Expected: provider ∈ {anthropic|cybos}, category ∈ {Design}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-061` | cybos-cases | Marketing & content | AI-driven design — claude.ai/design + design-system input +  | Prompts |
| 2 | `ANT-011` | anthropic | Design | Frontend Design | Frontend Design |
| 3 | `COB-014` | anthropic-cookbooks | Engineering productivity | Frontend Aesthetics: A Prompting Guide | The Prompt |
| 4 | `A-037` | cybos-cases | Strategy & leadership | Eliminate-role unlock chain — the prerequisite map for repla | End-to-end |
| 5 | `A-065` | cybos-cases | Engineering productivity | Parallel-agent dev workflow — 4–6 subsystem agents in worktr | Gotchas |

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
| 5 | `COB-008` | anthropic-cookbooks | Engineering productivity | 01 - The Chief of Staff Agent | Feature 5: Hooks - Automated Determinist |

### ✅ PASS — `meeting summary auto crm slack`

Expected: provider ∈ {cybos|fabric}, category ∈ {Operations|Sales & outbound}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-001` | cybos-cases | Sales & outbound | AI sales-meeting auto-processor (transcript → dual prompts → | AI sales-meeting auto-processor (transcr |
| 2 | `A-008` | cybos-cases | Sales & outbound | Risk-of-churn case worker embedded in the CRM | End-to-end |
| 3 | `B-033` | cybos-cases | Operations | Meeting transcription + follow-up auto-tasks | Meeting transcription + follow-up auto-t |
| 4 | `A-003` | cybos-cases | Sales & outbound | Real-time sales copilot during calls (in-call prompts + auto | End-to-end |
| 5 | `B-063` | cybos-cases | Founder productivity | Morning brief | What |

### ✅ PASS — `candidate cv resume analysis hire`

Expected: provider ∈ {fabric|cybos}, category ∈ {HR & hiring}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-014` | cybos-cases | HR & hiring | Two-stage AI hiring pipeline (screening + full evaluation) | Prompts |
| 2 | `A-012` | cybos-cases | HR & hiring | Flat-file ATS for small teams | End-to-end |
| 3 | `A-013` | cybos-cases | HR & hiring | All-in-one HR skill for small teams | End-to-end |

### ✅ PASS — `tony robbins year in review self reflection`

Expected: provider ∈ {fabric}, category ∈ {Founder productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-045` | cybos-cases | Founder productivity | Year-review system — 9-history Context Lab playbook | Year-review system — 9-history Context L |
| 2 | `B-152` | cybos-cases | Founder productivity | Universal custom-instructions prompt — first-principles, ant | Prompts |
| 3 | `FAB-171` | fabric | Founder productivity | Provide Guidance | End-to-end |
| 4 | `B-141` | cybos-cases | Knowledge management | Session-open / session-close skills — accumulate institution | "Self-learning during the work itself" d |

### ✅ PASS — `create powerpoint deck from data`

Expected: provider ∈ {anthropic|cybos}, category ∈ {Engineering productivity|Operations}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `COB-054` | anthropic-cookbooks | Engineering productivity | Introduction to Claude Skills | Introduction to Claude Skills |
| 2 | `C-076` | cybos-cases | Marketing & content | Claude-in-PowerPoint to reformat rough decks against a corpo | Claude-in-PowerPoint to reformat rough d |
| 3 | `COB-055` | anthropic-cookbooks | Engineering productivity | Claude Skills for Financial Applications | Create investment committee deck |
| 4 | `B-110` | cybos-cases | Operations | Install Anthropic's pdf / xlsx / pptx skills to ship client- | End-to-end |
| 5 | `B-079` | cybos-cases | Sales & outbound | Personalized interactive web client proposal (replacing PPTX | Personalized interactive web client prop |

### ✅ PASS — `extract tables from pdf form`

Expected: provider ∈ {anthropic}, category ∈ {Engineering productivity}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `COB-049` | anthropic-cookbooks | Engineering productivity | Using Haiku as a sub-agent | Step 5: Extract information from PDFs |
| 2 | `COB-005` | anthropic-cookbooks | Engineering productivity | Summarization with Claude | Data Preparation |
| 3 | `B-008` | cybos-cases | Sales & outbound | Headless deck unwrapping (DocSend / Pitch / Notion → PDF → s | End-to-end |
| 4 | `COB-054` | anthropic-cookbooks | Engineering productivity | Introduction to Claude Skills | Download the PDF file |
| 5 | `COB-048` | anthropic-cookbooks | Engineering productivity | Working with Charts, Graphs, and Slide Decks | Slide Decks |

### ✅ PASS — `build dashboard chart with claude`

Expected: provider ∈ {cybos|fabric}, category ∈ {Data & BI}

| # | ID | Provider | Category | Title | Heading |
| - | - | - | - | - | - |
| 1 | `A-084` | cybos-cases | Marketing & content | Full GTM launch playbook — motion by ACV, ORB channels, mult | Tools |
| 2 | `B-093` | cybos-cases | Data & BI | AI-built financial dashboards over CRM + ERP + bank APIs | End-to-end |
| 3 | `A-043` | cybos-cases | Founder productivity | Founder personal dashboard — custom HTML, MCP-fed, with char | Tools |
| 4 | `B-212` | cybos-cases | Data & BI | Data-visualization critique and design with Tufte principles | Tools |
| 5 | `C-140` | cybos-cases | Engineering productivity | Project-metrics dashboard generator | Project-metrics dashboard generator |

