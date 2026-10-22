import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  fitMapView,
  mapBounds,
  mapNodeMatches,
  mapNodeView,
  NODE_HEIGHT,
  NODE_WIDTH,
  type KnowledgeMap,
} from "../../maps.mjs";
export function MapCanvas({ map }: { map: KnowledgeMap }) {
  const viewport = useRef<HTMLDivElement>(null),
    drag = useRef<{ px: number; py: number; x: number; y: number } | null>(
      null,
    );
  const marker = "map-arrow-" + useId().replaceAll(":", "");
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [kind, setKind] = useState("");
  const bounds = useMemo(() => mapBounds(map), [map]);
  const kinds = [...new Set(map.edges.map((e) => e.kind).filter(Boolean))];
  const node = map.nodes.find((n) => n.id === selected);
  function fit() {
    const box = viewport.current?.getBoundingClientRect();
    if (box) setView(fitMapView(bounds, box.width, box.height));
  }
  useEffect(() => {
    fit();
    const observer = new ResizeObserver(fit);
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [map]);
  useEffect(() => {
    setSelected(null);
    setQuery("");
    setKind("");
  }, [map.id]);
  function zoom(factor: number) {
    const box = viewport.current?.getBoundingClientRect();
    if (!box) return;
    setView((v) => {
      const scale = Math.min(3, Math.max(0.05, v.scale * factor)),
        ratio = scale / v.scale;
      return {
        scale,
        x: box.width / 2 - (box.width / 2 - v.x) * ratio,
        y: box.height / 2 - (box.height / 2 - v.y) * ratio,
      };
    });
  }
  function revealNode(id: string) {
    const n = map.nodes.find((node) => node.id === id),
      box = viewport.current?.getBoundingClientRect();
    if (n && box) setView(mapNodeView(n, box.width, box.height, view.scale));
  }
  function focusNode(id: string) {
    setSelected(id);
    revealNode(id);
  }
  const matches = query.trim()
    ? map.nodes.filter((n) => mapNodeMatches(n, query))
    : [];
  const connected = new Set(
    map.edges
      .filter((e) => e.from === selected || e.to === selected)
      .flatMap((e) => [e.from, e.to]),
  );
  return (
    <section aria-label={"Канвас: " + map.title}>
      <div className="map-controls">
        <label>
          Поиск по блокам
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button onClick={() => zoom(1.25)} aria-label="Увеличить">
          +
        </button>
        <button onClick={() => zoom(0.8)} aria-label="Уменьшить">
          −
        </button>
        <button onClick={fit}>Вписать схему</button>
        <span aria-live="polite">{Math.round(view.scale * 100)}%</span>
        {kinds.length > 0 && (
          <label>
            Связи
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">Все виды</option>
              {kinds.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      {query.trim() && (
        <div className="map-results" aria-label="Результаты поиска">
          {matches.length ? (
            matches.slice(0, 8).map((n) => (
              <button key={n.id} onClick={() => focusNode(n.id)}>
                {n.label}
              </button>
            ))
          ) : (
            <p>Блоки не найдены.</p>
          )}
        </div>
      )}
      <p className="map-help">
        Перетаскивайте фон, чтобы двигать схему. Выберите блок, чтобы увидеть
        подробности и источник.
      </p>
      <div
        className="map-viewport"
        ref={viewport}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button,a")) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { px: e.clientX, py: e.clientY, x: view.x, y: view.y };
        }}
        onPointerMove={(e) => {
          if (drag.current) {
            const start = drag.current;
            setView((v) => ({
              ...v,
              x: start.x + e.clientX - start.px,
              y: start.y + e.clientY - start.py,
            }));
          }
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <div
          className="map-world"
          style={{
            width: bounds.width,
            height: bounds.height,
            transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`,
          }}
        >
          <svg
            width={bounds.width}
            height={bounds.height}
            className="map-edges"
            aria-hidden="true"
          >
            <defs>
              <marker
                id={marker}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {map.edges
              .filter((e) => !kind || e.kind === kind)
              .map((edge) => {
                const from = map.nodes.find((n) => n.id === edge.from)!,
                  to = map.nodes.find((n) => n.id === edge.to)!;
                if (!from || !to) return null;
                const x1 = from.x + NODE_WIDTH,
                  y1 = from.y + NODE_HEIGHT / 2,
                  x2 = to.x,
                  y2 = to.y + NODE_HEIGHT / 2;
                return (
                  <g
                    key={edge.id}
                    opacity={
                      selected && edge.from !== selected && edge.to !== selected
                        ? 0.2
                        : 1
                    }
                  >
                    <path
                      d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      markerEnd={"url(#" + marker + ")"}
                    />
                    {edge.label && (
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2 - 9}
                        textAnchor="middle"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}
          </svg>
          {map.nodes.map((n) => (
            <button
              key={n.id}
              className="map-node"
              aria-pressed={n.id === selected}
              onClick={() => setSelected(n.id === selected ? null : n.id)}
              onFocus={(event) => {
                if (event.currentTarget.matches(":focus-visible"))
                  revealNode(n.id);
              }}
              style={{
                left: n.x,
                top: n.y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                opacity:
                  (query && !mapNodeMatches(n, query)) ||
                  (selected && n.id !== selected && !connected.has(n.id))
                    ? 0.3
                    : 1,
              }}
            >
              <strong>{n.label}</strong>
              {n.summary && <span>{n.summary}</span>}
            </button>
          ))}
        </div>
      </div>
      {node && (
        <aside className="map-inspector" aria-label="Выбранный блок">
          <button onClick={() => setSelected(null)}>Закрыть подробности</button>
          <h2>{node.label}</h2>
          <p>{node.summary}</p>
          {node.source && (
            <Link to={"/doc/" + node.source}>Открыть источник</Link>
          )}
          <ul>
            {map.edges
              .filter((e) => e.from === node.id || e.to === node.id)
              .map((e) => (
                <li key={e.id}>
                  {map.nodes.find((n) => n.id === e.from)?.label} →{" "}
                  {map.nodes.find((n) => n.id === e.to)?.label}
                  {e.label && ": " + e.label}
                </li>
              ))}
          </ul>
        </aside>
      )}
      <details className="map-table">
        <summary>Табличное представление</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Блок</th>
                <th>Описание</th>
                <th>Основание</th>
              </tr>
            </thead>
            <tbody>
              {map.nodes.map((n) => (
                <tr key={n.id}>
                  <th>{n.label}</th>
                  <td>{n.summary}</td>
                  <td>
                    {n.source ? (
                      <Link to={"/doc/" + n.source}>Источник</Link>
                    ) : (
                      "Не указан"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <thead>
              <tr>
                <th>Откуда</th>
                <th>Куда</th>
                <th>Связь</th>
              </tr>
            </thead>
            <tbody>
              {map.edges.map((e) => (
                <tr key={e.id}>
                  <td>{map.nodes.find((n) => n.id === e.from)?.label}</td>
                  <td>{map.nodes.find((n) => n.id === e.to)?.label}</td>
                  <td>{e.label || e.kind || "Не названа"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
