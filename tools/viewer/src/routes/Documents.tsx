import { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { adaptDocumentHtmlForOpaqueSandbox } from "@/lib/document-sandbox";
import { useCatalog } from "@/components/CatalogContext";
import { DocumentActions } from "@/components/DocumentActions";
import {
  documentHome,
  publicationHref,
  publishedHref,
  type Publication,
} from "../../publication.mjs";
export function Documents() {
  const location = useLocation();
  const catalogState = { catalogReturn: location.pathname + location.search };
  const data = useCatalog();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "",
    category = params.get("category") || "";
  const entries = data?.publication?.items ?? [];
  const matches = (item: Publication) =>
    [
      item.title,
      item.description,
      ...item.editions.map((e) => e.title + " " + e.version),
    ]
      .join(" ")
      .toLocaleLowerCase("ru")
      .includes(q.trim().toLocaleLowerCase("ru"));
  const roots = entries.filter(
    (i) =>
      !i.parentId &&
      (!category || i.category === category) &&
      (matches(i) ||
        entries.some((child) => child.parentId === i.id && matches(child))),
  );
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  return (
    <div className="workspace-page">
      <p className="eyebrow">Готовые материалы</p>
      <h1>Документы</h1>
      <p className="lede">
        Действующая редакция, части комплекта и прежние версии в одном месте.
      </p>
      <div className="library-filters">
        <label>
          Найти документ
          <input
            value={q}
            onChange={(e) => filter("q", e.target.value)}
            type="search"
          />
        </label>
        <label>
          Категория
          <select
            value={category}
            onChange={(e) => filter("category", e.target.value)}
          >
            <option value="">Все категории</option>
            {data?.publication?.categories.map((c) => (
              <option value={c.id} key={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!data ? (
        <p>Загрузка документов…</p>
      ) : !roots.length ? (
        <p>
          Документы не найдены. Измените фильтры или добавьте материал с полем
          artifact.
        </p>
      ) : (
        roots.map((item) => (
          <article className="publication-card" key={item.id}>
            <p className="eyebrow">
              {
                data.publication?.categories.find((c) => c.id === item.category)
                  ?.title
              }{" "}
              · {item.version} {item.date}
            </p>
            <h2>
              <Link to={publicationHref(item)} state={catalogState}>
                {item.title}
              </Link>
            </h2>
            <p>{item.description}</p>
            {entries
              .filter((c) => c.parentId === item.id)
              .map((c) => (
                <p key={c.id}>
                  Часть комплекта:{" "}
                  <Link to={publicationHref(c)} state={catalogState}>
                    {c.title}
                  </Link>
                </p>
              ))}
            {!!item.editions.length && (
              <details>
                <summary>Прежние версии · {item.editions.length}</summary>
                {item.editions.map((e) => (
                  <p key={e.path}>
                    <Link to={"/doc/" + e.path}>
                      {e.title} · {e.version}
                    </Link>
                  </p>
                ))}
              </details>
            )}
          </article>
        ))
      )}
    </div>
  );
}
export function PublishedDocument() {
  const location = useLocation();
  const { id } = useParams();
  const data = useCatalog();
  const item = data?.publication?.items.find((i) => i.id === id);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    setHtml("");
    setError("");
    if (item?.artifact.endsWith(".html"))
      fetch(publishedHref(item.artifact))
        .then((r) => {
          if (!r.ok) throw Error(String(r.status));
          return r.text();
        })
        .then((text) => {
          if (live) setHtml(text);
        })
        .catch(() => {
          if (live)
            setError("Не удалось загрузить документ. Обновите страницу.");
        });
    return () => {
      live = false;
    };
  }, [item?.artifact]);
  if (!data) return <p>Загрузка документа…</p>;
  if (!item)
    return (
      <div className="workspace-page">
        <h1>Документ не найден</h1>
        <Link to="/documents">В каталог</Link>
      </div>
    );
  const doc = data.docs.find((d) => d.path === item.path);
  const home = documentHome(item.path, {
    items: data.publication?.items,
    research: data.research,
    methods: data.methods,
  });
  const saved = location.state?.catalogReturn;
  const hasReturn =
    typeof saved === "string" && /^\/documents(?:\?|$)/.test(saved);
  const back = hasReturn ? { href: saved, title: "Документы" } : home;
  return (
    <div className="workspace-page">
      <Link to={back.href}>← {back.title}</Link>
      <h1>{item.title}</h1>
      {doc && <DocumentActions doc={doc} catalog={data} />}
      {item.artifact.endsWith(".md") ? (
        <Link to={publicationHref(item)} state={location.state}>
          Открыть документ
        </Link>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : html ? (
        <iframe
          title={item.title}
          srcDoc={adaptDocumentHtmlForOpaqueSandbox(html)}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          className="document-frame"
        />
      ) : (
        <p>Загрузка содержимого…</p>
      )}
    </div>
  );
}
