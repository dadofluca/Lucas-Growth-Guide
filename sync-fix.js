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