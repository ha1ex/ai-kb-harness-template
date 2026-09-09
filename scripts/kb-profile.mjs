#!/usr/bin/env node
// Explicit project profile proposal/activation; no model calls or inferred approval.
import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { KB_ROOT } from './lib/kb-root.mjs';
import { assertSafePath } from './lib/skills.mjs';
import { PROFILE_PATH, loadWorkSystem, validateProfile } from './lib/work-system.mjs';
import { hashContent } from './lib/workflow-state.mjs';
const root=KB_ROOT,args=process.argv.slice(2),command=args.shift();
const file=assertSafePath(root,PROFILE_PATH),proposalFile=assertSafePath(root,'.context/work-system/proposal.json');
const currentHash=()=>existsSync(file)?hashContent(readFileSync(file)):null;
function atomic(path,value){mkdirSync(dirname(path),{recursive:true});const tmp=path+`.${process.pid}.tmp`;writeFileSync(tmp,JSON.stringify(value,null,2)+'\n',{flag:'wx'});try{renameSync(tmp,path);}finally{if(existsSync(tmp))unlinkSync(tmp);}}
let lock,fd;
try {
  if(!command||['--help','-h','help'].includes(command)){
    console.log('Usage: kb:profile show [--json]\n       kb:profile propose --file <draft-profile.json>\n       kb:profile apply --by <owner> --note <confirmation reference>\nProposal validation has no LLM calls. Local confirmations do not authenticate identity.');
  } else {
    const opts={};
    for(let i=0;i<args.length;i++){
      if(args[i]==='--json'){opts.json=true;continue;}
      if(!['--file','--by','--note'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw Error(`Invalid argument: ${args[i]}`);
      opts[args[i].slice(2)]=args[++i];
    }
    if(command==='show'){
      const system=loadWorkSystem(root);
      console.log(JSON.stringify({profile:system.profile,roles:Object.keys(system.roles),workflows:Object.keys(system.workflows),proposal:existsSync(proposalFile)?JSON.parse(readFileSync(proposalFile,'utf8')):null},null,2));
    } else if(['propose','apply'].includes(command)){
      mkdirSync(dirname(proposalFile),{recursive:true});lock=assertSafePath(root,'.context/work-system/profile.lock');fd=openSync(lock,'wx');
      if(command==='propose'){
        if(!opts.file)throw Error('propose requires --file');
        const profile=validateProfile(JSON.parse(readFileSync(resolve(opts.file),'utf8')));
        if(profile.status!=='draft')throw Error('Proposal must have status: draft');
        if(profile.approval)throw Error('Draft profile cannot carry an approval');
        loadWorkSystem(root,{profileOverride:profile,checkDraft:true,checkContext:true});
        const proposal={version:1,profile,profileHash:hashContent(JSON.stringify(profile)),baseHash:currentHash(),createdAt:new Date().toISOString()};
        atomic(proposalFile,proposal);console.log(JSON.stringify(proposal,null,2));
      } else {
        if(!opts.by?.trim()||!opts.note?.trim())throw Error('apply requires --by and --note recording actual owner confirmation');
        const proposal=JSON.parse(readFileSync(proposalFile,'utf8'));
        if(proposal.version!==1||proposal.profile?.status!=='draft'||proposal.profileHash!==hashContent(JSON.stringify(proposal.profile)))throw Error('Profile proposal changed; propose and review again');
        if(proposal.baseHash!==currentHash())throw Error('Current profile changed since proposal; propose and review again');
        loadWorkSystem(root,{profileOverride:proposal.profile,checkDraft:true,checkContext:true});
        const active={...proposal.profile,status:'active',approval:{by:opts.by,note:opts.note,proposalHash:proposal.profileHash,at:new Date().toISOString()}};
        atomic(file,active);console.log(JSON.stringify(active,null,2));
      }
    } else throw Error(`Unknown command: ${command}`);
  }
} catch(error){console.error(error.message);process.exitCode=1;}
finally{if(fd!==undefined){closeSync(fd);unlinkSync(lock);}}
