import { useSearchParams } from "react-router-dom";
import { useCatalog } from "./CatalogContext";
import { DocLinks } from "./DocLinks";

export function Library() {
  const data = useCatalog();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const layer = params.get("layer") || "";
  const docs =
    data?.docs.filter(
      (d) =>
        (!layer || d.layer === layer) &&
        `${d.title} ${d.body}`.toLowerCase().includes(query.toLowerCase()),
    ) || [];
  return (
    <div className="workspace-page">
      <p className="eyebrow">Все материалы</p>
      <h1>Библиотека</h1>
      <p className="lede">Все материалы, в том числе документы без раздела.</p>
      <div className="library-filters">
        <input
          aria-label="Фильтр документов"
          placeholder="Найти документ…"
          value={query}
          onChange={(e) => setParams({ q: e.target.value, layer })}
        />
        <select
          aria-label="Слой знаний"
          value={layer}
          onChange={(e) => setParams({ q: query, layer: e.target.value })}
        >
          <option value="">Все слои</option>
          {data?.layers.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>
      <p className="eyebrow">{docs.length} документов</p>
      <DocLinks docs={docs} />
      {!docs.length && <p>По выбранным фильтрам ничего не найдено.</p>}
    </div>
  );
}
