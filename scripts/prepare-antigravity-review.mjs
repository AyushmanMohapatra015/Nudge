import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,lstatSync,realpathSync,existsSync,copyFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,sep,extname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {sourceFindings} from './check-public-source.mjs';

const root=realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),'..'));
const stagingRoot=resolve(root,'data/review-copies');
const target=resolve(root,'../Nudge-Antigravity-Review');
const hash=content=>createHash('sha256').update(content).digest('hex');
const allowedDirectories=new Set(['app','components','lib','tests','scripts','postman','evaluation','public']);
const allowedExtensions=new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.md','.txt','.css','.html','.svg','.yaml','.yml']);
function safePath(path){
  const parts=path.split('/');
  return !path.includes('\\') && parts.every(part=>part && part!=='.' && part!=='..' && !part.includes(':')) &&
    !parts.some(part=>/^(?:\.git|\.next|node_modules|data|test-results|\.agents|\.codex|\.aws|vendor|downloads?)$/i.test(part)) &&
    (!parts.some(part=>part.startsWith('.env')) || path==='.env.example') &&
    (parts.length===1 || allowedDirectories.has(parts[0])) &&
    (allowedExtensions.has(extname(path).toLowerCase()) || ['LICENSE','.gitignore','.env.example'].includes(path));
}
function checkedRead(base,path){
  if(!safePath(path))throw Error('Disallowed source path');
  const file=resolve(base,path),stat=lstatSync(file);
  if(!stat.isFile()||stat.isSymbolicLink()||!realpathSync(file).startsWith(realpathSync(base)+sep)||stat.size>2*1024*1024)throw Error('Unsupported source file');
  const content=readFileSync(file);
  if(content.includes(0)||sourceFindings(path,content.toString('utf8')).length)throw Error('Source content review failed');
  return content;
}
const brief=`# Start here: independent Nudge backend review

This is a source-only review copy, not the active project. It has no Git history, private environment, database, installed dependencies, generated build, sponsor library distribution or credentials. No setup or installation has been performed. README run commands describe the original application; do not execute them for this first review.

Read AGENTS.md, PROJECT_STATUS.md, ARCHITECTURE_REVIEW.md, PAYMENT_INTEGRITY.md, PROCESSING_RECOVERY.md, BRYNTUM_EVALUATION_PERMISSION.md and relevant source/tests. Some historical documents describe original-machine evidence and ignored receipts not included here; do not claim you reran those checks.

Task: independently review the PayPal invoice/payment and human-approval backend. Prioritise authoritative amount/status handling, exact cents, auth/origin and client projection, webhook verification/deduplication, version/idempotency/concurrency, uncertain remote outcomes and recovery. Review existing tests for meaningful gaps. Separate actual defects from hypotheses, intentional prototype limits and already-documented open work.

Write only REVIEW_FINDINGS.md in this review folder. For each finding: severity, exact file/line, trigger, expected/actual behavior, reasoning, existing safeguards/tests, confidence, a proposed focused test/fix and whether reproduction is still needed. State honestly that this first pass is static. Do not invent execution evidence or count a passing suite as real-user validation.

Do not edit implementation, package/lock files, sponsor notices or action-plan/status documents. Do not run commands, install dependencies, execute package scripts, start browsers/servers, access accounts, use live APIs/models, deploy, send messages, publish or create Git commits. Do not read outside this folder or search for the original project/private files. Request separate owner approval before any execution or expanded access. These written instructions are not a technical sandbox: the owner must configure actual tool permissions independently.

Keep proprietary Bryntum/AG software and credentials outside the repository and this review. Nudge's MIT licence covers its own code only. Never patch trial/expiry checks or attempt to extend rights by reinstalling. Review source imports without acquiring vendor files during this static pass.

Return findings to the owner for review and deliberate integration in the main project. Do not merge or copy changes back yourself. Missing dependencies, runtime configuration and historical receipts are expected in this copy, not automatically application bugs.
`;
const rules=`\n\n# Source-only independent review boundary\n\nThis folder is a sanitised static-review copy. Follow REVIEW_START_HERE.md. Only REVIEW_FINDINGS.md may be written; no commands, installs, live APIs, account access, publication or changes to implementation are authorised. Do not read outside this folder. Installed Next guides are intentionally absent: do not install dependencies or write Next code during this static pass. This text is task guidance, not an OS-enforced access control.\n`;
function inventory(base){
  const walk=relative=>readdirSync(resolve(base,relative)).flatMap(name=>{
    const path=relative?relative+'/'+name:name,stat=lstatSync(resolve(base,path));
    if(stat.isSymbolicLink())throw Error('Review copy contains a link');
    return stat.isDirectory()?walk(path):[path];
  });
  return walk('').sort();
}
function verify(base){
  const manifest=JSON.parse(readFileSync(resolve(base,'REVIEW_MANIFEST.json'),'utf8'));
  if(manifest.format!==1 || !Array.isArray(manifest.files)||manifest.files.length>2000)throw Error('Invalid review manifest');
  const expected=['REVIEW_MANIFEST.json',...manifest.files.map(file=>file.path)].sort();
  if(JSON.stringify(inventory(base))!==JSON.stringify(expected))throw Error('Review inventory mismatch');
  let bytes=0;
  for(const file of manifest.files){const content=checkedRead(base,file.path);bytes+=content.length;if(content.length!==file.bytes||hash(content)!==file.sha256)throw Error('Review hash mismatch');}
  if(bytes>16*1024*1024)throw Error('Review byte limit');
  return manifest;
}
try{
  if(process.argv.length===4 && process.argv[2]==='--export'){
    const staging=realpathSync(resolve(root,process.argv[3]));
    if(!staging.startsWith(stagingRoot+sep)||dirname(target)!==dirname(root)||basename(target)!=='Nudge-Antigravity-Review'||existsSync(target))throw Error('Export boundary or existing target');
    const manifest=verify(staging);mkdirSync(target);
    for(const path of ['REVIEW_MANIFEST.json',...manifest.files.map(file=>file.path)]){mkdirSync(dirname(resolve(target,path)),{recursive:true});copyFileSync(resolve(staging,path),resolve(target,path));}
    verify(target);console.log(JSON.stringify({success:true,reviewDirectory:target,files:manifest.files.length,hashesVerified:true,dependenciesInstalled:false,gitHistoryIncluded:false}));
  }else if(process.argv.length===2){
    const paths=[...new Set(execFileSync('git',['-C',root,'ls-files','-z','--cached','--others','--exclude-standard'],{encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024}).split('\0').filter(Boolean))].sort();
    if(paths.length>2000)throw Error('Source count limit');
    const staging=resolve(stagingRoot,randomUUID());mkdirSync(staging,{recursive:true});let bytes=0;
    const files=[];
    for(const path of paths){if(!safePath(path))continue;const content=checkedRead(root,path);bytes+=content.length;if(bytes>16*1024*1024)throw Error('Source byte limit');mkdirSync(dirname(resolve(staging,path)),{recursive:true});writeFileSync(resolve(staging,path),content);}
    writeFileSync(resolve(staging,'REVIEW_START_HERE.md'),brief);
    writeFileSync(resolve(staging,'AGENTS.md'),readFileSync(resolve(staging,'AGENTS.md'),'utf8')+rules);
    for(const path of inventory(staging)){const content=checkedRead(staging,path);files.push({path,bytes:content.length,sha256:hash(content)});}
    writeFileSync(resolve(staging,'REVIEW_MANIFEST.json'),JSON.stringify({format:1,scope:'Current reviewed source snapshot with static-review brief and copy-only AGENTS supplement; no Git history, private data, dependencies or generated files',files},null,2));
    verify(staging);console.log(JSON.stringify({success:true,stagingDirectory:staging,files:files.length,hashesVerified:true,sourceContentScan:'Targeted known patterns, not an exhaustive secret guarantee',excluded:'Private env/data/history, dependencies, generated files, binaries, vendor downloads and local agent/account config'}));
  }else throw Error('Unsupported arguments');
}catch{console.error('Review-copy preparation stopped; no raw source, identifiers or secret values printed. Existing export targets are never overwritten.');process.exitCode=1;}
