import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "./CatalogContext";

export function CommandPalette() {
  const data = useCatalog();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const links = [
    { title: "Главная", path: "/" },
    { title: "Библиотека", path: "/library" },
    ...(data?.spaces || []).map((s) => ({
      title: s.title,
      path: "/space/" + s.id,
    })),
    ...(data?.docs || []).map((d) => ({
      title: d.title || d.name,
      path: "/doc/" + d.path,
    })),
  ]
    .filter((l) => l.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 15);
  return (
    <>
      <button
        ref={trigger}
        className="palette-trigger"
        onClick={() => setOpen(true)}
      >
        Поиск <kbd>⌘ / Ctrl K</kbd>
      </button>
      <dialog
        ref={dialog}
        className="command-palette"
        onCancel={() => setOpen(false)}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
      >
        <div className="palette-head">
          <h2>Перейти к…</h2>
          <button aria-label="Закрыть поиск" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>
        <input
          autoFocus
          aria-label="Поиск разделов и документов"
          placeholder="Поиск разделов и документов"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="palette-results">
          {links.map((l) => (
            <button
              key={l.path}
              onClick={() => {
                navigate(l.path);
                setOpen(false);
              }}
            >
              {l.title}
              <span>↵</span>
            </button>
          ))}
          {!links.length && <p>Документы не найдены.</p>}
        </div>
      </dialog>
    </>
  );
}
