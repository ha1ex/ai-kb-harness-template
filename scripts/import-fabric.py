#!/usr/bin/env python3
"""
Import danielmiessler/fabric patterns into 06_outputs/fabric-patterns/.

Strategy:
1. Read all 255 patterns from .context/fabric-src/data/patterns/<name>/system.md
2. Auto-categorize via keyword-rules → 11 cybos categories + 12-design + 13-cybersecurity
3. Drop noise: spiritual, gaming, gimmick, utilities, personal-non-business
4. Parse # IDENTITY / # STEPS / # OUTPUT INSTRUCTIONS → our ## What / ## End-to-end / ## Tools
5. Write to 06_outputs/fabric-patterns/<category>/FAB-NNN-<slug>.md

ID scheme: FAB-001..FAB-NNN (assigned in alphabetical order of imported patterns).
License: MIT (per repo LICENSE), source: github.com/danielmiessler/fabric/blob/main/data/patterns/<name>/system.md
"""
import pathlib, re, time, sys, html as H
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / ".context" / "fabric-src" / "data" / "patterns"
OUT = ROOT / "06_outputs" / "fabric-patterns"
UPSTREAM_BASE = "https://github.com/danielmiessler/fabric/blob/main/data/patterns"

CATEGORY_LABEL = {
    "01-engineering-productivity": "Engineering productivity",
    "02-marketing-content":        "Marketing & content",
    "03-strategy-leadership":      "Strategy & leadership",
    "04-infrastructure":           "Infrastructure",
    "05-sales-outbound":           "Sales & outbound",
    "06-operations":               "Operations",
    "07-knowledge-management":     "Knowledge management",
    "08-hr-hiring":                "HR & hiring",
    "09-founder-productivity":     "Founder productivity",
    "10-customer-success":         "Customer success",
    "11-data-bi":                  "Data & BI",
    "12-design":                   "Design",
    "13-cybersecurity":            "Cybersecurity",
}

# Explicit drop list — patterns we don't want in the KB regardless of category.
DROP = {
    # Spiritual/wellness/personal
    "analyze_spiritual_text", "find_female_life_partner", "heal_person",
    "detect_silent_victims", "detect_mind_virus", "recommend_yoga_practice",
    "recommend_artists",
    # Gimmicks / character roleplay
    "ask_uncle_duke", "model_as_sherlock_freud", "dialog_with_socrates",
    "find_hidden_message", "get_wow_per_minute",
    # Gaming
    "create_npc", "summarize_rpg_session", "create_rpg_summary",
    "extract_song_meaning",
    # Narrow niche
    "analyze_military_strategy", "write_latex",
    "extract_videoid",
    # Plain utilities (not "skills" — just text transforms)
    "ai", "sanitize_broken_html_to_markdown", "clean_text", "convert_to_markdown",
    "raw_query", "fix_typos", "apply_ul_tags", "md_callout", "translate",
    "export_data_as_csv", "to_flashcards",  # subset of create_flash_cards
    # Meta-template / readme
    "pattern_explanations.md", "official_pattern_template",
}

