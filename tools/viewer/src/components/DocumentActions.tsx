import { useState } from "react";
import type { Catalog, DocFull } from "@/api";
import { normalizePublishedPath, publishedHref } from "../../publication.mjs";
export function DocumentActions({
  doc,
  catalog,
}: {
  doc: DocFull;
  catalog: Catalog | null;
}) {
  const [error, setError] = useState("");
  const current =
    doc.frontmatter.status !== "archived" && !doc.frontmatter.supersededBy;
  const file = (key: string) => {
    const p = normalizePublishedPath(doc.frontmatter[key]);
    return current && p && catalog?.assets?.includes(p) ? p : null;
  };
  const pdf = file("pdf"),
    print = file("print");
  function download() {
    try {
      const url = URL.createObjectURL(
        new Blob([doc.raw], { type: "text/markdown;charset=utf-8" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.path.split("/").at(-1) || "document.md";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError("");
    } catch {
      setError("Не удалось скачать Markdown. Повторите попытку.");
    }
  }
  return (
    <div
      className="document-actions"
      aria-label="Скачать или распечатать документ"
    >
      <button type="button" onClick={download}>
        Скачать Markdown
      </button>
      <button type="button" onClick={() => window.print()}>
        Печать / сохранить PDF
      </button>
      {print && (
        <a href={publishedHref(print)} target="_blank" rel="noreferrer">
          Печатная версия
        </a>
      )}
      {pdf && (
        <a href={publishedHref(pdf)} download={pdf.split("/").at(-1)}>
          Скачать PDF
        </a>
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
