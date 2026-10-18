/* Structured sleep and legacy-note compatibility. No storage or network writes. */
(function(root){
 "use strict";
 const minute=60000,dayMs=86400000;
 const stamp=value=>value==null||value===""?NaN:new Date(value).getTime();
 const dateKey=value=>{const d=new Date(value);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
 const mean=values=>values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null;
 function duration(value){if(value==null||!Number.isFinite(value))return "—";const n=Math.round(value),h=Math.floor(n/60),m=n%60;return h?(h+"h"+(m?" "+m+"m":"")):m+"m";}
 function build({start,end,kind="nap",awake=null,wakeups=null,now=Date.now()}){
  const a=stamp(start),b=stamp(end),mins=(b-a)/minute;
  if(!Number.isFinite(a)||!Number.isFinite(b))throw Error("Choose a start and wake-up date and time.");
  if(b<=a)throw Error("Wake-up must follow the start. For overnight sleep, choose the next date.");
  if(mins>1440)throw Error("Check the dates: one sleep entry can cover up to 24 hours.");
  if(b>stamp(now)+minute)throw Error("The wake-up time is in the future. Choose when he woke up.");
  const optional=(value,label,max)=>{if(value===""||value==null)return null;const n=Number(value);if(!Number.isInteger(n)||n<0||n>max)throw Error("Check "+label+".");return n;};
  return {version:1,kind:kind==="night"?"night":"nap",start_at:new Date(a).toISOString(),end_at:new Date(b).toISOString(),awake_minutes:optional(awake,"minutes awake",Math.floor(mins)),wakeups:optional(wakeups,"wake-ups",100)};
 }
 function baseSession(event){
  const data=event.details?.sleep,note=String(event.notes||event.sourceText||""),at=stamp(event.at);
  let start=NaN,end=NaN,kind="nap",awake=null,wakeups=null,legacy=false;
  if(data&&typeof data==="object"){
   start=stamp(data.start_at);end=stamp(data.end_at);kind=data.kind==="night"?"night":"nap";
   if(data.awake_minutes!=null&&Number.isInteger(+data.awake_minutes)&&+data.awake_minutes>=0)awake=+data.awake_minutes;
   if(data.wakeups!=null&&Number.isInteger(+data.wakeups)&&+data.wakeups>=0)wakeups=+data.wakeups;
  }else if((event.tags||[]).includes("sleep")||event.event_type==="sleep"||((!(event.tags||[]).length||(event.tags||[]).includes("other"))&&/\b(?:slept|woke up|nap(?:ped)?)\b/i.test(note))){
   legacy=true;
   if(/Morning sleep check-in/i.test(note)){
    kind="night";end=at;const m=note.match(/(\d{1,2})h\s*(\d{1,2})m\s+in bed/i);if(m)start=end-(+m[1]*60+ +m[2])*minute;
   }else if(/\bNap\b/i.test(note)){
    start=at;const m=note.match(/\((?:(\d+)h\s*)?(\d+)m\)/i);if(m)end=start-0+(+(m[1]||0)*60+ +m[2])*minute;
    else{const clocks=[...note.matchAll(/(\d{1,2}):(\d{2})\s*(am|pm)?/ig)];if(clocks.length>=2){const clock=m=>+m[1]%12+(m[3]?.toLowerCase()==="pm"?12:!m[3]&&+m[1]>=12?12:0);let a=clock(clocks[0])*60+ +clocks[0][2],b=clock(clocks[1])*60+ +clocks[1][2];if(b<a)b+=1440;end=start+(b-a)*minute;}}
   }else{kind=/night|bedtime/i.test(note)?"night":"nap";if(/bedtime/i.test(note))start=at;else{end=at;const wake=note.match(/(?:until|till|woke\s*up\s*(?:at)?)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);if(wake){const d=new Date(at);d.setHours(+wake[1]%12+(wake[3].toLowerCase()==="pm"?12:0),+(wake[2]||0),0,0);end=d.getTime();}}}
   const w=note.match(/wakeups:\s*(\d+)(?![\d+])/i),a=note.match(/awake minutes:\s*(\d+)/i);
   if(w)wakeups=+w[1];if(a)awake=+a[1];
  }else return null;
  const mins=(end-start)/minute,complete=Number.isFinite(mins)&&mins>0&&mins<=1440;
  if(complete&&awake!=null&&awake>mins)awake=null;
  return {id:event.syncId||event.id,kind,start,end,minutes:complete?mins:null,awake,wakeups,complete,legacy};
 }
 function resolve(entries,now=Date.now()){return root.LucaSleepInference?root.LucaSleepInference.resolve(entries,{baseSession,now}):new Map(entries.map(e=>[String(e.syncId||e.id),baseSession(e)]).filter(([,s])=>s));}
 function session(event,entries=null,now=Date.now()){return resolve(entries||[event],now).get(String(event.syncId||event.id))||null;}
 function uniqueSessions(entries,now){
  const result=new Map();
  for(const s of resolve(entries,now).values()){if(!s)continue;if(s.complete&&s.end>now+minute)continue;
   const key=s.complete?s.kind+":"+s.start+":"+s.end:String(s.id),old=result.get(key);
   const score=x=>(x.awake!=null?2:0)+(x.wakeups!=null?1:0)+(!x.legacy?1:0);
   if(!old||score(s)>=score(old))result.set(key,s);
  }return [...result.values()];
 }
 // Union the logged windows so overlapping/repeated records never double totals.
 function recordedMinutes(sessions,from=-Infinity,to=Infinity,adjust=false){
  const spans=sessions.filter(s=>s.complete&&s.end>from&&s.start<to).map(s=>({...s,a:Math.max(from,s.start),b:Math.min(to,s.end)}));
  const edges=[...new Set(spans.flatMap(s=>[s.a,s.b]))].sort((a,b)=>a-b);let total=0;
  for(let i=1;i<edges.length;i++){
   const active=spans.filter(s=>s.a<edges[i]&&s.b>edges[i-1]);if(!active.length)continue;
   const known=active.filter(s=>s.awake!=null),candidates=known.length?known:active;
   const ratio=adjust?Math.max(...candidates.map(s=>s.awake==null?1:Math.max(0,1-s.awake/s.minutes))):1;
   total+=(edges[i]-edges[i-1])/minute*ratio;
  }return Math.round(total);
 }
 function summarize(entries,days=7,now=new Date()){
  const end=stamp(now),start=new Date(end);start.setHours(0,0,0,0);start.setDate(start.getDate()-days+1);
  const rows=[];for(let i=0;i<days;i++){const d=new Date(start);d.setDate(d.getDate()+i);rows.push({date:dateKey(d),nap:0,napCount:0,night:null,wakes:null,awake:null,actual:null,total:null,sessions:[]});}
  const byDate=new Map(rows.map(r=>[r.date,r])),sessions=uniqueSessions(entries,end);
  for(const s of sessions){const key=dateKey(s.kind==="night"&&Number.isFinite(s.end)?s.end:s.start),row=byDate.get(key);if(row)row.sessions.push(s);}
  for(const row of rows){
   const naps=row.sessions.filter(s=>s.kind==="nap"&&s.complete),nights=row.sessions.filter(s=>s.kind==="night"&&s.complete),observations=row.sessions.filter(s=>s.kind==="night"&&s.wakeups!=null);
   row.napCount=naps.length;row.nap=recordedMinutes(naps);
   if(nights.length){row.night=recordedMinutes(nights);if(nights.every(s=>s.awake!=null)){row.actual=recordedMinutes(nights,-Infinity,Infinity,true);row.awake=row.night-row.actual;}}
   if(observations.length)row.wakes=observations.reduce((n,s)=>n+s.wakeups,0);
   if(naps.length||nights.length)row.total=recordedMinutes([...naps,...nights],-Infinity,Infinity,true);
  }
  const nights=rows.filter(r=>r.night!=null),naps=rows.filter(r=>r.napCount),known=rows.filter(r=>r.actual!=null),wakes=rows.filter(r=>r.wakes!=null),logged=rows.filter(r=>r.total!=null);
  const recent=sessions.filter(s=>s.complete&&s.end>end-dayMs&&s.start<end),period=sessions.filter(s=>s.complete&&s.end>=start&&s.start<=end);
  return {days,rows,night:mean(nights.map(r=>r.night)),nightCount:nights.length,nap:mean(naps.map(r=>r.nap)),napCount:naps.length,napSessions:naps.reduce((n,r)=>n+r.napCount,0),wakes:wakes.length?Math.round(wakes.reduce((n,r)=>n+r.wakes,0)/wakes.length*10)/10:null,wakeCount:wakes.length,actualNight:mean(known.map(r=>r.actual)),actualCount:known.length,daily:mean(logged.map(r=>r.total)),loggedDays:logged.length,last24:recent.length?recordedMinutes(recent,end-dayMs,end,true):null,naps24:recent.filter(s=>s.kind==="nap").length,longest:period.length?Math.round(Math.max(...period.map(s=>s.minutes))):null,inferredCount:period.filter(s=>s.inferred).length,partialCount:sessions.filter(s=>!s.complete&&Math.max(s.start||0,s.end||0)>=start).length};
 }
 const api={build,session,resolve,baseSession,summarize,duration,dateKey,recordedMinutes};root.LucaSleep=api;if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