# Explicit per-pattern category overrides (highest priority).
# Use when the rule-based mapping would be wrong.
EXPLICIT = {
    # Engineering productivity
    "explain_code": "01-engineering-productivity",
    "explain_docs": "01-engineering-productivity",
    "explain_project": "01-engineering-productivity",
    "explain_terms_and_conditions": "07-knowledge-management",
    "coding_master": "01-engineering-productivity",
    "review_code": "01-engineering-productivity",
    "create_coding_feature": "01-engineering-productivity",
    "create_coding_project": "01-engineering-productivity",
    "create_command": "01-engineering-productivity",
    "create_git_diff_commit": "01-engineering-productivity",
    "summarize_git_changes": "01-engineering-productivity",
    "summarize_git_diff": "01-engineering-productivity",
    "summarize_pull-requests": "01-engineering-productivity",
    "write_pull-request": "01-engineering-productivity",
    "generate_code_rules": "01-engineering-productivity",
    "suggest_pattern": "01-engineering-productivity",
    "suggest_gt_command": "01-engineering-productivity",
    "suggest_openclaw_pattern": "01-engineering-productivity",
    "refine_design_document": "01-engineering-productivity",
    "review_design": "01-engineering-productivity",
    "create_design_document": "01-engineering-productivity",
    "recommend_pipeline_upgrade": "01-engineering-productivity",
    "create_upgrade_pack": "01-engineering-productivity",
    "analyze_terraform_plan": "04-infrastructure",
    "create_prd": "01-engineering-productivity",
    "create_loe_document": "01-engineering-productivity",
    "create_pattern": "01-engineering-productivity",
    "create_bd_issue": "01-engineering-productivity",
    "create_user_story": "01-engineering-productivity",
    "extract_mcp_servers": "01-engineering-productivity",
    "extract_algorithm_update_analysis": "01-engineering-productivity",
    "improve_prompt": "01-engineering-productivity",
    "rate_ai_response": "01-engineering-productivity",
    "rate_ai_result": "01-engineering-productivity",
    "judge_output": "01-engineering-productivity",
    "summarize_prompt": "01-engineering-productivity",

    # Marketing & content
    "write_essay": "02-marketing-content",
    "write_essay_pg": "02-marketing-content",
    "write_micro_essay": "02-marketing-content",
    "create_academic_paper": "02-marketing-content",
    "create_aphorisms": "02-marketing-content",
    "create_keynote": "02-marketing-content",
    "create_newsletter_entry": "02-marketing-content",
    "create_show_intro": "02-marketing-content",
    "create_slides": "02-marketing-content",
    "create_video_chapters": "02-marketing-content",
    "extract_video_commerce_entities": "02-marketing-content",
    "analyze_prose": "02-marketing-content",
    "analyze_prose_json": "02-marketing-content",
    "analyze_prose_pinker": "02-marketing-content",
    "improve_writing": "02-marketing-content",
    "improve_academic_writing": "02-marketing-content",
    "improve_report_finding": "02-marketing-content",
    "humanize": "02-marketing-content",
    "tweet": "02-marketing-content",
    "create_story_about_people": "02-marketing-content",
    "create_story_about_person": "02-marketing-content",
    "create_story_explanation": "02-marketing-content",
    "enrich_blog_post": "02-marketing-content",
    "extract_sponsors": "02-marketing-content",
    "extract_affiliate_products": "02-marketing-content",
    "extract_latest_video": "02-marketing-content",
    "create_art_prompt": "02-marketing-content",
    "create_hormozi_offer": "05-sales-outbound",

    # Strategy & leadership
    "prepare_7s_strategy": "03-strategy-leadership",
    "analyze_proposition": "03-strategy-leadership",
    "analyze_tech_impact": "03-strategy-leadership",
    "analyze_risk": "03-strategy-leadership",
    "analyze_debate": "03-strategy-leadership",
    "summarize_debate": "03-strategy-leadership",
    "create_prediction_block": "03-strategy-leadership",
    "extract_predictions": "03-strategy-leadership",
    "analyze_monetization_opportunities": "03-strategy-leadership",
    "analyze_answers": "03-strategy-leadership",
    "identify_dsrp_distinctions": "03-strategy-leadership",
    "identify_dsrp_perspectives": "03-strategy-leadership",
    "identify_dsrp_relationships": "03-strategy-leadership",
    "identify_dsrp_systems": "03-strategy-leadership",
    "create_idea_compass": "03-strategy-leadership",
    "create_better_frame": "03-strategy-leadership",
    "create_golden_rules": "03-strategy-leadership",
    "extract_business_ideas": "03-strategy-leadership",
    "extract_bd_ideas": "03-strategy-leadership",
    "create_ai_jobs_analysis": "03-strategy-leadership",
    "ultimate_law_safety": "03-strategy-leadership",
    "analyze_mistakes": "03-strategy-leadership",
    "compare_and_contrast": "03-strategy-leadership",
    "check_agreement": "03-strategy-leadership",
    "check_falsifiability": "07-knowledge-management",

    # Sales & outbound
    "analyze_sales_call": "05-sales-outbound",
    "create_formal_email": "05-sales-outbound",
    "analyze_email_headers": "13-cybersecurity",

    # Operations
    "summarize_meeting": "06-operations",
    "summarize_board_meeting": "06-operations",
    "transcribe_minutes": "06-operations",
    "concall_summary": "06-operations",
    "agility_story": "06-operations",
    "audit_consent": "06-operations",
    "audit_transparency": "06-operations",
    "analyze_incident": "06-operations",
    "analyze_bill": "06-operations",
    "analyze_bill_short": "06-operations",
    "extract_main_activities": "06-operations",
    "analyze_discord_structure": "06-operations",
    "analyze_comments": "06-operations",
    "summarize_legislation": "06-operations",

    # Knowledge management
    "extract_wisdom": "07-knowledge-management",
    "extract_wisdom_dm": "07-knowledge-management",
    "extract_wisdom_nometa": "07-knowledge-management",
    "extract_wisdom_with_attribution": "07-knowledge-management",
    "extract_wisdom_agents": "07-knowledge-management",
    "extract_article_wisdom": "07-knowledge-management",
    "capture_thinkers_work": "07-knowledge-management",
    "analyze_paper": "07-knowledge-management",
    "analyze_paper_simple": "07-knowledge-management",
    "summarize_paper": "07-knowledge-management",
    "summarize_lecture": "07-knowledge-management",
    "summarize_newsletter": "07-knowledge-management",
    "summarize_micro": "07-knowledge-management",
    "summarize": "07-knowledge-management",
    "create_summary": "07-knowledge-management",
    "create_5_sentence_summary": "07-knowledge-management",
    "create_micro_summary": "07-knowledge-management",
    "create_recursive_outline": "07-knowledge-management",
    "create_flash_cards": "07-knowledge-management",
    "create_mnemonic_phrases": "07-knowledge-management",
    "create_reading_plan": "07-knowledge-management",
    "create_quiz": "07-knowledge-management",
    "create_tags": "07-knowledge-management",
    "extract_book_ideas": "07-knowledge-management",
    "extract_book_recommendations": "07-knowledge-management",
    "extract_main_idea": "07-knowledge-management",
    "extract_core_message": "07-knowledge-management",
    "extract_insights": "07-knowledge-management",
    "extract_insights_dm": "07-knowledge-management",
    "extract_ideas": "07-knowledge-management",
    "extract_all_quotes": "07-knowledge-management",
    "extract_references": "07-knowledge-management",
    "extract_patterns": "07-knowledge-management",
    "extract_recommendations": "07-knowledge-management",
    "extract_questions": "07-knowledge-management",
    "extract_characters": "07-knowledge-management",
    "extract_jokes": "07-knowledge-management",
    "extract_recipe": "07-knowledge-management",
    "extract_controversial_ideas": "07-knowledge-management",
    "extract_primary_problem": "07-knowledge-management",
    "extract_primary_solution": "07-knowledge-management",
    "extract_extraordinary_claims": "07-knowledge-management",
    "extract_ethical_framework": "07-knowledge-management",
    "extract_most_redeeming_thing": "07-knowledge-management",
    "extract_product_features": "07-knowledge-management",
    "extract_alpha": "07-knowledge-management",
    "extract_domains": "07-knowledge-management",
    "extract_instructions": "07-knowledge-management",
    "extract_skills": "08-hr-hiring",
    "analyze_claims": "07-knowledge-management",
    "find_logical_fallacies": "07-knowledge-management",
    "rate_content": "07-knowledge-management",
    "rate_value": "07-knowledge-management",
    "label_and_rate": "07-knowledge-management",
    "youtube_summary": "07-knowledge-management",
    "create_video_chapters_summary": "07-knowledge-management",
    "create_report_finding": "07-knowledge-management",
    "analyze_presentation": "07-knowledge-management",
    "analyze_cfp_submission": "08-hr-hiring",

    # HR & hiring
    "analyze_candidates": "08-hr-hiring",
    "analyze_interviewer_techniques": "08-hr-hiring",
    "answer_interview_question": "08-hr-hiring",
    "identify_job_stories": "08-hr-hiring",
    "analyze_personality": "08-hr-hiring",
    "predict_person_actions": "08-hr-hiring",

    # Founder productivity (Tony Robbins coaching patterns prefixed t_)
    "t_year_in_review": "09-founder-productivity",
    "t_check_dunning_kruger": "09-founder-productivity",
    "t_describe_life_outlook": "09-founder-productivity",
    "t_find_blindspots": "09-founder-productivity",
    "t_find_negative_thinking": "09-founder-productivity",
    "t_find_neglected_goals": "09-founder-productivity",
    "t_give_encouragement": "09-founder-productivity",
    "t_red_team_thinking": "09-founder-productivity",
    "t_create_h3_career": "09-founder-productivity",
    "t_analyze_challenge_handling": "09-founder-productivity",
    "t_visualize_mission_goals": "09-founder-productivity",
    "t_threat_model_plans": "09-founder-productivity",
    "t_check_metrics": "09-founder-productivity",
    "t_create_opening_sentence": "09-founder-productivity",
    "t_extract_intro_sentences": "09-founder-productivity",
    "t_extract_panel_topics": "09-founder-productivity",
    "provide_guidance": "09-founder-productivity",

    # Customer success
    "analyze_product_feedback": "10-customer-success",

    # Data & BI
    "create_graph_from_input": "11-data-bi",
    "create_visualization": "11-data-bi",
    "create_excalidraw_visualization": "11-data-bi",
    "create_markmap_visualization": "11-data-bi",
    "create_mermaid_visualization": "11-data-bi",
    "create_mermaid_visualization_for_github": "11-data-bi",
    "create_conceptmap": "11-data-bi",
    "create_investigation_visualization": "11-data-bi",

    # Design
    "create_design_system": "12-design",
    "create_logo": "12-design",
    "create_diy": "12-design",

    # Cybersecurity (NEW category)
    "analyze_malware": "13-cybersecurity",
    "analyze_logs": "13-cybersecurity",
    "analyze_threat_report": "13-cybersecurity",
    "analyze_threat_report_cmds": "13-cybersecurity",
    "analyze_threat_report_trends": "13-cybersecurity",
    "create_cyber_summary": "13-cybersecurity",
    "create_security_update": "13-cybersecurity",
    "create_sigma_rules": "13-cybersecurity",
    "create_network_threat_landscape": "13-cybersecurity",
    "create_stride_threat_model": "13-cybersecurity",
    "create_threat_scenarios": "13-cybersecurity",
    "create_ttrc_graph": "13-cybersecurity",
    "create_ttrc_narrative": "13-cybersecurity",
    "extract_ctf_writeup": "13-cybersecurity",
    "extract_poc": "13-cybersecurity",
    "ask_secure_by_design_questions": "13-cybersecurity",
    "write_hackerone_report": "13-cybersecurity",
    "write_semgrep_rule": "13-cybersecurity",
    "write_nuclei_template_rules": "13-cybersecurity",
    "greybeard_secure_prompt_eval": "13-cybersecurity",

    # Anything left → 07-knowledge-management as default for extract_* / analyze_*
}


