#!/usr/bin/env python3
"""
Create reference-only cards for the 4 source-available skills from
anthropics/skills (docx/pdf/pptx/xlsx). These are © Anthropic, all-rights-reserved
in this repo's License terms — we CANNOT copy the body. But we can:

  - Record their existence (so search finds them)
  - Copy the upstream `description` field verbatim (this is metadata, fair-use)
  - Point users to upstream for full content

ID scheme: ANT-013..ANT-016. kind=reference, license=source-available.
"""
import pathlib, re, time, html as H

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / ".context" / "anthropics-skills-src" / "skills"
OUT = ROOT / "06_outputs" / "anthropics-skills" / "01-engineering-productivity"
UPSTREAM_BASE = "https://github.com/anthropics/skills/blob/main/skills"

ASSIGNMENT = [
    ("ANT-013", "docx", "DOCX (Microsoft Word) creation, editing, and analysis"),
    ("ANT-014", "pdf",  "PDF processing — extract, merge, split, OCR, fill forms"),
    ("ANT-015", "pptx", "PPTX (PowerPoint) — create, read, edit slide decks"),
    ("ANT-016", "xlsx", "XLSX (Excel) — read, edit, create spreadsheets with formulas"),
]


def parse_fm(text: str):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    if not m:
        return {}
    fm = {}
    cur = None
    for line in m.group(1).splitlines():
        if not line.strip():
            continue
        if cur and (line.startswith(" ") or line.startswith("\t")):
            fm[cur] += " " + line.strip()
            continue
        km = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if km:
            cur = km.group(1)
            v = km.group(2).strip()
            if v.startswith('"') and v.endswith('"'):
                v = v[1:-1]
            fm[cur] = v
    return fm


def yaml_escape(v: str) -> str:
    s = (v or "").replace("\\", "\\\\").replace('"', '\\"')
    return f'"{s}"'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    today = time.strftime("%Y-%m-%d")
    for case_id, name, title in ASSIGNMENT:
        upstream_md = SRC / name / "SKILL.md"
        if not upstream_md.exists():
            print(f"  SKIP {case_id}: {upstream_md} not found")
            continue
        fm = parse_fm(upstream_md.read_text(encoding="utf-8"))
        upstream_descr = fm.get("description", "").strip()

        source_url = f"{UPSTREAM_BASE}/{name}/SKILL.md"
        license_url = f"{UPSTREAM_BASE}/{name}/LICENSE.txt"

        # Subtitle = first sentence of upstream description (trigger-rich).
        cut = re.split(r"(?<=[.!?])\s", upstream_descr, maxsplit=1)
        subtitle = cut[0] if cut else title
        if len(subtitle) > 220:
            subtitle = subtitle[:217] + "..."

        body = f"""## What

**Reference-only card.** This skill exists in the upstream Anthropic repo but is
**source-available, not open source** — we cannot redistribute the body in this KB.
See `{source_url}` for the canonical implementation.

## When to use

> {upstream_descr}

## How to access

1. Clone the upstream repo:
   ```bash
   git clone --depth=1 https://github.com/anthropics/skills.git
   ```
2. Use the skill in Claude Code by installing the Anthropic plugin marketplace:
   ```
   /plugin marketplace add anthropics/skills
   /plugin install document-skills@anthropic-agent-skills
   ```
3. Or read the upstream SKILL.md directly: [{name}/SKILL.md]({source_url})

## License

**Source-available.** Copyright © 2025 Anthropic, PBC. All rights reserved.
Terms: [{name}/LICENSE.txt]({license_url}).

Allowed: reading the source for reference / inspiration.
NOT allowed: copying, redistributing, commercial use in derivative skills.
"""
        fm_out = [
            "---",
            f"id: {case_id}",
            "tier: A",
            f'category: "Engineering productivity"',
            "kind: reference",
            f"title: {yaml_escape(title)}",
            f"subtitle: {yaml_escape(subtitle)}",
            f"source: {source_url}",
            f"upstream_name: {yaml_escape(name)}",
            f"upstream_description: {yaml_escape(upstream_descr)}",
            "provider: anthropic",
            "license: source-available",
            f"license_source: {license_url}",
            f"ingested: {today}",
            "type: case",
            "version: v0.1",
            "---",
            "",
        ]
        path = OUT / f"{case_id}-{name}.md"
        path.write_text("\n".join(fm_out) + f"# {title}\n\n> {subtitle}\n\n{body}\n", encoding="utf-8")
        print(f"  WROTE {case_id} {name} → {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
