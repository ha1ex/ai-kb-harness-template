import { Link } from "react-router-dom";
import type { DocMeta } from "@/api";

export function DocLinks({ docs }: { docs: DocMeta[] }) {
  return (
    <div className="doc-list">
      {docs.map((d) => (
        <Link key={d.path} to={"/doc/" + d.path}>
          <strong>{d.title || d.name}</strong>
          <span>
            {String(d.frontmatter.status || d.layer.replace(/^\d+_/, ""))}
          </span>
        </Link>
      ))}
    </div>
  );
}
