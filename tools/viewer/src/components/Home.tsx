import { Link } from "react-router-dom";
import { useCatalog } from "./CatalogContext";
import { RecentChanges } from "./RecentChanges";

export function Home() {
  const data = useCatalog();
  if (!data) return <p>Загрузка проекта…</p>;
  return (
    <div className="workspace-page">
      <div className="hero">
        <p className="eyebrow">
          Знания проекта{data.config.status ? " · " + data.config.status : ""}
        </p>
        <h1>{data.config.name}</h1>
        <p>{data.config.description}</p>
        <Link className="primary-link" to="/library">
          Открыть библиотеку →
        </Link>
      </div>
      <div className="overview-counts">
        <span>
          <b>{data.docs.length}</b> документов
        </span>
        <span>
          <b>{data.spaces.length}</b> раздела
        </span>
      </div>
      {!data.docs.length && (
        <div className="empty-state">
          <h2>Здесь начинается ваш проект</h2>
          <p>
            Добавьте первый документ и настройте разделы в
            00_context/spaces.json. После этого обновите витрину.
          </p>
        </div>
      )}
      {data.spaces.length > 0 && (
        <section>
          <h2>С чего начать?</h2>
          <div className="space-grid">
            {data.spaces.map((s, i) => (
              <article className="space-card" key={s.id}>
                <span className="eyebrow">
                  {String(i + 1).padStart(2, "0")} / РАЗДЕЛ
                </span>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <div className="starter-links">
                  {s.start_docs
                    .slice(0, 3)
                    .flatMap((p) => data.docs.filter((d) => d.path === p))
                    .map((d) => (
                      <Link key={d.path} to={"/doc/" + d.path}>
                        {d.title || d.name} →
                      </Link>
                    ))}
                </div>
                <Link to={"/space/" + s.id}>Открыть раздел →</Link>
              </article>
            ))}
          </div>
        </section>
      )}
      {data.docs.length > 0 && <RecentChanges />}
    </div>
  );
}
