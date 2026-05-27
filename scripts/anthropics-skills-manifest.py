#!/usr/bin/env python3
"""Generate _index.md and _categories.md for 06_outputs/anthropics-skills/.
Also (re)generate 06_outputs/_skills-index.md — aggregate over all libraries.
"""
import pathlib, re, time
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "06_outputs" / "anthropics-skills"
AGG_INDEX = ROOT / "06_outputs" / "_skills-index.md"


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
    records = []
    for md in sorted(library_dir.rglob("*.md")):
        if md.name.startswith("_"):
            continue
        fm = parse_frontmatter(md)
        if not fm.get("id"):
            continue
        fm["_path"] = md
        records.append(fm)
    return records


def generate_library_manifest(library_dir: pathlib.Path, library_name: str):
    records = collect(library_dir)
    today = time.strftime("%Y-%m-%d")
    by_cat = defaultdict(list)
    for r in records:
        by_cat[r.get("category", "Uncategorized")].append(r)

    # _index.md
    idx = [
        "---",
        "type: index",
        f"title: {library_name} — каталог",
        f"ingested: {today}",
        f"total: {len(records)}",
        "version: v0.1",
        "---",
        "",
        f"# {library_name} — каталог",
        "",
        f"> Импорт из upstream-источника на {today}. Всего **{len(records)}** скилов в **{len(by_cat)}** категориях.",
        "",
        "## По категориям",
        "",
        "| Категория | Скилов | Папка |",
        "| - | -: | - |",
    ]
    for folder in sorted(p.name for p in library_dir.iterdir() if p.is_dir()):
        items = [r for r in records if r["_path"].parent.name == folder]
        if items:
            cat = items[0].get("category", folder)
            idx.append(f"| {cat} | {len(items)} | [`{folder}/`](./{folder}/) |")
    idx += ["", "## Все скилы", "", "| ID | Категория | Title | License | Upstream |", "| - | - | - | - | - |"]
    for r in sorted(records, key=lambda x: x["id"]):
        rel = r["_path"].relative_to(library_dir)
        idx.append(
            f"| `{r['id']}` "
            f"| {r.get('category','')} "
            f"| [{r.get('title','')}](./{rel}) "
            f"| {r.get('license','')} "
            f"| [{r.get('upstream_name','')}]({r.get('source','')}) |"
        )
    (library_dir / "_index.md").write_text("\n".join(idx) + "\n", encoding="utf-8")

    # _categories.md
    cat_lines = [
        "---",
        "type: index",
        f"title: {library_name} — по категориям",
        f"ingested: {today}",
        "version: v0.1",
        "---",
        "",
        f"# {library_name} — по категориям",
        "",
    ]
    for folder in sorted(p.name for p in library_dir.iterdir() if p.is_dir()):
        items = sorted(
            [r for r in records if r["_path"].parent.name == folder],
            key=lambda x: x["id"],
        )
        if not items:
            continue
        cat = items[0].get("category", folder)
        cat_lines.append(f"## {cat} · {len(items)} скилов · [`{folder}/`](./{folder}/)")
        cat_lines.append("")
        cat_lines.append("| ID | Title | Subtitle |")
        cat_lines.append("| - | - | - |")
        for r in items:
            rel = r["_path"].relative_to(library_dir)
            sub = (r.get("subtitle", "") or "").replace("|", "\\|")
            if len(sub) > 140:
                sub = sub[:137] + "…"
            cat_lines.append(f"| `{r['id']}` | [{r.get('title','')}](./{rel}) | {sub} |")
        cat_lines.append("")
    (library_dir / "_categories.md").write_text("\n".join(cat_lines) + "\n", encoding="utf-8")
    print(f"{library_name}: _index.md + _categories.md ({len(records)} skills, {len(by_cat)} cats)")
    return records


def generate_aggregate_index():
    today = time.strftime("%Y-%m-%d")
    libs = {
        "cybos-cases": "Cybos.ai cases (https://www.cybos.ai/cases)",
        "anthropics-skills": "Anthropic Agent Skills (https://github.com/anthropics/skills)",
    }
    rows = []
    total = 0
    for folder, descr in libs.items():
        lib_dir = ROOT / "06_outputs" / folder
        if not lib_dir.exists():
            continue
        recs = collect(lib_dir)
        total += len(recs)
        cats = sorted(set(r.get("category", "") for r in recs if r.get("category")))
        rows.append((folder, descr, len(recs), cats))
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
        f"> Все библиотеки скилов в этой KB на {today}. Всего **{total}** единиц.",
        "",
        "| Библиотека | Описание | Скилов | Категорий | Каталог |",
        "| - | - | -: | -: | - |",
    ]
    for folder, descr, n, cats in rows:
        lines.append(f"| **{folder}** | {descr} | {n} | {len(cats)} | [`{folder}/_index.md`](./{folder}/_index.md) |")
    lines += [
        "",
        "## Покрытие категорий",
        "",
        "| Категория | cybos | anthropics |",
        "| - | -: | -: |",
    ]
    # union of cats
    cybos_by_cat = defaultdict(int)
    ant_by_cat = defaultdict(int)
    for folder, _, _, _ in rows:
        recs = collect(ROOT / "06_outputs" / folder)
        for r in recs:
            cat = r.get("category", "")
            if folder == "cybos-cases":
                cybos_by_cat[cat] += 1
            elif folder == "anthropics-skills":
                ant_by_cat[cat] += 1
    all_cats = sorted(set(cybos_by_cat) | set(ant_by_cat))
    for cat in all_cats:
        c = cybos_by_cat.get(cat, 0)
        a = ant_by_cat.get(cat, 0)
        lines.append(f"| {cat} | {c if c else '—'} | {a if a else '—'} |")
    AGG_INDEX.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"aggregate: {AGG_INDEX.relative_to(ROOT)} ({total} skills total)")


if __name__ == "__main__":
    generate_library_manifest(OUT, "Anthropic Agent Skills")
    generate_aggregate_index()
