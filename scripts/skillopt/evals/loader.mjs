// evals/loader.mjs — discover и parse eval-кейсов.
//
// Структура:
//   skills/<skill-name>/evals/<case-id>.yaml
//
// Формат файла:
//   ---
//   type: eval-case
//   version: v0.1
//   skill: skill-ingest
//   grader: contains
//   tags: [regression, happy-path]
//   budget: { max_tokens: 8000, timeout_ms: 60000 }
//   pass_threshold: 0.8                # для llm-judge
//   ---
//   # Input
//   <текст промпта, поддержка {{file:relative/path.md}}>
//
//   # Expected
//   <блок ожиданий — зависит от grader'а>

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, dirname, relative } from "node:path";
import { KB_ROOT } from "../../lib/kb-root.mjs";
import { discoverSkills, assertSafePath, assertSkillName } from "../../lib/skills.mjs";
import yaml from "js-yaml";
import { z } from "zod";

export const REPO_ROOT = KB_ROOT;
export const SKILLS_DIR = join(REPO_ROOT, "skills");

const EvalCaseFrontmatterSchema = z.object({
  type: z.literal("eval-case"),
  version: z.string(),
  skill: z.string(),
  grader: z.enum(["contains", "label-presence", "json-schema", "llm-judge"]),
  tags: z.array(z.string()).optional().default([]),
  budget: z
    .object({
      max_tokens: z.number().int().positive().optional(),
      timeout_ms: z.number().int().positive().optional(),
    })
    .optional()
    .default({}),
  pass_threshold: z.number().min(0).max(1).optional(),
  owner: z.string().optional(),
  mandatory: z.boolean().optional().default(true),
});

const EvalCaseSchema = z.object({
  id: z.string(),
  path: z.string(),
  skill: z.string(),
  frontmatter: EvalCaseFrontmatterSchema,
  input: z.string(),
  expected: z.string(),
});

/**
 * Парсит один YAML-файл eval-кейса.
 */
export async function parseEvalCase(absPath, { root = REPO_ROOT, skill } = {}) {
  assertSafePath(root, absPath);
  const raw = (await readFile(absPath, "utf8")).replace(/\r\n/g, "\n");
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) {
    throw new Error(`[skillopt:loader] ${relative(REPO_ROOT, absPath)}: нет frontmatter (---...---)`);
  }
  let fm;
  try {
    fm = yaml.load(fmMatch[1]);
  } catch (e) {
    throw new Error(`[skillopt:loader] ${relative(REPO_ROOT, absPath)}: невалидный YAML — ${e.message}`);
  }
  const fmParsed = EvalCaseFrontmatterSchema.safeParse(fm);
  if (!fmParsed.success) {
    throw new Error(
      `[skillopt:loader] ${relative(REPO_ROOT, absPath)}: невалидный frontmatter — ${fmParsed.error.message}`,
    );
  }
  if (skill && fmParsed.data.skill !== skill) throw Error(`Eval skill mismatch: ${absPath}`);
  assertSkillName(fmParsed.data.skill);
  const body = fmMatch[2] ?? "";
  const sections = splitSections(body);
  if (!sections.Input?.trim()) {
    throw new Error(`[skillopt:loader] ${relative(REPO_ROOT, absPath)}: нет секции "# Input"`);
  }
  if (!sections.Expected?.trim()) {
    throw new Error(`[skillopt:loader] ${relative(REPO_ROOT, absPath)}: нет секции "# Expected"`);
  }

  // Раскрываем {{file:...}} интерполяцию в input
  const inputResolved = await interpolateFiles(sections.Input.trim(), dirname(absPath), root);

  const caseId = basename(absPath).replace(/\.ya?ml$/, "");
  assertSkillName(caseId);
  return EvalCaseSchema.parse({
    id: caseId,
    path: relative(root, absPath),
    skill: fmParsed.data.skill,
    frontmatter: fmParsed.data,
    input: inputResolved,
    expected: sections.Expected.trim(),
  });
}

