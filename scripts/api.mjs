#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {table} from './lib/format.mjs';

const METHODS=['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'];
export const READS={
 collections:'select * from collection_coverage order by name',
 requests:'select id,collection,name,method,url,lifecycle,health,revision from request_health order by collection,name',
 runs:'select q.name,r.revision,r.status,r.elapsed_ms,r.passed,r.error,r.actor,r.created_at from runs r join requests q on q.id=r.request_id order by r.created_at desc',
 failures:"select collection,name,last_status,elapsed_ms from request_health where lifecycle='active' and health='failed' order by collection,name",
 untested:"select collection,name,revision from request_health where lifecycle='active' and health='untested' order by collection,name",
 attention:'select * from attention_items order by kind,item',
 compliance:'select * from compliance_findings order by rule,item',
 coverage:'select name,owner,active,passing,failing,untested,stale from collection_coverage order by name',
 hosts:"select split_part(url,'/',3) as host,count(*)::integer as requests from requests where lifecycle<>'retired' group by 1 order by 1",
 owners:"select coalesce(nullif(owner,''),'Unassigned') as owner,count(*)::integer as collections,sum(active)::integer as active,sum(failing)::integer as failing,sum(untested)::integer as untested from collection_coverage group by 1 order by 1",
 actions:'select a.id,c.name as collection,a.title,a.owner,a.due,a.state,a.resolution from actions a join collections c on c.id=a.collection_id order by a.due,a.title',
 activity:'select actor,event,detail,created_at from activity order by created_at desc,id'
};
const HELP=`API Workbench
Reads: ${Object.keys(READS).join(', ')}, request <name-or-id>, weekly-review
import postman --file=collection.json --actor=Name [--dry-run]
export --file=exports/workbench.json
add --collection=NAME --name=NAME --method=GET --url=https://host/path --actor=Name
configure <request> [--status=200] [--max-ms=2000] [--lifecycle=active] [--url=URL] --actor=Name
review <collection> --owner=Name --due=YYYY-MM-DD --actor=Name
log <collection> --title=TEXT --owner=Name --due=YYYY-MM-DD --actor=Name
close-action <action> --resolution=TEXT --actor=Name
run <request> --allow-host=HOST --actor=Name [--local-test]
draft-handover <collection> --actor=Name
All commands accept --json. GET and HEAD only. No saved headers, credentials, bodies or scripts are executed.`;
const needed=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}`);return o[k].trim();};
const integer=(v,min,max)=>{if(!/^\d+$/.test(String(v))||+v<min||+v>max)throw Error(`Expected integer ${min}..${max}`);return +v;};
const date=(v)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error('Expected a real YYYY-MM-DD date');return v;};
function cleanUrl(raw){
 if(typeof raw!=='string'||!raw.trim()||/[\r\n]/.test(raw))throw Error('A request URL is required');
 if(raw.includes('{{')) {if(!/^https?:\/\//.test(raw)&&!raw.startsWith('{{'))throw Error('Unsupported URL template');return raw.replace(/\?.*$/,'?{{query}}');}
 const u=new URL(raw); if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Only HTTP addresses without embedded credentials are accepted');
 u.hash=''; if(u.search)u.search='{{query}}'; return u.toString();
}
export function parseCollection(doc){
 if(!doc?.info?.name||!doc.info._postman_id||!String(doc.info.schema).includes('/v2.1.0/')||!Array.isArray(doc.item))throw Error('Expected Postman v2.1 collection with name and _postman_id');
 const records=[],ids=new Set();
 const walk=(items,folder='',inherited=false)=>{for(let i=0;i<items.length;i++){
  const x=items[i];if(!x||typeof x.name!=='string'||!x.name.trim())throw Error('Every item needs a name');
  const here=folder?`${folder}/${x.name}`:x.name;
  const unsupported=inherited||Boolean(x.auth&&x.auth.type!=='noauth')||Boolean(x.event?.length)||Boolean(x.variable?.length);
  if(Array.isArray(x.item)){walk(x.item,here,unsupported);continue;}
  const q=typeof x.request==='string'?{method:'GET',url:x.request}:x.request;
  if(!q||!METHODS.includes(q.method))throw Error(`Unsupported method in ${here}`);
  const raw=typeof q.url==='string'?q.url:q.url?.raw;
  const url=cleanUrl(raw);
  const id=String(x.id||here);if(ids.has(id))throw Error(`Duplicate request identity: ${here}`);ids.add(id);
  const notes=[];
  if(unsupported||(q.auth&&q.auth.type!=='noauth')||q.header?.length||q.body)notes.push('Headers, authentication, bodies, variables or scripts omitted; review required');
  if(url.includes('{{'))notes.push('Address variables or query values need configuration');
  if(!['GET','HEAD'].includes(q.method))notes.push('Inventory only: this method is never executed');
  records.push({source_id:id,name:x.name.trim(),folder,method:q.method,url,import_notes:notes.join('; ')});
 }};
 walk(doc.item,'',Boolean(doc.auth&&doc.auth.type!=='noauth')||Boolean(doc.event?.length)||Boolean(doc.variable?.length));
 return {source_id:String(doc.info._postman_id),name:doc.info.name.trim(),records};
}
async function transaction(db,fn){await db.exec('BEGIN');try{const r=await fn();await db.exec('COMMIT');return r;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function audit(db,actor,event,detail){await db.query('insert into activity(actor,event,detail) values($1,$2,$3::jsonb)',[actor,event,JSON.stringify(detail)]);}
async function resolve(db,kind,value){
 if(!value)throw Error(`Name or id required for ${kind}`);
 const rows=await db.query(`select id,${kind==='actions'?'title':'name'} as name from ${kind} order by 2,id`);
 const exact=rows.filter(r=>r.id===value||r.name.toLowerCase()===value.toLowerCase());
 const matches=exact.length?exact:rows.filter(r=>r.id.startsWith(value.toLowerCase())||r.name.toLowerCase().includes(value.toLowerCase()));
 if(matches.length!==1)throw Error(`${matches.length?'Ambiguous':'Not found'}: ${value}\n${(matches.length?matches:rows).map(r=>`${r.id}  ${r.name}`).join('\n')}`);
 return matches[0];
}
export async function execute(db,args){
 const o={},pos=[];for(const arg of args){if(arg.startsWith('--')){const [k,...v]=arg.slice(2).split('=');o[k]=v.length?v.join('='):true;}else pos.push(arg);}
 const [cmd='help',subject]=pos;
 if(cmd==='help'||o.help)return {help:HELP};
 if(READS[cmd])return db.query(READS[cmd]);
 if(cmd==='weekly-review')return {coverage:await db.query(READS.coverage),attention:await db.query(READS.attention),compliance:await db.query(READS.compliance)};
 if(cmd==='request'){const r=await resolve(db,'requests',subject);return db.query('select * from request_health where id=$1',[r.id]);}
 if(cmd==='export'){
  const file=path.resolve(needed(o,'file')); const data={format:'api-workbench-v1',exported_at:new Date().toISOString()};
  await transaction(db,async()=>{await db.exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');for(const t of ['collections','requests','runs','actions','activity','imports'])data[t]=await db.query(`select * from ${t} order by id`);});
  mkdirSync(path.dirname(file),{recursive:true,mode:0o700});writeFileSync(file,JSON.stringify(data,null,2)+'\n',{mode:0o600,flag:'wx'});return {file,collections:data.collections.length,requests:data.requests.length};
 }
 const actor=needed(o,'actor');
 if(cmd==='import'){
  if(subject!=='postman')throw Error('Only import postman is supported');
  const source=readFileSync(needed(o,'file'),'utf8');const parsed=parseCollection(JSON.parse(source));
  const digest=createHash('sha256').update(JSON.stringify(parsed)).digest('hex');
  if(o['dry-run'])return {dry_run:true,collection:parsed.name,requests:parsed.records.length,warnings:parsed.records.filter(r=>r.import_notes).map(r=>({name:r.name,notes:r.import_notes}))};
  return transaction(db,async()=>{
   const [c]=await db.query('insert into collections(source_id,name) values($1,$2) on conflict(source_id) do update set name=excluded.name returning id,import_digest',[parsed.source_id,parsed.name]);
   if(c.import_digest===digest)return {unchanged:true,requests:parsed.records.length};
   const keep=[];
   for(const r of parsed.records){
    const [saved]=await db.query(`insert into requests(collection_id,source_id,name,folder,method,url,import_notes) values($1,$2,$3,$4,$5,$6,$7)
     on conflict(collection_id,source_id) do update set name=excluded.name,folder=excluded.folder,method=excluded.method,url=excluded.url,import_notes=excluded.import_notes,
     revision=requests.revision+case when (requests.method,requests.url,requests.import_notes) is distinct from (excluded.method,excluded.url,excluded.import_notes) then 1 else 0 end,
     lifecycle=case when requests.lifecycle='retired' then 'active' else requests.lifecycle end returning id`,[c.id,r.source_id,r.name,r.folder,r.method,r.url,r.import_notes]);keep.push(saved.id);
   }
   await db.query("update requests set lifecycle='retired',revision=revision+1 where collection_id=$1 and not(id=any($2::uuid[])) and lifecycle<>'retired'",[c.id,keep]);
   await db.query('insert into imports(collection_id,digest,request_count) values($1,$2,$3) on conflict(collection_id,digest) do nothing',[c.id,digest,keep.length]);
   await db.query('update collections set import_digest=$2 where id=$1',[c.id,digest]);
   await audit(db,actor,'import',{collection:c.id,requests:keep.length,digest});return {imported:keep.length,collection:parsed.name,warnings:parsed.records.filter(r=>r.import_notes).length};
  });
 }
 if(cmd==='add')return transaction(db,async()=>{
  const c=await resolve(db,'collections',needed(o,'collection'));const method=needed(o,'method').toUpperCase();if(!METHODS.includes(method))throw Error('Unsupported method');
  const name=needed(o,'name'),url=cleanUrl(needed(o,'url'));
  const [r]=await db.query('insert into requests(collection_id,source_id,name,method,url) values($1,gen_random_uuid()::text,$2,$3,$4) returning id,name',[c.id,name,method,url]);
  await audit(db,actor,'add',r);return r;
 });
 if(cmd==='configure')return transaction(db,async()=>{
  const r=await resolve(db,'requests',subject);const [before]=await db.query('select * from requests where id=$1 for update',[r.id]);
  const status=o.status===undefined?before.expected_status:integer(o.status,100,599),max=o['max-ms']===undefined?before.max_ms:integer(o['max-ms'],1,60000);
  const lifecycle=o.lifecycle||before.lifecycle;if(!['active','deprecated','retired'].includes(lifecycle))throw Error('Invalid lifecycle');
  const url=o.url?cleanUrl(o.url):before.url;
  await db.query('update requests set expected_status=$2,max_ms=$3,lifecycle=$4,url=$5,revision=revision+1 where id=$1',[r.id,status,max,lifecycle,url]);
  await audit(db,actor,'configure',{id:r.id,before:{status:before.expected_status,max_ms:before.max_ms,lifecycle:before.lifecycle,url:before.url},after:{status,max_ms:max,lifecycle,url}});return {id:r.id,revision:before.revision+1};
 });
 if(cmd==='review')return transaction(db,async()=>{
  const c=await resolve(db,'collections',subject),owner=needed(o,'owner'),due=date(needed(o,'due'));
  await db.query('update collections set owner=$2,review_due=$3 where id=$1',[c.id,owner,due]);await audit(db,actor,'review',{id:c.id,owner,due});return {reviewed:c.name,owner,due};
 });
 if(cmd==='log')return transaction(db,async()=>{
  const c=await resolve(db,'collections',subject);const [r]=await db.query('insert into actions(collection_id,title,owner,due) values($1,$2,$3,$4) returning id,title',[c.id,needed(o,'title'),needed(o,'owner'),date(needed(o,'due'))]);
  await audit(db,actor,'log',r);return r;
 });
 if(cmd==='close-action')return transaction(db,async()=>{
  const a=await resolve(db,'actions',subject),resolution=needed(o,'resolution');const rows=await db.query("update actions set state='closed',resolution=$2 where id=$1 and state='open' returning id",[a.id,resolution]);
  if(!rows.length)throw Error('Action is already closed');await audit(db,actor,'close-action',{id:a.id,resolution});return {closed:a.name};
 });
 if(cmd==='run'){
  const found=await resolve(db,'requests',subject);const [r]=await db.query('select * from requests where id=$1',[found.id]);
  if(r.lifecycle!=='active')throw Error('Only active requests can run');
  if(!['GET','HEAD'].includes(r.method))throw Error('Only GET and HEAD can run; all other methods are inventory only');
  if(r.import_notes)throw Error('Import needs review: add a separately reviewed request for execution');
  if(r.url.includes('{{')||r.url.includes('}}'))throw Error('Resolve address variables before running');
  const u=new URL(r.url),host=needed(o,'allow-host');
  if(host!==u.host)throw Error('The exact host and port must match --allow-host');
  if(u.username||u.password||u.search)throw Error('Credentials and query values are not accepted by this runner');
  const isLocal=['127.0.0.1','localhost','[::1]'].includes(u.hostname);
  if(o['local-test']&&!isLocal)throw Error('--local-test is only for loopback fixtures');
  if(u.protocol!=='https:'&&!(o['local-test']&&isLocal&&u.protocol==='http:'))throw Error('HTTPS required, except an explicit loopback test');
  let status=null,error='',elapsed=0,passed=false;
  const start=performance.now();
  try{
   const response=await fetch(u,{method:r.method,redirect:'manual',signal:AbortSignal.timeout(r.max_ms),headers:{'User-Agent':'api-workbench/0.1'}});
   status=response.status;await response.body?.cancel();elapsed=Math.round(performance.now()-start);
   passed=status===r.expected_status&&elapsed<=r.max_ms;
   if(!passed)error=status!==r.expected_status?'Unexpected status':'Latency exceeded';
  }catch(e){elapsed=Math.round(performance.now()-start);error=e.name==='TimeoutError'?'Timeout':'Connection failed';}
  return transaction(db,async()=>{
   const [current]=await db.query('select revision from requests where id=$1 for update',[r.id]);
   const [saved]=await db.query('insert into runs(request_id,revision,status,elapsed_ms,passed,error,actor) values($1,$2,$3,$4,$5,$6,$7) returning id',[r.id,r.revision,status,elapsed,passed,error,actor]);
   await audit(db,actor,'run',{request:r.id,run:saved.id,revision:r.revision,passed});
   return {name:r.name,status,elapsed_ms:elapsed,passed,error,superseded:current.revision!==r.revision};
  });
 }
 if(cmd==='draft-handover'){
  const c=await resolve(db,'collections',subject);const rows=await db.query('select name,method,lifecycle,health from request_health where collection_id=$1 order by name',[c.id]);
  const file=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts',`handover-${c.id}-${Date.now()}.md`);mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
  writeFileSync(file,`# ${c.name}: handover draft\n\nPrepared by ${actor}. Review before sharing.\n\n${JSON.stringify(rows,null,2)}\n`,{flag:'wx',mode:0o600});return {file,requests:rows.length};
 }
 throw Error(`Unknown command ${cmd}. Run help.`);
}
function render(result){
 if(Array.isArray(result))return table(result,Object.keys(result[0]||{}).map(key=>({key,label:key,width:90,format:v=>v instanceof Date?v.toISOString():typeof v==='object'?JSON.stringify(v):String(v??'')})));
 if(result?.help)return result.help;
 return Object.entries(result).map(([k,v])=>Array.isArray(v)?`${k}\n${render(v)}`:`${k}: ${typeof v==='object'?JSON.stringify(v):v}`).join('\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const result=await execute(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):render(result));if(result?.passed===false||result?.superseded)process.exitCode=1;}
 catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}
}
