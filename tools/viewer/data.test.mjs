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
