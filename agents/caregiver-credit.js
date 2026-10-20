/* Recognition for the hands doing the care, independent of who keeps the notes. */
(function(root){
 'use strict';
 const identity=value=>String(value||'').trim().toLowerCase();
 const names=values=>(values||[]).flatMap(value=>String(value||'').split(/\s*(?:,|&|\+|\band\b)\s*/i)).map(identity).filter(Boolean);
 const day=value=>{const d=new Date(value);return [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-');};
 function summary(entries,person,{identities=[],babyId=null,now=Date.now()}={}){
  const target=identity(person),actors=new Map(identities.filter(x=>x?.user_id&&identity(x.person)).map(x=>[x.user_id,identity(x.person)])),seen=new Set(),days=new Set(),loggers=new Set();let count=0;
  if(!target||['luca','kj'].includes(target))return {count:0,days:0,loggers:0,earned:false};
  for(const e of entries||[]){
   const id=String(e.syncId||e.id||''),at=+new Date(e.at),tags=e.tags||[],author=actors.get(e.createdBy||e.created_by);
   if(!id||seen.has(id)||!Number.isFinite(at)||at>+new Date(now)||e.test_event||e.details?.test_event||tags.includes('stars')||e.details?.starChart||(babyId&&(e.babyId||e.baby_id)&&(e.babyId||e.baby_id)!==babyId))continue;
   seen.add(id);
   if(!author||author===target||!names(e.people||e.caregivers).includes(target))continue;
   if(!(Number(e.oz??e.amount_oz)>0||['feed','feeding','poop','pee','sleep','solids','medicine','bath','walk','play'].includes(e.event_type)||tags.some(t=>['poop','pee','sleep','solids','medicine','bath','walk','play'].includes(t))))continue;
   count++;days.add(day(e.at));loggers.add(author);
  }
  return {count,days:days.size,loggers:loggers.size,earned:count>=5&&days.size>=3};
 }
 const api={summary};root.LucaCaregiverCredit=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
