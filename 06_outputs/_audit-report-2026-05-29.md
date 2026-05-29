---
id: AUDIT-2026-05-29
type: report
kind: report
title: "Всесторонний аудит проекта ai-kb-harness-template"
date: 2026-05-29
version: v1.0
scope: "harness + KB; двойная оптика Lens T (шаблон) / Lens K (реальная KB)"
method: "6 параллельных read-only аудиторов + ground-truth команды; находки с доказательствами file:line"
---

# Всесторонний аудит — `ai-kb-harness-template` (29 мая 2026)

## 0. Как читать этот отчёт

Репозиторий — **гибрид**: переиспользуемый AI-harness (шаблон оснастки) И загруженная knowledge base
(736 карточек из 4 источников). Поэтому каждая находка оценена в **двойной оптике**:

- **Lens T (Template):** хорошая ли это переиспользуемая оснастка? Пустые слои `00–05` и `TODO`-заглушки — *норма* чистого шаблона. Критерии: работает из коробки, безопасна, воспроизводима, документирована.
- **Lens K (Real KB):** соблюдает ли репозиторий **собственный** `AGENTS.md`? Пустые слои, отсутствие меток/цитат/связей — *дефекты* (их же документ зовёт это «lint failure»).

**Severity:** `Blocker` · `High` · `Medium` · `Low` · `Info` — отдельно под каждую оптику (они расходятся).
**Метод:** 6 read-only аудиторов (по измерению A–F) + независимые ground-truth команды. Громкие находки
(`kb-doctor` EXIT 1, `protobufjs` critical) перепроверены вручную — см. §5.

---

## 1. Вердикт и scorecard

| Измерение | Lens T | Lens K | Резюме |
|---|:---:|:---:|---|
| **A. Соответствие правилам (AGENTS.md)** | 🟢 | 🔴 | Шаблон собран аккуратно, документы непротиворечивы; но KB грубо обходит собственную иерархию слоёв, меток, цитат, журнала. |
| **B. Инженерное качество кода** | 🟡 | 🟢 | RAG/хуки/skillopt аккуратны и образцовы местами; дыры в dev-поверхностях (viewer-сервер, `--execute` без таймаута). |
| **C. Качество контента (736 карточек)** | 🟢 | 🟡 | Структура единообразна; но 7 пустых fabric-стабов, cybos (57%) без лицензии, метрики «42/42» и «0 дублей» завышают строгость. |
| **D. Безопасность / supply chain** | 🟡 | 🟢 | Секретов нет, MCP read-only; но 1 **critical** RCE в зависимостях, широкие permissions, `deny:[]` пуст. |
| **E. Воспроизводимость / онбординг** | 🟡 | 🟢 | Заводится, но Node не закреплён (нативные модули), 3 раздельных `pnpm install`, нет CI. |
| **F. Продуктовая ценность / ROI** | 🟢 | 🔴 | Честная рабочая оснастка без vaporware; но двойная идентичность сбивает, граф/backlinks мертвы, флагман-loop невоспроизводим из коробки. |

### Общий вердикт

- **Как шаблон-оснастка (Lens T): 🟡 «рабочая и честная, но раздаётся с острыми краями».**
  Код делает ровно то, что обещает README (guards реальны, `dream-cycle`/`kb-doctor` работают на чистом Node — это редкая зрелость). НО для артефакта, который **форкают не глядя**, опасны дефолты: 1 critical RCE в supply-chain, viewer-сервер отдаёт любой файл по сети, слишком широкие permissions, спотыкающийся онбординг, красный `kb-doctor` при первом запуске.

- **Как реальная KB (Lens K): 🔴 «полезная плоская библиотека, противоречащая собственной дисциплине».**
  736 карточек влиты в `06_outputs/` минуя слои `00–05`; 0 содержательных меток, ~0 `related:` (граф и backlinks мертвы на 99% узлов), `log.md` не ведётся, semantic invariant (`core.md`, `AGENTS.md §Project purpose`) = `TODO` — **при том что этот текст подмешивается в `think`/MCP как системный промпт**. Контент полезен как справочник, но не несёт ту дисциплину `evidence→synthesis→decision`, которую проповедует `AGENTS.md`.

