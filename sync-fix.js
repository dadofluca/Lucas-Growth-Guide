/* Luca P34 — direct inline Save -> Supabase */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P34";
 const btn=document.getElementById("inlineSave");if(!btn)return;
 btn.onclick=async function(){
  if(smartSaving)return;
  if(!smartItems.length&&!smartSupplyItems.length)return toast("Nothing to save");
  if(smartItems.some(smartNeedsChoice))return toast("Answer the highlighted choice first");
  smartSaving=true;btn.disabled=true;
  try{
   const baseText=document.getElementById("smartText").value.trim();
   const made=[];
   for(const it of smartItems){
    let at=new Date();
    if(it.clock)at=it.clock.ambiguous?inferDateFromChoice(it.clock,it.clockChoice):it.clock.date;
    else if(it.start)at=it.start.ambiguous?inferDateFromChoice(it.start,it.startChoice):it.start.date;
    let tags=it.kind==="feed"?[]:[it.kind],notes="";
    if(it.kind==="sleep"&&it.start&&it.end){let sd=it.start.ambiguous?inferDateFromChoice(it.start,it.startChoice):it.start.date,ed=it.end.ambiguous?inferDateFromChoice(it.end,it.endChoice):it.end.date;if(ed<=sd)ed.setDate(ed.getDate()+1);let mins=Math.round((ed-sd)/60000);notes="Nap "+it.start.raw+"–"+it.end.raw+" ("+Math.floor(mins/60)+"h "+mins%60+"m)"}
    else if(it.kind==="solids")notes=it.label.replace(/^🥣\s*/,"")+(it.relative?"; "+it.relative:"");
    else if(it.kind==="other")notes=it.note||baseText;
    else if(it.kind==="medicine")notes=it.label.replace(/^💊\s*/,"")+(it.dose?" · Dose: "+it.dose:"");
    made.push({id:Date.now()+"-"+Math.random(),at:at.toISOString(),oz:it.oz||null,tags,people:[it.credit||deviceCaregiver()],notes,source:"smart",sourceText:it.raw||it.label||baseText});
   }
   for(const s of smartSupplyItems){let item=supplies.find(x=>x.name.toLowerCase()===s.name.toLowerCase());if(item&&syncUser)await setSupply(item.id,"low");else{let p=JSON.parse(localStorage.getItem("luca-pending-supplies")||"{}");p[s.name]="low";localStorage.setItem("luca-pending-supplies",JSON.stringify(p))}}
   for(const e of made){
    a.push(e);persist();
    if(syncBaby&&syncUser){const remote=await pushEntry(e);if(remote){a=a.filter(x=>x.id!==e.id);a.push({id:remote.id,at:remote.event_time,oz:remote.amount_oz==null?null:+remote.amount_oz,tags:remote.tags||[],people:remote.caregivers||[],notes:remote.note||"",event_type:remote.event_type||"",source:remote.details?.source||"smart",sourceText:remote.details?.sourceText||e.sourceText||"",remote:true})}}
   }
   persist();render();
   document.getElementById("quickText").value="";document.getElementById("smartText").value="";
   smartItems=[];smartSupplyItems=[];renderSmart();document.getElementById("inlineClarify").classList.remove("show");
   toast(syncBaby&&syncUser?"Saved + synced ✓":"Saved on this phone");
  }catch(err){console.error("P34 direct save",err);toast("Saved on this phone — sync failed")}
  finally{smartSaving=false;btn.disabled=false}
 };
})();

/* P35 — supplies readability, unobstructed supply controls, sound feedback */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P35";
 

 let ctx=null;
 function audio(){ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume();return ctx}
 function ping(freq=660,d=.09,delay=0){try{let x=audio(),o=x.createOscillator(),g=x.createGain(),t=x.currentTime+delay;o.type="sine";o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.028,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(x.destination);o.start(t);o.stop(t+d)}catch(e){}}
 window.lucaSound={
  saved(){ping(587,.08);ping(784,.12,.07)},
  deleted(){ping(330,.08);ping(220,.12,.07)},
  edited(){ping(523,.07);ping(659,.09,.06)}
 };
 const oldToast=window.toast;
 if(typeof oldToast==="function")window.toast=function(s){oldToast(s);if(/saved|logged|added|synced|restocked|running low/i.test(s))window.lucaSound.saved();else if(/deleted|removed/i.test(s))window.lucaSound.deleted();else if(/updated|changes/i.test(s))window.lucaSound.edited()};
})();

