---
type: report
title: Skills dedup — fabric/anthropic/cookbook vs cybos
ingested: 2026-05-27
version: v0.1
---

# Skills dedup — fabric/anthropic/cookbook vs cybos

> Семантический анализ: для каждой единицы из fabric-patterns / anthropics-skills / claude-cookbooks найден ближайший cybos-кейс через vector-search по индексу. Порог "подозрение на дубль" — **cosine ≥ 0.85** (это очень близко по смыслу title+subtitle+первого абзаца).

**Всего проверено:** 104 единиц.  
**Подозрений на дубль (cosine ≥ 0.85):** 0.

## Топ-30 ближайших пар

| # | Источник | ID | Title | Cosine | Ближайший cybos | Раздел |
| - | - | - | - | -: | - | - |
| 1 | fabric | `FAB-023` | Review Code | **0.787** | [B-184-hire-vs-ai-decision-paid-trial-protocol-for-a-first-contract.md](../06_outputs/cybos-cases/08-hr-hiring/B-184-hire-vs-ai-decision-paid-trial-protocol-for-a-first-contract.md) | Prompts |
| 2 | fabric | `FAB-026` | Suggest Openclaw Pattern | **0.787** | [A-073-openclaw-personal-autonomous-agent-on-a-server-telegram-skil.md](../06_outputs/cybos-cases/09-founder-productivity/A-073-openclaw-personal-autonomous-agent-on-a-server-telegram-skil.md) | OpenClaw — personal autonomous agent on a server (Telegram + skills + cron) |
| 3 | anthropic | `ANT-001` | Building LLM-Powered Applications with Claude | **0.778** | [B-067-self-installable-claude-code-skill-via-http.md](../06_outputs/cybos-cases/04-infrastructure/B-067-self-installable-claude-code-skill-via-http.md) | Self-installable Claude Code skill via HTTP |
| 4 | anthropic-cookbooks | `COB-003` | Knowledge Graph Construction with Claude | **0.777** | [A-032-token-metabolism-knowledge-graph-as-company-memory.md](../06_outputs/cybos-cases/07-knowledge-management/A-032-token-metabolism-knowledge-graph-as-company-memory.md) | End-to-end |
| 5 | anthropic-cookbooks | `COB-023` | Orchestrate: from issue to merged PR | **0.775** | [B-035-reverse-engineered-business-process-diagram.md](../06_outputs/cybos-cases/06-operations/B-035-reverse-engineered-business-process-diagram.md) | End-to-end |
| 6 | anthropic-cookbooks | `COB-013` | The Vulnerability Detection Agent | **0.775** | [B-142-cross-session-memory-via-shell-snippets-in-global-claudemd.md](../06_outputs/cybos-cases/07-knowledge-management/B-142-cross-session-memory-via-shell-snippets-in-global-claudemd.md) | What |
| 7 | anthropic-cookbooks | `COB-055` | Claude Skills for Financial Applications | **0.774** | [B-110-install-anthropics-pdf-xlsx-pptx-skills-to-ship-client-ready.md](../06_outputs/cybos-cases/06-operations/B-110-install-anthropics-pdf-xlsx-pptx-skills-to-ship-client-ready.md) | Tools |
| 8 | anthropic-cookbooks | `COB-019` | Explore: grounding in an unfamiliar codebase | **0.773** | [A-031-shared-workspace-as-second-brain.md](../06_outputs/cybos-cases/07-knowledge-management/A-031-shared-workspace-as-second-brain.md) | Gotchas |
| 9 | anthropic-cookbooks | `COB-050` | Usage & Cost Admin API Cookbook | **0.773** | [B-133-plan-mode-plus-hidden-claude-code-model-aliases-for-long-ses.md](../06_outputs/cybos-cases/01-engineering-productivity/B-133-plan-mode-plus-hidden-claude-code-model-aliases-for-long-ses.md) | Tools |
| 10 | anthropic-cookbooks | `COB-026` | Outcomes: agents that verify their own work | **0.770** | [A-088-five-parallel-subagent-review-with-a-weighted-safety-score.md](../06_outputs/cybos-cases/06-operations/A-088-five-parallel-subagent-review-with-a-weighted-safety-score.md) | Gotchas |
| 11 | anthropic-cookbooks | `COB-080` | Tool choice | **0.770** | [B-120-debug-loop-circuit-breaker-after-3-failed-prs-zoom-out-and-b.md](../06_outputs/cybos-cases/01-engineering-productivity/B-120-debug-loop-circuit-breaker-after-3-failed-prs-zoom-out-and-b.md) | Tools |
| 12 | anthropic-cookbooks | `COB-054` | Introduction to Claude Skills | **0.768** | [B-110-install-anthropics-pdf-xlsx-pptx-skills-to-ship-client-ready.md](../06_outputs/cybos-cases/06-operations/B-110-install-anthropics-pdf-xlsx-pptx-skills-to-ship-client-ready.md) | What |
| 13 | anthropic-cookbooks | `COB-076` | Context Editing & Memory for Long-Running Agents | **0.768** | [A-048-handoffs-as-the-unit-of-agent-memory-wave-numbered-per-proje.md](../06_outputs/cybos-cases/07-knowledge-management/A-048-handoffs-as-the-unit-of-agent-memory-wave-numbered-per-proje.md) | Handoffs as the unit of agent memory — wave-numbered per-project handoff docs |
| 14 | anthropic | `ANT-004` | Web Artifacts Builder | **0.767** | [B-067-self-installable-claude-code-skill-via-http.md](../06_outputs/cybos-cases/04-infrastructure/B-067-self-installable-claude-code-skill-via-http.md) | Self-installable Claude Code skill via HTTP |
| 15 | anthropic-cookbooks | `COB-053` | Orchestrator-Workers Workflow | **0.765** | [B-115-router-bot-pattern-one-orchestrator-agent-many-deterministic.md](../06_outputs/cybos-cases/06-operations/B-115-router-bot-pattern-one-orchestrator-agent-many-deterministic.md) | Router-bot pattern — one orchestrator agent, many deterministic worker bots |
| 16 | anthropic-cookbooks | `COB-037` | \"Uploading\" PDFs to Claude Via the API | **0.765** | [C-045-cowork-tab-in-claude-desktop-app-non-cli-onramp.md](../06_outputs/cybos-cases/04-infrastructure/C-045-cowork-tab-in-claude-desktop-app-non-cli-onramp.md) | What |
| 17 | fabric | `FAB-101` | Transcribe Minutes | **0.764** | [C-042-calendar-event-tagging-convention-cohort-02.md](../06_outputs/cybos-cases/09-founder-productivity/C-042-calendar-event-tagging-convention-cohort-02.md) | Calendar event tagging convention (#cohort-02) |
| 18 | fabric | `FAB-067` | Check Agreement | **0.764** | [B-212-data-visualization-critique-and-design-with-tufte-principles.md](../06_outputs/cybos-cases/11-data-bi/B-212-data-visualization-critique-and-design-with-tufte-principles.md) | Gotchas |
| 19 | anthropic-cookbooks | `COB-021` | Iterate: do → observe → fix | **0.764** | [C-144-running-implementation-notes-file-for-off-spec-decisions.md](../06_outputs/cybos-cases/01-engineering-productivity/C-144-running-implementation-notes-file-for-off-spec-decisions.md) | What |
| 20 | fabric | `FAB-100` | Summarize Meeting | **0.763** | [B-033-meeting-transcription-follow-up-auto-tasks.md](../06_outputs/cybos-cases/06-operations/B-033-meeting-transcription-follow-up-auto-tasks.md) | Meeting transcription + follow-up auto-tasks |
| 21 | anthropic-cookbooks | `COB-048` | Working with Charts, Graphs, and Slide Decks | **0.763** | [B-101-meta-graph-cli-meta-platform-ops-skill-claude-operates-brand.md](../06_outputs/cybos-cases/02-marketing-content/B-101-meta-graph-cli-meta-platform-ops-skill-claude-operates-brand.md) | What |
| 22 | anthropic-cookbooks | `COB-011` | Migrating from the OpenAI Agents SDK | **0.763** | [B-090-screenshot-microservice-opportunistic-learning-loop.md](../06_outputs/cybos-cases/01-engineering-productivity/B-090-screenshot-microservice-opportunistic-learning-loop.md) | What |
| 23 | anthropic-cookbooks | `COB-041` | Session Memory Compaction | **0.762** | [B-142-cross-session-memory-via-shell-snippets-in-global-claudemd.md](../06_outputs/cybos-cases/07-knowledge-management/B-142-cross-session-memory-via-shell-snippets-in-global-claudemd.md) | Cross-session memory via shell snippets in global CLAUDE.md |
| 24 | anthropic-cookbooks | `COB-038` | Prompt caching with the Claude API | **0.762** | [C-081-keep-claude-code-sessions-warm-kv-cache-expiry-burns-tokens.md](../06_outputs/cybos-cases/06-operations/C-081-keep-claude-code-sessions-warm-kv-cache-expiry-burns-tokens.md) | What |
| 25 | anthropic-cookbooks | `COB-047` | How to transcribe documents with Claude | **0.762** | [B-110-install-anthropics-pdf-xlsx-pptx-skills-to-ship-client-ready.md](../06_outputs/cybos-cases/06-operations/B-110-install-anthropics-pdf-xlsx-pptx-skills-to-ship-client-ready.md) | Install Anthropic's pdf / xlsx / pptx skills to ship client-ready deliverables from Claude Code |
| 26 | anthropic-cookbooks | `COB-056` | Building Custom Skills for Claude | **0.761** | [A-065-parallel-agent-dev-workflow-46-subsystem-agents-in-worktrees.md](../06_outputs/cybos-cases/01-engineering-productivity/A-065-parallel-agent-dev-workflow-46-subsystem-agents-in-worktrees.md) | "review this diff" |
| 27 | anthropic-cookbooks | `COB-032` | Building a moderation filter with Claude | **0.761** | [A-011-stylistic-contentvoice-writer-multi-channel-fact-check.md](../06_outputs/cybos-cases/02-marketing-content/A-011-stylistic-contentvoice-writer-multi-channel-fact-check.md) | Tools |
| 28 | fabric | `FAB-030` | Summarize Prompt | **0.761** | [C-100-anti-fluff-chat-digest-prompt-concrete-tools-attributed-insi.md](../06_outputs/cybos-cases/07-knowledge-management/C-100-anti-fluff-chat-digest-prompt-concrete-tools-attributed-insi.md) | Anti-fluff chat-digest prompt — concrete tools, attributed insights, open questions |
| 29 | anthropic-cookbooks | `COB-039` | Summarizing Web Page Content with Claude 3 Haiku | **0.761** | [B-110-install-anthropics-pdf-xlsx-pptx-skills-to-ship-client-ready.md](../06_outputs/cybos-cases/06-operations/B-110-install-anthropics-pdf-xlsx-pptx-skills-to-ship-client-ready.md) | Install Anthropic's pdf / xlsx / pptx skills to ship client-ready deliverables from Claude Code |
| 30 | anthropic-cookbooks | `COB-077` | Parallel tool calls on Claude 3.7 Sonnet | **0.761** | [A-066-three-layer-rule-enforcement-hook-skill-step-claudemd.md](../06_outputs/cybos-cases/01-engineering-productivity/A-066-three-layer-rule-enforcement-hook-skill-step-claudemd.md) | Tools |

## Как читать

- **Cosine 1.0** — почти идентичные тексты (вряд ли встретится, разные источники).
- **0.90+** — очень похожие, требуют ручного просмотра. Возможно один скил пересказывает другой.
- **0.85-0.90** — тематически близкие, но могут быть разными подходами к одной задаче. Не обязательно дубли.
- **<0.85** — разные темы или один общий keyword.

Если решено пометить пару как дубль — добавь во frontmatter более старого/слабого скила:

```yaml
possible_duplicate: <id-ближайшего>
duplicate_confidence: <cosine-score>
```