**Корневая причина большинства K-дефектов** — нерешённая **двойная идентичность**: один репозиторий
одновременно «пустой шаблон с TODO» и «забитый чужим корпусом showcase». Развести их — самый
высокорычажный шаг.

---

## 2. Приоритизированный backlog (сводный, кросс-измеренческий)

### P0 — до раздачи/продакшн-использования (Lens T: High/Critical)
1. **`protobufjs` critical RCE** (D3). Транзитивно через `@xenova/transformers → onnxruntime-web@1.14.0 → onnx-proto → protobufjs@6.11.6`. **Подтверждено:** `pnpm audit` = `critical:1, high:4, moderate:4`. → `pnpm.overrides: protobufjs>=7.5.8` в `scripts/semantic/package.json` (после smoke-теста индексации) или апгрейд transformers; до фикса — баннер в README.
2. **Viewer-сервер: небезопасные дефолты** (B1+B2). `/api/doc/<path>` отдаёт **любой** файл под корнем (`.git/config`, `.claude/settings.json`), `server.listen(PORT)` биндит на `::` (вся LAN). → allowlist `extname===".md"` + `realpath`-containment (`server.ts:115-121`); `listen(PORT, "127.0.0.1")` (`server.ts:292`).
3. **Permissions слишком широкие** (D1+D2). `Bash(node scripts/*:*)` = карт-бланш на произвольный node-код; `deny:[]` пуст. → whitelist конкретных read-only скриптов; мутирующие (`skillopt apply`, `dream-cycle`) в `ask`; наполнить `deny` (`.env`, `~/.ssh`, `curl|bash`, запись в `.claude/`).
4. **Онбординг: Node не закреплён + 3 раздельных install** (E1+E2+E4+F4). Нативные `better-sqlite3`/ONNX чувствительны к ABI. → `.nvmrc`=`22`, `engines`, `packageManager:"pnpm@9"`, `pnpm-workspace.yaml` **или** корневой `setup`-скрипт.

### P1 — дисциплина KB (Lens K: 🔴, стратегическое)
5. **Разрешить конфликт source-hierarchy + развести идентичности** (A1+F1+F6). Решить и задокументировать в `AGENTS.md`: 736 карточек — это `06_outputs/external-corpus` (особый слой вне пирамиды) или их место в `02_sources/`; и отделить чистый template-репо от showcase с корпусом.
6. **Заполнить semantic invariant** (A7). `AGENTS.md §Project purpose` + `core.md` (Цель/Контекст/Hard rules) — это системный промпт для синтеза; сейчас агент получает «TODO» как цель проекта.
7. **Узаконить или проставить citation/labels/related** (A3+A4+A5+F2). Либо явно освободить upstream-карточки от меток (`source:`-URL = их цитата), либо размечать; проставить `related:` хотя бы внутри категорий — иначе `backlinks.mjs` и `/graph` пусты на 736/747 узлов.
8. **Вести `log.md`** (A6). Сейчас 9 строк (`(init)`, дата `2026-XX-XX`) при 736 ingested карточках — шаг 9 ingest-workflow не выполнен ни разу.

