/** Private family chat UI. Uses only the signed-in user's Supabase session. */
export function mountFamilyChat({getClient,getFamilyId,getUser,feed,input,send,status,mediaInput,attachButton,mediaPreview}){
 let busy=false,requestId=0,disposed=false,selectedFile=null;
 function say(message){status.textContent=message;}
 function show(rows,profiles=new Map()){
  feed.replaceChildren();
  for(const m of rows){
   const line=document.createElement("div");
   line.style.cssText="padding:10px;margin:7px 0;border-radius:12px;background:#f1e6d8;color:#373a38;overflow-wrap:anywhere";
   const who=document.createElement("strong");who.textContent=m.sender_id===getUser()?.id?"You":(profiles.get(m.sender_id)||"Family member");
   const when=document.createElement("small");when.textContent=" · "+new Date(m.created_at).toLocaleString();
   const body=document.createElement("div");body.textContent=m.body;
   line.append(who,when,body);
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
  if(!sb||!family||!user){feed.replaceChildren();say("Sign in to Family Sync to use chat.");return;}
  let data,error;
  try{({data,error}=await sb.from("family_chat_messages").select("id,sender_id,body,created_at,media_path,media_type").eq("family_id",family).order("created_at",{ascending:false}).limit(100));}catch{error=true;}
  if(disposed||request!==requestId)return;
  if(getFamilyId()!==family||getUser()?.id!==user.id){feed.replaceChildren();say("Family session changed. Refresh chat.");return;}
  if(error){feed.replaceChildren();say("Chat is unavailable right now. Please try again.");return;}
  let people=[];
  try{({data:people}=await sb.from("family_profiles").select("user_id,display_name").eq("family_id",family));}catch{}
  const names=new Map((people||[]).map(p=>[p.user_id,p.display_name]));
  if(disposed||request!==requestId)return;
  if(getFamilyId()!==family||getUser()?.id!==user.id){feed.replaceChildren();say("Family session changed. Refresh chat.");return;}
  show((data||[]).reverse(),names);say("");
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
 return ()=>{disposed=true;requestId++;clearInterval(timer);tab?.removeEventListener("click",load);send.removeEventListener("click",onSend);mediaInput?.removeEventListener("change",onChoose);attachButton?.removeEventListener("click",onAttach);feed.replaceChildren();};
}
