import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, type DocFull } from "@/api";
import { MarkdownDoc } from "@/v2/components/MarkdownDoc";
export function DocumentView() {
  const path = useParams()["*"] || "";
  const location = useLocation();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocFull | null>(null);
  const [err, setErr] = useState("");
  const [toc, setToc] = useState<{ id: string; title: string }[]>([]);
  useEffect(() => {
    let live = true;
    setDoc(null);
    setErr("");
    api
      .doc(path.replace(/\/$/, ""))
      .then((d) => {
        if (live) setDoc(d);
      })
      .catch((e) => {
        if (live) setErr(String(e));
      });
    return () => {
      live = false;
    };
  }, [path]);
  useEffect(() => {
    if (!doc) return;
    const reveal = () => {
      let id;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      if (!id) return;
      const node = document.getElementById(id);
      let parent: HTMLElement | null = node;
      while (parent) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      node?.scrollIntoView({ block: "start" });
    };
    const timer = setTimeout(() => {
      setToc(
        Array.from(
          document.querySelectorAll("#document-body h2,#document-body h3"),
        ).map((e) => ({ id: e.id, title: e.textContent || "" })),
      );
      requestAnimationFrame(reveal);
    }, 50);
    window.addEventListener("hashchange", reveal);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", reveal);
    };
  }, [doc, location.hash]);
  return (
    <div className="workspace-page document-page">
      <div className="document-breadcrumb">
        <button
          onClick={() =>
            window.history.state?.idx ? navigate(-1) : navigate("/library")
          }
        >
          ← Назад
        </button>
        <Link to="/library">Библиотека</Link>
        <span>{path}</span>
      </div>
      {err && <p role="alert">{err}</p>}
      {!doc && !err && <p>Загрузка документа…</p>}
      {doc && (
        <>
          <dl className="doc-meta">
            {["status", "date", "owner", "confidence"]
              .filter((k) => doc.frontmatter[k] != null)
              .map((k) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{String(doc.frontmatter[k])}</dd>
                </div>
              ))}
          </dl>
          <div className="document-grid">
            <div id="document-body">
              <MarkdownDoc source={doc.body} />
              {doc.backlinks.length > 0 && (
                <section>
                  <h2>Ссылки на этот документ</h2>
                  {doc.backlinks.map((p) => (
                    <p key={p}>
                      <Link to={"/doc/" + p}>{p}</Link>
                    </p>
                  ))}
                </section>
              )}
              <details className="source-disclosure" id="document-source">
                <summary>Исходный Markdown и метаданные</summary>
                <pre>{doc.raw}</pre>
              </details>
            </div>
            <nav className="toc-panel" aria-label="На этой странице">
              <p className="eyebrow">На этой странице</p>
              {toc.map((t) => (
                <a key={t.id} href={"#" + t.id}>
                  {t.title}
                </a>
              ))}
              <a href="#document-source">Исходный текст</a>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