### P2 — надёжность и качество (Medium)
9. **Зелёный `kb-doctor` из коробки** (F7+A9). **Подтверждено:** EXIT 1 (1 missing-frontmatter + 2 orphans — все три собственные scaffold-файлы). → frontmatter `type: synthesis` в `04_synthesis/contradictions.md`; вывести scaffold из orphan-проверки.
10. **Таймауты и path-guard** (B3+D4+D5). `spawnSync('claude')` без таймаута в `dream-cycle.mjs:216` и `think.mjs:147` (готовый паттерн есть в `skillopt/llm/claude-cli.mjs:65`); `"timeout":10` на PreToolUse-хуках в `settings.json`; `.regex(/^[\w.-]+$/)` на `run_id/skill` в `skillopt/mcp-server.mjs:89`.
11. **Контент** (C1+C2+C3+F5). 7 пустых fabric-стабов (FAB-001/043/055/093/117/154/161), причём FAB-117 ранжируется в search top-3 → до-импортировать тела или `status: stub` + исключить из индекса; cybos (57% KB) без `license`/`provider` → добавить правовую основу/атрибуцию.
12. **Честность метрик** (C7+C8). Dedup проверяет лишь `external→cybos` (пропускает внутрикорпусные дубли FAB-148/151/152); «42/42 PASS» = recall@3 по OR-логике с авторскими ожиданиями, не precision@1. → расширить оси/метрики, переформулировать claim'ы честнее.
13. **CI smoke-test** (E5). Matrix Node 20/22: `install → kb:index → kb:doctor → search-quality-probes`.

### P3 — tech-debt / Low / Info
FTS5 тихий `catch` без лога (B5, `lib.mjs:347`) · дублирование prompt-builder в `think.mjs`/`mcp-server.mjs` (B10) · oversized-чанк из одного слова (B6) · RU 1-символьные токены выпадают из BM25 (B7) · 8 orphan-`.py` ingest-скриптов без `requirements.txt` (E8) · нет CHANGELOG/git-тегов при `v0.2.0` (E7) · «полностью on-device» вводит в заблуждение про первый запуск (~120 MB ONNX) (E9/F4) · `.mcp.json` относительные пути (D10) · `zod@4` ↔ `@modelcontextprotocol/sdk@1` — добавить smoke-тест (B12) · `reflect.mjs` читает `usage` у skip-записей (B8) · мёртвый `if` в `check-md-frontmatter.mjs:46` (B9).

---

## 3. Находки по измерениям

### A. Соответствие декларированным правилам — T 🟢 / K 🔴
| Находка | T | K | Доказательство |
|---|:--:|:--:|---|
| Source hierarchy инвертирована: 100% контента в `06_outputs`, слои 00–05 пусты; `06_outputs` даже не упомянут в Canonical reading order | Info | **Blocker** | `AGENTS.md:17-24,28-33`; слои 00–05 = только `.gitkeep` |
| Canonical reading order ведёт в пустые каталоги (шаги 3,4,5) | Info | High | `AGENTS.md:17-24` vs пустые `00_context/03_wiki`, `open-questions.md:25` «(пока пусто)» |
| Метки FACT/INFERENCE/… отсутствуют (1/747, и тот — false-positive в prose) | Info | High | `AGENTS.md:57` «смешение без меток — lint failure»; grep → 1 файл (`FAB-104…:44`) |
| Внутренние цитаты `[source:/0..]` не используются (5 файлов, все — шаблон/примеры) | Info | Medium | grep → `AGENTS.md`, `README.md`, 2× `skills/*`, `contradictions.md` |
| `related:` связность ≈нулевая (1 контентный файл) → backlinks-индекс питать нечем | Info | High | grep `^related:` → `A-036…` + `skills/skill-decision-log.md`; `AGENTS.md:101` |
| `log.md` не ведётся (9 строк, `(init)`, `2026-XX-XX`) при 736 карточках | Info | High | `log.md:7,9`; 3 ingest-коммита не отражены |
| TODO-заглушки в semantic invariant | Info | High | `AGENTS.md:13`, `core.md:9,13,17-19`, `index.md:8`, `CLAUDE.md §Запуск` |
| Frontmatter `type`+`version` в 06_outputs — 100% (контрпроверка, НЕ дефект) | — | — | grep → 747/747 |
| `04_synthesis/contradictions.md` без frontmatter вовсе | Low | Medium | `contradictions.md:1`; `AGENTS.md:97` требует `type` |