/* P36 — edit mode is single-choice, truthful, and visually obvious */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P36";
 

 // Editing a caregiver means replacing the old caregiver, not adding another.
 document.querySelectorAll("#manualComposer [data-person]").forEach(b=>{
   b.addEventListener("click",()=>{
     if(!editId)return;
     const chosen=b.dataset.person;
     people.clear();
     document.querySelectorAll("#manualComposer [data-person]").forEach(x=>x.classList.remove("on"));
     people.add(chosen);b.classList.add("on");
     if(chosen!=="Other"){const o=document.getElementById("otherPerson");o.value="";o.style.display="none"}
     else document.getElementById("otherPerson").style.display="block";
   });
 });

 // In edit mode, ounce buttons are radio buttons and update displayed details.
 document.querySelectorAll("#manualComposer [data-oz]").forEach(b=>{
   b.addEventListener("click",()=>{
     if(!editId)return;
     ozPick=+b.dataset.oz;
     document.querySelectorAll("#manualComposer [data-oz]").forEach(x=>x.classList.toggle("on",x===b));
     const n=document.getElementById("notes");
     if(n&&/^\s*\d+(?:\.\d+)?\s*oz\b/i.test(n.value))n.value=n.value.replace(/^\s*\d+(?:\.\d+)?\s*oz\b/i,ozPick+" oz");
   });
 });

 // The original smart sentence is provenance, not the editable note.
 // On entering edit mode show the structured note; for a plain bottle leave it blank.
 document.addEventListener("click",e=>{
   const b=e.target.closest("[data-edit]");if(!b)return;
   setTimeout(()=>{
     const row=a.find(x=>String(x.id)===String(b.dataset.edit));
     if(!row)return;
     const n=document.getElementById("notes");
     n.value=row.notes||"";
   },0);
 },true);
})();

/* P37 — event time is when it happened; edits preserve provenance + undo */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P37";
 

 // Preserve original event state before editing, so Undo can restore the shared row.
 let editSnapshots={};
 document.addEventListener("click",e=>{
   const b=e.target.closest("[data-edit]");if(!b)return;
   const row=a.find(x=>String(x.id)===String(b.dataset.edit));
   if(row)editSnapshots[String(row.id)]=JSON.parse(JSON.stringify(row));
 },true);

 const baseUpdate=window.updateRemote;
 window.updateRemote=async function(e){
   if(!syncBaby||!e.remote)return;
   const prior=editSnapshots[String(e.id)];
   const details={};
   if(prior){
     details.original_event={
       event_time:prior.at,amount_oz:prior.oz,tags:prior.tags||[],
       caregivers:prior.people||[],note:prior.notes||"",
       sourceText:prior.sourceText||""
     };
     details.edited_at=new Date().toISOString();
   }
   const payload={event_time:e.at,amount_oz:e.oz||null,note:e.notes||null,tags:e.tags||[],caregivers:e.people||[],event_type:e.oz?"feed":((e.tags&&e.tags[0])||"other")};
   if(prior)payload.details={source:prior.source||"smart",sourceText:prior.sourceText||null,...details};
   const {error}=await sb.from("baby_events").update(payload).eq("id",e.id);
   if(error)toast("Couldn't save shared edit");
 };

 window.undoLucaEdit=async function(id){
   const old=editSnapshots[String(id)];if(!old)return toast("Nothing to undo");
   let cur=a.find(x=>String(x.id)===String(id));if(!cur)return;
   const restored={...old,id:cur.id,remote:cur.remote};
   a=a.map(x=>String(x.id)===String(id)?restored:x);persist();render();
   if(restored.remote)await sb.from("baby_events").update({
     event_time:restored.at,amount_oz:restored.oz||null,note:restored.notes||null,
     tags:restored.tags||[],caregivers:restored.people||[],
     event_type:restored.oz?"feed":((restored.tags&&restored.tags[0])||"other"),
     details:{source:restored.source||"smart",sourceText:restored.sourceText||null}
   }).eq("id",id);
   delete editSnapshots[String(id)];toast("Edit undone ✓");
 };

 // After a successful edit, offer a short-lived Undo action without changing original provenance.
 document.getElementById("saveEntry")?.addEventListener("click",()=>{
   const id=editId;if(!id)return;
   setTimeout(()=>{
     if(!editSnapshots[String(id)])return;
     const t=document.getElementById("toast");if(!t)return;
     t.innerHTML='Entry updated ✓ <button class="undoEdit" type="button">Undo</button>';
     t.classList.add("on");
     t.querySelector(".undoEdit")?.addEventListener("click",()=>window.undoLucaEdit(id));
   },80);
 },true);
})();