def categorize(name: str) -> str:
    """Return category folder or 'DROP' for unwanted patterns."""
    if name in DROP:
        return "DROP"
    if name in EXPLICIT:
        return EXPLICIT[name]
    # Fallback heuristics
    if name.startswith("extract_") or name.startswith("create_") or name.startswith("analyze_") \
            or name.startswith("summarize_") or name.startswith("rate_") \
            or name.startswith("identify_"):
        return "07-knowledge-management"
    if name.startswith("write_"):
        return "02-marketing-content"
    if name.startswith("t_"):
        return "09-founder-productivity"
    # Unknown — drop to be safe (will print warning)
    return "DROP"


def slugify(s: str, maxlen: int = 60) -> str:
    s = re.sub(r"[^\w\s-]", "", s, flags=re.U).strip().lower()
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:maxlen].strip("-")


def yaml_escape(v: str) -> str:
    s = (v or "").replace("\\", "\\\\").replace('"', '\\"')
    return f'"{s}"'


def parse_pattern(text: str):
    """Parse fabric system.md into structured sections.

    Recognizes (case-insensitive, # or ##):
      IDENTITY [and PURPOSE]
      PURPOSE / GOALS / GOAL
      STEPS / STEP
      INPUT
      OUTPUT / OUTPUT FORMAT
      OUTPUT INSTRUCTIONS / INSTRUCTIONS
      EXAMPLE / EXAMPLES
    """
    sections = {}
    cur = None
    buf = []
    for line in text.splitlines():
        m = re.match(r"^#+\s+(.+?)\s*$", line)
        if m:
            if cur is not None:
                sections[cur] = "\n".join(buf).strip()
            header = m.group(1).upper()
            # Normalize
            if "IDENTITY" in header:
                cur = "IDENTITY"
            elif header in ("PURPOSE", "GOALS", "GOAL"):
                cur = "PURPOSE"
            elif header in ("STEPS", "STEP"):
                cur = "STEPS"
            elif header == "INPUT":
                cur = "INPUT"
            elif "OUTPUT INSTRUCTIONS" in header or header == "INSTRUCTIONS":
                cur = "OUTPUT_INSTRUCTIONS"
            elif "OUTPUT" in header:
                cur = "OUTPUT"
            elif "EXAMPLE" in header:
                cur = "EXAMPLE"
            else:
                cur = "_other_" + header
            buf = []
        else:
            if cur:
                buf.append(line)
    if cur is not None:
        sections[cur] = "\n".join(buf).strip()
    return sections