### B. Инженерное качество кода — T 🟡 / K 🟢
| Находка | T | K | Доказательство |
|---|:--:|:--:|---|
| `/api/doc/<path>` читает любой файл под корнем (нет extension-allowlist) | **High** | Medium | `tools/viewer/server.ts:115-121` |
| Viewer слушает на всех интерфейсах (`::`) | **High** | Low | `server.ts:292` |
| Нет таймаута на `spawnSync('claude')` в `--execute` | Medium | Medium | `dream-cycle.mjs:216`, `think.mjs:147` (фикс есть в `skillopt/llm/claude-cli.mjs:65`) |
| Нет таймаута на загрузку модели/`embedder()` | Medium | Low | `lib.mjs:182`; `index.mjs:57`, `mcp-server.mjs:61` |
| Тихий `catch` глушит все ошибки FTS5 → hybrid молча деградирует | Low | Medium | `lib.mjs:347-350` |
| Oversized-чанк из одного слова; RU 1-символьные токены выпадают | Low/Info | Low | `lib.mjs:141-173`, `:378` |
| Дублирование prompt-builder think↔mcp; `index.mjs` без `try/finally` на `db.close()` | Info | Low | `think.mjs:158-225` vs `mcp-server.mjs:184-230`; `index.mjs:149` |
| **Образцово (НЕ дефект):** skillopt LLM-адаптеры с таймаутом+SIGTERM+retry; MCP намеренно read-only; `apply` с backup и проверкой чистого tree; BigInt/Number rowid учтён | — | — | `claude-cli.mjs:65`, `edit.mjs:75-88`, `lib.mjs:271,276` |

### C. Качество контента (736 карточек) — T 🟢 / K 🟡
| Находка | T | K | Доказательство |
|---|:--:|:--:|---|
| 7 пустых fabric-стабов (тело = повтор заголовка) | Low | **Medium** | `FAB-001-coding-master.md:17-21`, +043/055/093/117/154/161 |
| Пустой stub FAB-117 ранжируется search top-2 | Low | Medium | `_search-quality-report.md:216` ↔ пустая карточка |
| cybos (418, 57% KB) без `provider`/`license` — дословный контент с cybos.ai без правовой основы | Low | **Medium** | presence-count cybos: license 0/418, provider 0/418 |
| `tier` = прокси происхождения, не качества (пустой FAB всё равно «B») | Low | Low | anthropic/cookbook=A, fabric=B; ANT-014 стаб=A |
| Scrape-артефакты: вложенные backticks (120 файлов), пустые fenced-блоки (18) | Low | Low | `cybos-cases/.../A-007`, `A-024` |
| dedup «0 дублей» — однонаправлен (только external→cybos) | Low | Low | `dedup-skills.mjs:22,90-95`; кандидаты FAB-148/151/152 |
| «42/42 PASS» = recall@3 по OR-логике, не precision@1 | Low | Medium | `search-quality-probes.mjs:190-195` |
| **НЕ дефект:** число 736 корректно; 4 source-available (ANT-013..016) — намеренные reference-стабы; категорийная таблица арифметически точна | — | — | `_index.md:23-37`; tier 196/427/113 |

