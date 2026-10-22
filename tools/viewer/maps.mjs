// Portable maps: no product-specific node or relationship types.
export const NODE_WIDTH = 220,
  NODE_HEIGHT = 120;
export function validateMaps(maps, published) {
  const errors = [];
  const ids = new Set();
  const paths = new Set(published);
  for (const map of maps) {
    if (
      !/^[a-z0-9][a-z0-9-]*$/.test(map.id) ||
      ids.has(map.id) ||
      typeof map.title !== "string"
    )
      errors.push("maps: invalid or duplicate map id/title");
    ids.add(map.id);
    if (
      !Array.isArray(map.nodes) ||
      !map.nodes.length ||
      !Array.isArray(map.edges)
    ) {
      errors.push(`maps: ${map.id} needs nodes and edges`);
      continue;
    }
    const nodes = new Set(),
      edges = new Set();
    for (const node of map.nodes) {
      if (
        typeof node.id !== "string" ||
        nodes.has(node.id) ||
        !node.id ||
        typeof node.label !== "string" ||
        !node.label ||
        ![node.x, node.y].every((n) => Number.isFinite(n) && n >= 0)
      )
        errors.push(
          `maps: ${map.id} has invalid/duplicate node or coordinates`,
        );
      nodes.add(node.id);
      if (node.source && !paths.has(node.source))
        errors.push(`maps: ${map.id}/${node.id} source is unpublished`);
    }
    for (const edge of map.edges) {
      if (
        !edge.id ||
        edges.has(edge.id) ||
        !nodes.has(edge.from) ||
        !nodes.has(edge.to)
      )
        errors.push(`maps: ${map.id} has an invalid edge`);
      edges.add(edge.id);
    }
    if (map.source && !paths.has(map.source))
      errors.push(`maps: ${map.id} source is unpublished`);
  }
  return errors;
}
export function mapBounds(map) {
  return {
    width: Math.max(320, ...map.nodes.map((n) => n.x + NODE_WIDTH + 30)),
    height: Math.max(240, ...map.nodes.map((n) => n.y + NODE_HEIGHT + 30)),
  };
}
export function fitMapView(bounds, width, height) {
  const scale = Math.min(
    1,
    Math.max(1, width - 24) / bounds.width,
    Math.max(1, height - 24) / bounds.height,
  );
  return {
    scale,
    x: (width - bounds.width * scale) / 2,
    y: (height - bounds.height * scale) / 2,
  };
}
export function mapNodeMatches(node, query) {
  return [node.label, node.summary, node.id]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ru")
    .includes(query.trim().toLocaleLowerCase("ru"));
}

export function mapNodeView(node, width, height, preferredScale = 0.7) {
  const scale = Math.min(
    Math.max(0.7, preferredScale),
    Math.max(1, width - 24) / NODE_WIDTH,
    Math.max(1, height - 24) / NODE_HEIGHT,
  );
  return {
    scale,
    x: width / 2 - (node.x + NODE_WIDTH / 2) * scale,
    y: height / 2 - (node.y + NODE_HEIGHT / 2) * scale,
  };
}
