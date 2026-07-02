// probes-corpus.mjs — golden set проб по ДЕМО-КОРПУСУ (736 карточек в 06_outputs/<provider>/).
//
// Эти пробы завязаны на expect_provider/expect_cat карточек корпуса — они осмысленны ТОЛЬКО пока
// демо-корпус присутствует. probes.mjs (композитор) подключает их автоматически при наличии
// корпуса и пропускает после `kb:init --strip-demo` — шаблон не наказывает за удаление демо.
//
// Каждая проба:
//   q                — запрос (RU/EN), как его задал бы пользователь.
//   expect_provider  — regex-альтернатива провайдеров/библиотек, релевантных запросу (OR через |).
//   expect_cat       — regex-альтернатива ожидаемых категорий (OR через |).
//
// PASS-предикат (recall@k): среди top-k уникальных файлов есть хотя бы один, чья категория ИЛИ
// провайдер/библиотека матчат ожидание. Это recall@k, НЕ precision@1.

export const CORPUS_PROBES = [
  // ============================================================
  // 01-engineering-productivity
  // ============================================================
  { q: 'build mcp server claude tools',            expect_provider: 'anthropic|fabric|cybos',  expect_cat: 'Engineering productivity' },
  { q: 'prompt caching cost reduction claude api', expect_provider: 'anthropic-cookbooks|cybos', expect_cat: 'Engineering productivity' },
  { q: 'code review skill for pull requests',      expect_provider: 'fabric|cybos',             expect_cat: 'Engineering productivity' },
  { q: 'parallel multi-agent dev workflow worktrees', expect_provider: 'cybos|fabric',          expect_cat: 'Engineering productivity' },

  // ============================================================
  // 02-marketing-content
  // ============================================================
  { q: 'write essay in paul graham style',         expect_provider: 'fabric',                   expect_cat: 'Marketing & content' },
  { q: 'newsletter writing prompts',               expect_provider: 'fabric|cybos',             expect_cat: 'Marketing & content' },
  { q: 'blog post landing page conversion copy',   expect_provider: 'cybos|fabric',             expect_cat: 'Marketing & content' },

  // ============================================================
  // 03-strategy-leadership
  // ============================================================
  { q: 'competitive positioning swot analysis framework', expect_provider: 'fabric|cybos',      expect_cat: 'Strategy & leadership' },
  { q: 'prepare 7s mckinsey strategy',             expect_provider: 'fabric',                   expect_cat: 'Strategy & leadership' },
  { q: 'analyze business risk decision',           expect_provider: 'fabric|cybos',             expect_cat: 'Strategy & leadership' },

  // ============================================================
  // 04-infrastructure
  // ============================================================
  { q: 'terraform plan iac infrastructure analysis', expect_provider: 'fabric|cybos',           expect_cat: 'Infrastructure' },
  { q: 'self-installable claude code skill via http server', expect_provider: 'cybos',          expect_cat: 'Infrastructure' },

  // ============================================================
  // 05-sales-outbound
  // ============================================================
  { q: 'analyze sales call transcript scoring',    expect_provider: 'fabric|cybos',             expect_cat: 'Sales & outbound' },
  { q: 'cold outbound email prospect personalize', expect_provider: 'cybos|fabric',             expect_cat: 'Sales & outbound' },
  { q: 'create hormozi grand slam offer',          expect_provider: 'fabric',                   expect_cat: 'Sales & outbound' },

  // ============================================================
  // 06-operations
  // ============================================================
  { q: 'meeting summary auto crm slack',           expect_provider: 'cybos|fabric',             expect_cat: 'Operations|Sales & outbound' },
  { q: 'transcribe minutes board meeting',         expect_provider: 'fabric|cybos',             expect_cat: 'Operations' },
  { q: 'agility user story epic agile',            expect_provider: 'fabric|cybos',             expect_cat: 'Operations' },

  // ============================================================
  // 07-knowledge-management
  // ============================================================
  { q: 'extract wisdom from podcast or video',     expect_provider: 'fabric',                   expect_cat: 'Knowledge management' },
  { q: 'summarize research paper academic',        expect_provider: 'fabric|cybos',             expect_cat: 'Knowledge management' },
  { q: 'extract book ideas highlights reading',    expect_provider: 'fabric',                   expect_cat: 'Knowledge management' },

  // ============================================================
  // 08-hr-hiring
  // ============================================================
  { q: 'candidate cv resume analysis hire',        expect_provider: 'fabric|cybos',             expect_cat: 'HR & hiring' },
  { q: 'interview question preparation answer',    expect_provider: 'fabric|cybos',             expect_cat: 'HR & hiring' },
  { q: 'analyze personality from text behavior',   expect_provider: 'fabric',                   expect_cat: 'HR & hiring' },

  // ============================================================
  // 09-founder-productivity
  // ============================================================
  { q: 'tony robbins year in review self reflection', expect_provider: 'fabric|cybos',          expect_cat: 'Founder productivity' },
  { q: 'find blindspots dunning kruger thinking',  expect_provider: 'fabric',                   expect_cat: 'Founder productivity' },
  { q: 'daily focus top priorities founder',       expect_provider: 'cybos|fabric',             expect_cat: 'Founder productivity' },

  // ============================================================
  // 10-customer-success
  // ============================================================
  { q: 'analyze product feedback users complaints', expect_provider: 'fabric|cybos',            expect_cat: 'Customer success' },
  { q: 'saas churn prevention retention onboarding', expect_provider: 'cybos',                  expect_cat: 'Customer success' },

  // ============================================================
  // 11-data-bi
  // ============================================================
  { q: 'build dashboard chart with claude',        expect_provider: 'cybos|fabric',             expect_cat: 'Data & BI' },
  { q: 'natural language analytics over warehouse', expect_provider: 'cybos',                   expect_cat: 'Data & BI' },
  { q: 'classification embeddings text categories', expect_provider: 'anthropic-cookbooks',     expect_cat: 'Engineering productivity|Data & BI' },

  // ============================================================
  // 12-design
  // ============================================================
  { q: 'apply anthropic brand colors typography',  expect_provider: 'anthropic',                expect_cat: 'Design' },
  { q: 'design system tokens for frontend',        expect_provider: 'anthropic|cybos',          expect_cat: 'Design' },
  { q: 'algorithmic art generative design pattern', expect_provider: 'anthropic',               expect_cat: 'Design' },

  // ============================================================
  // 13-cybersecurity
  // ============================================================
  { q: 'analyze malware threat report',            expect_provider: 'fabric',                   expect_cat: 'Cybersecurity' },
  { q: 'write hackerone bug bounty report',        expect_provider: 'fabric',                   expect_cat: 'Cybersecurity' },
  { q: 'stride threat model security review',      expect_provider: 'fabric',                   expect_cat: 'Cybersecurity' },

  // ============================================================
  // Source-available reference cards
  // ============================================================
  { q: 'create powerpoint deck slides from data',  expect_provider: 'anthropic|cybos',          expect_cat: 'Engineering productivity|Operations' },
  { q: 'extract tables from pdf form fill',        expect_provider: 'anthropic',                expect_cat: 'Engineering productivity' },
  { q: 'edit excel spreadsheet formulas xlsx',     expect_provider: 'anthropic',                expect_cat: 'Engineering productivity' },
  { q: 'word document docx generate report',       expect_provider: 'anthropic',                expect_cat: 'Engineering productivity' },
];
