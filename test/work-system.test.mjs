import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const repo = resolve(import.meta.dirname, '..');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'kb-work-system-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const p of ['harness','AGENTS.md','docs/human-interface.md']) cpSync(join(repo,p),join(root,p),{ recursive: true });
  return root;
}
function write(root,path,value) { mkdirSync(join(root,path,'..'),{recursive:true});writeFileSync(join(root,path),typeof value==='string'?value:JSON.stringify(value)); }
function cli(root,file,args=[]) { return spawnSync(process.execPath,[join(repo,'scripts',file),...args],{cwd:root,env:{...process.env,KB_ROOT:root},encoding:'utf8'}); }
function save(root,data) { write(root,'input.json',{goal:'Answer question',acceptanceCriteria:['Evidence checked'],decisions:[],nextStep:'Continue',...data});return cli(root,'kb-session.mjs',['save','--task','research-one','--owner','writer','--file',join(root,'input.json')]); }
// The old context ignores these selectors entirely; next-session role/phase would be lost.
test('context selects a built-in workflow and explains required role and skills',t=>{
  const root=fixture(t),r=cli(root,'session-start-context.mjs',['--task','research-one','--workflow','research','--json']);
  assert.equal(r.status,0,r.stderr);const c=JSON.parse(r.stdout);
  assert.equal(c.work.workflow.id,'research');assert.equal(c.work.stage.id,'scope');assert.equal(c.work.role.id,'coordinator');
  assert.ok(c.work.skills.some(s=>s.name==='harness-handoff'));assert.ok(c.work.documents.some(d=>d.path==='harness/rules/evidence.md'));
});
test('saved workflow resumes at the next unfinished stage with prior artifacts',t=>{
  const root=fixture(t);write(root,'brief.md','Question and scope');
  const r=save(root,{workflow:'research',stages:[{id:'scope',status:'complete',result:'Question scoped',artifacts:[{name:'brief',path:'brief.md'}]}]});
  assert.equal(r.status,0,r.stderr);
  const c=JSON.parse(cli(root,'session-start-context.mjs',['--task','research-one','--json']).stdout);
  assert.equal(c.work.stage.id,'gather');assert.equal(c.work.role.id,'researcher');assert.equal(c.task.stages[0].artifacts[0].path,'brief.md');
  assert.ok(c.task.stages[0].artifacts[0].sha256);
});
test('completed phase requires nonempty real artifacts and preceding phases',t=>{
  const root=fixture(t);write(root,'brief.md','');
  assert.equal(save(root,{workflow:'research',stages:[{id:'scope',status:'complete',result:'Ready',artifacts:[{name:'brief',path:'brief.md'}]}]}).status,1);
  write(root,'findings.md','Evidence');
  assert.equal(save(root,{workflow:'research',stages:[{id:'gather',status:'complete',result:'Read',artifacts:[{name:'findings',path:'findings.md'}]}]}).status,1);
});
test('draft profile is visible but does not activate custom roles',t=>{
  const root=fixture(t);write(root,'00_context/work-system.json',{version:1,status:'draft',purpose:'Study users',roles:['coordinator'],workflows:['research'],skills:[],customRoles:{},customWorkflows:{}});
  const c=JSON.parse(cli(root,'session-start-context.mjs',['--workflow','research','--json']).stdout);
  assert.equal(c.work.profile.status,'draft');assert.equal(c.work.profile.active,false);assert.equal(c.work.role.id,'coordinator');
});
test('active project contract loads required evidence and reports missing evidence explicitly',t=>{
  const root=fixture(t);write(root,'00_context/work-system.json',{version:1,status:'active',purpose:'Interview study',roles:['interviewer'],workflows:['research'],skills:['harness-evidence'],customRoles:{interviewer:{id:'interviewer',title:'Interviewer',purpose:'Read interviews',inputs:['Sources'],outputs:['Findings'],skills:['harness-evidence'],requiredContext:['02_sources/interview.md'],optionalContext:[],boundaries:['Preserve uncertainty'],qualityCriteria:['Cite sources']}},customWorkflows:{}});
  let r=cli(root,'session-start-context.mjs',['--role','interviewer','--json']);assert.equal(r.status,0,r.stderr);
  let c=JSON.parse(r.stdout);assert.equal(c.work.ready,false);assert.ok(c.work.missing.some(x=>x.path==='02_sources/interview.md'));
  write(root,'02_sources/interview.md','---\ndate: 2026-09-09\nconfidence: low\n---\nFACT: Original claim [source: /01_raw/interview.md]');
  c=JSON.parse(cli(root,'session-start-context.mjs',['--role','interviewer','--json']).stdout);
  assert.equal(c.work.ready,true);assert.match(c.work.documents.find(d=>d.path==='02_sources/interview.md').text,/confidence: low/);
});
test('unknown selectors and broken project skill links fail instead of choosing another role',t=>{
  const root=fixture(t);
  assert.equal(cli(root,'session-start-context.mjs',['--role','invented','--json']).status,1);
  write(root,'00_context/work-system.json',{version:1,status:'active',purpose:'Study',roles:['coordinator'],workflows:['research'],skills:['missing-skill'],customRoles:{},customWorkflows:{}});
  assert.equal(cli(root,'check-harness.mjs',['--json']).status,1);
});
test('a changed completed artifact is reported stale and cannot retain completion',t=>{
  const root=fixture(t);write(root,'brief.md','Question v1');
  assert.equal(save(root,{workflow:'research',stages:[{id:'scope',status:'complete',result:'Scoped',artifacts:[{name:'brief',path:'brief.md'}]}]}).status,0);
  write(root,'brief.md','Changed question');
  const c=JSON.parse(cli(root,'session-start-context.mjs',['--task','research-one','--json']).stdout);
  assert.equal(c.work.ready,false);assert.ok(c.work.staleArtifacts.some(a=>a.path==='brief.md'));
  assert.equal(save(root,{nextStep:'Continue'}).status,1);
});
test('workflow completion cannot skip independent review or claim human approval',t=>{
  const root=fixture(t);const make=(id,name)=>{write(root,name+'.md',name+' content');return {id,status:'complete',result:'Done',artifacts:[{name,path:name+'.md'}]};};
  const stages=[make('scope','brief'),make('gather','findings'),make('synthesize','answer'),make('review','review'),make('save','result')];
  const data={workflow:'research',status:'complete',result:'Answer ready',checks:[{command:'verify',outcome:'passed',evidence:'Checked'}],stages};
  assert.equal(save(root,data).status,1);
  stages[3].review={mode:'self',status:'passed',reviewer:'writer',contextId:'same',authorContextId:'same'};
  assert.equal(save(root,data).status,1);
  stages[3].review={mode:'independent',status:'passed',reviewer:'reviewer',contextId:'review-session',authorContextId:'write-session'};
  assert.equal(save(root,data).status,0);
});
test('profile proposal stays inactive until confirmed and cannot overwrite a changed profile',t=>{
  const root=fixture(t),profile={version:1,status:'draft',purpose:'Customer evidence',roles:['researcher'],workflows:['research'],skills:[],customRoles:{},customWorkflows:{}};
  write(root,'draft.json',profile);
  let r=cli(root,'kb-profile.mjs',['propose','--file',join(root,'draft.json')]);assert.equal(r.status,0,r.stderr);
  assert.equal(existsSync(join(root,'00_context/work-system.json')),false);
  assert.equal(cli(root,'kb-profile.mjs',['apply']).status,1);
  r=cli(root,'kb-profile.mjs',['apply','--by','owner','--note','Confirmed in task conversation']);assert.equal(r.status,0,r.stderr);
  const active=JSON.parse(readFileSync(join(root,'00_context/work-system.json'),'utf8'));assert.equal(active.status,'active');assert.equal(active.approval.by,'owner');
  assert.equal(cli(root,'kb-profile.mjs',['propose','--file',join(root,'draft.json')]).status,0);
  write(root,'00_context/work-system.json',{...active,purpose:'New purpose'});
  assert.equal(cli(root,'kb-profile.mjs',['apply','--by','owner','--note','Confirmed']).status,1);
});
test('tampered profile proposals and missing referenced skills cannot be activated',t=>{
  const root=fixture(t),profile={version:1,status:'draft',purpose:'Study',roles:['coordinator'],workflows:['research'],skills:[],customRoles:{},customWorkflows:{}};
  write(root,'draft.json',profile);
  assert.equal(cli(root,'kb-profile.mjs',['propose','--file',join(root,'draft.json')]).status,0);
  const path='.context/work-system/proposal.json',proposal=JSON.parse(readFileSync(join(root,path),'utf8'));
  proposal.profile.purpose='Tampered';write(root,path,proposal);
  assert.equal(cli(root,'kb-profile.mjs',['apply','--by','owner','--note','Confirmed']).status,1);
  write(root,'draft.json',{...profile,skills:['unknown']});
  assert.equal(cli(root,'kb-profile.mjs',['propose','--file',join(root,'draft.json')]).status,1);
});
test('saving the next checkpoint preserves preceding phases without resending them',t=>{
  const root=fixture(t);write(root,'brief.md','Question');write(root,'findings.md','Two conflicting sources retained');
  assert.equal(save(root,{workflow:'research',stages:[{id:'scope',status:'complete',result:'Scoped',artifacts:[{name:'brief',path:'brief.md'}]}]}).status,0);
  const r=save(root,{stages:[{id:'gather',status:'complete',result:'Evidence gathered',artifacts:[{name:'findings',path:'findings.md'}]}]});
  assert.equal(r.status,0,r.stderr);const task=JSON.parse(r.stdout);assert.equal(task.stages[0].status,'complete');assert.equal(task.currentStage,'synthesize');
});
test('decision recording requires approval of the proposal and preserves rejected reviews',t=>{
  const root=fixture(t);const stage=(id,name)=>{write(root,name+'.md','Artifact '+name);return {id,status:'complete',result:'Done',artifacts:[{name,path:name+'.md'}]};};
  const stages=[stage('options','options'),stage('review','review'),stage('propose','proposal'),stage('record','decision')];
  stages[1].review={mode:'independent',status:'passed',reviewer:'Reviewer',contextId:'review',authorContextId:'author'};
  assert.equal(save(root,{workflow:'decision',stages}).status,1);
  stages[3].approval={by:'owner',reference:'Owner approved exact proposal in session 1'};
  assert.equal(save(root,{workflow:'decision',stages}).status,0);
});
test('rejected independent reviews survive resume and emit real first-attempt metrics once',t=>{
  const root=fixture(t);write(root,'options.md','Options');
  let r=save(root,{workflow:'decision',stages:[{id:'options',status:'complete',result:'Options gathered',artifacts:[{name:'options',path:'options.md'}]},{id:'review',status:'active',result:'Needs evidence',artifacts:[],review:{mode:'independent',status:'changes-requested',reviewer:'reviewer',contextId:'review-context',authorContextId:'author-context'}}]});
  assert.equal(r.status,0,r.stderr);let task=JSON.parse(r.stdout);assert.equal(task.stages[1].review.status,'changes-requested');assert.equal(task.stages[1].reviewAttempt,1);
  assert.equal(save(root,{nextStep:'Fix evidence'}).status,0);
  const events=readFileSync(join(root,'.context/kb-journal.jsonl'),'utf8').trim().split('\n').map(JSON.parse).filter(e=>e.kind==='task-review');
  assert.equal(events.length,1);assert.equal(events[0].passed,false);assert.equal(events[0].attempt,1);
});
test('context separates accepted scoped lessons from open observations and bounds whole sources',t=>{
  const root=fixture(t);write(root,'source.md','Evidence');
  write(root,'finding.json',{kind:'feedback',title:'Cite interview evidence',problem:'An answer missed an interview citation',paths:['source.md'],evidence:[{source:'source.md',observation:'Reviewer required direct citation'}],suggestedAction:'Cite the original interview summary',role:'researcher'});
  let r=cli(root,'kb-findings.mjs',['add','--file',join(root,'finding.json'),'--json']);assert.equal(r.status,0,r.stderr);const finding=JSON.parse(r.stdout);
  let c=JSON.parse(cli(root,'session-start-context.mjs',['--role','researcher','--json']).stdout);assert.equal(c.work.lessons.length,0);
  assert.equal(cli(root,'kb-findings.mjs',['transition','--id',finding.id,'--status','accepted','--by','owner','--note','Confirmed procedure']).status,0);
  c=JSON.parse(cli(root,'session-start-context.mjs',['--role','researcher','--json']).stdout);assert.equal(c.work.lessons.length,1);
  c=JSON.parse(cli(root,'session-start-context.mjs',['--role','editor','--json']).stdout);assert.equal(c.work.lessons.length,0);
  c=JSON.parse(cli(root,'session-start-context.mjs',['--role','researcher','--max-chars','1000','--json']).stdout);assert.equal(c.work.ready,false);assert.ok(c.work.deferred.some(d=>d.required));
});
test('a workflow cannot start a later stage before predecessors finish',t=>{
  const root=fixture(t);
  assert.equal(save(root,{workflow:'research',stages:[{id:'gather',status:'active',result:'',artifacts:[]}]}).status,1);
});
test('large profiles are deferred instead of silently exceeding the context budget',t=>{
  const root=fixture(t);write(root,'00_context/work-system.json',{version:1,status:'draft',purpose:'x'.repeat(100000),roles:['coordinator'],workflows:['research'],skills:[],customRoles:{},customWorkflows:{}});
  const r=cli(root,'session-start-context.mjs',['--json']);assert.equal(r.status,0,r.stderr);const c=JSON.parse(r.stdout);
  assert.ok(JSON.stringify(c.work).length<30000);assert.ok(c.work.deferred.some(d=>d.path==='00_context/work-system.json'));
});
test('task-specific accepted feedback does not become a rule for unrelated tasks',t=>{
  const root=fixture(t);write(root,'source.md','Specific project evidence');
  write(root,'feedback.json',{kind:'feedback',title:'Task-local correction',problem:'One artifact requires an appendix',paths:['source.md'],evidence:[{source:'source.md',observation:'The owner requested it for task A'}],suggestedAction:'Add the requested appendix',task:'task-a'});
  const added=cli(root,'kb-findings.mjs',['add','--file',join(root,'feedback.json'),'--json']);assert.equal(added.status,0,added.stderr);const finding=JSON.parse(added.stdout);
  assert.equal(cli(root,'kb-findings.mjs',['transition','--id',finding.id,'--status','accepted','--by','owner','--note','For task A only']).status,0);
  const c=JSON.parse(cli(root,'session-start-context.mjs',['--task','task-b','--json']).stdout);assert.equal(c.work.lessons.length,0);
});
test('resuming a checkpoint detects changed workflow requirements',t=>{
  const root=fixture(t);write(root,'brief.md','Question');
  assert.equal(save(root,{workflow:'research',stages:[{id:'scope',status:'complete',result:'Scoped',artifacts:[{name:'brief',path:'brief.md'}]}]}).status,0);
  const path='harness/workflows/research.json',workflow=JSON.parse(readFileSync(join(root,path),'utf8'));workflow.stages[0].requiredArtifacts.push('new-evidence');write(root,path,workflow);
  const c=JSON.parse(cli(root,'session-start-context.mjs',['--task','research-one','--json']).stdout);
  assert.equal(c.work.ready,false);assert.ok(c.work.staleArtifacts.some(a=>a.stage==='scope'&&/contract/i.test(a.reason)));
});
test('profile validation refuses empty files and directories as required context',t=>{
  const root=fixture(t);const role={id:'custom',title:'Custom role',purpose:'Research',inputs:['Question'],outputs:['Findings'],skills:['harness-evidence'],requiredContext:['required.md'],optionalContext:[],boundaries:[],qualityCriteria:['Evidence']};
  write(root,'draft.json',{version:1,status:'draft',purpose:'Study',roles:['custom'],workflows:['research'],skills:[],customRoles:{custom:role},customWorkflows:{}});
  write(root,'required.md','');assert.equal(cli(root,'kb-profile.mjs',['propose','--file',join(root,'draft.json')]).status,1);
  rmSync(join(root,'required.md'));mkdirSync(join(root,'required.md'));assert.equal(cli(root,'kb-profile.mjs',['propose','--file',join(root,'draft.json')]).status,1);
});
test('a plain external KB_ROOT still gets legacy session context without new contracts',t=>{
  const root=mkdtempSync(join(tmpdir(),'kb-legacy-context-'));t.after(()=>rmSync(root,{recursive:true,force:true}));write(root,'.remember/core.md','Existing external KB');
  const r=cli(root,'session-start-context.mjs',['--json']);assert.equal(r.status,0,r.stderr);const c=JSON.parse(r.stdout);assert.equal(c.core,'Existing external KB');assert.equal(c.work.available,false);
  assert.equal(cli(root,'session-start-context.mjs',['--workflow','research','--json']).status,1);
});
