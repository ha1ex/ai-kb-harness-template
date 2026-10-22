import { searchDocuments } from "./search-client.mjs";
// api.ts — типизированный клиент API (см. server.ts).

export type DocMeta = {
  path: string;
  layer: string;
  name: string;
  size: number;
  mtime: number;
  title: string | null;
  frontmatter: Record<string, unknown>;
};

export type TreeResponse = {
  layers: string[];
  tree: Record<string, DocMeta[]>;
  builtAt: number;
};

export type DocFull = {
  path: string;
  layer: string;
  raw: string;
  body: string;
  frontmatter: Record<string, unknown>;
  backlinks: string[];
};

export type GraphNode = { id: string; label: string; layer: string };
export type GraphEdge = { source: string; target: string; type: string };
export type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  hint?: string;
  error?: string;
};

export type SearchResult = {
  file: string;
  line: number;
  layer: string;
  heading: string;
  similarity: number | null;
  bm25_score: number | null;
  fused: number | null;
  vec_rank: number | null;
  bm25_rank: number | null;
  text: string;
};

export type SearchResponse =
  | { results: SearchResult[]; query: string; mode: string; top: number }
  | { error: string; raw?: string };

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} on ${url}`);
  return (await r.json()) as T;
}

export const api = {
  tree: () => getCatalog(),
  doc: async (path: string) => {
    const doc = (await getCatalog()).docs.find((d) => d.path === path);
    if (!doc)
      throw Error(
        "Документ не опубликован в этой витрине. Проверьте путь и настройки доступных слоёв; исходники 01_raw публикуются отдельно.",
      );
    return doc;
  },
  graph: () =>
    import.meta.env.PROD
      ? Promise.resolve({
          nodes: [],
          edges: [],
          hint: "Graph index is available in development mode",
        })
      : fetchJson<GraphResponse>("/api/graph"),
  search: (
    q: string,
    mode: "hybrid" | "vector" | "bm25" = "hybrid",
    top = 10,
  ): Promise<SearchResponse> =>
    searchDocuments(
      { staticMode: import.meta.env.PROD, fetchJson, getCatalog },
      q,
      mode,
      top,
    ),
};

export type Space = {
  id: string;
  title: string;
  description?: string;
  start_docs: string[];
};
export type Catalog = TreeResponse & {
  config: {
    name: string;
    description: string;
    status?: string;
    accent?: string;
  };
  spaces: Space[];
  docs: (DocMeta & DocFull)[];
  publication?: {
    items: import("../publication.mjs").Publication[];
    categories: import("../publication.mjs").Category[];
    errors: string[];
  };
  assets?: string[];
  methods?: {
    id: string;
    title: string;
    card: string;
    source: string;
    license: string;
    lens: string;
    question?: string;
    revision?: string;
    mode?: "reference" | "mirror";
    attribution?: string;
  }[];
  research?: {
    id: string;
    title: string;
    question?: string;
    status?: string;
    results: string[];
    workdir?: string;
  }[];
  registryErrors?: string[];
  maps?: import("../maps.mjs").KnowledgeMap[];
};
let catalogPromise: Promise<Catalog> | undefined;
export function getCatalog(): Promise<Catalog> {
  return (catalogPromise ??= fetchJson<Catalog>(
    import.meta.env.PROD ? "/data/catalog.json" : "/api/viewer",
  ));
}
