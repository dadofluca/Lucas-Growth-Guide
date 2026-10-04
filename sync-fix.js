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