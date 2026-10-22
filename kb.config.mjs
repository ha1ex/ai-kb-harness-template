// kb.config.mjs — PROJECT-OWNED конфиг KB-харнесса (C1).
//
// Это ЕДИНСТВЕННЫЙ файл, который нужно править под свою структуру: слои, правила provenance,
// frontmatter-требования, модель эмбеддера. Ядро (scripts/semantic/, scripts/lib/) — template-owned,
// его обновляет upstream; кастомизируя только этот файл, вы обновляетесь без merge-конфликтов
// (см. .template-manifest.json и scripts/kb-update.mjs).
//
// Каждое поле опционально: удалите ненужное — ядро возьмёт дефолт шаблона (значения ниже
// и есть дефолты). Файл читается scripts/lib/kb-root.mjs#loadKbConfig().
//
// Мультипроектность: у КАЖДОЙ KB может быть свой kb.config.mjs — оснастка читает конфиг
// из KB_ROOT (env), а не из своего репо.

export default {
  // Project identity is initialized in 00_context/project.json. Explicit overrides here win.
  viewer: {
    // registries: { methods: '06_outputs/methods/_registry.json', research: '06_outputs/research/_registry.json', maps: '06_outputs/maps/_registry.json' },
    // documents: { categories: [{id:'reports',title:'Отчёты'},{id:'other',title:'Другие документы'}] },
    // excludePaths: ['06_outputs/research/workdir'], // Excluded from the published catalog and viewer search.
    // name: 'My research project', description: 'Purpose and audience',
    // status: 'Research in progress', accent: '#457c72',
    // includeRaw: false, // Publish original raw Markdown only when explicitly intended.
  },
  // Executing synthesis is opt-in. No provider means a portable prompt, no model request.
  llm: { provider: "manual", timeout_ms: 300000, max_retries: 0 },

  layers: {
    // Слои, которые индексирует семантический поиск (порядок = каноническая иерархия).
    // Своя структура? Например: ['docs', 'adr', 'notes'] для существующего репо (уровень L0).
    indexable: [
      "00_context",
      "02_sources",
      "03_wiki",
      "04_synthesis",
      "05_decisions",
      "06_outputs",
    ],
    // Файлы в корне репо, попадающие в индекс (не слои; не цитируются как [source:]).
    rootFiles: ["log.md"],
    // Директории, в которые walker не заходит.
    skipDirs: [
      "node_modules",
      ".git",
      ".context",
      ".remember",
      ".claude",
      "scripts",
      "docs",
    ],
    // Ранг слоя в пирамиде (меньше = ближе к evidence). Питает provenance-порядок.
    rank: {
      "00_context": 0,
      "01_raw": 1,
      "02_sources": 2,
      "03_wiki": 3,
      "04_synthesis": 4,
      "05_decisions": 5,
      "06_outputs": 6,
    },
  },

  provenance: {
    // Слои-ИСТОЧНИКИ, для которых enforce порядок пирамиды (цитировать только строго ниже).
    enforced: ["04_synthesis", "05_decisions"],
    // Слои, где метки FACT:/DECISION: обязаны иметь цитату в абзаце (claim-coverage, гейт CI).
    coverageLayers: ["04_synthesis", "05_decisions"],
    // Зеркала внешних библиотек в 06_outputs — внутренние [source:] к ним неприменимы.
    externalCorpusDirs: [
      "anthropics-skills",
      "claude-cookbooks",
      "cybos-cases",
      "fabric-patterns",
      "mcp-catalog",
    ],
  },

  frontmatter: {
    // Слой → обязательные поля frontmatter (PreToolUse-хук check-md-frontmatter).
    rules: {
      "02_sources": ["type"],
      "03_wiki": ["type"],
      "04_synthesis": ["type"],
      "05_decisions": ["type"],
      "06_outputs": ["type", "version"],
    },
    // Имена файлов, освобождённые от frontmatter-требований.
    exemptBasenames: ["readme.md", "index.md", "nav.md", "_toc.md", "log.md"],
  },

  approval: {
    // Подпись эффекта решений: status из acceptedStatuses требует approved_by/approved_at/approved_ref/approved_hash
    // (pnpm kb:approve). Несовпадающий хеш — гейт в verify --scan; отсутствие подписи — advisory,
    // гейт только при required: true (включает проект).
    layers: ["05_decisions"],
    required: false,
    acceptedStatuses: ["accepted", "approved"],
    proposedStatuses: ["proposed", "draft"],
  },

  invariants: {
    // Архитектурные инварианты harness/invariants.json (pnpm kb:invariants): проектные заморозки по id и отключённые id.
    frozen: {},
    disabled: [],
  },

  doctor: {
    // Порог свежести synthesis в днях: считается по дате документа (updated/date/ingested), затем по последнему
    // коммиту, затем по mtime. status: living не стареет. Дефолт 60.
    staleDays: 60,
    // Synthetic walkthroughs teach the format; their historical dates are not project freshness.
    // Exact paths only; metadata, source links and provenance checks remain enabled.
    excludePaths: ['04_synthesis/walkthrough-pilot-hypotheses.md'],
  },

  decisions: {
    // Файлы в 05_decisions, освобождённые от требования метки DECISION: (check-decisions).
    exemptBasenames: [
      "decision-log.md",
      "rejected-options.md",
      "assumptions.md",
      "README.md",
    ],
  },

  embedder: {
    // Смена модели требует пересборки индекса: rm .semantic-index.sqlite && pnpm kb:index.
    model: "Xenova/multilingual-e5-small",
    dim: 384,
  },
};