/* P38 — edits change current event time + current display text, originals remain in details */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P38";

 function extractTime(text,base){
   text=(text||"").trim();
   let m=text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
   if(!m)return null;
   let h=+m[1],min=+(m[2]||0),ap=m[3].toLowerCase();
   if(h<1||h>12||min>59)return null;
   if(h===12)h=0;if(ap==="pm")h+=12;
   let d=new Date(base||Date.now());d.setHours(h,min,0,0);return d;
 }
 function currentSummary(e){
   let bits=[];
   if(e.oz)bits.push(e.oz+" oz bottle");
   if((e.tags||[]).includes("poop"))bits.push("poop");
   if((e.tags||[]).includes("solids"))bits.push(e.notes||"solids");
   if((e.tags||[]).includes("medicine"))bits.push(e.notes||"medicine");
   if((e.tags||[]).includes("activity"))bits.push(e.notes||"activity");
   if(!bits.length&&e.notes)bits.push(e.notes);
   if(e.people&&e.people.length)bits.push("by "+e.people.join(" & "));
   return bits.join(" · ");
 }

 // If someone types a new explicit time while editing, make that the actual event_time.
 document.getElementById("saveEntry")?.addEventListener("click",()=>{
   if(!editId)return;
   const id=editId;
   const note=document.getElementById("notes")?.value||"";
   const explicit=extractTime(note,a.find(x=>String(x.id)===String(id))?.at);
   if(!explicit)return;
   const row=a.find(x=>String(x.id)===String(id));
   if(row){row.at=explicit.toISOString();persist();render();if(row.remote)updateRemote(row)}
 },true);

 // Make the visible card describe CURRENT structured truth after edits.
 // Keep original typed sentence available only as provenance in the database.
 const baseRender=window.render;
 window.render=function(){
   baseRender();
   document.querySelectorAll("[data-edit]").forEach(btn=>{
     const row=a.find(x=>String(x.id)===String(btn.dataset.edit));
     if(!row)return;
     const card=btn.closest(".entry");if(!card)return;
     const labels=[...card.querySelectorAll("div")].filter(x=>x.textContent.trim()==="Original message");
     for(const label of labels){
       const next=label.nextElementSibling;
       if(row.remote && row.sourceText){
         label.textContent="Current details";
         if(next)next.textContent=currentSummary(row);
       }
     }
   });
 };
 render();
})();

/* P39 — edit form contrast/readability */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P39";
 
})();

/* P40 — full-app cosmetic audit / unified warm accessible theme */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P40";
 
})();

/* P41 — Luca Now: live, data-driven care snapshot */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P41";
 

 function fmtAgo(ms){let m=Math.max(0,Math.round(ms/60000));if(m<60)return m+"m ago";let h=Math.floor(m/60),r=m%60;return h+"h"+(r?(" "+r+"m"):"")+" ago"}
 function fmtClock(d){return d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}
 function snapshot(){
   const now=new Date(),today=now.toDateString();
   const feeds=(a||[]).filter(e=>e.oz&&e.at).sort((x,y)=>new Date(y.at)-new Date(x.at));
   const todayFeeds=feeds.filter(e=>new Date(e.at).toDateString()===today);
   const total=todayFeeds.reduce((s,e)=>s+(+e.oz||0),0);
   const poops=(a||[]).filter(e=>new Date(e.at).toDateString()===today&&(e.tags||[]).includes("poop")).length;
   const solids=(a||[]).filter(e=>new Date(e.at).toDateString()===today&&(e.tags||[]).includes("solids")).length;
   const last=feeds[0]||null;
   let intervals=[];
   for(let i=0;i<Math.min(feeds.length-1,10);i++){let x=(new Date(feeds[i].at)-new Date(feeds[i+1].at))/60000;if(x>=45&&x<=360)intervals.push(x)}
   let avg=intervals.length?intervals.reduce((s,x)=>s+x,0)/intervals.length:null;
   let next=last&&avg?new Date(new Date(last.at).getTime()+avg*60000):null;
   let insight=feeds.length>=3?"Based on Luca's recent confirmed bottles. Estimates adjust as the family logs more.":"Keep logging confirmed feeds and Luca's rhythm will become more accurate.";
   return {last,total,poops,solids,avg,next,insight};
 }
 function paint(){
   const host=document.querySelector("#todayView .quickhome");if(!host)return;
   let box=document.getElementById("lucaNow");
   if(!box){box=document.createElement("div");box.id="lucaNow";box.className="lucaNow";host.insertBefore(box,host.firstChild)}
   const s=snapshot();
   box.innerHTML='<div class="lucaNowTitle"><span>🧸 Luca Now</span><small>LIVE FAMILY LOG</small></div>'+
   '<div class="nowGrid">'+
   '<div class="nowStat"><span>Last bottle</span><b>'+(s.last?(s.last.oz+' oz · '+fmtAgo(Date.now()-new Date(s.last.at))):'No feed yet')+'</b></div>'+
   '<div class="nowStat"><span>Estimated next</span><b>'+(s.next?('~'+fmtClock(s.next)):'Learning…')+'</b></div>'+
   '<div class="nowStat"><span>Today</span><b>'+s.total.toFixed(s.total%1?1:0)+' oz</b></div>'+
   '<div class="nowStat"><span>Care</span><b>'+s.poops+' poop'+(s.poops===1?'':'s')+' · '+s.solids+' food</b></div>'+
   '</div><div class="nowInsight">'+s.insight+'</div>';
 }
 const base=window.render;window.render=function(){base();paint()};paint();
 setInterval(paint,60000);
})();

