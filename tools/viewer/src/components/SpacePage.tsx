import { Link, useParams } from "react-router-dom";
import { useCatalog } from "./CatalogContext";
import { DocLinks } from "./DocLinks";

export function SpacePage() {
  const { id } = useParams();
  const data = useCatalog();
  const space = data?.spaces.find((s) => s.id === id);
  if (!space)
    return (
      <div className="workspace-page">
        Раздел не найден. <Link to="/">На главную</Link>
      </div>
    );
  const docs = data!.docs.filter(
    (d) =>
      space.start_docs.includes(d.path) ||
      [d.frontmatter.audience].flat().includes(id),
  );
  return (
    <div className="workspace-page">
      <p className="eyebrow">Раздел</p>
      <h1>{space.title}</h1>
      <p className="lede">{space.description}</p>
      <h2>Начните здесь</h2>
      <DocLinks
        docs={space.start_docs.flatMap((p) =>
          data!.docs.filter((d) => d.path === p),
        )}
      />
      <h2>Документы раздела</h2>
      {docs.length ? (
        <DocLinks docs={docs} />
      ) : (
        <p>
          Документов пока нет. Материалы без раздела остаются в{" "}
          <Link to="/library">библиотеке</Link>.
        </p>
      )}
    </div>
  );
}
