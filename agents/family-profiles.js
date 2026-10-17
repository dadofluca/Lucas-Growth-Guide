const presets={bear:"🧸",fox:"🦊",bunny:"🐰",duck:"🐥",owl:"🦉"};
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
 let disposed=false,requestId=0;
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
  if(error){list.replaceChildren();say("Profiles unavailable. Try again.");return;}
  if(getFamilyId()!==family||getUser()?.id!==user.id){list.replaceChildren();say("Family session changed. Refresh profiles.");return;}
  list.replaceChildren();
  for(const p of data||[]){
   const row=document.createElement("div");row.style.cssText="padding:12px;border-bottom:1px solid #ddd";
   const title=document.createElement("strong");title.textContent=(presets[p.avatar_preset]||"🧸")+" "+p.display_name+(p.user_id===user.id?" (You)":"");
   const seen=document.createElement("div");seen.className="muted";seen.textContent=lastSeen(p.last_active_at);
   row.append(title,seen);list.append(row);
   if(p.user_id===user.id){name.value=p.display_name;bio.value=p.bio||"";avatar.value=p.avatar_preset;}
  }
  say("");
 }
 save.addEventListener("click",async()=>{
  const client=getClient(),family=getFamilyId(),user=getUser();
  if(disposed||!client||!family||!user)return say("Sign in first.");
  const display_name=name.value.trim(),description=bio.value.trim(),preset=avatar.value;
  if(!display_name||display_name.length>40||description.length>160||!presets[preset])return say("Check your name, bio and avatar.");
  save.disabled=true;
  try{
   if(disposed||getFamilyId()!==family||getUser()?.id!==user.id)return say("Family session changed. Reopen profiles.");
   const {error}=await client.from("family_profiles").upsert({family_id:family,user_id:user.id,display_name,bio:description,avatar_preset:preset,updated_at:new Date().toISOString()},{onConflict:"family_id,user_id"});
   if(error)throw error;
   if(!disposed&&getFamilyId()===family&&getUser()?.id===user.id){await heartbeat();await refresh();say("Profile saved.");}
  }catch{say("Couldn't save your profile. Please retry.");}
  finally{save.disabled=false;}
 });
 refresh();heartbeat();
 const timer=setInterval(()=>{heartbeat();if(document.querySelector("#profileView")?.classList.contains("active"))refresh();},60000);
 return ()=>{disposed=true;requestId++;clearInterval(timer);list.replaceChildren();};
}
