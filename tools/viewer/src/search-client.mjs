export async function searchDocuments(
  { staticMode, fetchJson, getCatalog },
  q,
  mode = "hybrid",
  top = 10,
) {
  if (!staticMode)
    return fetchJson(
      `/api/search?q=${encodeURIComponent(q)}&mode=${mode}&top=${top}`,
    );
  const data = await getCatalog();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = data.docs.filter((d) =>
    terms.every((t) => (d.title + " " + d.body).toLowerCase().includes(t)),
  );
  return {
    results: matches
      .slice(0, top)
      .map((d) => ({
        file: d.path,
        line: 1,
        layer: d.layer,
        heading: d.title || d.name,
        text: d.body.slice(0, 300),
        similarity: null,
        bm25_score: null,
        fused: null,
        vec_rank: null,
        bm25_rank: null,
      })),
    query: q,
    mode: "local text",
    top,
  };
}
