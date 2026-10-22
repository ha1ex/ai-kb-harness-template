import test from "node:test";
import assert from "node:assert/strict";
import {
  collectPublications,
  normalizePublishedPath,
  documentHome,
} from "./publication.mjs";
const doc = (path, frontmatter = {}) => ({
  path,
  title: path,
  frontmatter,
  mtime: 0,
});
test("catalogue supports custom layers, one-level parts and archived editions", () => {
  const docs = [
    doc("reports/report.md", {
      artifact: "/reports/report.md",
      category: "research",
    }),
    doc("reports/appendix.md", {
      artifact: "/reports/appendix.md",
      parent: "/reports/report.md",
      order: 1,
    }),
    doc("reports/old.md", {
      status: "archived",
      supersededBy: "/reports/report.md",
      version: "v0.1",
    }),
  ];
  const { items, errors } = collectPublications(docs, {});
  assert.deepEqual(errors, []);
  assert.equal(items.length, 2);
  assert.equal(items.find((x) => x.id === "appendix").parentId, "report");
  assert.equal(
    items.find((x) => x.id === "report").editions[0].path,
    "reports/old.md",
  );
  assert.equal(
    documentHome("reports/appendix.md", { items }).href,
    "/doc/reports/report.md",
  );
});
test("catalogue rejects duplicate ids, nested parents and archives with live artifacts", () => {
  const docs = [
    doc("out/a.md", { artifact: "out/a.md" }),
    doc("out/b.md", { artifact: "out/b.md", parent: "out/a.md" }),
    doc("out/c.md", { artifact: "out/c.md", parent: "out/b.md" }),
    doc("else/a.md", { artifact: "else/a.md" }),
    doc("out/old.md", {
      artifact: "out/old.md",
      status: "archived",
      supersededBy: "out/a.md",
    }),
  ];
  const result = collectPublications(docs, {});
  assert.match(result.errors.join("\n"), /duplicate/i);
  assert.match(result.errors.join("\n"), /parent/i);
  assert.match(result.errors.join("\n"), /archiv/i);
});
test("published paths reject hidden segments, traversal, URL encodings and external URLs", () => {
  for (const path of [
    "../secret.pdf",
    "out/.env/file.html",
    "https://host/a.html",
    "//host/a.pdf",
    "out/%2e%2e/a.pdf",
    "out/a.html?x=1",
    "out\\a.pdf",
  ])
    assert.equal(normalizePublishedPath(path), null, path);
  assert.equal(normalizePublishedPath("/reports/a.pdf"), "reports/a.pdf");
});
test("research result has one home and archived edition inherits the current home", () => {
  const { items } = collectPublications(
    [
      doc("out/a.md", { artifact: "out/a.md" }),
      doc("out/old.md", { status: "archived", supersededBy: "out/a.md" }),
    ],
    {},
  );
  const research = [
    { id: "study", title: "Исследование", results: ["out/a.md"] },
  ];
  assert.equal(
    documentHome("out/a.md", { items, research }).href,
    "/research/study",
  );
  assert.equal(
    documentHome("out/old.md", { items, research }).href,
    "/research/study",
  );
});

test("a part inherits a custom category before category validation", () => {
  const result = collectPublications(
    [
      doc("out/main.md", { artifact: "out/main.md", category: "custom" }),
      doc("out/part.md", { artifact: "out/part.md", parent: "out/main.md" }),
    ],
    { categories: [{ id: "custom", title: "Свой раздел" }] },
  );
  assert.deepEqual(result.errors, []);
  assert.equal(result.items.find((i) => i.id === "part").category, "custom");
});
test("a research result part returns to its main document before the topic", () => {
  const { items } = collectPublications([
    doc("out/main.md", { artifact: "out/main.md" }),
    doc("out/part.md", { artifact: "out/part.md", parent: "out/main.md" }),
  ]);
  assert.equal(
    documentHome("out/part.md", {
      items,
      research: [{ id: "study", title: "Study", results: ["out/main.md"] }],
    }).href,
    "/doc/out/main.md",
  );
});
