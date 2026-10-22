import test from "node:test";
import assert from "node:assert/strict";
import {
  validateMaps,
  mapBounds,
  fitMapView,
  mapNodeMatches,
} from "./maps.mjs";
const map = {
  id: "demo",
  title: "Demo",
  nodes: [
    { id: "a", label: "Source", x: 20, y: 20, source: "reports/a.md" },
    { id: "b", label: "Result", x: 300, y: 20 },
  ],
  edges: [{ id: "ab", from: "a", to: "b", kind: "evidence" }],
};
test("maps validate nodes, edge endpoints and published source paths", () => {
  assert.deepEqual(validateMaps([map], ["reports/a.md"]), []);
  for (const changed of [
    { ...map, nodes: [...map.nodes, map.nodes[0]] },
    { ...map, edges: [{ id: "bad", from: "a", to: "missing" }] },
    { ...map, nodes: [{ ...map.nodes[0], x: NaN }] },
    map,
  ]) {
    assert.ok(validateMaps([changed], []).length > 0);
  }
});
test("map fitting respects narrow viewports and searches labels and notes", () => {
  const bounds = mapBounds(map);
  assert.ok(bounds.width >= 500);
  const fit = fitMapView(bounds, 280, 440);
  assert.ok(fit.scale > 0 && fit.scale < 1);
  assert.ok(
    mapNodeMatches(
      { label: "Source", summary: "Original evidence" },
      "evidence",
    ),
  );
  assert.equal(mapNodeMatches({ label: "Source" }, "missing"), false);
});

test("fit contains very wide maps and a focused node fits the visible viewport", async () => {
  const { mapNodeView } = await import("./maps.mjs");
  const bounds = { width: 10000, height: 500 };
  const fit = fitMapView(bounds, 280, 440);
  assert.ok(fit.x >= 0);
  assert.ok(fit.x + bounds.width * fit.scale <= 280);
  const view = mapNodeView({ x: 900, y: 300 }, 280, 440, 3);
  assert.ok(900 * view.scale + view.x >= 0);
  assert.ok((900 + 220) * view.scale + view.x <= 280);
});
