import { Link, useParams } from "react-router-dom";
import { useCatalog } from "@/components/CatalogContext";
import { MapCanvas } from "@/components/MapCanvas";
export function Maps() {
  const { id } = useParams();
  const data = useCatalog();
  const maps = data?.maps ?? [];
  const map = maps.find((m) => m.id === id);
  if (!data)
    return (
      <div className="workspace-page">
        <h1>Схемы</h1>
        <p>Загрузка схем…</p>
      </div>
    );
  if (id && !map)
    return (
      <div className="workspace-page">
        <h1>Схема не найдена</h1>
        <Link to="/maps">Все схемы</Link>
      </div>
    );
  return (
    <div className="workspace-page">
      <p className="eyebrow">Связи и устройство системы</p>
      <h1>{map?.title || "Схемы"}</h1>
      {map ? (
        <>
          <Link to="/maps">← Все схемы</Link>
          <p className="lede">{map.description}</p>
          <MapCanvas map={map} />
          {map.source && (
            <p>
              <Link to={"/doc/" + map.source}>Открыть описание схемы</Link>
            </p>
          )}
        </>
      ) : (
        <>
          <p className="lede">
            Откройте канвас, найдите нужный блок и проверьте связи по
            источникам.
          </p>
          {!maps.length ? (
            <p>Схем пока нет. Добавьте первую в реестр проекта.</p>
          ) : (
            maps.map((m) => (
              <article className="publication-card" key={m.id}>
                <h2>
                  <Link to={"/maps/" + m.id}>{m.title}</Link>
                </h2>
                <p>{m.description}</p>
              </article>
            ))
          )}
        </>
      )}
    </div>
  );
}
