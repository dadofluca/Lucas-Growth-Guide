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
 const st=document.createElement("style");
 st.textContent=`
 #suppliesView{padding-right:104px!important}
 #suppliesView .card,#suppliesView .entry{overflow:visible!important}
 #suppliesView,#suppliesView *{color:#34423b!important;-webkit-text-fill-color:#34423b!important}
 #suppliesView .muted,#suppliesView .why{color:#56625c!important;-webkit-text-fill-color:#56625c!important}
 #suppliesView .chip,#suppliesView button{color:#f8f2e9!important;-webkit-text-fill-color:#f8f2e9!important;background:#173c58!important}
 @media(max-width:430px){#suppliesView{padding-right:92px!important}}
 `;document.head.appendChild(st);

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
 const st=document.createElement("style");
 st.textContent=`
 #manualComposer .choice.on{background:#173c58!important;color:#fffaf2!important;-webkit-text-fill-color:#fffaf2!important;border-color:#173c58!important;box-shadow:0 0 0 3px #173c5830!important;transform:translateY(-1px)}
 #manualComposer .choice.on small,#manualComposer .choice.on span{color:#fffaf2!important;-webkit-text-fill-color:#fffaf2!important}
 `;document.head.appendChild(st);

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
 const st=document.createElement("style");
 st.textContent=`
 .editMeta{font-size:12px;color:#66716b!important;-webkit-text-fill-color:#66716b!important;margin-top:8px}
 .undoEdit{margin-left:6px;border:0;background:transparent!important;color:#9b5a38!important;-webkit-text-fill-color:#9b5a38!important;font-weight:800;padding:3px 5px}
 `;document.head.appendChild(st);

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
 const st=document.createElement("style");
 st.textContent=`
 #manualComposer{color:#304038!important}
 #manualComposer label{color:#405048!important;-webkit-text-fill-color:#405048!important;font-weight:800!important}
 #manualComposer textarea,#manualComposer input[type="date"],#manualComposer input[type="time"],#manualComposer input[type="text"]{
   background:#fffaf2!important;color:#263a33!important;-webkit-text-fill-color:#263a33!important;
   border:1.5px solid #b6a58e!important;box-shadow:inset 0 1px 0 #fff,0 2px 8px #60452c12!important;
   opacity:1!important
 }
 #manualComposer textarea::placeholder,#manualComposer input::placeholder{color:#77827c!important;-webkit-text-fill-color:#77827c!important;opacity:1!important}
 #manualComposer input[type="date"],#manualComposer input[type="time"]{color-scheme:light!important}
 #manualComposer #saveEntry{
   background:#173c58!important;color:#fffaf2!important;-webkit-text-fill-color:#fffaf2!important;
   opacity:1!important;border:1px solid #173c58!important;font-weight:900!important
 }
 #manualComposer #cancelEdit{
   background:#f8f0e5!important;color:#34423b!important;-webkit-text-fill-color:#34423b!important;
   border:1px solid #c7b69f!important;opacity:1!important
 }
 `;document.head.appendChild(st);
})();

