import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CatalogContext } from "./src/components/CatalogContext";
import { AppSidebar } from "./src/components/AppSidebar";
import { Home } from "./src/components/Home";
import type { Catalog } from "./src/api";
Object.assign(globalThis, {
  localStorage: { getItem: () => null, setItem: () => {} },
});
const data: Catalog = {
  config: { name: "Test", description: "Purpose" },
  spaces: [
    {
      id: "study",
      title: "Study",
      start_docs: ["03_wiki/one.md", "03_wiki/two.md"],
    },
  ],
  layers: [],
  tree: {},
  builtAt: 0,
  docs: ["one", "two"].map((name) => ({
    path: `03_wiki/${name}.md`,
    name,
    layer: "03_wiki",
    title: name,
    size: 1,
    mtime: 1,
    body: "Evidence",
    raw: "Evidence",
    frontmatter: {},
    backlinks: [],
  })),
};
const render = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <CatalogContext.Provider value={data}>{node}</CatalogContext.Provider>
    </MemoryRouter>,
  );
test("navigation retains advanced routes", () => {
  const html = render(<AppSidebar />);
  for (const path of ["/graph", "/open-questions", "/skillopt"])
    assert.ok(html.includes(`href="${path}"`));
});
test("homepage topic contains direct links to starter documents", () => {
  const html = render(<Home />);
  const card = html.split('class="space-card"')[1].split("</article>")[0];
  for (const name of ["one", "two"])
    assert.ok(card.includes(`href="/doc/03_wiki/${name}.md"`));
});

import { MarkdownDoc } from "./src/v2/components/MarkdownDoc";
test("source markers become internal router links, code samples stay literal", () => {
  const html = render(
    <MarkdownDoc
      showCopy={false}
      source={
        "[source: /02_sources/proof.md]\n\n`[source: /02_sources/inline.md]`\n\n```md\n[source: /02_sources/fenced.md]\n```"
      }
    />,
  );
  assert.match(
    html,
    /<a[^>]*href="\/doc\/02_sources\/proof.md"[^>]*data-discover="true"/,
  );
  assert.ok(html.includes("[source: /02_sources/inline.md]"));
  assert.ok(html.includes("[source: /02_sources/fenced.md]"));
  assert.ok(!html.includes('href="/doc/02_sources/inline.md"'));
});
test("GFM tasks retain checked state as disabled checkboxes", () => {
  const html = render(
    <MarkdownDoc showCopy={false} source={"- [x] Done\n- [ ] Pending"} />,
  );
  const inputs = html.match(/<input[^>]*>/g) || [];
  assert.equal(inputs.length, 2);
  assert.ok(inputs.every((input) => input.includes('disabled=""')));
  assert.ok(inputs[0].includes('checked=""'));
  assert.ok(!inputs[1].includes('checked=""'));
});

