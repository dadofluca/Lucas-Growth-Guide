import {bonusCharacters,bonusAvatarSvg} from "./avatar-characters.js";
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
for(const [key,item] of Object.entries(bonusCharacters)){presets[key]="★";palette[key]=item.colors;labels[key]=item.label;}
function armorySvg(key){
 const a=armory[key],[dark,light]=a.colors;
 const crown=key==="diaperKing"||key==="napEmperor";
 const soldier=["teddyTrooper","formulaCommando","bottleSupreme"].includes(key);
 const explosive=["diaperDoom","poopMeteor","wipeTornado"].includes(key);
 const tired=["sleepDeprived","napEmperor"].includes(key);
 const duck=key==="evilDuck";
 const prop={
 teddyTrooper:'<path d="M19 26 Q9 11 22 10 Q36 9 37 26 M63 26 Q65 9 79 10 Q92 11 81 26" fill="#87624b" stroke="#453e3b" stroke-width="3"/>',
 formulaCommando:'<g transform="rotate(-20 81 78)"><rect x="75" y="61" width="12" height="26" rx="5" fill="#f8faf5" stroke="#547a91" stroke-width="2"/><rect x="78" y="55" width="6" height="9" rx="2" fill="#e6c28a"/></g>',
 diaperDoom:'<path d="M15 80 Q50 64 85 80 L79 95 Q50 84 21 95Z" fill="#f8f1d9" stroke="#746187" stroke-width="3"/><path d="M42 79 l8 7 8-7" fill="none" stroke="#d3b9ef" stroke-width="3"/>',
 poopMeteor:'<path d="M69 21 Q92 19 91 40 L84 33 79 44 72 34Z" fill="#f4b04b" stroke="#bc5836" stroke-width="2"/>',
 wipeTornado:'<path d="M10 78 Q50 99 90 78 M20 87 Q50 101 80 87" fill="none" stroke="#d9f7f5" stroke-width="5" stroke-linecap="round"/>',
 diaperKing:'<path d="M27 82 Q50 98 73 82 L67 96 H33Z" fill="#8d3d94" stroke="#f5d58e" stroke-width="3"/>',
 napEmperor:'<path d="M20 87 Q50 99 80 87" fill="none" stroke="#f5e2b5" stroke-width="8"/>',
 bottleSupreme:'<path d="M80 58 l-10 18 10-2-8 20 19-27-11 1Z" fill="#ffe17a" stroke="#d39c36" stroke-width="2"/>',
 evilDuck:'<path d="M25 30 Q11 18 22 12 Q35 10 37 29 M63 29 Q65 10 78 12 Q89 18 75 30" fill="#f6d33f"/>',
 sleepDeprived:'<g transform="rotate(14 80 84)"><rect x="72" y="74" width="18" height="19" rx="3" fill="#fff3d9" stroke="#765a4d" stroke-width="2"/><path d="M90 78 Q102 82 90 88" fill="none" stroke="#fff3d9" stroke-width="4"/></g>'
 }[key]||"";
 const helm=soldier?'<path d="M13 46 Q15 9 50 10 Q85 9 87 46 L78 50 Q49 41 22 50Z" fill="url(#helm)" stroke="#293e43" stroke-width="3"/><path d="M24 30 Q50 14 75 30" fill="none" stroke="#f2ebd1" stroke-opacity=".45" stroke-width="4"/><rect x="14" y="42" width="72" height="9" rx="4" fill="#34494d"/><circle cx="50" cy="27" r="5" fill="#e8cf79"/>':"";
 const royalty=crown?'<path d="M18 37 L15 14 34 27 50 7 66 27 85 14 82 37Z" fill="url(#gold)" stroke="#795132" stroke-width="3"/><circle cx="50" cy="25" r="5" fill="#dc5874"/><circle cx="31" cy="30" r="3" fill="#7fd5d8"/><circle cx="69" cy="30" r="3" fill="#7fd5d8"/>':"";
 const blast=explosive?'<path d="M50 2 L60 20 78 8 75 31 98 40 78 53 91 77 67 69 58 98 43 76 18 90 25 65 3 50 25 39 17 14 41 26Z" fill="url(#blast)" stroke="#70464d" stroke-width="2.5"/>':"";
 const eyes=tired?'<path d="M27 54 Q35 48 43 54 M57 54 Q65 48 73 54" stroke="#263440" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M26 59 L43 61 M57 61 L74 59" stroke="#a46b73" stroke-width="2" opacity=".8"/>':'<path d="M28 50 Q35 45 42 50 M58 50 Q65 45 72 50" fill="none" stroke="#5d4240" stroke-width="3"/><ellipse cx="35" cy="55" rx="5" ry="6" fill="#222e38"/><ellipse cx="65" cy="55" rx="5" ry="6" fill="#222e38"/><circle cx="33" cy="53" r="1.8" fill="#fff"/><circle cx="63" cy="53" r="1.8" fill="#fff"/>';
 const mouth=duck?'<path d="M31 68 Q50 58 69 68 L50 80Z" fill="#ee933d" stroke="#b55d32" stroke-width="2"/>':'<path d="M36 70 Q50 88 64 70 Q50 76 36 70Z" fill="#542f42" stroke="#493343" stroke-width="2"/><path d="M41 73 Q50 78 59 73" fill="none" stroke="#fff6ea" stroke-width="3"/>';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="bg" cx=".32" cy=".18" r=".85"><stop stop-color="'+light+'"/><stop offset=".62" stop-color="'+dark+'"/><stop offset="1" stop-color="#253443"/></radialGradient><linearGradient id="face" x1=".2" y1="0" x2=".8" y2="1"><stop stop-color="#fff8e8"/><stop offset=".55" stop-color="'+light+'"/><stop offset="1" stop-color="'+dark+'"/></linearGradient><linearGradient id="helm"><stop stop-color="'+dark+'"/><stop offset=".5" stop-color="'+light+'"/><stop offset="1" stop-color="'+dark+'"/></linearGradient><linearGradient id="gold"><stop stop-color="#fff4aa"/><stop offset=".55" stop-color="#d99b36"/><stop offset="1" stop-color="#f8d777"/></linearGradient><radialGradient id="blast"><stop stop-color="#fff4c4"/><stop offset=".55" stop-color="'+light+'"/><stop offset="1" stop-color="'+dark+'"/></radialGradient></defs><circle cx="50" cy="50" r="49" fill="url(#bg)" stroke="#fff3d6" stroke-width="1.5"/>'+blast+'<ellipse cx="50" cy="61" rx="37" ry="35" fill="#283341" opacity=".2"/><ellipse cx="50" cy="57" rx="35" ry="36" fill="url(#face)" stroke="'+dark+'" stroke-width="3"/><ellipse cx="34" cy="40" rx="15" ry="9" fill="#fff" opacity=".14"/>'+prop+helm+royalty+eyes+mouth+'<ellipse cx="24" cy="67" rx="6" ry="4" fill="#e67d7d" opacity=".38"/><ellipse cx="76" cy="67" rx="6" ry="4" fill="#e67d7d" opacity=".38"/><path d="M14 78 Q50 102 86 78" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/></svg>';
 return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
export function avatarSvg(key){
 if(bonusCharacters[key])return bonusAvatarSvg(key);
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
 for(const [key,item] of Object.entries({...armory,...bonusCharacters})){const option=document.createElement("option");option.value=key;option.textContent=item.label;avatar.append(option);}
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
 return ()=>{disposed=true;requestId++;clearInterval(timer);save.removeEventListener("click",onSave);for(const field of [name,bio,avatar])field.removeEventListener("input",markDirty);list.replaceChildren();gallery.remove();heading.remove();for(const key of Object.keys({...armory,...bonusCharacters}))avatar.querySelector(`option[value="${key}"]`)?.remove();avatar.style.display="";};
}
