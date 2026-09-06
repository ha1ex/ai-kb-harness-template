import { NavLink } from "react-router-dom";
import { useCatalog } from "./CatalogContext";
import { NavTree } from "./NavTree";

export function AppSidebar() {
  const data = useCatalog();
  return (
    <aside className="workspace-sidebar">
      <nav aria-label="Основная навигация">
        <NavLink to="/" end>
          Главная
        </NavLink>
        <NavLink to="/search">Поиск</NavLink>
        <p className="eyebrow">Разделы</p>
        {data?.spaces.map((s) => (
          <NavTree
            key={s.id}
            id={s.id}
            title={s.title}
            paths={s.start_docs.map((p) => "/doc/" + p)}
            to={"/space/" + s.id}
          >
            {s.start_docs
              .filter((p) => data.docs.some((d) => d.path === p))
              .map((p) => (
                <NavLink key={p} to={"/doc/" + p}>
                  {data.docs.find((d) => d.path === p)?.title || p}
                </NavLink>
              ))}
          </NavTree>
        ))}
        <p className="eyebrow">Все материалы</p>
        <NavTree id="library" title="Библиотека" to="/library">
          {data?.layers.map((l) => (
            <NavLink key={l} to={"/layer/" + l}>
              {l.replace(/^\d+_/, "").replaceAll("_", " ")}
            </NavLink>
          ))}
        </NavTree>
        <p className="eyebrow">Инструменты</p>
        <NavLink to="/graph">Граф знаний</NavLink>
        <NavLink to="/open-questions">Открытые вопросы</NavLink>
        <NavLink to="/skillopt">SkillOpt</NavLink>
      </nav>
    </aside>
  );
}