### D. Безопасность / supply chain — T 🟡 / K 🟢
| Находка | T | K | Доказательство |
|---|:--:|:--:|---|
| `protobufjs@6.11.6` — **critical RCE** (+8 advisory) через ONNX | **High** | Medium | `pnpm-lock.yaml`; `pnpm audit` = `critical:1,high:4,moderate:4` (перепроверено) |
| `Bash(node scripts/*:*)` = произвольное исполнение node-кода | High | Low | `.claude/settings.json:11`; ср. `edit.mjs:88` (writeFile) |
| `deny:[]` пуст — нет жёстких запретов | High | Low | `.claude/settings.json:35` |
| Нет `timeout` на PreToolUse-хуках | Medium | Low | `.claude/settings.json:48-62` |
| Path traversal в skillopt MCP (`run_id`/`skill` без санитайза) → arbitrary file read | Medium | Low | `skillopt/mcp-server.mjs:89,157` |
| Config-driven исполнение кода (`.skillopt.js` adapters) | Medium | Low | `config.mjs:19-26,97`; `generic-cli.mjs:44-47` |
| `env.allowRemoteModels` не задан → офлайн без кэша падает; модель с HF Hub | Low | Low | `lib.mjs:24,51-54` |
| **НЕ дефект:** секретов нет (дерево+история); хуки fail-open без shell-инъекции; MCP read-only; `spawn` без `shell:true`; `onlyBuiltDependencies` allowlist | — | — | grep → no matches; `check-*.mjs`, `openai-http.mjs:22` |

### E. Воспроизводимость / онбординг — T 🟡 / K 🟢
| Находка | T | K | Доказательство |
|---|:--:|:--:|---|
| Node-версия не закреплена (нет `.nvmrc`/`engines`) — риск для нативных модулей | **High** | Low | все 4 `package.json` без `engines`; нет `.nvmrc` |
| Нет корневого install-оркестратора (3 раздельных `pnpm install`) | **High** | Info | root `package.json:5` (только в description); нет `pnpm-workspace.yaml` |
| Корневые `kb:*` молча падают до под-install (`Cannot find module 'better-sqlite3'`) | Medium | Info | `package.json:8`; root deps `{}` |
| Prerequisite `pnpm`/`corepack` нигде не объявлен | Medium | Info | нет `packageManager`-поля |
| Нет CI (`.github/workflows` отсутствует) | Medium | Low | перепроверено |
| 8 orphan-`.py` ingest-скриптов без `requirements.txt`/доков | Low | Medium | `scripts/*.py`; grep по докам → пусто |
| Нет CHANGELOG/git-тегов при `v0.2.0` | Low | Info | `git tag -l` → 0 |
| **НЕ дефект:** нет корневого lock (нечего лочить); индекс/кэш gitignored корректно; viewer `better-sqlite3` optional + graceful fallback; все 12 команд ссылаются на существующие файлы | — | — | `server.ts:142,161` |

### F. Продуктовая ценность / ROI — T 🟢 / K 🔴
| Находка | T | K | Доказательство |
|---|:--:|:--:|---|
| Корпус полностью обходит слои 00–05 — противоречит заявленной дисциплине | Low | **High** | `find 06_outputs = 747`; 00–05 = `.gitkeep`/scaffold |
| Backlinks и Graph мертвы (0 непустых `related:` на 747 карточек) | Low | **High** | grep; README:164 обещает blast-radius |
| Флагман SkillOpt-loop невоспроизводим из коробки (`MIN_CASES_FOR_REFLECT=5`, а кейсов 3) | Medium | Low | `reflect.mjs:26,61`; `find skills -name '*.yaml' = 3` |
| Headline-фича не работает на clone (install + индекс + 120 MB модель) | Medium | Medium | `import search.mjs` → `Cannot find package`; README:5 «через 10 минут» |
| Двойная идентичность сбивает первого пользователя | Medium | Medium | `README:1` «шаблон» vs 747 чужих карточек; `core.md`/`AGENTS.md` TODO |
| Бимодальное качество карточек (cybos богатые / fabric стабы) | Low | Medium | `FAB-001` = 389 B |
| Harness флагает собственный scaffold как нездоровый | Low | Low | `kb-doctor` → EXIT 1 (перепроверено) |
| **НЕ дефект — главный актив доверия:** документация = коду (guards `MIN_CASES=5`, refusal при 100% pass и грязном tree реальны; `dream-cycle` пишет только drop-zone) | — | — | `reflect.mjs:61,74`; `edit.mjs:75`; `.context/dream-report-2026-05-29.md` |

