import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
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