/* P42 — Teddy private caregiver chat */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P42";
 const insights=document.getElementById("insightsView");if(!insights)return;
 const card=document.createElement("section");card.className="card";card.id="teddyCard";
 card.innerHTML='<div class="teddyHead"><div class="teddyFace">🧸</div><div><h2>Teddy</h2><div class="why">Your private Luca assistant · shared Luca facts, private conversation</div></div></div><div id="teddyChat" class="teddyChat"><div class="teddyBubble ai">Hi — I’m Teddy. Ask me about Luca’s recent bottles, patterns, handoffs, sleep, diapers or anything in his shared log.</div></div><div class="teddyAsk"><textarea id="teddyText" placeholder="Ask Teddy about Luca…"></textarea><button id="teddySend" class="confirm">Ask Teddy</button></div>';
 insights.insertBefore(card,insights.children[1]||null);
 
 async function load(){
  if(!syncUser||!syncFamily)return;
  const {data}=await sb.from("teddy_messages").select("role,content").eq("user_id",syncUser.id).eq("family_id",syncFamily).order("created_at").limit(40);
  if(data?.length)document.getElementById("teddyChat").innerHTML=data.map(x=>'<div class="teddyBubble '+(x.role==="user"?"me":"ai")+'">'+esc(x.content)+'</div>').join("");
 }
 document.getElementById("teddySend").onclick=async()=>{
  const input=document.getElementById("teddyText"),q=input.value.trim();if(!q)return;
  if(!syncUser)return toast("Connect Family Sync first");
  const chat=document.getElementById("teddyChat");chat.insertAdjacentHTML("beforeend",'<div class="teddyBubble me">'+esc(q)+'</div>');input.value="";chat.scrollTop=chat.scrollHeight;
  const wait=document.createElement("div");wait.className="teddyBubble ai";wait.textContent="Teddy is thinking…";chat.appendChild(wait);
  const {data,error}=await sb.functions.invoke("teddy-chat",{body:{message:q}});
  wait.textContent=error?"Teddy couldn't answer just now.":(data?.answer||data?.error||"Teddy couldn't answer just now.");chat.scrollTop=chat.scrollHeight;
 };
 document.querySelector('nav button[data-tab="insights"]')?.addEventListener("click",()=>setTimeout(load,150));
 setTimeout(load,1200);
})();

/* P43 — one-tap Quick Bottle from persistent bottle dock */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P43";
 
 const bottle=[...document.querySelectorAll(".careDock button")].find(b=>/🍼/.test(b.textContent));if(!bottle)return;
 bottle.style.position="relative";if(!bottle.querySelector(".bottlePlus"))bottle.insertAdjacentHTML("beforeend",'<span class="bottlePlus">+</span>');
 const pop=document.createElement("div");pop.className="quickBottlePop";pop.id="quickBottlePop";pop.innerHTML=(window.LucaConfig?.bottles||[4,5,6,7,8]).map(n=>'<button type="button" data-qoz="'+n+'">'+n+' oz</button>').join("");document.body.appendChild(pop);
 bottle.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();pop.classList.toggle("on")});
 document.addEventListener("click",e=>{if(!pop.contains(e.target)&&!bottle.contains(e.target))pop.classList.remove("on")});
 pop.addEventListener("click",async e=>{
   const b=e.target.closest("[data-qoz]");if(!b)return;const oz=+b.dataset.qoz,who=deviceCaregiver(),now=new Date();
   b.disabled=true;
   const entry={id:Date.now()+"-"+Math.random(),at:now.toISOString(),oz,tags:[],people:[who],notes:"",source:"quick-bottle",sourceText:oz+" oz quick bottle by "+who};
   a.push(entry);persist();render();pop.classList.remove("on");
   if(syncBaby&&syncUser){const remote=await pushEntry(entry);if(remote){a=a.filter(x=>x.id!==entry.id);a.push({id:remote.id,at:remote.event_time,oz:remote.amount_oz==null?null:+remote.amount_oz,tags:remote.tags||[],people:remote.caregivers||[],notes:remote.note||"",event_type:remote.event_type||"feed",source:remote.details?.source||"quick-bottle",sourceText:remote.details?.sourceText||entry.sourceText,remote:true});persist();render();toast(oz+" oz bottle logged ✓")}}
   else toast(oz+" oz bottle saved on this phone");
   b.disabled=false;
 });
})();

