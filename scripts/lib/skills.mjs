// Dependency-free skill ownership and path contract shared by clients and SkillOpt.
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, relative, join, sep, isAbsolute } from 'node:path';

export function assertSafePath(root, path) {
  root = resolve(root);
  const absolute = resolve(root, path);
  const rel = relative(root, absolute);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw Error(`Unsafe path: ${path}`);
  let cursor = root;
  for (const part of rel.split(sep)) {
    cursor = join(cursor, part);
    // lstat sees dangling symlinks too; existsSync does not.
    let stat;
    try { stat = lstatSync(cursor); } catch (e) { if (e.code === 'ENOENT') continue; throw e; }
    if (stat.isSymbolicLink()) throw Error(`Skill symlink not portable: ${relative(root, cursor)}`);
  }
  return absolute;
}

export function assertSkillName(name) {
  if (typeof name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) throw Error(`Unsafe skill name: ${name}`);
  return name;
}

// Skills use scalar name/description. Other metadata stays untouched, including
// legacy nested triggers; invalid required scalars fail closed.
export function validateSkillText(input, { name, legacy = false } = {}) {
  assertSkillName(name);
  let text = String(input).replace(/\r\n/g, '\n');
  let fm = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (text.startsWith('---') && !fm) throw Error(`Invalid skill frontmatter: ${name}`);
  const fields = fm ? parseFields(fm[1], name) : {};
  const missing = [];
  for (const key of ['name', 'description']) {
    if (!Object.hasOwn(fields, key)) {
      if (!legacy) throw Error(`Invalid skill frontmatter: missing ${key} in ${name}`);
      const value = key === 'name' ? name : `Project procedure ${name}; use when this procedure is requested.`;
      missing.push(`${key}: ${JSON.stringify(value)}`);
      fields[key] = JSON.stringify(value);
    }
    let value = fields[key];
    if (key === 'description' && /^[|>][+-]?$/.test(value)) {
      const lines = fm[1].split('\n'), start = lines.findIndex(line => /^description:/.test(line));
      const block = [];
      for (let i = start + 1; i < lines.length && (!lines[i].trim() || /^\s/.test(lines[i])); i++) block.push(lines[i].trim());
      value = block.join(' ').trim();
    } else if (value.startsWith('"')) {
      try { value = JSON.parse(value); } catch { throw Error(`Invalid skill metadata ${key}: ${name}`); }
    } else if (value.startsWith("'")) {
      if (!/^'(?:[^']|'')*'$/.test(value)) throw Error(`Invalid skill metadata ${key}: ${name}`);
      value = value.slice(1, -1).replace(/''/g, "'");
    } else if (/^[\[\]{}&*!|>]/.test(value) || /:\s/.test(value)) {
      throw Error(`Invalid skill metadata ${key}: ${name}; use a quoted scalar`);
    } else value = value.replace(/\s+#.*$/, '');
    if (typeof value !== 'string' || !value.trim() || /^(?:null|true|false|~)$/i.test(value)) throw Error(`Invalid skill metadata ${key}: ${name}`);
    if (key === 'name' && value !== name) throw Error(`Skill name mismatch: ${name} declares ${value}`);
  }
  if (missing.length) text = fm ? text.replace(/^---\n/, `---\n${missing.join('\n')}\n`) : `---\n${missing.join('\n')}\n---\n\n${text}`;
  if (!text.replace(/^---\n[\s\S]*?\n---/, '').trim()) throw Error(`Empty skill body: ${name}`);
  return text;
}

function parseFields(block, name) {
  const fields = {};
  for (const line of block.split('\n')) {
    if (!line.trim() || /^\s|^#/.test(line)) continue;
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:[ \t]+(.*)|[ \t]*)$/);
    if (!match || Object.hasOwn(fields, match[1])) throw Error(`Invalid skill metadata: ${name}`);
    fields[match[1]] = (match[2] ?? '').trim();
  }
  return fields;
}

export const SKILL_STATUSES = ['draft', 'verified', 'deprecated'];
// Optional lifecycle metadata. Absence means "not set"; an unknown value fails closed with a hint.
// Only `deprecated` has an effect: roles, workflows and profiles cannot reference it and clients do not receive it.
export function skillMetadata(input, { name } = {}) {
  const text = String(input).replace(/\r\n/g, '\n');
  const fm = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  const fields = fm ? parseFields(fm[1], name) : {};
  const scalar = value => value.replace(/^["']|["']$/g, '').replace(/\s+#.*$/, '').trim();
  const meta = { status: null, version: null };
  if (Object.hasOwn(fields, 'status')) {
    const status = scalar(fields.status);
    if (!SKILL_STATUSES.includes(status)) throw Error(`Invalid skill status "${status}" in ${name}; use one of ${SKILL_STATUSES.join(', ')}`);
    meta.status = status;
  }
  if (Object.hasOwn(fields, 'version')) {
    const version = scalar(fields.version);
    if (!/^[1-9][0-9]*$/.test(version)) throw Error(`Invalid skill version "${version}" in ${name}; use a positive integer`);
    meta.version = Number(version);
  }
  return meta;
}

export function discoverSkills(root) {
  const skills = [], errors = [], seen = new Set(), duplicates = new Set();
  function checkTree(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = assertSafePath(root, join(dir, entry.name));
      if (entry.isDirectory()) checkTree(path);
      else if (!entry.isFile()) throw Error(`Unsafe skill resource: ${relative(root, path)}`);
    }
  }
  for (const [base, source] of [['harness/skills', 'harness'], ['skills', 'project']]) {
    try {
      const absolute = assertSafePath(root, base);
      if (!existsSync(absolute)) continue;
      const entries = readdirSync(absolute, { withFileTypes: true });
      const names = new Set();
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name.startsWith('_') || entry.name === 'README.md') continue;
        if (entry.isSymbolicLink()) { errors.push(`Skill symlink not portable: ${base}/${entry.name}`); continue; }
        if (entry.isDirectory()) names.add(entry.name);
        else if (source === 'project' && entry.isFile() && entry.name.endsWith('.md')) names.add(entry.name.slice(0, -3));
      }
      for (const name of [...names].sort()) {
        try {
          assertSkillName(name);
          const dirPath = `${base}/${name}`, standard = `${dirPath}/SKILL.md`, flat = `${base}/${name}.md`;
          const hasStandard = existsSync(assertSafePath(root, standard));
          const hasFlat = source === 'project' && existsSync(assertSafePath(root, flat));
          if (hasFlat && hasStandard) throw Error(`Duplicate flat and standard skill: ${name}`);
          if (!hasFlat && !hasStandard) throw Error(`Missing SKILL.md: ${dirPath}`);
          if (seen.has(name)) { duplicates.add(name); throw Error(`Duplicate skill name: ${name}`); }
          seen.add(name);
          const dir = existsSync(join(root, dirPath)) ? dirPath : null;
          if (dir) checkTree(assertSafePath(root, dir));
          const path = hasFlat ? flat : standard;
          const text = validateSkillText(readFileSync(assertSafePath(root, path), 'utf8'), { name, legacy: hasFlat });
          const { status, version } = skillMetadata(text, { name });
          skills.push({ name, path, dir, source, legacy: hasFlat, text, status, version });
        } catch (e) { errors.push(e.message); }
      }
    } catch (e) { errors.push(e.message); }
  }
  return { skills: skills.filter(s => !duplicates.has(s.name)).sort((a, b) => a.name.localeCompare(b.name)), errors };
}
