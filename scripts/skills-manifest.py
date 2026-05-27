#!/usr/bin/env python3
"""
Generate per-library manifests AND the aggregate 06_outputs/_skills-index.md.

Auto-discovers any 06_outputs/<library>/ that has subfolders matching
the canonical NN-category pattern.
"""
import pathlib, re, time
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_BASE = ROOT / "06_outputs"
AGG_INDEX = OUT_BASE / "_skills-index.md"

LIBRARY_TITLES = {
    "cybos-cases":       "Cybos.ai cases (https://www.cybos.ai/cases)",
    "anthropics-skills": "Anthropic Agent Skills (https://github.com/anthropics/skills)",
    "fabric-patterns":   "Fabric patterns (https://github.com/danielmiessler/fabric)",
    "claude-cookbooks":  "Anthropic claude-cookbooks (https://github.com/anthropics/claude-cookbooks)",
}


def parse_frontmatter(path: pathlib.Path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).splitlines():
        km = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if km:
            v = km.group(2).strip()
            if v.startswith('"') and v.endswith('"'):
                v = v[1:-1]
            fm[km.group(1)] = v
    return fm


def collect(library_dir: pathlib.Path):
    out = []
    for md in sorted(library_dir.rglob("*.md")):
        if md.name.startswith("_"):
            continue
        fm = parse_frontmatter(md)
        if not fm.get("id"):
            continue
        fm["_path"] = md
        out.append(fm)
    return out


def is_library_dir(path: pathlib.Path) -> bool:
    if not path.is_dir():
        return False
    if path.name.startswith("_"):
        return False
    if path.name.startswith("."):
        return False
    # Must contain at least one NN-... subdirectory with .md files
    for sub in path.iterdir():
        if sub.is_dir() and re.match(r"^\d{2}-", sub.name):
            return True
    return False


def generate_library_manifest(library_dir: pathlib.Path, library_title: str):
    records = collect(library_dir)
    today = time.strftime("%Y-%m-%d")
    by_cat_folder = defaultdict(list)
    for r in records:
        by_cat_folder[r["_path"].parent.name].append(r)

    # _index.md
    idx = [
        "---",
        "type: index",
        f"title: {library_title} — каталог",
        f"ingested: {today}",
        f"total: {len(records)}",
        "version: v0.1",
        "---",
        "",
        f"# {library_title} — каталог",
        "",
        f"> Импорт из upstream-источника на {today}. Всего **{len(records)}** единиц в **{len(by_cat_folder)}** категориях.",
        "",
        "## По категориям",
        "",
        "| Категория | Единиц | Папка |",
        "| - | -: | - |",
    ]
    for folder in sorted(p.name for p in library_dir.iterdir() if p.is_dir()):
        items = by_cat_folder.get(folder, [])
        if items:
            cat = items[0].get("category", folder)
            idx.append(f"| {cat} | {len(items)} | [`{folder}/`](./{folder}/) |")

    idx += [
        "",
        "## Все единицы",
        "",
        "| ID | Категория | Title | License | Upstream |",
        "| - | - | - | - | - |",
    ]
    for r in sorted(records, key=lambda x: x.get("id", "")):
        rel = r["_path"].relative_to(library_dir)
        upstream_link = ""
        if r.get("upstream_name") and r.get("source"):
            upstream_link = f"[{r['upstream_name']}]({r['source']})"
        elif r.get("source"):
            upstream_link = r["source"]
        idx.append(
            f"| `{r.get('id','')}` "
            f"| {r.get('category','')} "
            f"| [{r.get('title','')}](./{rel}) "
            f"| {r.get('license','')} "
            f"| {upstream_link} |"
        )
    (library_dir / "_index.md").write_text("\n".join(idx) + "\n", encoding="utf-8")

    # _categories.md
    cat_lines = [
        "---",
        "type: index",
        f"title: {library_title} — по категориям",
        f"ingested: {today}",
        "version: v0.1",
        "---",
        "",
        f"# {library_title} — по категориям",
        "",
    ]
    for folder in sorted(p.name for p in library_dir.iterdir() if p.is_dir()):
        items = sorted(by_cat_folder.get(folder, []), key=lambda x: x.get("id", ""))
        if not items:
            continue
        cat = items[0].get("category", folder)
        cat_lines.append(f"## {cat} · {len(items)} единиц · [`{folder}/`](./{folder}/)")
        cat_lines.append("")
        cat_lines.append("| ID | Title | Subtitle |")
        cat_lines.append("| - | - | - |")
        for r in items:
            rel = r["_path"].relative_to(library_dir)
            sub = (r.get("subtitle", "") or "").replace("|", "\\|")
            if len(sub) > 140:
                sub = sub[:137] + "…"
            cat_lines.append(f"| `{r.get('id','')}` | [{r.get('title','')}](./{rel}) | {sub} |")
        cat_lines.append("")
    (library_dir / "_categories.md").write_text("\n".join(cat_lines) + "\n", encoding="utf-8")

    return records


def generate_aggregate():
    today = time.strftime("%Y-%m-%d")
    libs = []
    for child in sorted(OUT_BASE.iterdir()):
        if is_library_dir(child):
            libs.append(child)
    rows = []
    total = 0
    all_records = {}
    for lib in libs:
        recs = collect(lib)
        all_records[lib.name] = recs
        total += len(recs)
        cats = sorted(set(r.get("category", "") for r in recs if r.get("category")))
        title = LIBRARY_TITLES.get(lib.name, lib.name)
        rows.append((lib.name, title, len(recs), cats))

    lines = [
        "---",
        "type: index",
        "title: Skills — общий каталог",
        f"ingested: {today}",
        f"total: {total}",
        "version: v0.1",
        "---",
        "",
        "# Skills — общий каталог",
        "",
        f"> Все библиотеки скилов в этой KB на {today}. Всего **{total}** единиц из **{len(libs)}** источников.",
        "",
        "| Библиотека | Описание | Единиц | Категорий | Каталог |",
        "| - | - | -: | -: | - |",
    ]
    for folder, descr, n, cats in rows:
        lines.append(f"| **{folder}** | {descr} | {n} | {len(cats)} | [`{folder}/_index.md`](./{folder}/_index.md) |")

    # Coverage matrix
    lines += ["", "## Покрытие категорий", "", "| Категория | " + " | ".join(r[0] for r in rows) + " | ИТОГО |", "| - | " + " | ".join(["-:"] * len(rows)) + " | -: |"]
    counts_by_lib = []
    all_cats = set()
    for lib_name, _, _, _ in rows:
        recs = all_records[lib_name]
        cnt = defaultdict(int)
        for r in recs:
            c = r.get("category", "")
            cnt[c] += 1
            all_cats.add(c)
        counts_by_lib.append(cnt)
    for cat in sorted(all_cats):
        row_vals = []
        total_row = 0
        for cnt in counts_by_lib:
            v = cnt.get(cat, 0)
            total_row += v
            row_vals.append(str(v) if v else "—")
        lines.append(f"| {cat} | " + " | ".join(row_vals) + f" | **{total_row}** |")
    AGG_INDEX.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    libs = [p for p in OUT_BASE.iterdir() if is_library_dir(p)]
    for lib in libs:
        title = LIBRARY_TITLES.get(lib.name, lib.name)
        recs = generate_library_manifest(lib, title)
        print(f"  {lib.name:25s} _index.md + _categories.md ({len(recs)} items)")
    generate_aggregate()
    print(f"aggregate: {AGG_INDEX.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
