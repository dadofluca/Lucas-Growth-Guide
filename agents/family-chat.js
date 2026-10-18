import {avatarImage,avatarLabel} from "./family-profiles.js";
import {profileBanner} from "./flair-ui.js";
/** Private family chat UI. Uses only the signed-in user's Supabase session. */
export function mountFamilyChat({getClient,getFamilyId,getUser,feed,input,send,status,mediaInput,attachButton,mediaPreview}){
 let busy=false,requestId=0,disposed=false,selectedFile=null,profileCache=new Map(),cacheSession='';
 function say(message){status.textContent=message;}
 function show(rows,profiles=new Map()){
  const portraits=new Map([...feed.querySelectorAll("[data-message-id]")].map(el=>[el.dataset.messageId,el.querySelector(".avatarPortrait")]));
  feed.replaceChildren();
  for(const m of rows){
   const line=document.createElement("div");
   line.className="familyChatMessage";line.dataset.messageId=m.id;
   const profile=profiles.get(m.sender_id)||{};
   const preset=profile.avatar_preset||"bear",previous=portraits.get(m.id);const avatar=previous?.dataset.avatarKey===preset?previous:avatarImage(preset,40);
   avatar.setAttribute("aria-label",(profile.display_name||"Family member")+" avatar");
   avatar.style.borderRadius="50%";avatar.style.border="2px solid #fff6e7";
   const who=document.createElement("strong");who.textContent=m.sender_id===getUser()?.id?"You":(profile.display_name||"Family member");
   const when=document.createElement("small");when.className="chatTimestamp";when.textContent=new Date(m.created_at).toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
   const body=document.createElement("div");body.textContent=m.body;
   const header=document.createElement("div");header.className="chatMessageHeader";const identity=document.createElement("div");identity.className="chatIdentity";const character=document.createElement("span");character.className="avatarCharacter";character.textContent=avatarLabel(profile.avatar_preset);identity.append(who,character);const banner=profileBanner(profile.flair);if(banner)identity.append(banner);identity.append(when);header.append(avatar,identity);line.append(header,body);
   if(m.media_path&&["image","gif","video"].includes(m.media_type)){
    const sb=getClient();
    const media=document.createElement(m.media_type==="video"?"video":"img");
    media.style.cssText="display:block;max-width:100%;max-height:260px;border-radius:12px;margin-top:8px;object-fit:contain";
    if(m.media_type==="video"){media.controls=true;media.preload="metadata";}
    else{media.alt="Family chat attachment";media.loading="lazy";}
    const family=getFamilyId(),user=getUser();
    sb?.storage.from("family-chat-media").createSignedUrl(m.media_path,300).then(({data,error})=>{
     if(!error&&!disposed&&family===getFamilyId()&&user?.id===getUser()?.id&&data?.signedUrl)media.src=data.signedUrl;
    }).catch(()=>{});
    line.append(media);
   }
   feed.append(line);
  }
 }
 async function load(){
  const request=++requestId;
  const sb=getClient(),family=getFamilyId(),user=getUser();
  const session=family&&user?family+':'+user.id:'';if(session!==cacheSession){cacheSession=session;profileCache=new Map();}
  if(!sb||!family||!user){feed.replaceChildren();say("Sign in to Family Sync to use chat.");return;}
  let data,error;
  try{({data,error}=await sb.from("family_chat_messages").select("id,sender_id,body,created_at,media_path,media_type").eq("family_id",family).order("created_at",{ascending:false}).limit(100));}catch{error=true;}
  if(disposed||request!==requestId)return;
  if(getFamilyId()!==family||getUser()?.id!==user.id){feed.replaceChildren();say("Family session changed. Refresh chat.");return;}
  if(error){feed.replaceChildren();say("Chat is unavailable right now. Please try again.");return;}
  // Display confirmed messages immediately; profile/avatar enrichment must never block chat history.
  const messages=(data||[]).slice().reverse();
  show(messages,profileCache);say("");
  let people=[];
  try{({data:people}=await sb.from("family_profiles").select("user_id,display_name,avatar_preset,flair").eq("family_id",family));}catch{}
  const names=new Map((people||[]).map(p=>[p.user_id,p]));
  if(disposed||request!==requestId)return;
  if(getFamilyId()!==family||getUser()?.id!==user.id){feed.replaceChildren();say("Family session changed. Refresh chat.");return;}
  profileCache=names;show(messages,names);say("");
 }
 const onChoose=()=>{
  const file=mediaInput?.files?.[0]||null;
  const allowed=["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/quicktime","video/webm"];
  if(file&&(!allowed.includes(file.type)||file.size>26214400)){say("Use a GIF, photo, or video under 25 MB.");mediaInput.value="";selectedFile=null;return;}
  selectedFile=file;mediaPreview.textContent=file?"Attached: "+file.name+" ("+Math.ceil(file.size/1024)+" KB)":"";
 };
 const onAttach=()=>mediaInput?.click();
 mediaInput?.addEventListener("change",onChoose);
 attachButton?.addEventListener("click",onAttach);
 const onSend=async()=>{
  if(busy||disposed)return;
  const sb=getClient(),family=getFamilyId(),user=getUser(),body=input.value.trim();
  if(!sb||!family||!user){say("Sign in to send a message.");return;}
  if((!body&&!selectedFile)||body.length>2000){say("Write a message or attach a photo, GIF or video (up to 2,000 characters).");return;}
  busy=true;send.disabled=true;
  try{
   if(disposed||getFamilyId()!==family||getUser()?.id!==user.id){say("Family session changed. Reopen chat.");return;}
   let media_path=null,media_type=null;
   if(selectedFile){
    const file=selectedFile,ext=(file.name.split(".").pop()||"bin").replace(/[^a-z0-9]/gi,"").toLowerCase().slice(0,8);
    media_path=family+"/"+user.id+"/"+crypto.randomUUID()+"."+ext;
    media_type=file.type==="image/gif"?"gif":file.type.startsWith("video/")?"video":"image";
    const {error:uploadError}=await sb.storage.from("family-chat-media").upload(media_path,file,{contentType:file.type,upsert:false});
    if(uploadError)throw uploadError;
   }
   const {error}=await sb.from("family_chat_messages").insert({family_id:family,sender_id:user.id,body,media_path,media_type});
   if(error)throw error;
   if(!disposed&&getFamilyId()===family&&getUser()?.id===user.id){input.value="";selectedFile=null;if(mediaInput)mediaInput.value="";if(mediaPreview)mediaPreview.textContent="";await load();}
  }catch{say("Couldn't send. Your message is still here; try again.");}
  finally{busy=false;send.disabled=false;}
 };
 send.addEventListener("click",onSend);
 load();
 const refresh=()=>{if(document.querySelector("#chatView")?.classList.contains("active"))load();};
 const timer=setInterval(refresh,12000);
 const tab=document.querySelector('[data-tab="chat"]');
 tab?.addEventListener("click",load);
 const onFlair=e=>{if(e.detail?.family===getFamilyId())void load();};window.addEventListener("luca:profile-flair",onFlair);
 return ()=>{disposed=true;requestId++;clearInterval(timer);window.removeEventListener("luca:profile-flair",onFlair);tab?.removeEventListener("click",load);send.removeEventListener("click",onSend);mediaInput?.removeEventListener("change",onChoose);attachButton?.removeEventListener("click",onAttach);feed.replaceChildren();};
}