/* P44 — Quick Bottle uses the large top-right bottle button */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P44";
 
 const topBottle=document.querySelector("#todayView .icon");if(!topBottle)return;
 topBottle.style.cursor="pointer";topBottle.setAttribute("role","button");topBottle.setAttribute("aria-label","Quick bottle");
 const pop=document.createElement("div");pop.className="topQuickBottle";pop.innerHTML=(window.LucaConfig?.bottles||[4,5,6,7,8]).map(n=>'<button type="button" data-topoz="'+n+'">'+n+' oz</button>').join("");document.body.appendChild(pop);
 function position(){const r=topBottle.getBoundingClientRect();pop.style.top=(r.bottom+8)+"px";pop.style.right=Math.max(8,innerWidth-r.right)+"px"}
 topBottle.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();position();pop.classList.toggle("on")});
 document.addEventListener("click",e=>{if(!pop.contains(e.target)&&!topBottle.contains(e.target))pop.classList.remove("on")});
 addEventListener("resize",()=>{if(pop.classList.contains("on"))position()});
 pop.addEventListener("click",async e=>{
   const b=e.target.closest("[data-topoz]");if(!b)return;const oz=+b.dataset.topoz,who=deviceCaregiver(),now=new Date();
   b.disabled=true;const entry={id:Date.now()+"-"+Math.random(),at:now.toISOString(),oz,tags:[],people:[who],notes:"",source:"quick-bottle",sourceText:oz+" oz quick bottle by "+who};
   a.push(entry);persist();render();pop.classList.remove("on");
   if(syncBaby&&syncUser){const remote=await pushEntry(entry);if(remote){a=a.filter(x=>x.id!==entry.id);a.push({id:remote.id,at:remote.event_time,oz:remote.amount_oz==null?null:+remote.amount_oz,tags:remote.tags||[],people:remote.caregivers||[],notes:remote.note||"",event_type:remote.event_type||"feed",source:remote.details?.source||"quick-bottle",sourceText:remote.details?.sourceText||entry.sourceText,remote:true});persist();render();toast(oz+" oz bottle logged ✓")}}
   else toast(oz+" oz bottle saved on this phone");b.disabled=false;
 });
})();

/* P45 — quick poop caregiver picker + iOS intro recovery */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P45";
 

 // Quick poop: tap dock poop, then choose who changed it. Save immediately.
 const poop=document.getElementById("carePoop"),pop=document.createElement("div");pop.className="quickPoopPop";
 pop.innerHTML=["Sam","Maddie","Nona","Boppa","Jay","Other"].map(n=>'<button type="button" data-pooper="'+n+'">'+n+'</button>').join("");document.body.appendChild(pop);
 function pos(){const r=poop.getBoundingClientRect();pop.style.top=Math.min(innerHeight-180,Math.max(90,r.top-40))+"px";pop.style.right=Math.max(72,innerWidth-r.left+6)+"px"}
 poop?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();pos();pop.classList.toggle("on")},true);
 document.addEventListener("click",e=>{if(!pop.contains(e.target)&&!poop?.contains(e.target))pop.classList.remove("on")});
 pop.addEventListener("click",async e=>{
   const b=e.target.closest("[data-pooper]");if(!b)return;let who=b.dataset.pooper;
   if(who==="Other"){who=prompt("Who changed Luca?")?.trim();if(!who)return}
   const entry={id:Date.now()+"-"+Math.random(),at:new Date().toISOString(),oz:null,tags:["poop"],people:[who],notes:"",source:"quick-poop",sourceText:"Poop diaper changed by "+who};
   a.push(entry);persist();render();pop.classList.remove("on");
   if(syncBaby&&syncUser){const remote=await pushEntry(entry);if(remote){a=a.filter(x=>x.id!==entry.id);a.push({id:remote.id,at:remote.event_time,oz:null,tags:remote.tags||["poop"],people:remote.caregivers||[who],notes:remote.note||"",event_type:remote.event_type||"poop",source:remote.details?.source||"quick-poop",sourceText:remote.details?.sourceText||entry.sourceText,remote:true});persist();render();toast("Poop logged for "+who+" ✓")}}
   else toast("Poop saved for "+who);
 });

 // iOS PWA: explicitly load/play both intro videos; never leave a permanent black overlay.
 const intro=document.getElementById("bootCinematic");
 if(intro){
   const vids=[...intro.querySelectorAll("video")],finish=()=>{intro.classList.add("done");setTimeout(()=>intro.style.display="none",600)};
   let played=false;
   vids.forEach(v=>{v.muted=true;v.playsInline=true;v.setAttribute("playsinline","");v.setAttribute("webkit-playsinline","");try{v.load();const p=v.play();if(p&&p.then)p.then(()=>played=true).catch(()=>{})}catch(e){}});
   intro.querySelector(".introSkip")?.addEventListener("click",finish,{once:true});
   setTimeout(()=>{if(!played&&vids.every(v=>v.readyState<2))finish()},1800);
   setTimeout(finish,9000);
 }
})();