def first_sentence(s: str, maxlen: int = 200) -> str:
    if not s:
        return ""
    s = re.sub(r"\s+", " ", s).strip()
    cut = re.split(r"(?<=[.!?])\s", s, maxsplit=1)
    head = cut[0]
    if len(head) > maxlen:
        head = head[:maxlen - 3].rstrip() + "..."
    return head


def render_body(name: str, sections: dict) -> str:
    title = name.replace("_", " ").replace("-", " ").title()
    parts = []
    what = sections.get("IDENTITY", "")
    why = sections.get("PURPOSE", "")
    steps = sections.get("STEPS", "")
    out_inst = sections.get("OUTPUT_INSTRUCTIONS", "")
    out = sections.get("OUTPUT", "")
    example = sections.get("EXAMPLE", "")
    inp = sections.get("INPUT", "")

    if what:
        parts.append("## What\n\n" + what)
    if why:
        parts.append("## Why it matters\n\n" + why)
    if steps:
        parts.append("## End-to-end\n\n" + steps)
    if out or out_inst:
        body = ""
        if out:
            body += out
        if out_inst:
            body += ("\n\n" if body else "") + "### Output instructions\n\n" + out_inst
        parts.append("## Tools\n\n" + body)
    if inp:
        parts.append("### Input\n\n" + inp)
    if example:
        parts.append("### Example\n\n" + example)
    return "\n\n".join(parts).strip() + "\n"