import { DocumentActions } from "./src/components/DocumentActions";
import { Documents } from "./src/routes/Documents";
test("document actions distinguish stored PDF, browser printing and original Markdown", () => {
  const doc = {
    ...data.docs[0],
    frontmatter: { pdf: "reports/file.pdf", print: "reports/file-print.html" },
  };
  const catalogue = {
    ...data,
    assets: ["reports/file.pdf", "reports/file-print.html"],
  };
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <DocumentActions doc={doc} catalog={catalogue} />
    </MemoryRouter>,
  );
  assert.match(html, /Скачать Markdown/);
  assert.match(html, /Печать/);
  assert.match(html, /href="\/published\/reports\/file.pdf"/);
  const archived = renderToStaticMarkup(
    <MemoryRouter>
      <DocumentActions
        doc={{
          ...doc,
          frontmatter: { ...doc.frontmatter, status: "archived" },
        }}
        catalog={catalogue}
      />
    </MemoryRouter>,
  );
  assert.ok(!archived.includes("file.pdf"));
  assert.ok(!archived.includes("file-print.html"));
});
test("document catalogue has an empty state and persistent URL filters", () => {
  const catalogue = {
    ...data,
    publication: {
      items: [
        {
          id: "a",
          path: "reports/a.md",
          artifact: "reports/a.md",
          title: "Alpha",
          category: "other",
          parentId: null,
          order: 0,
          editions: [],
          version: "v1",
          date: "",
          status: "",
          description: "",
        },
      ],
      categories: [{ id: "other", title: "Другие документы" }],
      errors: [],
    },
  };
  const html = renderToStaticMarkup(
    <MemoryRouter initialEntries={["/documents?q=absent"]}>
      <CatalogContext.Provider value={catalogue}>
        <Documents />
      </CatalogContext.Provider>
    </MemoryRouter>,
  );
  assert.match(html, /value="absent"/);
  assert.match(html, /Документы не найдены/);
  assert.ok(!html.includes('href="/doc/reports/a.md"'));
});
test("print renderer includes every tab and disclosure, including inactive content", () => {
  const html = render(
    <MarkdownDoc
      showCopy={false}
      printMode
      source={
        '# Document\n\n<kb-tabs>\n<kb-tab label="One">\n\nFirst tab\n\n</kb-tab>\n<kb-tab label="Two">\n\nSecond tab\n\n</kb-tab>\n</kb-tabs>\n\n<kb-accordion>\n<kb-accordion-item title="Closed">\n\nHidden evidence\n\n</kb-accordion-item>\n</kb-accordion>'
      }
    />,
  );
  assert.match(html, /First tab/);
  assert.match(html, /Second tab/);
  assert.match(html, /Hidden evidence/);
});

test("native details and nested file folders are fully present in print mode", () => {
  const html = render(
    <MarkdownDoc
      showCopy={false}
      printMode
      source={
        '<details>\n<summary>Closed details</summary>\n\nHidden content\n\n</details>\n\n<kb-tree><kb-folder name="Closed"><kb-folder name="Nested"><kb-file name="inner.md" /></kb-folder></kb-folder></kb-tree>'
      }
    />,
  );
  assert.match(html, /<details[^>]* open=""/);
  assert.match(html, /Hidden content/);
  assert.match(html, /inner.md/);
  assert.match(html, /Nested/);
});
import { PublishedDocument } from "./src/routes/Documents";
test("HTML document return retains the catalogue query and category", () => {
  const catalogue = {
    ...data,
    assets: ["reports/view.html"],
    publication: {
      items: [
        {
          id: "view",
          path: "reports/view.md",
          artifact: "reports/view.html",
          title: "HTML",
          category: "other",
          parentId: null,
          order: 0,
          editions: [],
          version: "",
          date: "",
          status: "",
          description: "",
        },
      ],
      categories: [],
      errors: [],
    },
  };
  const html = renderToStaticMarkup(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/documents/view",
          state: { catalogReturn: "/documents?q=HTML&category=other" },
        },
      ]}
    >
      <CatalogContext.Provider value={catalogue}>
        <Routes>
          <Route path="/documents/:id" element={<PublishedDocument />} />
        </Routes>
      </CatalogContext.Provider>
    </MemoryRouter>,
  );
  assert.match(html, /href="\/documents\?q=HTML&amp;category=other"/);
});

import { MapCanvas } from "./src/components/MapCanvas";
test("canvas has named controls, source inspector and a table alternative", () => {
  const html = render(
    <MapCanvas
      map={{
        id: "demo",
        title: "Demo",
        nodes: [
          { id: "a", label: "Source", x: 20, y: 20, source: "reports/a.md" },
        ],
        edges: [],
      }}
    />,
  );
  for (const text of [
    "Увеличить",
    "Уменьшить",
    "Вписать схему",
    "Поиск по блокам",
    "Табличное представление",
    "Source",
  ])
    assert.ok(html.includes(text), text);
});
