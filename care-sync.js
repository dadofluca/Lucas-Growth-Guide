/* Shared care-event persistence. UI callers never issue their own event writes. */
(function(root){
 "use strict";
 function create({context,read,write,status,timeoutMs=12000,newId=()=>crypto.randomUUID()}){
  const flights=new Map(),deleted=new Set();let refreshFlight=null,clock=read().reduce((n,e)=>Math.max(n,e.syncedAt||0),0);
  const snapshot=()=>{const c=context();return {...c,user:c.user?{...c.user}:null}};
  const stamp=()=>++clock;
  const key=e=>String(e.syncId||e.id);
  const dirty=e=>!e.remote||e.pendingUpdate;
  function report(state,code){status?.({state,code,pending:read().filter(dirty).length});}
  function change(entries){write(entries);}
  function row(x){return {id:x.id,syncId:x.id,babyId:x.baby_id,at:x.event_time,oz:x.amount_oz==null?null:+x.amount_oz,tags:x.tags||[],people:x.caregivers||[],notes:x.note||"",event_type:x.event_type||"",source:x.details?.source||"",sourceText:x.details?.sourceText||"",details:x.details||{},remote:true};}
  function payload(e,c){return {baby_id:c.baby,event_type:e.oz?"feed":((e.tags||[])[0]||e.event_type||"other"),event_time:e.at,amount_oz:e.oz||null,note:e.notes||null,tags:e.tags||[],caregivers:e.people||[],details:{...e.details,source:e.source||"manual",sourceText:e.sourceText||null},created_by:c.user.id};}
  async function request(query){
   const controller=new AbortController();let timer;
   try{return await Promise.race([
    Promise.resolve(query.abortSignal(controller.signal)),
    new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Object.assign(new Error("Sync timed out"),{code:"timeout"}));},timeoutMs);})
   ]);}finally{clearTimeout(timer);}
  }
  function current(e){return read().find(x=>key(x)===key(e)||String(x.id)===String(e.id));}
  function sameContext(c){const now=context();return now.baby===c.baby&&now.user?.id===c.user?.id;}
  async function send(entry){
   const c=snapshot();if(!c.client||!c.baby||!c.user){report("local");return null;}
   if(entry.babyId&&entry.babyId!==c.baby){report("pending","family");return null;}
   let e=current(entry);if(!e)return null;
   if(!e.syncId||!e.babyId){e={...e,syncId:e.syncId||(e.remote?e.id:newId()),babyId:c.baby};change(read().map(x=>String(x.id)===String(e.id)?e:x));}
   const id=key(e);if(flights.has(id))return flights.get(id);
   const flight=(async()=>{
    try{
     let result;
     if(e.remote){
      result=await request(c.client.from("baby_events").update((({created_by,...fields})=>fields)(payload(e,c))).eq("id",e.id).eq("baby_id",c.baby).select().single());
     }else{
      result=await request(c.client.from("baby_events").insert({...payload(e,c),id:e.syncId}).select().single());
      // A response can be lost after the insert commits. Reuse the primary key on retry.
      if(result.error?.code==="23505")result=await request(c.client.from("baby_events").select("*").eq("id",e.syncId).eq("baby_id",c.baby).single());
     }
     if(result.error)throw result.error;
     if(!result.data)throw Object.assign(new Error("No saved row returned"),{code:"no-row"});
     if(!sameContext(c))return null;
     const latest=current(e);if(!latest)return result.data;
     const changed=(latest.revision||0)!==(e.revision||0);
     const saved=changed?{...latest,id:result.data.id,syncId:result.data.id,remote:true,pendingUpdate:true}:{...row(result.data),revision:e.revision||0};
     saved.syncedAt=stamp();
     change([...read().filter(x=>key(x)!==id&&String(x.id)!==String(e.id)&&String(x.id)!==String(result.data.id)),saved]);
     report(read().some(dirty)?"pending":"synced");return result.data;
    }catch(error){if(sameContext(c))report("pending",String(error.code||"network").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,30));return null;}
   })();
   flights.set(id,flight);
   try{return await flight;}finally{flights.delete(id);const latest=current(e);if(latest?.pendingUpdate&&(latest.revision||0)!==(e.revision||0))void send(latest);}
  }
  function save(entry){
   const previous=current(entry),c=context();
   const e={...previous,...entry,id:previous?.id||entry.id,remote:previous?.remote||entry.remote,revision:(previous?.revision||0)+1};
   if(!e.syncId)e.syncId=e.remote?e.id:newId();
   if(c.baby&&!e.babyId)e.babyId=c.baby;
   if(e.remote){
    e.pendingUpdate=true;
    e.details={...previous?.details,...e.details,original_event:previous?.details?.original_event||{event_time:previous?.at,amount_oz:previous?.oz,tags:previous?.tags||[],caregivers:previous?.people||[],note:previous?.notes||""},edited_at:new Date().toISOString()};
   }
   change([...read().filter(x=>String(x.id)!==String(e.id)&&key(x)!==key(e)),e]);report("pending");
   return send(e);
  }
  function refresh(){
   if(refreshFlight)return refreshFlight;
   const c=snapshot();if(!c.client||!c.baby||!c.user){report("local");return Promise.resolve(false);}
   refreshFlight=(async()=>{
    report("syncing");
    try{
     for(const e of read().filter(dirty)){if(!await send(e))break;}
     const started=clock;
     const {data,error}=await request(c.client.from("baby_events").select("*").eq("baby_id",c.baby).order("event_time",{ascending:false}));
     if(error)throw error;
     if(!sameContext(c))return false;
     if(!data?.length&&read().some(e=>e.remote)){report("pending","empty-result");return false;}
     const merged=new Map((data||[]).filter(x=>!deleted.has(String(x.id))).map(x=>[String(x.id),row(x)]));
     // Read the current queue AFTER the response: entries may have been logged or edited in flight.
     for(const e of read())if(dirty(e)||(e.syncedAt||0)>started)merged.set(key(e),e);
     change([...merged.values()]);
     const pending=read().some(dirty);report(pending?"pending":"synced");return !pending;
    }catch(error){if(sameContext(c))report("pending",String(error.code||"network").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,30));return false;}
   })();
   const result=refreshFlight;result.finally(()=>{if(refreshFlight===result)refreshFlight=null;});return result;
  }
  async function remove(entry){
   const c=snapshot(),e=current(entry)||entry,id=key(e);
   if(flights.has(id))await flights.get(id);
   const latest=current(e)||e;
   if(latest.remote||latest.babyId){
    if(!c.client||!c.baby||!c.user||!sameContext(c)||(latest.babyId&&latest.babyId!==c.baby))return false;
    try{
     const {data,error}=await request(c.client.from("baby_events").delete().eq("id",latest.remote?latest.id:id).eq("baby_id",c.baby).select("id"));
     if(error||!sameContext(c)||(latest.remote&&!data?.length))return false;
    }catch{return false;}
   }
   deleted.add(id);deleted.add(String(latest.id));
   change(read().filter(x=>key(x)!==id&&String(x.id)!==String(latest.id)));return true;
  }
  return {save,send,refresh,remove};
 }
 root.LucaCareSync={create};
})(globalThis);
