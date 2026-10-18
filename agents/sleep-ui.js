/* One editor for completed naps and overnight sleep. Saves through the care queue. */
(function(root){
 "use strict";
 function mount({host,getEntries,save,render,toast,deviceCaregiver,showToday,beforeEdit,afterEdit}){
  host.innerHTML='<div class="sleepEditorHeader"><div><div class="kicker">A little rest</div><h2 id="sleepEditorTitle">Log sleep</h2></div><button type="button" id="sleepCancel" class="tiny" aria-label="Close sleep editor">Close</button></div><form id="sleepForm" novalidate><div class="sleepSegment" role="group" aria-label="Sleep type"><button type="button" data-sleep-kind="nap" aria-pressed="true">Nap</button><button type="button" data-sleep-kind="night" aria-pressed="false">Night sleep</button></div><input id="sleepKind" type="hidden" value="nap"><label for="sleepStart">Fell asleep</label><input id="sleepStart" type="datetime-local" required><label for="sleepEnd">Woke up</label><input id="sleepEnd" type="datetime-local" required><div class="sleepDurationPreview"><span>Recorded window</span><strong id="sleepDuration" aria-live="polite">Choose a start time</strong></div><div id="sleepNightFields" hidden><div class="sleepOptionalGrid"><div><label for="sleepEntryWakeups">Wake-ups, if known</label><input id="sleepEntryWakeups" type="number" min="0" max="100" step="1" placeholder="Not sure" inputmode="numeric"></div><div><label for="sleepEntryAwake">Minutes awake, if known</label><input id="sleepEntryAwake" type="number" min="0" step="1" placeholder="Not sure" inputmode="numeric"></div></div></div><label for="sleepCaregiver">With Luca</label><input id="sleepCaregiver" type="text" maxlength="160" autocomplete="off" placeholder="Caregiver name"><details class="sleepExtra"><summary>Add a note</summary><label for="sleepEntryNotes" class="srOnly">Sleep notes</label><textarea id="sleepEntryNotes" rows="2" placeholder="Anything worth remembering…"></textarea></details><p id="sleepValidation" role="alert"></p><button id="sleepSave" type="submit" class="confirm">Save sleep</button><p class="why sleepEditorFoot">Start and wake-up times are saved together. You can edit them later.</p></form>';
  const $=id=>host.querySelector("#"+id),fields=["sleepStart","sleepEnd","sleepEntryWakeups","sleepEntryAwake"].map($);
  let editing=null,busy=false;
  const localValue=value=>{const d=new Date(value);return root.LucaSleep.dateKey(d)+"T"+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");};
  const data=()=>root.LucaSleep.build({start:$("sleepStart").value,end:$("sleepEnd").value,kind:$("sleepKind").value,awake:$("sleepKind").value==="night"?$("sleepEntryAwake").value:null,wakeups:$("sleepKind").value==="night"?$("sleepEntryWakeups").value:null});
  function preview(){try{const s=data();$("sleepDuration").textContent=root.LucaSleep.duration((new Date(s.end_at)-new Date(s.start_at))/60000);$("sleepDuration").dataset.valid="true";}catch{$("sleepDuration").textContent=$("sleepStart").value?"Check the start and wake-up times":"Choose a start time";$("sleepDuration").dataset.valid="false";}$("sleepValidation").textContent="";}
  function setKind(kind){$("sleepKind").value=kind;$("sleepNightFields").hidden=kind!=="night";for(const button of host.querySelectorAll("[data-sleep-kind]"))button.setAttribute("aria-pressed",String(button.dataset.sleepKind===kind));preview();}
  function close(){host.hidden=true;editing=null;}
  function open({entry=null,kind="nap"}={}){
   if(busy)return;editing=entry?.id||null;showToday();const s=entry?root.LucaSleep.session(entry,getEntries()):null,now=new Date();
   $("sleepForm").reset();$("sleepStart").value=s&&Number.isFinite(s.start)?localValue(s.start):"";$("sleepEnd").value=localValue(s&&Number.isFinite(s.end)?s.end:now);
   $("sleepCaregiver").value=(entry?.people||[deviceCaregiver()]).join(", ");$("sleepEntryNotes").value=entry?.notes||"";
   $("sleepEntryWakeups").value=s?.wakeups??"";$("sleepEntryAwake").value=s?.awake??"";
   $("sleepEditorTitle").textContent=entry?"Edit sleep":"Log sleep";$("sleepSave").textContent=entry?"Save changes":"Save sleep";
   setKind(s?.kind||kind);host.querySelector(".sleepEditorFoot").textContent=s?.inferred?"Times inferred from your notes. Saving confirms this window; adjust either time if needed.":"Start and wake-up times are saved together. You can edit them later.";host.hidden=false;host.dataset.editing=String(!!entry);host.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});
  }
  for(const field of fields)field.addEventListener("input",preview);
  for(const button of host.querySelectorAll("[data-sleep-kind]"))button.addEventListener("click",()=>setKind(button.dataset.sleepKind));
  $("sleepCancel").addEventListener("click",close);
  $("sleepForm").addEventListener("submit",event=>{
   event.preventDefault();if(busy)return;
   let sleep;try{sleep=data();}catch(error){$("sleepValidation").textContent=error.message;return;}
   const people=$("sleepCaregiver").value.split(",").map(s=>s.trim()).filter(Boolean);if(!people.length){$("sleepValidation").textContent="Add the caregiver name.";return;}
   const old=editing?getEntries().find(e=>String(e.id)===String(editing)):null;if(editing&&!old){$("sleepValidation").textContent="This entry is no longer available. Refresh the timeline.";return;}
   busy=true;$("sleepSave").disabled=true;
   try{
    const entry={...old,id:old?.id||Date.now()+"-sleep-"+Math.random(),at:sleep.start_at,oz:null,tags:["sleep"],people,notes:$("sleepEntryNotes").value.trim(),details:{...old?.details,sleep},source:old?.source||"sleep-form"};
    if(old)beforeEdit?.(old);void save(entry);close();render();toast(old?"Sleep changes saved on this phone ✓":"Sleep saved on this phone ✓",old?"":"sleep");if(old)afterEdit?.(entry.id);
   }catch{$("sleepValidation").textContent="Could not save. Keep these details and try again.";}
   finally{busy=false;$("sleepSave").disabled=false;}
  });
  return {open,close};
 }
 root.LucaSleepUI={mount};
})(typeof window!=="undefined"?window:globalThis);
