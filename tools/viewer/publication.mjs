// Shared by the static builder, development server and the reader UI.
export const DEFAULT_CATEGORIES = [
  { id: "product", title: "Продукт и требования" },
  { id: "architecture", title: "Архитектура" },
  { id: "research", title: "Исследования" },
  { id: "reports", title: "Отчёты" },
  { id: "presentations", title: "Презентации" },
  { id: "other", title: "Другие документы" },
];
export function normalizePublishedPath(value) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.startsWith("//") ||
    /[\\%?#:]/.test(value)
  )
    return null;
  const path = value.trim().replace(/^\//, "");
  if (
    path.split("/").some((s) => !s || s.startsWith(".")) ||
    !/\.(md|html|pdf)$/i.test(path)
  )
    return null;
  return path;
}
export function publicationHref(item) {
  return item.artifact.endsWith(".md")
    ? "/doc/" + item.artifact
    : "/documents/" + item.id;
}
export function publishedHref(path) {
  return "/published/" + path.split("/").map(encodeURIComponent).join("/");
}
export function collectPublications(docs, config = {}, assets = []) {
  const categories = config.categories ?? DEFAULT_CATEGORIES;
  const known = new Set(categories.map((c) => c.id));
  const byPath = new Map(docs.map((d) => [d.path, d]));
  const available = new Set([...byPath.keys(), ...assets]);
  const items = [];
  const errors = [];
  const ids = new Set();
  const fail = (path, message) => errors.push(`${path}: ${message}`);
  for (const doc of docs) {
    const fm = doc.frontmatter ?? {};
    if (fm.artifact == null) continue;
    if (fm.status === "archived" || fm.supersededBy) {
      fail(doc.path, "archived edition must not declare artifact");
      continue;
    }
    const artifact = normalizePublishedPath(fm.artifact);
    if (
      !artifact ||
      !/\.(md|html)$/.test(artifact) ||
      !available.has(artifact)
    ) {
      fail(doc.path, "artifact is missing or unpublished");
      continue;
    }
    const id = artifact
      .split("/")
      .at(-1)
      .replace(/\.(md|html)$/, "");
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
      fail(doc.path, "invalid document id");
      continue;
    }
    if (ids.has(id)) {
      fail(doc.path, "duplicate document id: " + id);
      continue;
    }
    ids.add(id);
    const category = fm.category ?? "other";
    const exports = {};
    for (const key of ["print", "pdf"])
      if (fm[key] != null) {
        const path = normalizePublishedPath(fm[key]);
        if (
          !path ||
          !(key === "pdf" ? path.endsWith(".pdf") : path.endsWith(".html")) ||
          !available.has(path)
        )
          fail(doc.path, key + " file is missing or unpublished");
        else exports[key] = path;
      }
    if (fm.order != null && (!Number.isInteger(fm.order) || fm.order < 1))
      fail(doc.path, "order must be a positive integer");
    items.push({
      id,
      path: doc.path,
      artifact,
      title: String(doc.title ?? id),
      description: String(fm.description ?? ""),
      category,
      version: String(fm.version ?? ""),
      date:
        fm.date instanceof Date
          ? fm.date.toISOString().slice(0, 10)
          : String(fm.date ?? ""),
      status: String(fm.status ?? ""),
      parentId: null,
      order: fm.order ?? 0,
      editions: [],
      ...exports,
    });
  }
  const indexed = new Map(items.map((i) => [i.path, i]));
  for (const item of items) {
    const parent = byPath.get(item.path).frontmatter.parent;
    if (parent == null) continue;
    const path = normalizePublishedPath(parent);
    const target = indexed.get(path);
    if (
      !target ||
      target === item ||
      byPath.get(path)?.frontmatter.parent != null
    )
      fail(item.path, "parent must be a current top-level document");
    else {
      item.parentId = target.id;
      if (byPath.get(item.path).frontmatter.category == null)
        item.category = target.category;
      else if (item.category !== target.category)
        fail(item.path, "parent and part must share category");
    }
  }
  for (const item of items)
    if (!known.has(item.category))
      fail(item.path, "unknown category: " + item.category);
  for (const doc of docs) {
    const fm = doc.frontmatter ?? {};
    if (fm.status !== "archived" && !fm.supersededBy) continue;
    const current = indexed.get(normalizePublishedPath(fm.supersededBy));
    if (fm.status !== "archived" || !current) {
      fail(doc.path, "archived edition needs a current supersededBy target");
      continue;
    }
    current.editions.push({
      path: doc.path,
      title: doc.title,
      version: String(fm.version ?? ""),
      date: String(fm.date ?? ""),
    });
  }
  for (const item of items)
    item.editions.sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.version.localeCompare(a.version, undefined, { numeric: true }),
    );
  items.sort(
    (a, b) =>
      a.order - b.order ||
      b.date.localeCompare(a.date) ||
      a.title.localeCompare(b.title, "ru"),
  );
  return { items, categories, errors };
}
export function documentHome(
  path,
  { items = [], research = [], methods = [] } = {},
) {
  let item = items.find(
    (i) =>
      i.path === path ||
      i.artifact === path ||
      i.editions.some((e) => e.path === path),
  );
  if (item?.parentId) {
    const parent = items.find((i) => i.id === item.parentId);
    if (parent) return { title: parent.title, href: publicationHref(parent) };
  }
  const resultPath = item?.path ?? path;
  const topic = research.find((t) => t.results?.includes(resultPath));
  if (topic) return { title: topic.title, href: "/research/" + topic.id };
  const method = methods.find((m) => m.card === path);
  if (method) return { title: "Методологии", href: "/methods" };
  if (item && item.editions.some((e) => e.path === path))
    return { title: item.title, href: publicationHref(item) };
  return {
    title: item ? "Документы" : "Библиотека",
    href: item ? "/documents" : "/library",
  };
}
