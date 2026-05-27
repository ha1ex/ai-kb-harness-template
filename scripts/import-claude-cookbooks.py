#!/usr/bin/env python3
"""
Import anthropics/claude-cookbooks Jupyter notebooks → Markdown KB-docs.

ipynb cells:
  - markdown → kept as-is
  - code     → fenced ```python block
  - outputs  → dropped (notebook outputs are large/noisy and not portable)
"""
import json, pathlib, re, time, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / ".context" / "claude-cookbooks-src"
OUT = ROOT / "06_outputs" / "claude-cookbooks"
UPSTREAM_BASE = "https://github.com/anthropics/claude-cookbooks/blob/main"

# Most cookbook content = AI/ML engineering. Single category to keep things tidy.
DEFAULT_CATEGORY_FOLDER = "01-engineering-productivity"
DEFAULT_CATEGORY_LABEL = "Engineering productivity"

# Optional per-folder override (currently all → engineering productivity).
FOLDER_TO_CATEGORY = {
    # e.g. "multimodal": ("01-engineering-productivity", "Engineering productivity"),
}


def slugify(s: str, maxlen: int = 60) -> str:
    s = re.sub(r"[^\w\s-]", "", s, flags=re.U).strip().lower()
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:maxlen].strip("-")


def yaml_escape(v: str) -> str:
    s = (v or "").replace("\\", "\\\\").replace('"', '\\"')
    return f'"{s}"'


def first_sentence(s: str, maxlen: int = 200) -> str:
    if not s:
        return ""
    s = re.sub(r"\s+", " ", s).strip()
    cut = re.split(r"(?<=[.!?])\s", s, maxsplit=1)
    head = cut[0]
    if len(head) > maxlen:
        head = head[:maxlen - 3].rstrip() + "..."
    return head


def ipynb_to_md(nb_path: pathlib.Path) -> tuple[str, str, str]:
    """Return (title, subtitle, body_md)."""
    nb = json.loads(nb_path.read_text(encoding="utf-8"))
    title = ""
    subtitle = ""
    body_parts = []

    for cell in nb.get("cells", []):
        ctype = cell.get("cell_type", "")
        src = "".join(cell.get("source", []))
        if not src.strip():
            continue
        if ctype == "markdown":
            # First H1 → title
            if not title:
                m = re.search(r"^# +(.+)$", src, re.M)
                if m:
                    title = m.group(1).strip()
                    # remainder is subtitle if not yet set
                    rest = src[m.end():].strip()
                    if rest and not subtitle:
                        subtitle = first_sentence(rest)
                    src_render = re.sub(r"^# +.+\n+", "", src, count=1)
                    if src_render.strip():
                        body_parts.append(src_render.strip())
                    continue
            body_parts.append(src.strip())
        elif ctype == "code":
            lang = "python"
            body_parts.append(f"```{lang}\n{src.rstrip()}\n```")
        # raw/other → skip
    body_md = "\n\n".join(body_parts).strip() + "\n"
    if not title:
        title = nb_path.stem.replace("_", " ").title()
    if not subtitle:
        # Use first non-heading paragraph
        for part in body_parts:
            if not part.startswith("#") and not part.startswith("```"):
                subtitle = first_sentence(part)
                break
        if not subtitle:
            subtitle = title
    return title, subtitle, body_md


def category_for(folder: str) -> tuple[str, str]:
    return FOLDER_TO_CATEGORY.get(folder, (DEFAULT_CATEGORY_FOLDER, DEFAULT_CATEGORY_LABEL))


def main():
    if not SRC.exists():
        sys.exit(f"upstream not found: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)
    today = time.strftime("%Y-%m-%d")

    notebooks = sorted(SRC.rglob("*.ipynb"))
    print(f"discovered {len(notebooks)} notebooks")

    written = 0
    for idx, nb in enumerate(notebooks, 1):
        rel_from_src = nb.relative_to(SRC)
        upstream_folder = rel_from_src.parts[0]
        case_id = f"COB-{idx:03d}"
        try:
            title, subtitle, body = ipynb_to_md(nb)
        except Exception as e:
            print(f"  SKIP {case_id} {rel_from_src}: {e}")
            continue
        cat_folder, cat_label = category_for(upstream_folder)
        slug = slugify(nb.stem)
        path = OUT / cat_folder / f"{case_id}-{slug}.md"
        path.parent.mkdir(parents=True, exist_ok=True)

        source_url = f"{UPSTREAM_BASE}/{rel_from_src.as_posix()}"
        fm = [
            "---",
            f"id: {case_id}",
            f"tier: A",
            f"category: {yaml_escape(cat_label)}",
            f"kind: workflow",
            f"title: {yaml_escape(title)}",
            f"subtitle: {yaml_escape(subtitle)}",
            f"source: {source_url}",
            f"upstream_name: {yaml_escape(rel_from_src.as_posix())}",
            f"upstream_folder: {yaml_escape(upstream_folder)}",
            f"provider: anthropic-cookbooks",
            f"license: MIT",
            f"license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE",
            f"ingested: {today}",
            f"type: case",
            f"version: v0.1",
            "---",
            "",
        ]
        content = "\n".join(fm) + f"# {title}\n\n> {subtitle}\n\n{body}"
        path.write_text(content, encoding="utf-8")
        written += 1

    print(f"\ndone: {written} notebooks imported")


if __name__ == "__main__":
    main()
