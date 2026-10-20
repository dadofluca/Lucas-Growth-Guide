/* Read-only contextual sleep inference. Source notes and care records stay untouched. */
(function(root){
 'use strict';
 const minute=60000,id=e=>String(e.syncId||e.id),time=v=>new Date(v).getTime();
 const clockPattern='(\\d{1,2}(?::\\d{2})?\\s*(?:a\\.?m\\.?|p\\.?m\\.?)?)';
 function clocks(raw,anchor,timeZone){
  // An unresolved wake clock cannot anchor a bedtime. Intl rejects NaN,
  // which otherwise aborts the entire background notification dispatch.
  if(!Number.isFinite(anchor))return [];
  const m=String(raw).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?$/i);if(!m)return [];
  const h=+m[1],mins=+(m[2]||0),ap=(m[3]||'').replaceAll('.','').toLowerCase();
  if(mins>59||h>23||(ap&&(h<1||h>12)))return [];
  const hours=ap?[h%12+(ap==='pm'?12:0)]:h>12||h===0?[h]:[h%12,h%12+12];
  if(timeZone){
   const parts=t=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(t).map(p=>[p.type,p.value]));
   const base=parts(anchor);
   return [-1,0,1].flatMap(offset=>hours.map(hour=>{const target=Date.UTC(+base.year,+base.month-1,+base.day+offset,hour,mins);let at=target;
    for(let i=0;i<4;i++){const p=parts(at),shown=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute),diff=target-shown;if(!diff)return at;at+=diff;}return NaN;
   })).filter(Number.isFinite);
  }
  return [-1,0,1].flatMap(offset=>hours.map(hour=>{const d=new Date(anchor);d.setDate(d.getDate()+offset);d.setHours(hour,mins,0,0);return +d;}));
 }
 function pastClock(raw,anchor,timeZone){return clocks(raw,anchor,timeZone).filter(t=>t<=anchor+minute&&anchor-t<18*3600000).sort((a,b)=>Math.abs(a-anchor)-Math.abs(b-anchor))[0]??NaN;}
 function counts(note){
  const exact=note.match(/(?:wake[- ]?ups?\s*:\s*(\d+)(?![\d+])|(\d+)\s*(?:wake[- ]?ups?|wakings))/i);
  const around=exact?note.slice(Math.max(0,exact.index-14),exact.index+exact[0].length):'';
  return {wakeups:exact&&!/maybe|about|around|roughly|~|\?/i.test(around)?+(exact[1]||exact[2]):null,awake:note.match(/awake minutes:\s*(\d+)/i)?.[1]??null};
 }
 function fromNote(e,base,now,timeZone){
  if(e.details?.sleep&&typeof e.details.sleep==='object')return base;
  const note=String(e.notes||e.sourceText||'').replace(/[–—]/g,'-'),at=time(e.at);
  if(!Number.isFinite(at)||! /\b(?:nap(?:ped|ping)?|slept|sleep|asleep|bedtime|down for (?:the )?night|woke|wake[ -]?up)\b/i.test(note))return base;
  if(/\b(?:will|tomorrow|hopefully|planning|trying to|going to|should (?:he|we)|didn['’]?t sleep|not asleep|hasn['’]?t slept)\b|\?/.test(note.toLowerCase()))return base;
  const range=note.match(new RegExp('\\bnap(?:ped)?(?:\\s+from)?\\s*[@:]?\\s*'+clockPattern+'\\s*(?:-|to|until)\\s*'+clockPattern,'i'));
  const stats=counts(note);
  if(range){
   const candidates=[];
   for(const start of clocks(range[1],at,timeZone))for(const end of clocks(range[2],at,timeZone)){
    const mins=(end-start)/minute;
    if(mins<=0||mins>480||end>now+minute||Math.min(Math.abs(start-at),Math.abs(end-at))>6*3600000)continue;
    candidates.push({start,end,score:Math.min(Math.abs(start-at),Math.abs(end-at))+Math.abs(start-at)*.05});
   }
   candidates.sort((a,b)=>a.score-b.score);
   if(candidates.length){const best=candidates[0];return {...base,id:id(e),kind:'nap',start:best.start,end:best.end,minutes:(best.end-best.start)/minute,awake:null,wakeups:null,complete:true,legacy:true,inferred:true,basis:'timed-nap-note',evidenceIds:[id(e)]};}
  }
  const night=/night|bedtime/i.test(note),wake=note.match(new RegExp('(?:until|till|woke(?:\\s*up)?\\s*(?:at)?|wake[- ]?up\\s*(?:at|:)?)\\s*'+clockPattern,'i'));
  const bedtime=/down for (?:the )?night|fell asleep|went (?:down|to sleep)|\bbedtime\b|asleep (?:at|since)/i.test(note);
  if(wake&&bedtime){
   const before=note.slice(0,wake.index),clock=before.match(new RegExp('(?:\\bat\\b|@|since)\\s*'+clockPattern,'i'));
   const end=pastClock(wake[1],at,timeZone),start=clock?pastClock(clock[1],end-minute,timeZone):NaN,mins=(end-start)/minute;
   if(Number.isFinite(mins)&&mins>0&&mins<=(night?1080:480)&&end<=now+minute)return {...base,id:id(e),kind:night?'night':'nap',start,end,minutes:mins,awake:stats.awake==null?null:+stats.awake,wakeups:stats.wakeups,complete:true,legacy:true,inferred:true,basis:'start-and-wake-note',evidenceIds:[id(e)]};
  }
  if(wake){const end=pastClock(wake[1],at,timeZone);if(Number.isFinite(end))return {...base,id:id(e),kind:night?'night':base?.kind||'nap',start:NaN,end,minutes:null,awake:stats.awake==null?null:+stats.awake,wakeups:stats.wakeups,complete:false,legacy:true,inferred:true,basis:'wake-note',evidenceIds:[id(e)]};}
  if(bedtime){
   const explicit=note.match(new RegExp('(?:\\bat\\b|@|since)\\s*'+clockPattern,'i'));
   const start=explicit?pastClock(explicit[1],at,timeZone):at;
   if(Number.isFinite(start))return {...base,id:id(e),kind:night?'night':'nap',start,end:NaN,minutes:null,awake:null,wakeups:null,complete:false,legacy:true,inferred:true,basis:'bedtime-note',evidenceIds:[id(e)]};
  }
  return base;
 }
 function resolve(entries,{baseSession,now=Date.now(),timeZone}={}){
  now=time(now);const result=new Map(),events=new Map(entries.map(e=>[id(e),e]));
  const sameBaby=(a,b)=>{const x=events.get(String(a.id))?.babyId,y=events.get(String(b.id))?.babyId;return !x||!y||x===y;};
  for(const e of entries){if((e.tags||[]).includes('stars')||e.details?.starChart)continue;const s=fromNote(e,baseSession(e),now,timeZone);if(s)result.set(id(e),s);}
  const complete=[...result.values()].filter(s=>s.complete&&!s.legacy),used=new Set();
  const starts=[...result.values()].filter(s=>s.kind==='night'&&!s.complete&&!s.ongoing&&Number.isFinite(s.start)).sort((a,b)=>b.start-a.start);
  const wakes=[...result.values()].filter(s=>s.kind==='night'&&!s.complete&&Number.isFinite(s.end)).sort((a,b)=>a.end-b.end);
  for(const wake of wakes){
   if(wake.end>now+minute)continue;
   const start=starts.find(s=>!used.has(s.id)&&s.start<wake.end&&wake.end-s.start<=18*3600000&&sameBaby(s,wake));
   if(!start)continue;used.add(start.id);
   const explicit=complete.find(s=>s.kind==='night'&&sameBaby(s,start)&&Math.abs(s.start-start.start)<=3*3600000&&Math.abs(s.end-wake.end)<=3*3600000);
   const session=explicit||{...wake,start:start.start,minutes:(wake.end-start.start)/minute,complete:true,inferred:true,basis:'bedtime-and-wake-notes',evidenceIds:[start.id,wake.id]};
   if(session.awake!=null&&session.awake>session.minutes)session.awake=null;
   result.set(start.id,{...session,id:start.id});result.set(wake.id,{...session,id:wake.id});
  }
  // A confirmed manual window supersedes a nearby partial note without double-counting it.
  for(const [key,s] of result)if(!s.complete&&!s.ongoing){const confirmed=complete.find(c=>c.kind===s.kind&&sameBaby(c,s)&&((Number.isFinite(s.start)&&Math.abs(c.start-s.start)<=30*minute)||(Number.isFinite(s.end)&&Math.abs(c.end-s.end)<=30*minute)));if(confirmed)result.set(key,{...confirmed,id:key});}
  return result;
 }
 root.LucaSleepInference={resolve};if(typeof module==='object'&&module.exports)module.exports={resolve};
})(typeof window!=='undefined'?window:globalThis);
