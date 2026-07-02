// probes-template.mjs — smoke-пробы по ВСЕГДА присутствующим файлам шаблона.
//
// В отличие от probes-corpus.mjs (демо-корпус, опционален) эти пробы работают в любом клоне:
// цели — living-документы шаблона и walkthrough-пример. Они проверяют, что retrieval-контур
// жив как таковой (индекс собран, vector+BM25+RRF находят очевидное), а не качество ранжирования
// на большом корпусе.
//
// Схема пробы:
//   q            — запрос как от пользователя;
//   expect_file  — alt-подстрока пути файла (OR через |), карточка в top-k с матчем = релевантна;
//   category     — группа в by_category отчёта eval.
//
// ВАЖНО: walkthrough-цели удаляются `kb:init --strip-demo` ВМЕСТЕ с этим осознанием:
// композитор probes.mjs пропускает walkthrough-пробы, если walkthrough-файлов нет.

export const TEMPLATE_PROBES = [
  // living-документы шаблона (есть всегда)
  {
    q: 'открытые вопросы и пробелы базы знаний',
    expect_file: 'open-questions',
    category: 'Template',
  },
  {
    q: 'code as agent harness что перенести в харнесс',
    expect_file: 'code-as-agent-harness-adoption',
    category: 'Template',
  },

  // walkthrough-пример (удаляется --strip-demo; композитор это учитывает)
  {
    q: 'deflection rate доля тикетов закрытых без человека',
    expect_file: 'walkthrough-deflection-rate',
    category: 'Walkthrough',
    walkthrough: true,
  },
  {
    q: 'гипотезы пилота AI-ассистента поддержки',
    expect_file: 'walkthrough-pilot-hypotheses',
    category: 'Walkthrough',
    walkthrough: true,
  },
  {
    q: 'решение о рамке пилота CSAT guardrail локальная модель',
    expect_file: 'walkthrough-decision-pilot-scope',
    category: 'Walkthrough',
    walkthrough: true,
  },
  {
    q: 'саммари интервью с CTO о поддержке',
    expect_file: 'walkthrough-interview-cto',
    category: 'Walkthrough',
    walkthrough: true,
  },
];
