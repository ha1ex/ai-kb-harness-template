#!/usr/bin/env python3
"""
Import Apache-2.0 skills from anthropics/skills (cloned to .context/anthropics-skills-src/)
into 06_outputs/anthropics-skills/ as KB-documents under our schema.

Skips source-available (docx/pdf/pptx/xlsx) and the un-licensed doc-coauthoring.
"""
import pathlib, re, time, sys, html as H

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / ".context" / "anthropics-skills-src" / "skills"
OUT = ROOT / "06_outputs" / "anthropics-skills"
UPSTREAM_BASE = "https://github.com/anthropics/skills/blob/main/skills"

# id, category-folder, kind=skill (all upstream are kind=skill).
ASSIGNMENT = [
    # 01-engineering-productivity
    ("ANT-001", "claude-api",            "01-engineering-productivity"),
    ("ANT-002", "mcp-builder",           "01-engineering-productivity"),
    ("ANT-003", "skill-creator",         "01-engineering-productivity"),
    ("ANT-004", "web-artifacts-builder", "01-engineering-productivity"),
    ("ANT-005", "webapp-testing",        "01-engineering-productivity"),
    # 06-operations
    ("ANT-006", "internal-comms",        "06-operations"),
    ("ANT-007", "slack-gif-creator",     "06-operations"),
    # 12-design (NEW)
    ("ANT-008", "algorithmic-art",       "12-design"),
    ("ANT-009", "brand-guidelines",      "12-design"),
    ("ANT-010", "canvas-design",         "12-design"),
    ("ANT-011", "frontend-design",       "12-design"),
    ("ANT-012", "theme-factory",         "12-design"),
]

CATEGORY_LABEL = {
    "01-engineering-productivity": "Engineering productivity",
    "06-operations":               "Operations",
    "12-design":                   "Design",
}


def slugify(s: str, maxlen: int = 60) -> str:
    s = re.sub(r"[^\w\s-]", "", s, flags=re.U).strip().lower()
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:maxlen].strip("-")


def parse_frontmatter(text: str):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.S)
    if not m:
        return {}, text
    fm_raw, body = m.group(1), m.group(2)
    fm = {}
    cur_key = None
    for line in fm_raw.splitlines():
        if not line.strip():
            continue
        # support multi-line string continuation (line starts with space)
        if cur_key and (line.startswith(" ") or line.startswith("\t")):
            fm[cur_key] += " " + line.strip()
            continue
        km = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if km:
            cur_key = km.group(1)
            val = km.group(2).strip()
            # strip surrounding quotes
            if val.startswith('"') and val.endswith('"'):
                val = val[1:-1]
            fm[cur_key] = val
    return fm, body


def first_h1(body: str) -> str:
    m = re.search(r"^# +(.+?)$", body, re.M)
    return m.group(1).strip() if m else ""


def yaml_escape(v: str) -> str:
    s = (v or "").replace("\\", "\\\\").replace('"', '\\"')
    return f'"{s}"'


def main():
    if not SRC.exists():
        sys.exit(f"upstream source not found: {SRC}\nRun: git clone --depth=1 https://github.com/anthropics/skills.git .context/anthropics-skills-src")

    OUT.mkdir(parents=True, exist_ok=True)
    today = time.strftime("%Y-%m-%d")

    written = []
    for case_id, upstream_name, cat_folder in ASSIGNMENT:
        skill_md = SRC / upstream_name / "SKILL.md"
        if not skill_md.exists():
            print(f"  SKIP {case_id}: {skill_md} not found")
            continue

        raw = skill_md.read_text(encoding="utf-8")
        fm, body = parse_frontmatter(raw)

        upstream_descr = fm.get("description", "").strip()
        title = first_h1(body) or fm.get("name", upstream_name).replace("-", " ").title()
        # subtitle = first sentence of description (truncated)
        subtitle = upstream_descr.split(". ")[0].rstrip(".") if upstream_descr else title
        if len(subtitle) > 220:
            subtitle = subtitle[:217] + "..."

        # license per-skill: Apache 2.0 for all assigned here (filtered upstream)
        license_url = f"{UPSTREAM_BASE}/{upstream_name}/LICENSE.txt"
        source_url = f"{UPSTREAM_BASE}/{upstream_name}/SKILL.md"

        # body cleanup: strip leading frontmatter (already done), keep first h1 → make it ours
        # body already without frontmatter; we'll prepend our own title block
        body_clean = body.lstrip()
        # remove the original h1 (we'll print it ourselves once)
        body_clean = re.sub(r"^# +.+?\n+", "", body_clean, count=1)

        slug = slugify(upstream_name)
        path = OUT / cat_folder / f"{case_id}-{slug}.md"
        path.parent.mkdir(parents=True, exist_ok=True)

        fm_out = [
            "---",
            f"id: {case_id}",
            f"tier: A",
            f"category: {yaml_escape(CATEGORY_LABEL[cat_folder])}",
            f"kind: skill",
            f"title: {yaml_escape(title)}",
            f"subtitle: {yaml_escape(subtitle)}",
            f"source: {source_url}",
            f"upstream_name: {yaml_escape(upstream_name)}",
            f"upstream_description: {yaml_escape(upstream_descr)}",
            f"provider: anthropic",
            f"license: Apache-2.0",
            f"license_source: {license_url}",
            f"ingested: {today}",
            f"type: case",
            f"version: v0.1",
            "---",
            "",
        ]
        content = "\n".join(fm_out) + f"# {title}\n\n> {subtitle}\n\n{body_clean.strip()}\n"
        path.write_text(content, encoding="utf-8")
        written.append((case_id, upstream_name, cat_folder, path))
        print(f"  WROTE {case_id} {upstream_name:25s} → {path.relative_to(ROOT)}")

    print(f"\nimported {len(written)} skills")


if __name__ == "__main__":
    main()
