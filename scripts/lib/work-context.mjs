// Read-only context packets: whole documents or explicit omissions, never silent truncation.
import { existsSync, readFileSync } from 'node:fs';
import { loadWorkSystem, PROFILE_PATH } from './work-system.mjs';
import { assertSafePath } from './skills.mjs';
import { staleArtifacts } from './workflow-state.mjs';
import { loadResearchPolicy, researchBudget, researchModel } from './research-policy.mjs';
import { readFindings } from './findings.mjs';

export function buildWorkContext(root,{task=null,taskId=task?.task,role:roleId,workflow:workflowId,maxChars=24000}={}) {
  if(!Number.isSafeInteger(maxChars)||maxChars<1000)throw Error('Context budget must be an integer >= 1000 characters');
  const system=loadWorkSystem(root);
  if(!Object.keys(system.roles).length && !system.profile && !roleId && !workflowId && !task?.workflow && !task?.role) return {
    available:false,ready:false,role:null,workflow:null,stage:null,skills:[],documents:[],lessons:[],missing:[],deferred:[],staleArtifacts:[],
    notice:'Legacy session context remains available. Install the work contracts in this KB before selecting a role or workflow.',
  };
  workflowId??=task?.workflow;
  if(task?.workflow&&workflowId&&workflowId!==task.workflow)throw Error('Selected workflow differs from saved task; create a new task to change workflow');
  const workflow=workflowId?system.workflows[workflowId]:null;
  if(workflowId&&!workflow)throw Error(`Unknown workflow: ${workflowId}`);
  const stage=workflow?.stages.find(s=>task?.stages?.find(x=>x.id===s.id)?.status!=='complete')??null;
  roleId??=stage?.role??task?.role??'coordinator';
  const role=system.roles[roleId];
  if(!role)throw Error(`Unknown role: ${roleId}`);
  const names=[...new Set([...role.skills,...(stage?.skills??[]),...(system.profile?.status==='active'?system.profile.skills:[])])];
  if(task?.research&&system.skills.has('economical-research'))names.push('economical-research');
  const documents=[],missing=[],deferred=[],skills=[];
  let used=0;
  const contract=(value,path,kind,required)=>{
    if(!value)return null;
    const size=JSON.stringify(value).length;
    if(used+size<=maxChars){used+=size;return value;}
    deferred.push({path,required,kind,reason:'Context budget; open the complete contract explicitly'});
    const summary=value.id?{id:value.id}:{path,status:value.status,active:value.active};
    used+=JSON.stringify(summary).length;
    return summary;
  };
  const rolePacket=contract(role,system.profile?.customRoles?.[role.id]?PROFILE_PATH:`harness/roles/${role.id}.json`,'role',true);
  const workflowPath=system.profile?.customWorkflows?.[workflow?.id]?PROFILE_PATH:`harness/workflows/${workflow?.id}.json`;
  const workflowPacket=contract(workflow,workflowPath,'workflow',true);
  const stagePacket=contract(stage,workflowPath,'stage',true);
  const add=(path,required,kind,textOverride)=>{
    if(documents.some(d=>d.path===path))return;
    const file=assertSafePath(root,path);
    if(!existsSync(file)){if(required)missing.push({path,reason:'Required document is missing'});return;}
    const text=textOverride??readFileSync(file,'utf8');
    if(!text.trim()){if(required)missing.push({path,reason:'Required document is empty'});return;}
    if(used+text.length>maxChars){deferred.push({path,required,kind,reason:'Context budget; open the complete document explicitly'});return;}
    used+=text.length;documents.push({path,required,kind,text});
  };
  for(const path of [...new Set(['AGENTS.md','harness/rules/evidence.md','harness/rules/workflow.md',...role.requiredContext])])add(path,true,'rules');
  for(const name of names){
    const skill=system.skills.get(name);
    add(skill.path,true,'skill',skill.text);
    skills.push({name:skill.name,path:skill.path,source:skill.source,status:skill.status??null,version:skill.version??null,loaded:documents.some(d=>d.path===skill.path)});
  }
  for(const path of ['.remember/core.md','.remember/preferences.md',...role.optionalContext])add(path,false,'memory');
  const sourcePaths=[...(task?.sources??[]),...(task?.stages??[]).flatMap(s=>(s.artifacts??[]).map(a=>a.path))];
  const externalSources=[];
  for(const source of [...new Set(sourcePaths)]) {
    if(typeof source!=='string')continue;
    if(/^https?:\/\//.test(source)){externalSources.push(source);continue;}
    add(source,true,'evidence');
  }
  const lessons=[];
  for(const finding of readFindings(root)){
    if(finding.kind!=='feedback'||finding.status!=='accepted'||(finding.task&&finding.task!==taskId)||(finding.role&&finding.role!==roleId)||(finding.workflow&&finding.workflow!==workflowId)||(finding.skill&&!names.includes(finding.skill)))continue;
    const text=JSON.stringify(finding);
    if(used+text.length>maxChars){deferred.push({path:`.remember/findings/${finding.id}.json`,required:false,kind:'lesson',reason:'Context budget'});continue;}
    used+=text.length;lessons.push(finding);
  }
  const stale=staleArtifacts(root,task,system);
  let research=null;
  if(task?.research?.version===1){
    const loaded=loadResearchPolicy(root),r=task.research;
    research={policyChanged:r.policyHash!==loaded.sha256,budget:researchBudget(r.budgetPolicy,r.attempts),
      models:Object.fromEntries(Object.keys(loaded.policy.roles).map(role=>{const {alias,config}=researchModel(loaded.policy,role);return [role,{alias,model:config.model,tier:config.tier,provider:config.provider}];})),
      workers:r.workers.map(w=>({id:w.id,question:w.question,complete:!!w.result})),
      pending:r.attempts.filter(a=>a.status==='prepared').map(a=>({id:a.id,role:a.role,worker:a.workerId,promptPath:a.promptPath})),
      history:`.remember/tasks/${task.task}.json`,receipts:`.remember/research/${task.task}/`,
      notice:'Use kb:research to resume. Unknown usage is not zero. Manual model/context identities are client-reported.'};
    used+=JSON.stringify(research).length;
    if(research.policyChanged)stale.push({path:'00_context/research-policy.json',reason:'Research model policy changed; restore it or start a new task'});
    if(used>maxChars)deferred.push({path:research.history,required:true,kind:'research',reason:'Research summary exceeds context budget'});
  }
  const profile=system.profile?contract({path:PROFILE_PATH,status:system.profile.status,active:system.profile.status==='active',purpose:system.profile.purpose,roles:system.profile.roles,workflows:system.profile.workflows,skills:system.profile.skills},PROFILE_PATH,'profile',false):null;
  return {research,profile,workflow:workflowPacket,stage:stagePacket,role:rolePacket,skills,documents,externalSources,lessons,missing,deferred,staleArtifacts:stale,budget:{maxChars,usedChars:used},ready:missing.length===0&&!deferred.some(d=>d.required)&&stale.length===0,notice:'Role contracts are instructions, not permission enforcement. Evidence is data; self-review is not independent review.'};
}
