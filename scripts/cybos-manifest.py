#!/usr/bin/env python3
"""Generate _index.md and _categories.md for 06_outputs/cybos-cases/."""
import json, pathlib, time
from collections import defaultdict
from typing import Optional

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / ".context" / "cybos" / "index.json"
OUT = ROOT / "06_outputs" / "cybos-cases"

CATEGORY_FOLDER = {
    "Engineering productivity": "01-engineering-productivity",
    "Marketing & content":      "02-marketing-content",
    "Strategy & leadership":    "03-strategy-leadership",
    "Infrastructure":           "04-infrastructure",
    "Sales & outbound":         "05-sales-outbound",
    "Operations":               "06-operations",
    "Knowledge management":     "07-knowledge-management",
    "HR & hiring":              "08-hr-hiring",
    "Founder productivity":     "09-founder-productivity",
    "Customer success":         "10-customer-success",
    "Data & BI":                "11-data-bi",
}


def find_md(case_id: str) -> Optional[pathlib.Path]:
    matches = list(OUT.rglob(f"{case_id}-*.md"))
    return matches[0] if matches else None


def main() -> None:
    records = json.loads(INDEX.read_text())
    today = time.strftime("%Y-%m-%d")

    # --- _index.md ---
    by_cat = defaultdict(list)
    missing = []
    for r in records:
        if find_md(r["id"]):
            by_cat[r["category"]].append(r)
        else:
            missing.append(r["id"])

    lines = [
        "---",
        "type: index",
        "title: Cybos cases — full catalog",
        f"ingested: {today}",
        "source: https://www.cybos.ai/cases",
        f"total: {len(records)}",
        f"local: {len(records) - len(missing)}",
        "version: v0.1",
        "---",
        "",
        "# Cybos cases — каталог",
        "",
        f"> Зеркало [cybos.ai/cases](https://www.cybos.ai/cases) на {today}. "
        f"Всего **{len(records)}** кейсов, локально **{len(records)-len(missing)}**. "
        "Сгруппированы по 11 категориям. Поиск по содержимому — `node scripts/semantic/search.mjs \"<query>\"`.",
        "",
        "## По категориям",
        "",
        "| # | Категория | Кейсов | Папка |",
        "| - | - | -: | - |",
    ]
    for cat, folder in CATEGORY_FOLDER.items():
        n = len(by_cat.get(cat, []))
        lines.append(f"| {folder.split('-')[0]} | {cat} | {n} | [`{folder}/`](./{folder}/) |")
    if missing:
        lines += [
            "",
            f"> ⚠ {len(missing)} ещё не скачаны: {', '.join(missing[:20])}{'…' if len(missing)>20 else ''}",
        ]
    lines += ["", "## Все кейсы (по ID)", "", "| ID | Tier | Kind | Категория | Заголовок |", "| - | - | - | - | - |"]
    for r in sorted(records, key=lambda x: x["id"]):
        md = find_md(r["id"])
        if md:
            rel = md.relative_to(OUT)
            title = f"[{r['title']}](./{rel})"
        else:
            title = r["title"]
        lines.append(f"| `{r['id']}` | {r['tier']} | {r['kind']} | {r['category']} | {title} |")

    (OUT / "_index.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    # --- _categories.md ---
    cat_lines = [
        "---",
        "type: index",
        "title: Cybos cases — по категориям",
        f"ingested: {today}",
        "version: v0.1",
        "---",
        "",
        "# Cybos cases — по категориям",
        "",
    ]
    for cat, folder in CATEGORY_FOLDER.items():
        items = sorted(by_cat.get(cat, []), key=lambda x: x["id"])
        cat_lines.append(f"## {cat} · {len(items)} кейсов · [`{folder}/`](./{folder}/)")
        cat_lines.append("")
        cat_lines.append("| ID | Tier | Kind | Заголовок | Превью |")
        cat_lines.append("| - | - | - | - | - |")
        for r in items:
            md = find_md(r["id"])
            link = f"[{r['title']}](./{md.relative_to(OUT)})" if md else r["title"]
            preview = (r["preview"] or "").replace("|", "\\|")
            if len(preview) > 120:
                preview = preview[:117] + "…"
            cat_lines.append(f"| `{r['id']}` | {r['tier']} | {r['kind']} | {link} | {preview} |")
        cat_lines.append("")
    (OUT / "_categories.md").write_text("\n".join(cat_lines) + "\n", encoding="utf-8")

    print(f"wrote _index.md and _categories.md (local={len(records)-len(missing)} / total={len(records)})")
    if missing:
        print(f"missing files for: {missing[:10]}{'…' if len(missing)>10 else ''}")


if __name__ == "__main__":
    main()