/* P46 — top Quick Poop + reliable single-layer intro */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P46";
 // Put poop beside the top bottle, not in the side dock.
 const head=document.querySelector("#todayView header.top"),bottle=head?.querySelector(".icon");
 if(head&&bottle){
   let wrap=document.getElementById("topQuickActions");
   if(!wrap){wrap=document.createElement("div");wrap.id="topQuickActions";wrap.style.cssText="display:flex;gap:9px;align-items:center";bottle.parentNode.insertBefore(wrap,bottle);wrap.appendChild(bottle);
     const p=document.createElement("div");p.id="topPoop";p.className="icon";p.textContent="💩";p.setAttribute("role","button");p.setAttribute("aria-label","Quick poop");wrap.appendChild(p);
   }
   const p=document.getElementById("topPoop"),pop=document.querySelector(".quickPoopPop");
   if(p&&pop){p.onclick=e=>{e.preventDefault();e.stopPropagation();const r=p.getBoundingClientRect();pop.style.top=(r.bottom+8)+"px";pop.style.right=Math.max(8,innerWidth-r.right)+"px";pop.classList.toggle("on")}}
 }
 // Disable P45's side-dock quick-poop interception; side dock goes back to status/fun.
 const side=document.getElementById("carePoop");if(side){const clone=side.cloneNode(true);side.parentNode.replaceChild(clone,side)}

 // iOS intro: use ONE visible video layer. A second simultaneous decode was freezing on frame 1.
 const intro=document.getElementById("bootCinematic");
 if(intro){
   const blur=intro.querySelector(".introBlur"),main=intro.querySelector(".introMain"),skip=intro.querySelector(".introSkip");
   if(blur){try{blur.pause()}catch(e){} blur.remove()}
   if(main){
     main.muted=true;main.playsInline=true;main.setAttribute("playsinline","");main.setAttribute("webkit-playsinline","");main.preload="auto";
     const finish=()=>{intro.classList.add("done");setTimeout(()=>intro.style.display="none",650)};
     let watchdog=setTimeout(()=>{if(main.currentTime<0.08)finish()},2600);
     main.addEventListener("playing",()=>clearTimeout(watchdog),{once:true});main.addEventListener("ended",finish,{once:true});main.addEventListener("error",finish,{once:true});
     skip?.addEventListener("click",finish,{once:true});
     try{main.currentTime=0;main.load();const play=main.play();if(play?.catch)play.catch(()=>{})}catch(e){}
   }
 }
})();

/* P47 — Home Screen shortcut deep links */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P47";
 function openBottle(){
   const b=document.querySelector("#todayView .icon");if(!b)return;
   setTimeout(()=>b.click(),250);
 }
 function openPoop(){
   const p=document.getElementById("topPoop");if(!p)return;
   setTimeout(()=>p.click(),250);
 }
 function shortcutRoute(){
   const q=new URLSearchParams(location.search),act=(q.get("quick")||"").toLowerCase();
   if(!act)return;
   const go=()=>{if(act==="bottle")openBottle();if(act==="poop")openPoop();};
   setTimeout(go,900);
   // Clean the URL after routing so normal future launches stay normal.
   setTimeout(()=>{try{history.replaceState({},document.title,location.pathname)}catch(e){}},1800);
 }
 shortcutRoute();
})();

