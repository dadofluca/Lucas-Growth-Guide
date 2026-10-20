/* Read-only bottle spacing. Sleep windows never become feeding intervals. */
(function(root){
 'use strict';
 const minute=60000;
 function estimate(entries,{now=Date.now(),sessions=root.LucaSleep?.resolve(entries,now)||new Map()}={}){
  now=+new Date(now);
  const seen=new Set(),feeds=entries.filter(e=>{
   const at=+new Date(e.at),id=e.syncId||e.id;
   if(!(Number(e.oz)>0)||!Number.isFinite(at)||at>now)return false;
   if(id!=null){if(seen.has(String(id)))return false;seen.add(String(id));}
   return true;
  }).sort((a,b)=>new Date(b.at)-new Date(a.at));
  const recent=feeds.filter(e=>now-new Date(e.at)<=7*86400000).slice(0,48);
  const source=new Map(entries.map(e=>[String(e.syncId||e.id),e]));
  const sleep=[...sessions.values()],intervals=[];
  const sameBaby=(a,b)=>!a?.babyId||!b?.babyId||a.babyId===b.babyId;
  let excludedSleep=0,excludedNight=0;
  for(let i=1;i<recent.length&&intervals.length<12;i++){
   const later=recent[i-1],earlier=recent[i],start=+new Date(earlier.at),end=+new Date(later.at),gap=(end-start)/minute;
   if(!sameBaby(earlier,later)||gap<45||gap>360)continue;
   const asleep=sleep.some(s=>{
    if(!sameBaby(earlier,source.get(String(s.id))))return false;
    if(s.ongoing&&Number.isFinite(s.start))return s.start<end;
    if(s.complete)return s.start<end&&s.end>start;
    // A bedtime or wake boundary is enough to reject the crossing interval.
    return (Number.isFinite(s.start)&&s.start>=start&&s.start<end)||(Number.isFinite(s.end)&&s.end>start&&s.end<=end);
   });
   if(asleep){excludedSleep++;continue;}
   const a=new Date(start),b=new Date(end),opening=new Date(a),closing=new Date(a);
   opening.setHours(6,0,0,0);closing.setHours(21,0,0,0);
   // Missing sleep logs must not admit overnight feeds. Use local calendar time.
   if(a.getFullYear()!==b.getFullYear()||a.getMonth()!==b.getMonth()||a.getDate()!==b.getDate()||start<+opening||end>+closing){excludedNight++;continue;}
   intervals.push(gap);
  }
  const learned=intervals.length>0,minutes=learned?Math.round(intervals.reduce((n,x)=>n+x,0)/intervals.length):180;
  return {minutes,learned,intervals,excludedSleep,excludedNight,last:feeds[0]||null,nextAt:feeds.length?+new Date(feeds[0].at)+minutes*minute:null};
 }
 const api={estimate};root.LucaBottleRhythm=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
