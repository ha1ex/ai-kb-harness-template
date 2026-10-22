import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildCatalog } from "./data.mjs";
test("empty project has neutral defaults", async () => {
  const root = await mkdtemp(join(tmpdir(), "viewer-"));
  try {
    const c = await buildCatalog(root);
    assert.equal(c.config.name, "AI KB Harness");
    assert.equal(c.docs.length, 0);
    assert.deepEqual(c.spaces, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("configured themes preserve untagged docs and ignore symlink escapes", async () => {
  const root = await mkdtemp(join(tmpdir(), "viewer-"));
  try {
    await mkdir(join(root, "03_wiki"));
    await mkdir(join(root, "00_context"));
    await writeFile(
      join(root, "kb.config.mjs"),
      "export default {viewer:{name:'Research'},layers:{indexable:['03_wiki']}};",
    );
    await writeFile(
      join(root, "03_wiki", "note.md"),
      "---\ntitle: A finding\n---\n# Finding\nEvidence",
    );
    await symlink("/etc/passwd", join(root, "03_wiki", "escape.md"));
    await writeFile(
      join(root, "00_context", "spaces.json"),
      JSON.stringify({
        spaces: [
          {
            id: "research",
            title: "Research",
            start_docs: ["03_wiki/note.md"],
          },
        ],
      }),
    );
    const c = await buildCatalog(root);
    assert.equal(c.config.name, "Research");
    assert.equal(c.docs.length, 1);
    assert.equal(c.docs[0].title, "A finding");
    assert.deepEqual(c.spaces[0].start_docs, ["03_wiki/note.md"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("project identity fills defaults; explicit viewer config overrides it", async () => {
  const root = await mkdtemp(join(tmpdir(), "viewer-"));
  try {
    await mkdir(join(root, "00_context"));
    await writeFile(
      join(root, "00_context/project.json"),
      JSON.stringify({ name: "My study", description: "Purpose" }),
    );
    let c = await buildCatalog(root);
    assert.equal(c.config.name, "My study");
    await writeFile(
      join(root, "kb.config.mjs"),
      "export default {viewer:{name:'Override'}}",
    );
    c = await buildCatalog(root);
    assert.equal(c.config.name, "Override");
    assert.equal(c.config.description, "Purpose");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
import { searchDocuments } from "./src/search-client.mjs";
test("raw source publication is explicitly opt-in", async () => {
  const root = await mkdtemp(join(tmpdir(), "viewer-"));
  try {
    await mkdir(join(root, "01_raw"));
    await writeFile(join(root, "01_raw/private.md"), "# Raw");
    assert.equal((await buildCatalog(root)).docs.length, 0);
    await writeFile(
      join(root, "kb.config.mjs"),
      "export default {viewer:{includeRaw:true}}",
    );
    assert.equal((await buildCatalog(root)).docs.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("development search preserves semantic API modes", async () => {
  let called = "";
  const result = await searchDocuments(
    {
      staticMode: false,
      fetchJson: async (url) => {
        called = url;
        return { results: [] };
      },
      getCatalog: () => {
        throw Error("should not load catalog");
      },
    },
    "needle",
    "vector",
    3,
  );
  assert.match(called, /mode=vector&top=3/);
  assert.deepEqual(result.results, []);
});
test("static search needs no API and reports local text mode", async () => {
  const result = await searchDocuments(
    {
      staticMode: true,
      fetchJson: () => {
        throw Error("no API");
      },
      getCatalog: async () => ({
        docs: [
          {
            title: "Needle",
            body: "Evidence",
            path: "03_wiki/a.md",
            layer: "03_wiki",
          },
        ],
      }),
    },
    "needle",
  );
  assert.equal(result.mode, "local text");
  assert.equal(result.results.length, 1);
});

test("publications expose only explicit files, methods and research results, with private workdirs excluded", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "viewer-publications-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const put = async (path, body) => {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), body);
  };
  await put(
    "kb.config.mjs",
    `export default {layers:{indexable:['reports']},viewer:{registries:{methods:'methods.json',research:'research.json'}}}`,
  );
  await put(
    "reports/report.md",
    "---\nartifact: reports/report.md\nprint: reports/report-print.html\n---\n# Report",
  );
  await put("reports/report-print.html", "<!doctype html><h1>Report</h1>");
  await put("reports/undeclared.html", "Private");
  await put("reports/work/private.md", "# Private draft");
  await put(
    "methods.json",
    JSON.stringify({
      methods: [
        {
          id: "method",
          title: "Method",
          card: "reports/report.md",
          source: "https://example.com",
          license: "CC0",
          lens: "product",
        },
      ],
    }),
  );
  await put(
    "research.json",
    JSON.stringify({
      research: [
        {
          id: "study",
          title: "Study",
          results: ["reports/report.md"],
          workdir: "reports/work",
        },
      ],
    }),
  );
  const c = await buildCatalog(root);
  assert.deepEqual(c.publication.errors, []);
  assert.equal(c.publication.items.length, 1);
  assert.deepEqual(c.assets, ["reports/report-print.html"]);
  assert.equal(c.methods[0].id, "method");
  assert.equal(
    c.docs.some((d) => d.path.includes("work/")),
    false,
  );
});
test("declared assets cannot expose raw, excluded paths or symlinked directories", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "viewer-assets-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "reports"), { recursive: true });
  await mkdir(join(root, "01_raw"), { recursive: true });
  await writeFile(
    join(root, "kb.config.mjs"),
    `export default {layers:{indexable:['reports']},viewer:{excludePaths:['reports/private']}}`,
  );
  await writeFile(join(root, "01_raw/a.html"), "SECRET");
  await symlink(join(root, "01_raw"), join(root, "reports/linked"));
  await mkdir(join(root, "reports/private"));
  await writeFile(join(root, "reports/private/a.html"), "SECRET");
  for (const [name, path] of [
    ["raw", "01_raw/a.html"],
    ["link", "reports/linked/a.html"],
    ["excluded", "reports/private/a.html"],
  ])
    await writeFile(
      join(root, "reports", name + ".md"),
      `---\nartifact: ${path}\n---\n# Document`,
    );
  const c = await buildCatalog(root);
  assert.equal(c.assets.length, 0);
  assert.equal(c.publication.items.length, 0);
  assert.equal(c.publication.errors.length, 3);
});

test("layer roots reject symlink aliases and hidden ancestor segments", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "viewer-layer-root-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "01_raw"));
  await writeFile(join(root, "01_raw/private.md"), "SECRET");
  await symlink(join(root, "01_raw"), join(root, "reports"));
  await mkdir(join(root, "out/.hidden"), { recursive: true });
  await writeFile(join(root, "out/.hidden/private.md"), "SECRET");
  await writeFile(
    join(root, "kb.config.mjs"),
    "export default {layers:{indexable:['reports','out/.hidden']}}",
  );
  const c = await buildCatalog(root);
  assert.deepEqual(c.docs, []);
});
