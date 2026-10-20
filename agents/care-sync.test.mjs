import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
const sandbox={setTimeout,clearTimeout,AbortController,crypto:{randomUUID}};
vm.runInNewContext(readFileSync(new URL('../care-sync.js',import.meta.url),'utf8'),sandbox);
const create=sandbox.LucaCareSync.create;
const pause=()=>new Promise(r=>setImmediate(r));
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function harness(){
 let entries=[],mode='ok',wait=null,selectWait=null;const rows=new Map(),calls=[],statuses=[];
 const c={baby:'baby-a',user:{id:'user-a'}};
 c.client={from(table){assert.equal(table,'baby_events');let op='select',payload,filters={};const q={
  delete(){op='delete';return q},insert(p){op='insert';payload=p;return q},update(p){op='update';payload=p;return q},select(){return q},eq(k,v){filters[k]=v;return q},order(){return q},single(){return q},
  async abortSignal(signal){
   calls.push({op,payload,filters});
   if(mode==='hang')return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{code:'timeout'}))));
   if(mode==='fail')return {error:{code:'network'}};
   if(wait){const w=wait;wait=null;await w.promise;}
   if(op==='insert'){
    if(rows.has(payload.id))return {error:{code:'23505'}};
    rows.set(payload.id,{...payload});
    if(mode==='lost'){mode='ok';return {error:{code:'network'}};}
    return {data:{...payload}};
   }
   if(op==='delete'){const old=rows.get(filters.id);if(old&&old.baby_id===filters.baby_id){rows.delete(old.id);return {data:[{id:old.id}]}}return {data:[]};}
   if(op==='update'){
    const old=rows.get(filters.id);
    if(!old||old.baby_id!==filters.baby_id)return {error:{code:'PGRST116'}};
    const saved={...old,...payload};rows.set(saved.id,saved);return {data:saved};
   }
   const selected=[...rows.values()].filter(x=>!filters.baby_id||x.baby_id===filters.baby_id).filter(x=>!filters.id||x.id===filters.id).map(x=>({...x}));
   if(selectWait){const w=selectWait;selectWait=null;await w.promise;}
   return {data:filters.id?selected[0]:selected};
  }
 };return q;}};
 const store=create({context:()=>c,read:()=>entries,write:x=>{entries=x},status:x=>statuses.push(x),timeoutMs:30,newId:randomUUID});
 return {store,c,rows,calls,statuses,get entries(){return entries},set entries(x){entries=x},set mode(x){mode=x},set wait(x){wait=x},set selectWait(x){selectWait=x}};
}
const entry=(id='local-1',oz=6)=>({id,at:'2026-10-18T13:00:00Z',oz,tags:[],people:['Synthetic caregiver'],notes:''});
test('P152: an older refresh response cannot restore 6:51 after a 6:30 PM edit',async()=>{
 const h=harness();await h.store.save({...entry(),at:'2026-10-20T22:51:00Z',people:['Sam']});const id=h.entries[0].id,w=deferred();h.selectWait=w;const refresh=h.store.refresh();await pause();
 await h.store.save({...h.entries[0],at:'2026-10-20T22:30:00Z',people:['Maddie','KJ']});w.resolve();await refresh;
 assert.equal(h.entries.length,1);assert.equal(h.entries[0].id,id);assert.equal(h.entries[0].at,'2026-10-20T22:30:00Z');assert.equal(h.rows.get(id).event_time,'2026-10-20T22:30:00Z');assert.equal(h.rows.get(id).created_by,'user-a');
});
test('P152: consecutive time edits during an in-flight update keep the newest time and caregivers',async()=>{
 const h=harness();await h.store.save({...entry(),at:'2026-10-20T22:51:00Z',people:['Sam']});const id=h.entries[0].id,w=deferred();h.wait=w;
 const first=h.store.save({...h.entries[0],at:'2026-10-20T22:40:00Z'});const second=h.store.save({...h.entries[0],at:'2026-10-20T22:30:00Z',people:['Maddie','KJ']});w.resolve();await Promise.all([first,second]);await pause();
 assert.equal(h.rows.size,1);assert.equal(h.entries[0].at,'2026-10-20T22:30:00Z');assert.equal(h.rows.get(id).event_time,'2026-10-20T22:30:00Z');assert.deepEqual(Array.from(h.entries[0].people),['Maddie','KJ']);
});
test('P142: pagination retains the star opening record beyond the first thousand care logs',async()=>{
 const h=harness(),ranges=[],from=h.c.client.from;
 for(let i=0;i<1000;i++)h.rows.set('care-'+i,{id:'care-'+i,baby_id:'baby-a',event_time:'2026-10-18T12:00:00Z',amount_oz:8,tags:[],caregivers:['Sam']});
 h.rows.set('opening',{id:'opening',baby_id:'baby-a',event_time:'2026-10-01T12:00:00Z',tags:['stars'],caregivers:['KJ'],details:{starChart:{action:'opening',person:'KJ',delta:33}}});
 h.c.client.from=table=>{const q=from(table),request=q.abortSignal;let range=null;q.range=(start,end)=>{range=[start,end];ranges.push(range);return q;};q.abortSignal=async signal=>{const r=await request(signal);if(range&&Array.isArray(r.data))r.data=r.data.slice(range[0],range[1]+1);return r;};return q;};
 assert.equal(await h.store.refresh(),true);assert.equal(h.entries.length,1001);assert.deepEqual(ranges,[[0,499],[500,999],[1000,1499]]);
 vm.runInNewContext(readFileSync(new URL('./family-stars.js',import.meta.url),'utf8'),sandbox);assert.equal(sandbox.LucaFamilyStars.state(h.entries,'KJ').balance,33);
});
test('P142: a failed later history page preserves the previous complete cache',async()=>{
 const h=harness(),from=h.c.client.from;h.entries=[{...entry('cached'),remote:true,babyId:'baby-a'}];
 for(let i=0;i<600;i++)h.rows.set('care-'+i,{id:'care-'+i,baby_id:'baby-a',event_time:'2026-10-18T12:00:00Z',tags:[],caregivers:['Sam']});
 h.c.client.from=table=>{const q=from(table),request=q.abortSignal;let start=0,end=499;q.range=(a,b)=>{start=a;end=b;return q;};q.abortSignal=async signal=>start>=500?{error:{code:'network'}}:{data:(await request(signal)).data.slice(start,end+1)};return q;};
 assert.equal(await h.store.refresh(),false);assert.equal(h.entries.length,1);assert.equal(h.entries[0].id,'cached');assert.equal(h.statuses.at(-1).code,'network');
});
test('care save persists before the remote request completes and serializes duplicate sends',async()=>{
 const h=harness(),w=deferred();h.wait=w;
 const saving=h.store.save(entry());assert.equal(h.entries.length,1);assert.equal(h.entries[0].remote,undefined);
 const retry=h.store.send(h.entries[0]);assert.equal(h.calls.length,1);w.resolve();await Promise.all([saving,retry]);
 assert.equal(h.rows.size,1);assert.equal(h.entries.length,1);assert.equal(h.entries[0].remote,true);
});
test('a committed insert with a lost response is recovered by its stable primary key after reload',async()=>{
 const h=harness();h.mode='lost';await h.store.save(entry());assert.equal(h.rows.size,1);assert.equal(h.entries[0].remote,undefined);
 const savedId=h.entries[0].syncId;
 // Recreate the store to prove the identity survives loss of in-memory flight state.
 const restarted=create({context:()=>h.c,read:()=>h.entries,write:x=>h.entries=x,newId:randomUUID});
 await restarted.refresh();assert.equal(h.rows.size,1);assert.equal(h.entries.length,1);assert.equal(h.entries[0].id,savedId);assert.equal(h.entries[0].remote,true);
});
test('refreshes share one request and retain an entry created during an older timeline response',async()=>{
 const h=harness(),w=deferred();h.selectWait=w;
 const first=h.store.refresh(),second=h.store.refresh();assert.equal(first,second);await pause();
 await h.store.save(entry());w.resolve();await first;
 assert.equal(h.entries.length,1);assert.equal(h.entries[0].oz,6);assert.equal(h.rows.size,1);
});
test('an entry saved offline during refresh remains queued',async()=>{
 const h=harness(),w=deferred();h.selectWait=w;const refreshing=h.store.refresh();await pause();
 h.mode='fail';await h.store.save(entry());w.resolve();await refreshing;
 assert.equal(h.entries.length,1);assert.equal(h.entries[0].oz,6);assert.equal(h.entries[0].remote,undefined);
 assert.equal(h.statuses.at(-1).state,'pending');
});
test('failed edits survive refresh and retry against the same row without changing its creator',async()=>{
 const h=harness();await h.store.save(entry());const id=h.entries[0].id;
 h.mode='fail';await h.store.save({...h.entries[0],oz:7,at:'2026-10-18T12:00:00Z',people:['Another caregiver']});
 assert.equal(h.entries[0].pendingUpdate,true);await h.store.refresh();assert.equal(h.entries[0].oz,7);
 h.mode='ok';h.c.user={id:'user-b'};await h.store.refresh();
 assert.equal(h.rows.size,1);assert.equal(h.entries[0].id,id);assert.equal(h.entries[0].oz,7);assert.equal(h.entries[0].pendingUpdate,undefined);
 assert.equal(h.rows.get(id).created_by,'user-a');assert.deepEqual(Array.from(h.entries[0].people),['Another caregiver']);
});
test('editing an entry while its insert is in flight preserves and uploads the newest values',async()=>{
 const h=harness(),w=deferred();h.wait=w;const first=h.store.save(entry());
 const edit=h.store.save({...h.entries[0],oz:8});w.resolve();await Promise.all([first,edit]);await pause();
 assert.equal(h.rows.size,1);assert.equal(h.entries[0].oz,8);assert.equal([...h.rows.values()][0].amount_oz,8);assert.equal(h.entries[0].pendingUpdate,undefined);
});
test('failed reads and unexpected empty reads preserve cached history',async()=>{
 const h=harness();await h.store.save(entry());const previous=h.entries[0];
 h.mode='fail';assert.equal(await h.store.refresh(),false);assert.equal(h.entries[0],previous);
 h.mode='ok';h.rows.clear();assert.equal(await h.store.refresh(),false);assert.equal(h.entries[0],previous);assert.equal(h.statuses.at(-1).code,'empty-result');
});
test('a stalled network request times out and releases the queue for retry',async()=>{
 const h=harness();h.mode='hang';await h.store.save(entry());assert.equal(h.entries.length,1);assert.equal(h.statuses.at(-1).state,'pending');
 h.mode='ok';await h.store.refresh();assert.equal(h.rows.size,1);assert.equal(h.entries[0].remote,true);
});
test('sign-out or switching family during a read cannot replace the active timeline',async()=>{
 const h=harness(),w=deferred();h.selectWait=w;const first=h.store.refresh();await pause();h.c.baby='baby-b';h.c.user=null;w.resolve();assert.equal(await first,false);assert.equal(h.entries.length,0);
});
test('an event bound to another family is retained locally and is never uploaded to the new family',async()=>{
 const h=harness();h.entries=[{...entry(),syncId:randomUUID(),babyId:'other-baby'}];assert.equal(await h.store.refresh(),false);assert.equal(h.rows.size,0);assert.equal(h.entries.length,1);
});