**Вердикт F одной фразой:** под Lens T — редкая честная, рабочая, on-device оснастка (hybrid RAG + MCP +
дисциплина утверждений + human-in-the-loop SkillOpt), максимально ценная для **solo-researcher/solo-founder**,
готового вложить полчаса в setup и ведущего один проект с нуля; под Lens K ценность подорвана плоской,
несвязанной выкладкой корпуса в обход слоёв.

---

## 4. Сильные стороны (что НЕ нужно «чинить»)

- **Код делает то, что обещает** — нет vaporware. Guards (`MIN_CASES_FOR_REFLECT=5`, refusal при 100% pass-rate и грязном working-tree), `dream-cycle` (чистый Node, пишет только в `.context/`), `kb-doctor` (без зависимостей) — всё подтверждено запуском.
- **Образцовая обработка процессов в skillopt** — таймауты+`SIGTERM`+retry/backoff во всех LLM-адаптерах; MCP-серверы намеренно read-only, мутации только через CLI (human-in-the-loop).
- **Permissions-матрица в основе разумна** — immutable-слои и история под `ask`, деструктив (`rm`/`push`/`reset`) под `ask`; хуки fail-open и без shell-инъекции.
- **Frontmatter-контракт в `06_outputs` соблюдён на 100%**; категорийная арифметика точна; source-available карточки оформлены корректно.
- **Воспроизводимость по-пакетно обеспечена** — три `pnpm-lock.yaml`, индекс регенерируем, viewer мягко деградирует без индекса.
- **Документы взаимно непротиворечивы** — разрыв исключительно «декларация ↔ реальность данных», не «документ ↔ документ».

Под **Lens T** намеренными и корректными являются: пустые слои `00–05` с `.gitkeep`, `TODO`-плейсхолдеры
в `AGENTS.md`/`core.md`/`index.md`/`CLAUDE.md`, `log.md` с одной `(init)`-строкой, scaffold-файлы synthesis.
Их не следует трактовать как дефекты при оценке шаблона.

---

## 5. Методология и верификация

**Как получены находки:** 6 параллельных read-only субагентов (по измерению A–F), каждый — с доказательством
`file:line`/выводом команды; плюс независимые ground-truth команды ведущего аудитора. Аудит не менял
репозиторий (кроме записи этого отчёта).

**Перепроверено вручную (видно своими глазами):**
- `node scripts/kb-doctor.mjs` → **EXIT 1**; 749 файлов; 1 missing-frontmatter (`contradictions.md`) + 2 orphans.
- `pnpm audit` в `scripts/semantic` → `{info:0, low:0, moderate:4, high:4, critical:1}`.
- Счёты: `06_outputs` = 744 подпапочных + 3 отчёта = 747 `.md`; **736 карточек** (744 − 8 индексных) — число в `_skills-index.md` корректно.
- Нулевые claim'ы: метки `FACT/…` → 1 файл; непустой `related:` → 1; `[source:/0..]` → 5; `version:` → 747×`v0.1`.
- Окружение: Node `v22.14.0`; нет `.nvmrc`, нет `.github/workflows`; слои 00–05 пусты (04 = 2 scaffold).

**Команды для самостоятельной перепроверки:**
```bash
node scripts/kb-doctor.mjs --json
node scripts/search-quality-probes.mjs
git ls-files '06_outputs/**/*.md' | wc -l          # 744 (+3 отчёта в корне)
grep -rlE '^related:\s*\[?\s*[^]\s]' --include='*.md' . | wc -l   # связность
cd scripts/semantic && pnpm audit                  # supply chain
```

**Границы аудита:** не выполнялись install/build (анализ конфигов, не прогон сборки); `pnpm audit`
выполнен по lock-файлу `scripts/semantic` (skillopt/viewer — по разбору `package.json`); контент проверен
выборочно (8–10 файлов на источник), не сплошняком все 736 карточек.
