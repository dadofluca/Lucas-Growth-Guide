const presets={bear:"🧸",fox:"🦊",bunny:"🐰",duck:"🐥",owl:"🦉",lion:"🦁",panda:"🐼",koala:"🐨",penguin:"🐧",dino:"🦕",robot:"🤖",astronaut:"👨‍🚀",sun:"☀️",star:"⭐"};
const palette={bear:["#b98362","#f3d8bb"],fox:["#d46b40","#ffe3b5"],bunny:["#b8a2ca","#fff0e9"],duck:["#f3c65b","#fff0b2"],owl:["#8974a8","#e3d4f4"],lion:["#d49a3c","#f8df95"],panda:["#6c8190","#e8f0ee"],koala:["#8399aa","#dae5eb"],penguin:["#547c9b","#e0effa"],dino:["#4a9e85","#b5ebce"],robot:["#697fae","#bde3f1"],astronaut:["#697fae","#d6e4ff"],sun:["#e8a649","#fff0ae"],star:["#9b7bbd","#f2e2ff"]};
const labels={bear:"Bear",fox:"Fox",bunny:"Bunny",duck:"Duck",owl:"Owl",lion:"Lion",panda:"Panda",koala:"Koala",penguin:"Penguin",dino:"Dinosaur",robot:"Robot",astronaut:"Astronaut",sun:"Sunshine",star:"Star"};
/* P80: Avatar Armory. Original illustrated parody characters, not emoji stand-ins. */
const armory={
 teddyTrooper:{label:"Teddy Trooper",colors:["#495a65","#c7d7cc"],symbol:"🪖",detail:"Tactical pacifier squad"},
 formulaCommando:{label:"Formula Commando",colors:["#7b4f37","#efcf91"],symbol:"🍼",detail:"Bottle Battalion"},
 diaperDoom:{label:"Diaper Doom",colors:["#674c88","#d3bbef"],symbol:"💥",detail:"Exploding diaper survivor"},
 poopMeteor:{label:"Poop Meteor",colors:["#775039","#dfb98b"],symbol:"☄️",detail:"Diaper Apocalypse"},
 wipeTornado:{label:"Wipe Tornado",colors:["#4c7d91","#c1ecf2"],symbol:"🌪️",detail:"Emergency wipe response"},
 diaperKing:{label:"King of Diapers",colors:["#86508b","#f1d69a"],symbol:"👑",detail:"Royal Ridiculousness"},
 napEmperor:{label:"Emperor of Naps",colors:["#55588e","#b4bce4"],symbol:"💤",detail:"The sleeping overlord"},
 bottleSupreme:{label:"Bottle Commander",colors:["#b46e44","#f8cf83"],symbol:"⚡",detail:"Supreme bottle commander"},
 evilDuck:{label:"Evil Rubber Duck",colors:["#d49a31","#fff0a1"],symbol:"🦆",detail:"Unhinged Heroes"},
 sleepDeprived:{label:"Sleep-Deprived Hero",colors:["#546078","#b6bfd2"],symbol:"☕",detail:"Fueled by coffee and spite"}
};
for(const [key,item] of Object.entries(armory)){presets[key]=item.symbol;palette[key]=item.colors;labels[key]=item.label;}
function armorySvg(key){
 const a=armory[key],dark=a.colors[0],light=a.colors[1];
 const crown=key==="diaperKing"||key==="napEmperor"?'<path d="M23 37 L20 16 36 26 50 11 64 26 80 16 77 37Z" fill="#f9c84d" stroke="#7b5930" stroke-width="3"/>':"";
 const helmet=key==="teddyTrooper"||key==="formulaCommando"||key==="bottleSupreme"?'<path d="M15 45 Q17 12 50 12 Q83 12 85 45Z" fill="'+dark+'" stroke="#34404b" stroke-width="3"/><rect x="15" y="40" width="70" height="9" rx="4" fill="#334b48"/>':"";
 const explosion=key==="diaperDoom"||key==="poopMeteor"||key==="wipeTornado"?'<path d="M50 4 L60 22 79 10 74 33 96 38 78 52 93 73 67 69 58 96 44 74 18 89 26 64 5 51 27 40 18 15 41 26Z" fill="'+light+'" stroke="'+dark+'" stroke-width="3"/>':"";
 const sleepy=key==="sleepDeprived"||key==="napEmperor";
 const eyes=sleepy?'<path d="M27 53 Q35 47 43 53 M57 53 Q65 47 73 53" stroke="#26303e" stroke-width="4" fill="none" stroke-linecap="round"/>':'<circle cx="35" cy="51" r="5" fill="#29303c"/><circle cx="65" cy="51" r="5" fill="#29303c"/>';
 const mouth=key==="evilDuck"?'<path d="M34 66 L50 77 66 66 L50 65Z" fill="#f18e41"/>':'<path d="M39 69 Q50 83 61 69" stroke="#473c46" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
 const accent=key==="formulaCommando"||key==="bottleSupreme"?'<rect x="42" y="78" width="16" height="17" rx="4" fill="#eaf5fc" stroke="#587f9d" stroke-width="2"/>':key==="sleepDeprived"?'<path d="M70 80 h16 v12 h-16Z" fill="#e9f4f6" stroke="#4e596b" stroke-width="2"/>':"";
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="49" fill="'+dark+'"/>'+explosion+'<circle cx="50" cy="56" r="34" fill="'+light+'" stroke="'+dark+'" stroke-width="3"/>'+helmet+crown+eyes+mouth+accent+'<path d="M28 64 L39 60 M61 60 L72 64" stroke="#df777c" stroke-width="3" opacity=".55"/></svg>';
 return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
function avatarSvg(key){
 if(armory[key])return armorySvg(key);
 const [dark,light]=palette[key]||palette.bear;
 const ears=key==="bunny"?'\x3cellipse cx="30" cy="25" rx="10" ry="25" fill="'+dark+'"/\x3e\x3cellipse cx="70" cy="25" rx="10" ry="25" fill="'+dark+'"/\x3e':key==="fox"||key==="bear"||key==="panda"||key==="koala"||key==="lion"?'\x3ccircle cx="26" cy="30" r="16" fill="'+dark+'"/\x3e\x3ccircle cx="74" cy="30" r="16" fill="'+dark+'"/\x3e':"";
 const eye=key==="robot"?'\x3crect x="29" y="48" width="12" height="9" rx="3" fill="#253847"/\x3e\x3crect x="59" y="48" width="12" height="9" rx="3" fill="#253847"/\x3e':'\x3ccircle cx="35" cy="52" r="4" fill="#283342"/\x3e\x3ccircle cx="65" cy="52" r="4" fill="#283342"/\x3e';
 const detail=key==="duck"?'\x3cpath d="M38 65 Q50 59 62 65 L50 76Z" fill="#ec8e50"/\x3e':key==="dino"?'\x3cpath d="M21 36 L27 13 40 29 50 10 62 28 73 13 80 38" fill="'+dark+'"/\x3e':key==="astronaut"?'\x3ccircle cx="50" cy="54" r="35" fill="none" stroke="#f7fafb" stroke-width="7"/\x3e':key==="sun"?'\x3ccircle cx="50" cy="54" r="39" fill="none" stroke="#fff1a0" stroke-width="5" stroke-dasharray="4 9"/\x3e':key==="star"?'\x3cpath d="M50 8 L61 30 85 34 68 51 72 76 50 64 28 76 32 51 15 34 39 30Z" fill="'+dark+'"/\x3e':key==="robot"?'\x3cpath d="M50 27 V17 M43 17h14" stroke="#e8f5fa" stroke-width="5" stroke-linecap="round"/\x3e':"";
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="'+light+'"/><stop offset="1" stop-color="'+dark+'"/></linearGradient></defs><circle cx="50" cy="50" r="49" fill="url(#g)"/>'+ears+'<ellipse cx="50" cy="56" rx="35" ry="36" fill="'+light+'"/>'+detail+eye+'<ellipse cx="50" cy="68" rx="6" ry="4" fill="'+dark+'"/><path d="M43 77 Q50 83 57 77" stroke="#684b4c" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="28" cy="66" r="5" fill="#e98d8d" opacity=".38"/><circle cx="72" cy="66" r="5" fill="#e98d8d" opacity=".38"/></svg>';
 return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
function avatarImage(key,size=54){const image=document.createElement("img");image.src=avatarSvg(key);image.alt=labels[key]||"Avatar";image.width=size;image.height=size;image.style.cssText="width:"+size+"px;height:"+size+"px;border-radius:50%;box-shadow:0 3px 9px #3c4c5630;flex-shrink:0";return image;}
function lastSeen(iso){
 if(!iso)return "Activity not available";
 const minutes=Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/60000));
 if(!Number.isFinite(minutes))return "Activity not available";
 if(minutes<5)return "Active recently";
 if(minutes<60)return `Last active ${minutes} min ago`;
 if(minutes<1440)return `Last active ${Math.floor(minutes/60)} hr ago`;
 return `Last active ${Math.floor(minutes/1440)} days ago`;
}
export function mountFamilyProfiles({getClient,getFamilyId,getUser,list,name,bio,avatar,save,status}){
 let disposed=false,requestId=0,dirty=false;
 const markDirty=()=>{dirty=true;};
 const gallery=document.createElement("div");gallery.className="avatarGallery";gallery.setAttribute("role","group");gallery.setAttribute("aria-label","Illustrated avatar choices");
 avatar.insertAdjacentElement("afterend",gallery);avatar.style.display="none";
 for(const [key,item] of Object.entries(armory)){const option=document.createElement("option");option.value=key;option.textContent=item.label;avatar.append(option);}
 const heading=document.createElement("div");heading.textContent="⚔️ Avatar Armory — diaper warfare and exhausted-parent legends";heading.style.cssText="font-weight:800;margin:14px 0 8px;color:inherit";gallery.before(heading);
 const avatarButtons=new Map();
 for(const key of Object.keys(presets)){
  if(armory[key]&&!gallery.dataset.armoryHeading){gallery.dataset.armoryHeading="yes";}
  const button=document.createElement("button");button.type="button";button.className="avatarChoice";button.setAttribute("aria-label",labels[key]);button.setAttribute("aria-pressed","false");button.append(avatarImage(key,56));const caption=document.createElement("span");caption.textContent=labels[key];button.append(caption);
  button.addEventListener("click",()=>{avatar.value=key;avatar.dispatchEvent(new Event("input",{bubbles:true}));paintSelection()});gallery.append(button);avatarButtons.set(key,button);
 }
 function paintSelection(){for(const [key,button] of avatarButtons)button.setAttribute("aria-pressed",String(key===avatar.value));}
 paintSelection();
 for(const field of [name,bio,avatar])field.addEventListener("input",markDirty);
 const say=t=>{if(!disposed)status.textContent=t;};
 async function heartbeat(){if(disposed)return;const client=getClient(),family=getFamilyId(),user=getUser();if(!client||!family||!user||document.visibilityState!=="visible")return;try{await client.from("family_profiles").update({last_active_at:new Date().toISOString()}).eq("family_id",family).eq("user_id",user.id);}catch{}}
 async function refresh(){
  if(disposed)return;
  const request=++requestId;
  const client=getClient(),family=getFamilyId(),user=getUser();
  if(!client||!family||!user){list.replaceChildren();say("Sign in to Family Sync to see profiles.");return;}
  let data,error;
  try{({data,error}=await client.from("family_profiles").select("user_id,display_name,bio,avatar_preset,last_active_at").eq("family_id",family).order("display_name"));}catch{error=true;}
  if(disposed||request!==requestId)return;
  if(getFamilyId()!==family||getUser()?.id!==user.id){list.replaceChildren();say("Family session changed. Refresh profiles.");return;}
  if(error){list.replaceChildren();say("Profiles unavailable. Try again.");return;}
  list.replaceChildren();
  for(const p of data||[]){
   const row=document.createElement("div");row.style.cssText="padding:12px;border-bottom:1px solid #ddd";
   const title=document.createElement("strong");const deviceName=/^device-[a-f0-9-]{12,}$/i.test(p.display_name||"");title.textContent=(deviceName?"Family member":p.display_name)+(p.user_id===user.id?" (You)":"");row.style.display="flex";row.style.alignItems="center";row.style.gap="12px";row.append(avatarImage(p.avatar_preset,48));
   const seen=document.createElement("div");seen.className="muted";seen.textContent=lastSeen(p.last_active_at);
   row.append(title,seen);list.append(row);
   if(p.user_id===user.id&&!dirty){name.value=/^device-[a-f0-9-]{12,}$/i.test(p.display_name||"")?"":p.display_name;bio.value=p.bio||"";avatar.value=presets[p.avatar_preset]?p.avatar_preset:"bear";paintSelection();}
  }
  say((data||[]).some(p=>p.user_id===user.id&&/^device-[a-f0-9-]{12,}$/i.test(p.display_name||""))?"Choose a display name and tap Save profile.":"");
 }
 const onSave=async()=>{
  const client=getClient(),family=getFamilyId(),user=getUser();
  if(disposed||!client||!family||!user)return say("Sign in first.");
  const display_name=name.value.trim(),description=bio.value.trim(),preset=avatar.value;
  if(!display_name||display_name.length>40||description.length>160||!presets[preset])return say("Check your name, bio and avatar.");
  save.disabled=true;
  try{
   if(disposed||getFamilyId()!==family||getUser()?.id!==user.id)return say("Family session changed. Reopen profiles.");
   const {error}=await client.from("family_profiles").upsert({family_id:family,user_id:user.id,display_name,bio:description,avatar_preset:preset,updated_at:new Date().toISOString()},{onConflict:"family_id,user_id"});
   if(error)throw error;
   if(!disposed&&getFamilyId()===family&&getUser()?.id===user.id){dirty=false;await heartbeat();await refresh();say("Profile saved.");}
  }catch{say("Couldn't save your profile. Please retry.");}
  finally{save.disabled=false;}
 };
 save.addEventListener("click",onSave);
 refresh();heartbeat();
 const timer=setInterval(()=>{heartbeat();if(document.querySelector("#profileView")?.classList.contains("active"))refresh();},60000);
 return ()=>{disposed=true;requestId++;clearInterval(timer);save.removeEventListener("click",onSave);for(const field of [name,bio,avatar])field.removeEventListener("input",markDirty);list.replaceChildren();gallery.remove();heading.remove();for(const key of Object.keys(armory))avatar.querySelector(`option[value="${key}"]`)?.remove();avatar.style.display="";};
}
