import { useCatalog } from "./CatalogContext";
import { DocLinks } from "./DocLinks";

export function RecentChanges() {
  const data = useCatalog();
  return (
    <section>
      <h2>Последние изменения</h2>
      <DocLinks
        docs={[...(data?.docs || [])]
          .sort((a, b) => b.mtime - a.mtime)
          .slice(0, 5)}
      />
    </section>
  );
}
