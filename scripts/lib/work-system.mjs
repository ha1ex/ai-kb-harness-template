// Portable work contracts. No model calls; project profiles are opt-in.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { discoverSkills, assertSafePath } from './skills.mjs';

export const PROFILE_PATH = '00_context/work-system.json';
const ID = /^[a-z][a-z0-9-]*$/;
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
function strings(value, label, { allowEmpty = true } = {}) {
  if (!Array.isArray(value) || value.some(x => !nonempty(x)) || (!allowEmpty && !value.length)) throw Error(`${label} must be an array of nonempty strings`);
}
function roleContract(role, id) {
  if (!object(role) || role.id !== id || !ID.test(id) || !nonempty(role.title) || !nonempty(role.purpose)) throw Error(`Invalid role contract: ${id}`);
  for (const field of ['inputs','outputs','skills','requiredContext','optionalContext','boundaries','qualityCriteria']) strings(role[field], `Role ${id}.${field}`, {allowEmpty: !['inputs','outputs','qualityCriteria'].includes(field)});
}
function workflowContract(workflow, id) {
  if (!object(workflow) || workflow.id !== id || !ID.test(id) || !nonempty(workflow.title) || !Array.isArray(workflow.stages) || !workflow.stages.length) throw Error(`Invalid workflow contract: ${id}`);
  const seen = new Set();
  for (const stage of workflow.stages) {
    if (!object(stage) || !ID.test(stage.id) || seen.has(stage.id) || !nonempty(stage.title) || !ID.test(stage.role)) throw Error(`Invalid or duplicate stage in ${id}`);
    seen.add(stage.id);
    strings(stage.skills, `Stage ${id}/${stage.id}.skills`);
    strings(stage.requiredArtifacts, `Stage ${id}/${stage.id}.requiredArtifacts`, {allowEmpty:false});
    if (new Set(stage.requiredArtifacts).size !== stage.requiredArtifacts.length) throw Error(`Duplicate required artifact: ${id}/${stage.id}`);
    for (const field of ['requiresReview','requiresApproval']) if (stage[field] !== undefined && typeof stage[field] !== 'boolean') throw Error(`Stage ${id}/${stage.id}.${field} must be boolean`);
  }
}
function definitions(root, dir, validate) {
  const out = {};
  const abs = assertSafePath(root, dir);
  if (!existsSync(abs)) return out;
  for (const name of readdirSync(abs).filter(x => x.endsWith('.json')).sort()) {
    const id = name.slice(0,-5);
    const value = JSON.parse(readFileSync(assertSafePath(root, `${dir}/${name}`), 'utf8'));
    validate(value,id);
    out[id]=value;
  }
  return out;
}
export function validateProfile(profile) {
  if (!object(profile) || profile.version !== 1 || !['draft','active'].includes(profile.status) || !nonempty(profile.purpose)) throw Error('Profile requires version: 1, status: draft|active and purpose');
  for (const field of ['roles','workflows','skills']) strings(profile[field], `Profile.${field}`);
  for (const field of ['customRoles','customWorkflows']) if (!object(profile[field])) throw Error(`Profile.${field} must be an object`);
  for (const [id,role] of Object.entries(profile.customRoles)) roleContract(role,id);
  for (const [id,workflow] of Object.entries(profile.customWorkflows)) workflowContract(workflow,id);
  return profile;
}
export function loadWorkSystem(root, { checkDraft = false, checkContext = false, profileOverride = undefined } = {}) {
  const roles=definitions(root,'harness/roles',roleContract);
  const workflows=definitions(root,'harness/workflows',workflowContract);
  const discovery=discoverSkills(root);
  if (discovery.errors.length) throw Error(discovery.errors.join('\n'));
  const skills=new Map(discovery.skills.map(s=>[s.name,s]));
  const path=assertSafePath(root,PROFILE_PATH);
  const profile=profileOverride !== undefined ? validateProfile(profileOverride) : (existsSync(path)?validateProfile(JSON.parse(readFileSync(path,'utf8'))):null);
  const selected=profile && (profile.status==='active'||checkDraft);
  if (selected) {
    for (const [id,value] of Object.entries(profile.customRoles)) {
      if (roles[id]) throw Error(`Project role collides with core role: ${id}; use a distinct project ID`);
      roles[id]=value;
    }
    for (const [id,value] of Object.entries(profile.customWorkflows)) {
      if (workflows[id]) throw Error(`Project workflow collides with core workflow: ${id}; use a distinct project ID`);
      workflows[id]=value;
    }
    for (const id of profile.roles) if (!roles[id]) throw Error(`Unknown profile role: ${id}`);
    for (const id of profile.workflows) if (!workflows[id]) throw Error(`Unknown profile workflow: ${id}`);
    for (const id of profile.skills) if (!skills.has(id)) throw Error(`Unknown profile skill: ${id}`);
  }
  for (const role of Object.values(roles)) {
    for (const name of role.skills) if (!skills.has(name)) throw Error(`Role ${role.id} references missing skill: ${name}`);
    for (const path of [...role.requiredContext,...role.optionalContext]) assertSafePath(root,path);
    if (checkContext && selected && profile.customRoles[role.id]) for (const path of role.requiredContext) {
      const file=assertSafePath(root,path);
      if (!existsSync(file) || !statSync(file).isFile() || !readFileSync(file,'utf8').trim()) throw Error(`Role ${role.id} missing or empty required context file: ${path}`);
    }
  }
  for (const workflow of Object.values(workflows)) for (const stage of workflow.stages) {
    if (!roles[stage.role]) throw Error(`Workflow ${workflow.id}/${stage.id} references unknown role: ${stage.role}`);
    for (const name of stage.skills) if (!skills.has(name)) throw Error(`Workflow ${workflow.id}/${stage.id} references missing skill: ${name}`);
  }
  return {profile,roles,workflows,skills};
}
