/* Luca P33 — reliable Smart Entry cloud write */
(function(){
 const badge=document.getElementById("patchBadge"); if(badge)badge.textContent="P33";
 const save=document.getElementById("smartSave"); if(!save||typeof pushEntry!=="function")return;
 let beforeIds=null;
 save.addEventListener("pointerdown",()=>{try{beforeIds=new Set((a||[]).map(x=>String(x.id)))}catch(e){beforeIds=null}},true);
 save.addEventListener("click",()=>{setTimeout(async()=>{try{
   if(!syncBaby||!syncUser)return;
   const candidates=(a||[]).filter(e=>!e.remote&&e.source==="smart"&&(!beforeIds||!beforeIds.has(String(e.id))));
   for(const e of candidates){const remote=await pushEntry(e);if(remote){a=a.filter(x=>x.id!==e.id);a.push({id:remote.id,at:remote.event_time,oz:remote.amount_oz==null?null:+remote.amount_oz,tags:remote.tags||[],people:remote.caregivers||[],notes:remote.note||"",event_type:remote.event_type||"",source:remote.details?.source||"smart",sourceText:remote.details?.sourceText||e.sourceText||"",remote:true})}}
   if(candidates.length){persist();render()}
 }catch(err){console.error("P33 smart sync retry",err);toast("Saved on this phone — sync will retry")}finally{beforeIds=null}},180)});
})();