/* P48 — expandable history days + weekly childcare coverage board */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P48";


 function niceDay(d){return d.toLocaleDateString([],{weekday:"long",month:"short",day:"numeric"})}
 function historyEventMarkup(e){
   const c=typeof chips==="function"?chips(e):[];
   return '<div class="historyEvent48"><div class="eventLine48"><b>'+new Date(e.at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})+'</b><span class="muted">'+esc((e.people||[]).join(", "))+'</span></div>'+
   '<div class="chips">'+c.map(x=>'<span class="chip">'+esc(x)+'</span>').join("")+'</div>'+
   (e.sourceText?'<div class="note"><span class="muted" style="font-size:11px">Original message</span><br>'+esc(e.sourceText)+'</div>':(e.notes?'<div class="note">'+esc(e.notes)+'</div>':""))+
   '<div class="actions"><button class="tiny" data-h48edit="'+e.id+'">Edit</button><button class="tiny del" data-h48del="'+e.id+'">Delete</button></div></div>';
 }
 function renderHistory48(){
   const el=document.getElementById("history");if(!el||typeof a==="undefined")return;
   const groups={};
   a.forEach(e=>{const k=day(e.at);(groups[k]??=[]).push(e)});
   const ordered=Object.entries(groups).sort((x,y)=>Math.max(...y[1].map(e=>+new Date(e.at)))-Math.max(...x[1].map(e=>+new Date(e.at))));
   el.innerHTML=ordered.map(([k,v],idx)=>{
     v.sort((x,y)=>new Date(y.at)-new Date(x.at));
     const feeds=v.filter(e=>e.oz),poops=v.filter(e=>(e.tags||[]).includes("poop")||e.event_type==="poop"),date=new Date(v[0].at);
     return '<section class="historyDay48" data-h48day="'+encodeURIComponent(k)+'"><button class="historyHead48" type="button"><span><b>'+niceDay(date)+'</b><div class="summary48">'+feeds.reduce((s,e)=>s+(+e.oz||0),0)+' oz · '+feeds.length+' bottle'+(feeds.length===1?"":"s")+' · '+poops.length+' poop'+(poops.length===1?"":"s")+' · '+v.length+' entr'+(v.length===1?"y":"ies")+'</div></span><span class="historyChevron48">⌄</span></button><div class="historyBody48">'+v.map(historyEventMarkup).join("")+'<button class="historyDeleteDay48" data-h48deleteday="'+encodeURIComponent(k)+'">Delete entire day</button></div></section>';
   }).join("")||'<div class="muted">No history yet.</div>';
   el.querySelectorAll(".historyHead48").forEach(b=>b.onclick=()=>b.closest(".historyDay48").classList.toggle("open"));
   el.querySelectorAll("[data-h48edit]").forEach(b=>b.onclick=()=>{
     document.querySelector('nav [data-tab="today"]')?.click();
     setTimeout(()=>edit(b.dataset.h48edit),80);
   });
   el.querySelectorAll("[data-h48del]").forEach(b=>b.onclick=async()=>{await del(b.dataset.h48del);renderHistory48()});
   el.querySelectorAll("[data-h48deleteday]").forEach(b=>b.onclick=async()=>{
     const key=decodeURIComponent(b.dataset.h48deleteday),items=a.filter(e=>day(e.at)===key);
     if(!items.length||!confirm("Delete all "+items.length+" entries from "+niceDay(new Date(items[0].at))+"? This cannot be undone."))return;
     for(const e of items){if(e.remote)try{await deleteRemote(e.id)}catch(err){console.error(err)}}
     a=a.filter(e=>day(e.at)!==key);persist();render();toast("Day deleted");renderHistory48();
   });
 }
 const oldRender48=window.render;
 if(typeof oldRender48==="function")window.render=function(){oldRender48();renderHistory48()};
 renderHistory48();

 function sunStart(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-x.getDay());return x}
 function dateKey48(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
 function tm48(d){return new Date(d).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}
 function overlaps48(a,b){const s=Math.max(+new Date(a.start_at),+new Date(b.start_at)),e=Math.min(+new Date(a.end_at),+new Date(b.end_at));return e>s?[s,e]:null}
 function merge48(xs){xs=xs.sort((a,b)=>a[0]-b[0]);const out=[];for(const x of xs){const last=out[out.length-1];if(last&&x[0]<=last[1])last[1]=Math.max(last[1],x[1]);else out.push([...x])}return out}
 function subtract48(base,covers){
   let pieces=[base];
   for(const c of covers){const next=[];for(const p of pieces){if(c[1]<=p[0]||c[0]>=p[1])next.push(p);else{if(c[0]>p[0])next.push([p[0],c[0]]);if(c[1]<p[1])next.push([c[1],p[1]])}}pieces=next}
   return pieces.filter(x=>x[1]-x[0]>5*60000);
 }
 function dayState48(rs){
   const works=rs.filter(x=>x.kind==="work"),covers=rs.filter(x=>x.kind==="coverage");
   const sam=works.filter(x=>(window.LucaConfig?.parents.sam||/^sam(uel)?\\b/i).test(x.person||"")),maddie=works.filter(x=>(window.LucaConfig?.parents.maddie||/^maddie\\b|^magdal/i).test(x.person||""));
   const needs=[];for(const s of sam)for(const m of maddie){const o=overlaps48(s,m);if(o)needs.push(o)}
   const mergedNeeds=merge48(needs),coverInts=merge48(covers.map(x=>[+new Date(x.start_at),+new Date(x.end_at)]));
   const gaps=mergedNeeds.flatMap(n=>subtract48(n,coverInts));
   return {works,covers,needs:mergedNeeds,gaps};
 }
 window.pullSchedule=async function(){
   scheduleCursor=sunStart(scheduleCursor||new Date());
   const start=new Date(scheduleCursor),end=new Date(start);end.setDate(end.getDate()+7);
   const same=dateKey48(start)===dateKey48(sunStart(new Date()));
   const label=start.toLocaleDateString([],{month:"short",day:"numeric"})+" – "+new Date(end-1).toLocaleDateString([],{month:"short",day:"numeric"});
   $("#scheduleMonth").textContent=label;$("#scheduleToday").style.visibility=same?"hidden":"visible";$("#scheduleToday").textContent="This week";
   if(!syncFamily){scheduleRows=[];$("#scheduleList").innerHTML='<div class="note">Connect Family Sync to load the shared schedule.</div>';return}
   const {data,error}=await sb.from("luca_schedule").select("*").eq("family_id",syncFamily).gte("start_at",start.toISOString()).lt("start_at",end.toISOString()).order("start_at");
   if(!error){scheduleRows=data||[];renderSchedule()}
 };
 window.renderSchedule=function(){
   const el=$("#scheduleList");if(!el)return;
   const start=sunStart(scheduleCursor),days=[];
   for(let i=0;i<7;i++){const d=new Date(start);d.setDate(d.getDate()+i);const k=dateKey48(d),rs=scheduleRows.filter(r=>dateKey48(new Date(r.start_at))===k);days.push({d,k,rs,state:dayState48(rs)})}
   const mini=days.map(x=>{const cls=x.state.gaps.length?"gap":(x.state.needs.length?"covered":"");return '<div class="weekMini48 '+cls+'"><span>'+x.d.toLocaleDateString([],{weekday:"narrow"})+'</span><b>'+x.d.getDate()+'</b></div>'}).join("");
   const cards=days.map(x=>{
     const s=x.state,status=s.gaps.length?["gap","⚠ Coverage gap"]:s.needs.length?["covered","✓ Covered"]:["home","Parent available"];
     const work=s.works.length?s.works.map(w=>'<div class="work48">💼 <b>'+esc(w.person)+'</b> · '+tm48(w.start_at)+'–'+tm48(w.end_at)+'</div>').join(""):'<div class="home48">No Sam/Maddie work block scheduled.</div>';
     let care="";
     if(s.needs.length){
       care+=s.covers.map(c=>'<div class="cover48">👶 <b>'+esc(c.person)+'</b> · '+tm48(c.start_at)+'–'+tm48(c.end_at)+'</div>').join("");
       care+=s.gaps.map(g=>'<div class="gap48">⚠ Luca needs coverage · '+tm48(g[0])+'–'+tm48(g[1])+'<div class="assign48">'+(window.LucaConfig?.caregivers||["Nona","Boppa","Jay","Yolanda","Lindsay"]).filter(n=>!/^sam|^maddie/i.test(n)).map(n=>'<button data-gapday="'+x.k+'" data-gapperson="'+n+'" data-gapstart="'+new Date(g[0]).toISOString()+'" data-gapend="'+new Date(g[1]).toISOString()+'">'+n+'</button>').join("")+'</div></div>').join("");
     }else care='<div class="home48">✓ No outside childcare coverage needed.</div>';
     return '<div class="scheduleDay48"><div class="scheduleDayTop48"><b>'+x.d.toLocaleDateString([],{weekday:"long",month:"short",day:"numeric"})+'</b><span class="scheduleStatus48 '+status[0]+'">'+status[1]+'</span></div>'+work+care+'</div>';
   }).join("");
   el.innerHTML='<div class="weekLegend48"><span><i style="background:#d9d9d6"></i>Working</span><span><i style="background:#bfeacf"></i>Covered</span><span><i style="background:#ffc7bc"></i>Missing coverage</span></div><div class="weekStrip48">'+mini+'</div>'+cards;
   el.querySelectorAll("[data-gapday]").forEach(b=>b.onclick=()=>{if(!syncFamily||!syncUser)return toast("Connect Family Sync first");window.LucaSchedule?.openCoverage(b.dataset.gapday,b.dataset.gapperson)});
   window.LucaSchedule?.decorate?.();
 };
 $("#schedulePrev").onclick=()=>{scheduleCursor=sunStart(scheduleCursor);scheduleCursor.setDate(scheduleCursor.getDate()-7);pullSchedule()};
 $("#scheduleNext").onclick=()=>{scheduleCursor=sunStart(scheduleCursor);scheduleCursor.setDate(scheduleCursor.getDate()+7);pullSchedule()};
 $("#scheduleToday").onclick=()=>{scheduleCursor=sunStart(new Date());pullSchedule()};
 if(document.getElementById("scheduleView")?.classList.contains("active"))pullSchedule();
})();