def main():
    if not SRC.exists():
        sys.exit(f"upstream not found: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)
    today = time.strftime("%Y-%m-%d")

    all_names = sorted(p.name for p in SRC.iterdir() if p.is_dir())
    print(f"discovered {len(all_names)} patterns")

    by_cat = defaultdict(list)
    dropped = []
    unknown = []
    for nm in all_names:
        cat = categorize(nm)
        if cat == "DROP":
            dropped.append(nm)
            continue
        if cat not in CATEGORY_LABEL:
            unknown.append(nm)
            continue
        by_cat[cat].append(nm)

    total_keep = sum(len(v) for v in by_cat.values())
    print(f"  → {total_keep} keep / {len(dropped)} drop / {len(unknown)} unknown\n")
    for cat in sorted(by_cat):
        print(f"  {cat:30s} {len(by_cat[cat]):3d}")
    if unknown:
        print(f"  UNKNOWN: {unknown}")

    # Assign IDs FAB-001..NNN in alphabetical order of pattern name.
    keepers = []
    for cat in CATEGORY_LABEL:
        for nm in sorted(by_cat.get(cat, [])):
            keepers.append((nm, cat))
    print(f"\nwriting {len(keepers)} patterns to {OUT.relative_to(ROOT)}...")

    written = 0
    for idx, (nm, cat) in enumerate(keepers, 1):
        case_id = f"FAB-{idx:03d}"
        src_md = SRC / nm / "system.md"
        if not src_md.exists():
            print(f"  SKIP {case_id} {nm}: no system.md")
            continue
        raw = src_md.read_text(encoding="utf-8", errors="replace")
        sections = parse_pattern(raw)

        title = nm.replace("_", " ").title()
        # subtitle = first sentence of IDENTITY (or PURPOSE)
        subtitle = first_sentence(sections.get("IDENTITY", "") or sections.get("PURPOSE", "") or title)

        body = render_body(nm, sections)
        slug = slugify(nm)
        path = OUT / cat / f"{case_id}-{slug}.md"
        path.parent.mkdir(parents=True, exist_ok=True)

        fm = [
            "---",
            f"id: {case_id}",
            f"tier: B",
            f"category: {yaml_escape(CATEGORY_LABEL[cat])}",
            f"kind: pattern",
            f"title: {yaml_escape(title)}",
            f"subtitle: {yaml_escape(subtitle)}",
            f"source: {UPSTREAM_BASE}/{nm}/system.md",
            f"upstream_name: {yaml_escape(nm)}",
            f"provider: fabric",
            f"license: MIT",
            f"license_source: https://github.com/danielmiessler/fabric/blob/main/LICENSE",
            f"ingested: {today}",
            f"type: case",
            f"version: v0.1",
            "---",
            "",
        ]
        content = "\n".join(fm) + f"# {title}\n\n> {subtitle}\n\n{body}"
        path.write_text(content, encoding="utf-8")
        written += 1

    print(f"\ndone: {written} patterns imported")
    if dropped:
        print(f"\ndropped ({len(dropped)}):")
        for d in dropped:
            print(f"  - {d}")


if __name__ == "__main__":
    main()