/* P40 — full-app cosmetic audit / unified warm accessible theme */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P40";
 const st=document.createElement("style");
 st.textContent=`
 :root{--ink:#304038;--muted:#5f6b64;--paper:#f8f0e4;--paper2:#efe2d1;--navy:#173c58;--line:#c5b49d;--accent:#a95e3d}
 body,.view{color:var(--ink)!important}
 .view h1,.view h2,.view h3,.card h1,.card h2,.card h3{color:var(--ink)!important;-webkit-text-fill-color:var(--ink)!important}
 .muted,.why,.note,.kicker{color:var(--muted)!important;-webkit-text-fill-color:var(--muted)!important;opacity:1!important}
 .card,.entry,.smartItem,.inlineClarify{border-color:#fff9!important}
 button{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}
 .tiny,.actions button,.lbTabs button,.scheduleToday{
   background:var(--paper)!important;color:var(--ink)!important;-webkit-text-fill-color:var(--ink)!important;
   border:1px solid var(--line)!important;font-weight:800!important;opacity:1!important
 }
 .confirm,.smartSave{
   background:var(--navy)!important;color:#fffaf2!important;-webkit-text-fill-color:#fffaf2!important;
   border:1px solid var(--navy)!important;font-weight:900!important;opacity:1!important
 }
 textarea,input,select{
   background:#fffaf2!important;color:var(--ink)!important;-webkit-text-fill-color:var(--ink)!important;
   border-color:var(--line)!important;opacity:1!important
 }
 textarea::placeholder,input::placeholder{color:#78817c!important;-webkit-text-fill-color:#78817c!important;opacity:1!important}
 .chip{color:var(--ink)!important;-webkit-text-fill-color:var(--ink)!important;background:#f7eee2!important}
 nav{color:var(--muted)!important}nav button{color:var(--muted)!important;-webkit-text-fill-color:var(--muted)!important}
 nav button.active{color:var(--accent)!important;-webkit-text-fill-color:var(--accent)!important}
 #insightsView .card,#historyView .card,#leaderboardView .card,#scheduleView .card,#suppliesView .card{color:var(--ink)!important}
 #historyView .entry,#timeline .entry,#drawerTimeline .entry{color:var(--ink)!important}
 #historyView .entry .muted,#timeline .entry .muted,#drawerTimeline .entry .muted{color:var(--muted)!important}
 #suppliesView{padding-right:0!important}
 #suppliesView .entry{padding-right:78px!important;position:relative}
 #suppliesView .actions{flex-wrap:wrap!important}
 #suppliesView .chip{background:#f3e7d6!important;color:#35463e!important;-webkit-text-fill-color:#35463e!important}
 #scheduleView .scheduleNav button{background:var(--navy)!important;color:#fffaf2!important;-webkit-text-fill-color:#fffaf2!important}
 #scheduleView #scheduleList,#scheduleView #scheduleList *{color:var(--ink)!important;-webkit-text-fill-color:var(--ink)!important}
 #leaderboardView .lbRow,#leaderboardView .lbRow *{color:var(--ink)!important;-webkit-text-fill-color:var(--ink)!important}
 #manualComposer .choice{background:#faf2e7!important;color:var(--ink)!important;-webkit-text-fill-color:var(--ink)!important;border-color:#ad9a80!important}
 #manualComposer .choice.on{background:var(--navy)!important;color:#fffaf2!important;-webkit-text-fill-color:#fffaf2!important}
 #manualComposer .choice.on *{color:#fffaf2!important;-webkit-text-fill-color:#fffaf2!important}
 #manualComposer label{color:var(--ink)!important;-webkit-text-fill-color:var(--ink)!important}
 #manualComposer textarea,#manualComposer input{background:#fffaf2!important;color:var(--ink)!important;-webkit-text-fill-color:var(--ink)!important}
 #manualComposer #saveEntry{background:var(--navy)!important;color:#fffaf2!important;-webkit-text-fill-color:#fffaf2!important}
 .careDock{top:36%!important;right:8px!important}
 @media(max-width:430px){.careDock{right:6px!important}.entry{scroll-margin-top:100px}}
 `;document.head.appendChild(st);
})();