test('undo from a pre-sync snapshot updates the existing remote row',async()=>{
 const h=harness(),original=entry();await h.store.save(original);await h.store.save({...h.entries[0],oz:8});
 await h.store.save({...original,syncId:h.entries[0].syncId});assert.equal(h.rows.size,1);assert.equal([...h.rows.values()][0].amount_oz,6);
});
test('a restarted store accepts newer shared values instead of retaining old sync stamps',async()=>{
 const h=harness();await h.store.save(entry());const id=h.entries[0].id;h.rows.set(id,{...h.rows.get(id),amount_oz:5});
 const restarted=create({context:()=>h.c,read:()=>h.entries,write:x=>h.entries=x,newId:randomUUID});await restarted.refresh();assert.equal(h.entries[0].oz,5);
});
test('a confirmed delete is not resurrected by an older timeline response',async()=>{
 const h=harness();await h.store.save(entry());const w=deferred();h.selectWait=w;const reading=h.store.refresh();await pause();
 assert.equal(await h.store.remove(h.entries[0]),true);w.resolve();await reading;assert.equal(h.entries.length,0);assert.equal(h.rows.size,0);
});
test('failed shared deletion retains the entry',async()=>{
 const h=harness();await h.store.save(entry());h.mode='fail';assert.equal(await h.store.remove(h.entries[0]),false);assert.equal(h.entries.length,1);
});

test('a discarded local entry in an older retry snapshot is not inserted later',async()=>{
 const h=harness();assert.equal(await h.store.send(entry()),null);assert.equal(h.calls.length,0);assert.equal(h.rows.size,0);
});
test('offline entries are bound to the selected baby before their first request',async()=>{
 const h=harness();h.c.baby=null;h.c.user=null;await h.store.save(entry());assert.equal(h.entries[0].babyId,undefined);
 h.c.baby='baby-a';h.c.user={id:'user-a'};const w=deferred();h.wait=w;const syncing=h.store.refresh();
 assert.equal(h.entries[0].babyId,'baby-a');w.resolve();await syncing;assert.equal(h.entries[0].remote,true);
});

test('one stalled upload does not make refresh wait through the entire pending queue',async()=>{
 const h=harness();h.c.baby=null;h.c.user=null;
 for(let i=0;i<5;i++)await h.store.save(entry('queued-'+i));
 h.c.baby='baby-a';h.c.user={id:'user-a'};h.mode='hang';
 assert.equal(await h.store.refresh(),false);assert.equal(h.calls.length,2);assert.equal(h.entries.length,5);
});
