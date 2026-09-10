// Workflow completion gates validate artifacts and recorded review, not human identity.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { assertSafePath } from './skills.mjs';
import { loadWorkSystem } from './work-system.mjs';
import { researchStaleness } from './research-evidence.mjs';
export const hashContent = value => createHash('sha256').update(value).digest('hex');
export function artifactHash(root,path) {
  const content=readFileSync(assertSafePath(root,path));
  if (!content.length || !content.toString('utf8').trim()) throw Error(`Empty artifact: ${path}`);
  return hashContent(content);
}
// Only fields that change what a stage requires enter the fingerprint. Additive role metadata
// (metrics, autonomy hints, notes) must not reopen completed checkpoints.
const ROLE_CONTRACT_FIELDS=['id','version','skills','requiredContext','optionalContext','boundaries','qualityCriteria','inputs','outputs'];
function stageContractHash(system,stage) {
  const role=system.roles[stage.role];
  const names=[...new Set([...role.skills,...stage.skills])];
  const contract=Object.fromEntries(ROLE_CONTRACT_FIELDS.filter(k=>role[k]!==undefined).map(k=>[k,role[k]]));
  return hashContent(JSON.stringify({stage,role:contract,skills:names.map(name=>({name,text:system.skills.get(name).text}))}));
}
export function staleArtifacts(root,task,system=loadWorkSystem(root)) {
  const stale=researchStaleness(root,task);
  if(task?.workflow) {
    const workflow=system.workflows[task.workflow];
    for(const stage of task.stages??[]) if(stage.status==='complete') {
      const contract=workflow?.stages.find(s=>s.id===stage.id);
      if(!contract || !stage.contractHash || stageContractHash(system,contract)!==stage.contractHash)stale.push({stage:stage.id,path:`harness/workflows/${task.workflow}.json`,reason:'Workflow/role/skill contract changed since checkpoint; reopen and recheck'});
    }
  }
  for (const stage of task?.stages??[]) if (stage.status==='complete') for (const a of stage.artifacts??[]) {
    try { if (!a.sha256 || artifactHash(root,a.path)!==a.sha256) stale.push({stage:stage.id,path:a.path,reason:'Content changed since checkpoint'}); }
    catch (error) { stale.push({stage:stage.id,path:a.path,reason:error.message}); }
  }
  return stale;
}
function reviewGate(review,label) {
  if (!review || review.status!=='passed' || review.mode!=='independent' || !review.reviewer?.trim() || !review.contextId?.trim() || !review.authorContextId?.trim() || review.contextId===review.authorContextId) throw Error(`${label} requires passed independent review in a separate context; self-review is not independent`);
}
export function normalizeWorkflowTask(root,next,previous=null) {
  if (!next.workflow) {
    if (previous?.workflow) throw Error('Cannot remove a saved workflow; create a new task');
    if (next.stages?.length) throw Error('Stages require a workflow');
    if (next.role) {const system=loadWorkSystem(root);if(!system.roles[next.role])throw Error(`Unknown role: ${next.role}`);}
    return next;
  }
  const system=loadWorkSystem(root),workflow=system.workflows[next.workflow];
  if (!workflow) throw Error(`Unknown workflow: ${next.workflow}`);
  if (previous?.workflow && previous.workflow!==next.workflow) throw Error('Cannot change workflow of a saved task; create a new task');
  if (next.role && !system.roles[next.role]) throw Error(`Unknown role: ${next.role}`);
  const supplied=next.stages??[];
  if(!Array.isArray(supplied))throw Error('stages must be an array');
  const byId=new Map((previous?.stages??[]).map(s=>[s.id,s]));
  const suppliedIds=new Set();
  for(const stage of supplied) {
    if (!stage || suppliedIds.has(stage.id) || !workflow.stages.some(s=>s.id===stage.id)) throw Error(`Unknown or duplicate workflow stage: ${stage?.id}`);
    suppliedIds.add(stage.id);
    byId.set(stage.id,stage);
  }
  let unfinished=false;
  const priorArtifacts={};
  const stages=workflow.stages.map(contract=>{
    const stage={id:contract.id,status:'pending',result:'',artifacts:[],...byId.get(contract.id)};
    if (!['pending','active','complete'].includes(stage.status)) throw Error(`Invalid stage status: ${stage.id}`);
    if(!Array.isArray(stage.artifacts))throw Error(`Stage ${stage.id}.artifacts must be an array`);
    const previousStage=previous?.stages?.find(s=>s.id===stage.id);
    const review=stage.review;
    if(review) {
      if(!contract.requiresReview || !['independent','self'].includes(review.mode) || !['passed','changes-requested','not-run'].includes(review.status))throw Error(`Invalid review record for ${stage.id}`);
      if(review.mode==='independent' && review.status!=='not-run') {
        if(!review.reviewer?.trim()||!review.contextId?.trim()||!review.authorContextId?.trim()||review.contextId===review.authorContextId)throw Error(`Independent review of ${stage.id} requires separate author and reviewer contexts`);
        const newVerdict=JSON.stringify(review)!==JSON.stringify(previousStage?.review);
        stage.reviewAttempt=(previousStage?.reviewAttempt??0)+(newVerdict?1:0);
      }
    } else if(previousStage?.reviewAttempt)stage.reviewAttempt=previousStage.reviewAttempt;
    if(stage.status==='complete') {
      if(unfinished)throw Error(`Cannot complete ${stage.id} before preceding phases`);
      if(typeof stage.result!=='string'||!stage.result.trim())throw Error(`Stage ${stage.id} needs a nonempty result`);
      const names=new Set();
      stage.artifacts=stage.artifacts.map(a=>{
        if(!a||typeof a.name!=='string'||!a.name.trim()||names.has(a.name))throw Error(`Invalid/duplicate artifact in ${stage.id}`);
        names.add(a.name);
        const sha256=artifactHash(root,a.path);
        const old=previous?.stages?.find(s=>s.id===stage.id&&s.status==='complete')?.artifacts?.find(x=>x.name===a.name);
        if(old&&(old.path!==a.path||old.sha256!==sha256))throw Error(`Artifact changed: ${a.path}; reopen this phase and its successors before rechecking`);
        return {name:a.name,path:a.path,sha256};
      });
      for(const name of contract.requiredArtifacts)if(!names.has(name))throw Error(`Stage ${stage.id} missing required artifact: ${name}`);
      const inputHash=hashContent(JSON.stringify(priorArtifacts));
      const oldStage=previous?.stages?.find(s=>s.id===stage.id&&s.status==='complete');
      const contractHash=stageContractHash(system,contract);
      if(oldStage?.contractHash && oldStage.contractHash!==contractHash)throw Error(`Contract changed for ${stage.id}; reopen and recheck`);
      stage.contractHash=contractHash;
      if(oldStage?.inputHash && oldStage.inputHash!==inputHash)throw Error(`Inputs changed for ${stage.id}; reopen and recheck`);
      stage.inputHash=inputHash;
      if(contract.requiresReview)reviewGate(stage.review,`Stage ${stage.id}`);
      if(contract.requiresApproval) {
        if(!stage.approval?.by?.trim()||!stage.approval?.reference?.trim())throw Error(`Stage ${stage.id} requires the owner's recorded approval of the proposal`);
        stage.approval={...stage.approval,inputHash};
      }
      for(const a of stage.artifacts)priorArtifacts[`${stage.id}/${a.name}`]=a.sha256;
    } else {
      if(unfinished && stage.status==='active')throw Error(`Cannot start ${stage.id} before preceding phases`);
      unfinished=true;
      // Unfinished records never retain a previous success verdict or fingerprints.
      delete stage.inputHash;
      delete stage.contractHash;
      delete stage.approval;
      if(stage.status==='pending')delete stage.review;
      stage.artifacts=stage.artifacts.map(({name,path})=>({name,path}));
    }
    return stage;
  });
  if(next.status==='complete'&&unfinished)throw Error('Workflow completion requires all phases, artifacts and review');
  next.stages=stages;
  next.currentStage=stages.find(s=>s.status!=='complete')?.id??null;
  return next;
}
