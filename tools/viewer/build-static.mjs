import { buildCatalog } from "./data.mjs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
const root = resolve(process.env.REPO_ROOT || process.env.KB_ROOT || "../..");
const data = await buildCatalog(root);
await mkdir("dist/data", { recursive: true });
await writeFile("dist/data/catalog.json", JSON.stringify(data));
const html = await readFile("dist/index.html", "utf8");
const routes = [
  "library",
  "search",
  "graph",
  "open-questions",
  "skillopt",
  ...data.layers.map((l) => "layer/" + l),
  ...data.spaces.map((s) => "space/" + s.id),
  ...data.docs.map((d) => "doc/" + d.path),
];
for (const route of routes) {
  const dest = join("dist", route, "index.html");
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, html);
}
await writeFile("dist/404.html", html);
console.log(
  `Static viewer: ${data.docs.length} documents, ${data.spaces.length} spaces, ${routes.length} direct routes.`,
);
