#!/usr/bin/env python3
"""
Scrape cybos.ai case pages → Markdown with frontmatter.

Usage:
  python3 scripts/scrape-cybos.py --ids A-001,A-002        # cherry-pick
  python3 scripts/scrape-cybos.py --all                    # all 418
  python3 scripts/scrape-cybos.py --category "Sales & outbound"
  python3 scripts/scrape-cybos.py --limit 5                # first N
"""
import argparse, html as H, json, os, pathlib, re, sys, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / ".context" / "cybos" / "index.json"
OUT_BASE = ROOT / "06_outputs" / "cybos-cases"
UA = "Mozilla/5.0 (cybos-cases-mirror; contact: kb harness)"

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


def slugify(s: str, maxlen: int = 60) -> str:
    s = re.sub(r"[^\w\s-]", "", s, flags=re.U).strip().lower()
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:maxlen].strip("-")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def strip_tag(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s)


# --- HTML → Markdown for cybos case body ---
def html_to_md(html: str) -> str:
    s = html
    # Drop comments
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    # Inline tags
    s = re.sub(r"<strong[^>]*>(.*?)</strong>", r"**\1**", s, flags=re.S)
    s = re.sub(r"<b[^>]*>(.*?)</b>", r"**\1**", s, flags=re.S)
    s = re.sub(r"<em[^>]*>(.*?)</em>", r"*\1*", s, flags=re.S)
    s = re.sub(r"<i[^>]*>(.*?)</i>", r"*\1*", s, flags=re.S)
    s = re.sub(r"<code[^>]*>(.*?)</code>", r"`\1`", s, flags=re.S)
    s = re.sub(
        r'<a [^>]*href="([^"]+)"[^>]*>(.*?)</a>',
        lambda m: f"[{strip_tag(m.group(2)).strip()}]({m.group(1)})",
        s,
        flags=re.S,
    )
    # Headings
    for n in (1, 2, 3, 4, 5, 6):
        s = re.sub(
            rf"<h{n}[^>]*>(.*?)</h{n}>",
            lambda m, n=n: "\n\n" + "#" * n + " " + strip_tag(m.group(1)).strip() + "\n\n",
            s,
            flags=re.S,
        )
    # Lists
    def replace_ul(m):
        items = re.findall(r"<li[^>]*>(.*?)</li>", m.group(1), flags=re.S)
        return "\n" + "\n".join("- " + strip_tag(it).strip() for it in items) + "\n"
    s = re.sub(r"<ul[^>]*>(.*?)</ul>", replace_ul, s, flags=re.S)
    def replace_ol(m):
        items = re.findall(r"<li[^>]*>(.*?)</li>", m.group(1), flags=re.S)
        return "\n" + "\n".join(f"{i+1}. " + strip_tag(it).strip() for i, it in enumerate(items)) + "\n"
    s = re.sub(r"<ol[^>]*>(.*?)</ol>", replace_ol, s, flags=re.S)
    # Pre/code blocks
    s = re.sub(
        r"<pre[^>]*>(.*?)</pre>",
        lambda m: "\n```\n" + strip_tag(m.group(1)).strip() + "\n```\n",
        s,
        flags=re.S,
    )
    # Paragraphs / breaks / div
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<p[^>]*>(.*?)</p>", lambda m: "\n\n" + strip_tag(m.group(1)).strip() + "\n", s, flags=re.S)
    # Sections — keep their inner content, drop wrapper
    s = re.sub(r"</?section[^>]*>", "", s, flags=re.S)
    s = re.sub(r"</?div[^>]*>", "", s, flags=re.S)
    s = re.sub(r"</?span[^>]*>", "", s, flags=re.S)
    # Decode entities
    s = H.unescape(s)
    # Collapse whitespace
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip() + "\n"