function splitSections(body) {
  const out = {};
  const lines = body.split("\n");
  let current = null;
  let buf = [];
  for (const line of lines) {
    const m = line.match(/^#\s+(\S.*)$/);
    if (m) {
      if (current) out[current] = buf.join("\n");
      current = m[1].trim();
      buf = [];
    } else {
      buf.push(line);
    }
  }
  if (current) out[current] = buf.join("\n");
  return out;
}

async function interpolateFiles(text, baseDir, root) {
  const re = /\{\{file:([^}]+)\}\}/g;
  let out = "";
  let lastIdx = 0;
  for (const m of text.matchAll(re)) {
    out += text.slice(lastIdx, m.index);
    const rel = m[1].trim();
    // ищем относительно baseDir (директория самого eval-файла) с fallback _fixtures/
    const candidates = [
      join(baseDir, rel),
      join(baseDir, "_fixtures", rel),
      join(root, rel),
    ];
    const hit = candidates.find((p) => { assertSafePath(root, p); return existsSync(p); });
    if (!hit) {
      throw new Error(`[skillopt:loader] не найден файл фикстуры: ${rel} (пробовали ${candidates.join(" | ")})`);
    }
    out += await readFile(hit, "utf8");
    lastIdx = m.index + m[0].length;
  }
  out += text.slice(lastIdx);
  return out;
}

/** A directory loader is also used for prepared new-skill evals. */
export async function loadEvalDirectory(evalsDir, { root = REPO_ROOT, skill, caseFilter = null } = {}) {
  assertSkillName(skill);
  assertSafePath(root, evalsDir);
  if (!existsSync(evalsDir)) return [];
  const files = (await readdir(evalsDir)).filter(f => /\.ya?ml$/.test(f) && !f.startsWith('_')).sort();
  const out = [], seen = new Set();
  for (const file of files) {
    const id = basename(file).replace(/\.ya?ml$/, '');
    if (caseFilter && caseFilter !== id) continue;
    try {
      if (seen.has(id)) throw Error(`Duplicate eval case: ${skill}/${id}`);
      seen.add(id);
      out.push(await parseEvalCase(join(evalsDir, file), { root, skill }));
    } catch (error) { out.push({ id, skill, path: relative(root, join(evalsDir, file)), error: error.message }); }
  }
  return out;
}

export function requireSkills(root = REPO_ROOT) {
  const result = discoverSkills(root);
  if (result.errors.length) throw Error(result.errors.join('\n'));
  return result.skills;
}

export async function discoverEvals({ skillFilter = null, caseFilter = null, root = REPO_ROOT } = {}) {
  if (skillFilter) assertSkillName(skillFilter);
  const skills = requireSkills(root).filter(s => !skillFilter || s.name === skillFilter);
  const out = [];
  for (const skill of skills) {
    if (!skill.dir) continue;
    out.push(...await loadEvalDirectory(join(root, skill.dir, 'evals'), { root, skill: skill.name, caseFilter }));
  }
  return out;
}

export async function listSkillsWithEvals({ root = REPO_ROOT } = {}) {
  const out = [];
  for (const s of requireSkills(root)) {
    const cases = s.dir ? await loadEvalDirectory(join(root, s.dir, 'evals'), { root, skill: s.name }) : [];
    out.push({ skill: s.name, path: s.path, source: s.source, legacy: s.legacy, skillFileExists: true, caseCount: cases.length, errors: cases.filter(c => c.error).map(c => c.error) });
  }
  return out;
}

export async function readSkillFile(skillName, { root = REPO_ROOT } = {}) {
  assertSkillName(skillName);
  const skill = requireSkills(root).find(s => s.name === skillName);
  if (!skill) throw Error(`[skillopt:loader] skill file not found: ${skillName}`);
  return skill;
}
