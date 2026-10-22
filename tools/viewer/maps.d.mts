export type MapNode = {
  id: string;
  label: string;
  summary?: string;
  source?: string;
  x: number;
  y: number;
};
export type MapEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  kind?: string;
};
export type KnowledgeMap = {
  id: string;
  title: string;
  description?: string;
  source?: string;
  nodes: MapNode[];
  edges: MapEdge[];
};
export const NODE_WIDTH: number, NODE_HEIGHT: number;
export function validateMaps(
  maps: KnowledgeMap[],
  published: string[],
): string[];
export function mapBounds(map: KnowledgeMap): { width: number; height: number };
export function fitMapView(
  bounds: { width: number; height: number },
  width: number,
  height: number,
): { scale: number; x: number; y: number };
export function mapNodeMatches(
  node: Pick<MapNode, "label" | "summary">,
  query: string,
): boolean;

export function mapNodeView(
  node: { x: number; y: number },
  width: number,
  height: number,
  preferredScale?: number,
): { scale: number; x: number; y: number };