def parse_case(html: str, meta: dict) -> dict:
    m = re.search(r"<article[^>]*>(.*?)</article>", html, re.S)
    if not m:
        raise ValueError(f"no <article> in {meta['id']}")
    body = m.group(1)

    # Drop case-eyebrow (category/kind chip), we already have those
    body = re.sub(r'<div class="case-eyebrow">.*?</div>', "", body, flags=re.S)
    # Extract subtitle
    sub_m = re.search(r'<p class="case-subtitle">(.*?)</p>', body, flags=re.S)
    subtitle = H.unescape(strip_tag(sub_m.group(1)).strip()) if sub_m else meta.get("preview", "")
    # Extract meta-row (Tier/Effort/For)
    meta_row = {}
    mr = re.search(r'<div class="case-meta-row">(.*?)</div>\s*<section', body, flags=re.S)
    if mr:
        for k_m in re.finditer(
            r'<span class="k">([^<]+)</span>(.*?)(?=<span class="k">|$)', mr.group(1), re.S
        ):
            k = k_m.group(1).strip()
            v = re.sub(r"<[^>]+>", " ", k_m.group(2))
            v = re.sub(r"\s+", " ", H.unescape(v)).strip()
            meta_row[k] = v
    # Drop subtitle + meta-row from body before MD conversion
    body = re.sub(r'<p class="case-subtitle">.*?</p>', "", body, flags=re.S)
    body = re.sub(r'<div class="case-meta-row">.*?</div>\s*(?=<section)', "", body, flags=re.S)
    # Drop the leading <h1> (title goes into frontmatter / # h1 we'll add)
    body = re.sub(r"<h1[^>]*>.*?</h1>", "", body, count=1, flags=re.S)
    # Drop trailing "← All cases" navigation and case-id badge
    body = re.sub(r'<a [^>]*href="/cases"[^>]*>.*?</a>', "", body, flags=re.S)
    body = re.sub(r'<[^>]+class="[^"]*case-id[^"]*"[^>]*>[^<]*</[^>]+>', "", body, flags=re.S)

    md_body = html_to_md(body)
    # Trailing fallback: strip lines containing only case ID or "All cases"
    md_body = re.sub(r"\n\[?←?\s*All cases.*?$", "", md_body, flags=re.S)
    md_body = re.sub(r"\n[A-C]-\d{3}\s*$", "", md_body)
    return {"subtitle": subtitle, "meta_row": meta_row, "body_md": md_body.strip() + "\n"}


def yaml_escape(v: str) -> str:
    if v is None:
        return '""'
    s = str(v).replace("\\", "\\\\").replace('"', '\\"')
    return f'"{s}"'


def write_case(meta: dict, parsed: dict) -> pathlib.Path:
    folder = CATEGORY_FOLDER.get(meta["category"], "00-uncategorized")
    slug = slugify(meta["title"]) or meta["id"].lower()
    fname = f"{meta['id']}-{slug}.md"
    path = OUT_BASE / folder / fname
    path.parent.mkdir(parents=True, exist_ok=True)
    fm = [
        "---",
        f"id: {meta['id']}",
        f"tier: {meta['tier']}",
        f"category: {yaml_escape(meta['category'])}",
        f"kind: {meta['kind']}",
        f"title: {yaml_escape(meta['title'])}",
        f"subtitle: {yaml_escape(parsed['subtitle'])}",
        f"source: {meta['source']}",
        f"ingested: {time.strftime('%Y-%m-%d')}",
    ]
    # Rename meta_row keys to avoid collision with top-level frontmatter (e.g. tier).
    for k, v in parsed["meta_row"].items():
        key = k.strip().lower().replace(" ", "_")
        if key in ("tier", "category", "kind", "id", "title", "source"):
            key = f"meta_{key}"
        fm.append(f"{key}: {yaml_escape(v)}")
    fm += ["type: case", "version: v0.1", "---", ""]
    head = "\n".join(fm)
    content = f"{head}# {meta['title']}\n\n> {parsed['subtitle']}\n\n{parsed['body_md']}"
    path.write_text(content, encoding="utf-8")
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", help="comma-separated case IDs")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--category", help="exact category name")
    ap.add_argument("--limit", type=int, help="cap N records (after other filters)")
    ap.add_argument("--delay", type=float, default=0.3, help="seconds between requests")
    args = ap.parse_args()

    records = json.loads(INDEX.read_text())
    sel = records
    if args.ids:
        wanted = set(s.strip().upper() for s in args.ids.split(","))
        sel = [r for r in sel if r["id"] in wanted]
    if args.category:
        sel = [r for r in sel if r["category"] == args.category]
    if args.limit:
        sel = sel[: args.limit]
    if not args.all and not args.ids and not args.category and not args.limit:
        ap.error("specify --ids / --all / --category / --limit")

    print(f"selected {len(sel)} records → {OUT_BASE}")
    ok = 0
    fail = []
    for i, r in enumerate(sel, 1):
        try:
            html = fetch(r["source"])
            parsed = parse_case(html, r)
            path = write_case(r, parsed)
            ok += 1
            print(f"  [{i:>3}/{len(sel)}] {r['id']} → {path.relative_to(ROOT)}")
        except Exception as e:
            fail.append((r["id"], str(e)))
            print(f"  [{i:>3}/{len(sel)}] {r['id']} FAILED: {e}", file=sys.stderr)
        time.sleep(args.delay)
    print(f"\nDone: ok={ok} failed={len(fail)}")
    if fail:
        print("failures:")
        for cid, err in fail:
            print(f"  {cid}: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