/* P41 — Luca Now: live, data-driven care snapshot */
(function(){
 const badge=document.getElementById("patchBadge");if(badge)badge.textContent="P41";
 const st=document.createElement("style");
 st.textContent=`
 .lucaNow{margin:10px 0 14px;padding:14px;border-radius:20px;background:#f7eee2cc;border:1px solid #fff9;box-shadow:inset 0 1px #fff}
 .lucaNowTitle{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-weight:900;color:#304038}
 .lucaNowTitle small{font-size:11px;color:#6b746e;font-weight:750}
 .nowGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
 .nowStat{background:#fff8ef;border:1px solid #d8c9b5;border-radius:15px;padding:10px;min-height:62px}
 .nowStat span{display:block;font-size:11px;color:#68736c;margin-bottom:3px;font-weight:750}
 .nowStat b{display:block;color:#304038;font-size:16px;line-height:1.15}
 .nowInsight{margin-top:9px;padding:9px 10px;border-radius:13px;background:#e7eee8;color:#405149;font-size:12px;font-weight:700;line-height:1.35}
 `;document.head.appendChild(st);

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
 const st=document.createElement("style");st.textContent=`
 .teddyHead{display:flex;gap:11px;align-items:center}.teddyFace{font-size:34px}.teddyHead h2{margin:0}
 .teddyChat{max-height:330px;overflow:auto;display:grid;gap:8px;margin:14px 0;padding:3px}
 .teddyBubble{max-width:88%;padding:10px 12px;border-radius:16px;white-space:pre-wrap;line-height:1.38;font-size:14px}
 .teddyBubble.ai{justify-self:start;background:#f1e4d3;color:#304038}.teddyBubble.me{justify-self:end;background:#173c58;color:#fffaf2}
 .teddyAsk textarea{min-height:72px;background:#fffaf2!important;color:#304038!important}.teddyAsk button{width:100%;margin-top:8px}
 `;document.head.appendChild(st);
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
 const st=document.createElement("style");st.textContent=`
 .quickBottlePop{position:fixed;right:74px;top:43%;z-index:10030;display:none;gap:6px;padding:8px;border-radius:18px;background:#f7eee7f2;border:1px solid #fff;box-shadow:0 10px 28px #38291e35;backdrop-filter:blur(12px)}
 .quickBottlePop.on{display:flex}
 .quickBottlePop button{width:47px;height:47px;border-radius:50%;border:1px solid #c9b79e;background:#fff8ef!important;color:#304038!important;-webkit-text-fill-color:#304038!important;font-weight:900;font-size:15px;padding:0}
 .quickBottlePop button:active{transform:scale(.93);background:#173c58!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
 .bottlePlus{position:absolute;width:21px;height:21px;border-radius:50%;background:#173c58;color:#fff;display:grid;place-items:center;font-size:17px;font-weight:900;line-height:1;right:-2px;top:-2px;border:2px solid #f7eee7;pointer-events:none}
 `;document.head.appendChild(st);
 const bottle=[...document.querySelectorAll(".careDock button")].find(b=>/🍼/.test(b.textContent));if(!bottle)return;
 bottle.style.position="relative";if(!bottle.querySelector(".bottlePlus"))bottle.insertAdjacentHTML("beforeend",'<span class="bottlePlus">+</span>');
 const pop=document.createElement("div");pop.className="quickBottlePop";pop.id="quickBottlePop";pop.innerHTML=[4,5,6,7,8].map(n=>'<button type="button" data-qoz="'+n+'">'+n+' oz</button>').join("");document.body.appendChild(pop);
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
 const st=document.createElement("style");st.textContent=`
 .topQuickBottle{position:fixed;z-index:10040;display:none;grid-template-columns:repeat(5,48px);gap:6px;padding:8px;border-radius:18px;background:#f7eee7f5;border:1px solid #fff;box-shadow:0 12px 30px #38291e35;backdrop-filter:blur(12px)}
 .topQuickBottle.on{display:grid}
 .topQuickBottle button{width:48px;height:48px;border-radius:14px;border:1px solid #c9b79e;background:#fff8ef!important;color:#304038!important;-webkit-text-fill-color:#304038!important;font-weight:900;padding:0}
 .topQuickBottle button:active{background:#173c58!important;color:#fff!important;-webkit-text-fill-color:#fff!important;transform:scale(.94)}
 `;document.head.appendChild(st);
 const topBottle=document.querySelector("#todayView .icon");if(!topBottle)return;
 topBottle.style.cursor="pointer";topBottle.setAttribute("role","button");topBottle.setAttribute("aria-label","Quick bottle");
 const pop=document.createElement("div");pop.className="topQuickBottle";pop.innerHTML=[4,5,6,7,8].map(n=>'<button type="button" data-topoz="'+n+'">'+n+' oz</button>').join("");document.body.appendChild(pop);
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
 const st=document.createElement("style");st.textContent=`
 .quickPoopPop{position:fixed;z-index:10045;display:none;grid-template-columns:repeat(3,minmax(68px,1fr));gap:6px;width:236px;padding:8px;border-radius:18px;background:#f7eee7f5;border:1px solid #fff;box-shadow:0 12px 30px #38291e35;backdrop-filter:blur(12px)}
 .quickPoopPop.on{display:grid}.quickPoopPop button{min-height:45px;border-radius:13px;border:1px solid #c9b79e;background:#fff8ef!important;color:#304038!important;-webkit-text-fill-color:#304038!important;font-weight:850;padding:7px}
 `;document.head.appendChild(st);

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

 const st=document.createElement("style");
 st.textContent=\`
 /* History */
 #historyView .card{padding:10px!important;background:transparent!important;border:0!important;box-shadow:none!important}
 .historyDay48{background:rgba(255,250,242,.34);border:1px solid rgba(255,255,255,.72);border-radius:24px;margin:0 0 12px;overflow:hidden;box-shadow:0 8px 24px rgba(60,48,36,.07)}
 .historyHead48{width:100%;border:0;background:transparent!important;color:#31453b!important;-webkit-text-fill-color:#31453b!important;padding:20px 18px;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:12px}
 .historyHead48 .summary48{font-size:15px;color:#607067!important;-webkit-text-fill-color:#607067!important;font-weight:500;margin-top:4px}
 .historyChevron48{font-size:22px;transition:transform .2s ease}
 .historyDay48.open .historyChevron48{transform:rotate(180deg)}
 .historyBody48{display:none;padding:0 14px 16px}
 .historyDay48.open .historyBody48{display:block}
 .historyEvent48{background:rgba(255,255,255,.56);border:1px solid rgba(255,255,255,.75);border-radius:18px;padding:13px;margin:8px 0}
 .historyEvent48 .eventLine48{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
 .historyDeleteDay48{width:100%;margin-top:12px;border:1px solid #b46b5a!important;background:rgba(180,107,90,.08)!important;color:#8b4335!important;-webkit-text-fill-color:#8b4335!important;border-radius:14px;padding:11px;font-weight:750}
 .historyEvent48 button{color:#f8f3e9!important;-webkit-text-fill-color:#f8f3e9!important;background:#294b61!important}
 .historyEvent48 button.del{background:#8d4e43!important}

 /* Schedule */
 #scheduleView .card{padding:12px!important}
 #scheduleView .scheduleNav{align-items:center}
 #scheduleView .scheduleMonth{font-size:18px;font-weight:800;color:#31453b!important;-webkit-text-fill-color:#31453b!important;text-align:center}
 #scheduleView .scheduleToday{margin:8px auto 12px;display:block;background:#314b59!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
 .weekLegend48{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 14px;font-size:11px;font-weight:750;color:#405149}
 .weekLegend48 span{display:flex;align-items:center;gap:5px}.weekLegend48 i{width:10px;height:10px;border-radius:3px;display:inline-block}
 .weekStrip48{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin:4px 0 14px}
 .weekMini48{padding:8px 2px;border-radius:13px;text-align:center;background:rgba(255,255,255,.36);border:1px solid rgba(255,255,255,.7);font-size:10px;color:#47594f}
 .weekMini48 b{display:block;font-size:14px;color:#30473b}.weekMini48.gap{background:#ffd7cf;border-color:#ed9a88}.weekMini48.covered{background:#d4f0df;border-color:#8cc9a5}
 .scheduleDay48{background:rgba(255,250,242,.35);border:1px solid rgba(255,255,255,.76);border-radius:22px;padding:14px;margin:10px 0;color:#31453b!important;-webkit-text-fill-color:#31453b!important}
 .scheduleDayTop48{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
 .scheduleStatus48{font-size:11px;font-weight:850;padding:6px 9px;border-radius:999px;white-space:nowrap}
 .scheduleStatus48.home{background:#e4ece6;color:#496156!important;-webkit-text-fill-color:#496156!important}
 .scheduleStatus48.covered{background:#c9efd8;color:#17633b!important;-webkit-text-fill-color:#17633b!important}
 .scheduleStatus48.gap{background:#ffd1c7;color:#8d3325!important;-webkit-text-fill-color:#8d3325!important}
 .work48,.cover48,.gap48,.home48{border-radius:13px;padding:9px 10px;margin:6px 0;font-size:13px;line-height:1.25}
 .work48{background:#d9d9d6;color:#4f5350!important;-webkit-text-fill-color:#4f5350!important}
 .cover48{background:#bfeacf;color:#175d39!important;-webkit-text-fill-color:#175d39!important;font-weight:750}
 .gap48{background:#ffc7bc;color:#842e21!important;-webkit-text-fill-color:#842e21!important;font-weight:850;border:1px solid #e78875}
 .home48{background:rgba(255,255,255,.45);color:#5b6a62!important;-webkit-text-fill-color:#5b6a62!important}
 .assign48{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
 .assign48 button{padding:7px 9px;border-radius:11px;border:0;background:#294b61!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:11px;font-weight:750}
 \`;document.head.appendChild(st);

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
   const sam=works.filter(x=>/^sam(uel)?\b/i.test(x.person||"")),maddie=works.filter(x=>/^maddie\b|^magdal/i.test(x.person||""));
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
       care+=s.gaps.map(g=>'<div class="gap48">⚠ Luca needs coverage · '+tm48(g[0])+'–'+tm48(g[1])+'<div class="assign48">'+["Nona","Boppa","Jay","Yolanda","Lindsay"].map(n=>'<button data-gapday="'+x.k+'" data-gapperson="'+n+'" data-gapstart="'+new Date(g[0]).toISOString()+'" data-gapend="'+new Date(g[1]).toISOString()+'">'+n+'</button>').join("")+'</div></div>').join("");
     }else care='<div class="home48">✓ No outside childcare coverage needed.</div>';
     return '<div class="scheduleDay48"><div class="scheduleDayTop48"><b>'+x.d.toLocaleDateString([],{weekday:"long",month:"short",day:"numeric"})+'</b><span class="scheduleStatus48 '+status[0]+'">'+status[1]+'</span></div>'+work+care+'</div>';
   }).join("");
   el.innerHTML='<div class="weekLegend48"><span><i style="background:#d9d9d6"></i>Working</span><span><i style="background:#bfeacf"></i>Covered</span><span><i style="background:#ffc7bc"></i>Missing coverage</span></div><div class="weekStrip48">'+mini+'</div>'+cards;
   el.querySelectorAll("[data-gapday]").forEach(b=>b.onclick=async()=>{
     if(!syncFamily||!syncUser)return toast("Connect Family Sync first");
     const {error}=await sb.from("luca_schedule").insert({family_id:syncFamily,person:b.dataset.gapperson,kind:"coverage",start_at:b.dataset.gapstart,end_at:b.dataset.gapend,source:"family assignment",created_by:syncUser.id});
     if(error)return toast("Couldn't save coverage");
     toast(b.dataset.gapperson+" covers that gap ✓");await pullSchedule();
   });
 };
 $("#schedulePrev").onclick=()=>{scheduleCursor=sunStart(scheduleCursor);scheduleCursor.setDate(scheduleCursor.getDate()-7);pullSchedule()};
 $("#scheduleNext").onclick=()=>{scheduleCursor=sunStart(scheduleCursor);scheduleCursor.setDate(scheduleCursor.getDate()+7);pullSchedule()};
 $("#scheduleToday").onclick=()=>{scheduleCursor=sunStart(new Date());pullSchedule()};
 if(document.getElementById("scheduleView")?.classList.contains("active"))pullSchedule();
})();




/* P51 — direct drawer contrast + schedule hooks */
(function(){
const st=document.createElement("style");st.textContent=`
#sideMenu .sidePanel,#timelineDrawer .drawerPanel{color:#f7f1e8!important;-webkit-text-fill-color:#f7f1e8!important}
#sideMenu .sidePanel *,#timelineDrawer .drawerPanel *{color:inherit!important;-webkit-text-fill-color:currentColor!important}
#sideMenu .sidePanel .kicker{color:#9ed8ff!important;-webkit-text-fill-color:#9ed8ff!important}
#sideMenu .sidePanel .muted,#sideMenu .sidePanel .why,#timelineDrawer .drawerPanel .muted,#timelineDrawer .drawerPanel .why{color:#c4d0d8!important;-webkit-text-fill-color:#c4d0d8!important}
#sideMenu .sidePanel .menuRow{color:#f7f1e8!important;-webkit-text-fill-color:#f7f1e8!important;background:#ffffff0b!important}
#sideMenu .sidePanel .card{color:#f7f1e8!important;-webkit-text-fill-color:#f7f1e8!important}
#scheduleView .scheduleStatus48.gap{background:#ffd1c7!important;color:#7b2c21!important;-webkit-text-fill-color:#7b2c21!important}#scheduleView .scheduleStatus48.covered{background:#c9efd8!important;color:#105b37!important;-webkit-text-fill-color:#105b37!important}#scheduleView .assign48 button{background:#173c58!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
.cov51{position:fixed;inset:0;z-index:99999;background:#10171488;display:grid;align-items:end;padding:14px}.covSheet51{background:#f8efe2;color:#304038;border-radius:28px;padding:20px 18px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -12px 45px #0004}.covSheet51 h2{margin:0 0 4px;color:#304038!important}.covSheet51 p{margin:0 0 16px;color:#66736c!important}.covInputs51{display:grid;grid-template-columns:1fr 1fr;gap:10px}.covInputs51 label{font-size:12px;font-weight:800}.covInputs51 input{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:12px;border:1px solid #cdbda9;border-radius:13px;background:#fffaf2;color:#263d33;font-size:17px}.covRange51{height:64px;position:relative;margin:12px 0}.covRange51:before{content:"";position:absolute;left:8px;right:8px;top:28px;height:8px;border-radius:8px;background:#d1c8bb}.covRange51 input{position:absolute;left:0;top:0;width:100%;height:58px;margin:0;background:transparent;pointer-events:none;-webkit-appearance:none}.covRange51 input::-webkit-slider-thumb{-webkit-appearance:none;width:30px;height:30px;border-radius:50%;background:#173c58;border:4px solid #fff;box-shadow:0 2px 7px #0004;pointer-events:auto}.covBtns51{display:grid;grid-template-columns:1fr 1.5fr;gap:9px}.covBtns51 button{padding:14px;border:0;border-radius:14px;font-weight:800}.covSave51{background:#173c58!important;color:#fff!important}`;document.head.appendChild(st);
function mm51(x){let d=new Date(x);return d.getHours()*60+d.getMinutes()}function hm51(m){return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")}function iso51(k,m){let p=k.split("-").map(Number),d=new Date(p[0],p[1]-1,p[2],Math.floor(m/60),m%60);return d.toISOString()}
function edit51(o){document.querySelector(".cov51")?.remove();let w=document.createElement("div");w.className="cov51";w.innerHTML='<div class="covSheet51"><h2>'+esc(o.person)+' has Luca</h2><p>Slide either end, or tap a time for exact entry.</p><div class="covInputs51"><label>Start<input class="cs51" type="time" step="900" value="'+hm51(o.start)+'"></label><label>End<input class="ce51" type="time" step="900" value="'+hm51(o.end)+'"></label></div><div class="covRange51"><input class="crs51" type="range" min="0" max="1439" step="15" value="'+o.start+'"><input class="cre51" type="range" min="0" max="1439" step="15" value="'+o.end+'"></div><div class="covBtns51"><button class="covCancel51">Cancel</button><button class="covSave51">OK · Save</button></div></div>';document.body.appendChild(w);let s=w.querySelector(".cs51"),e=w.querySelector(".ce51"),rs=w.querySelector(".crs51"),re=w.querySelector(".cre51");function sync(){if(+rs.value>=+re.value)rs.value=Math.max(0,+re.value-15);s.value=hm51(+rs.value);e.value=hm51(+re.value)}rs.oninput=sync;re.oninput=sync;s.onchange=()=>{let p=s.value.split(":");rs.value=+p[0]*60 + +p[1];sync()};e.onchange=()=>{let p=e.value.split(":");re.value=+p[0]*60 + +p[1];sync()};w.querySelector(".covCancel51").onclick=()=>w.remove();w.querySelector(".covSave51").onclick=async()=>{let row={family_id:syncFamily,person:o.person,kind:"coverage",start_at:iso51(o.day,+rs.value),end_at:iso51(o.day,+re.value),source:"coverage editor",created_by:syncUser.id};let q=o.id?sb.from("luca_schedule").update({start_at:row.start_at,end_at:row.end_at,source:row.source}).eq("id",o.id):sb.from("luca_schedule").insert(row);let {error}=await q;if(error)return toast("Couldn't save coverage");w.remove();toast(o.person+" coverage saved ✓");await pullSchedule()}}
window.lucaCoverageEditor=edit51;
window.lucaBindSchedule=function(){let el=document.getElementById("scheduleList");if(!el)return;el.querySelectorAll("[data-gapday]").forEach(b=>b.onclick=()=>edit51({person:b.dataset.gapperson,day:b.dataset.gapday,start:mm51(b.dataset.gapstart),end:mm51(b.dataset.gapend)}));el.querySelectorAll(".cover48").forEach(r=>{let person=r.querySelector("b")?.textContent?.trim();let row=(scheduleRows||[]).find(x=>x.kind==="coverage"&&x.person===person&&r.textContent.includes(tm48(x.start_at)));if(row)r.onclick=()=>edit51({person,day:dateKey48(new Date(row.start_at)),start:mm51(row.start_at),end:mm51(row.end_at),id:row.id})})};
})();
/* P51 */(()=>{let b=document.getElementById("patchBadge");if(b)b.textContent="P51";window.LUCA_PATCH="P51"})();
