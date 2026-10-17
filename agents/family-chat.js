/** Private family chat UI. Uses only the signed-in user's Supabase session. */
export function mountFamilyChat({getClient,getFamilyId,getUser,feed,input,send,status}){
 let busy=false;
 function say(message){status.textContent=message;}
 function show(rows,profiles=new Map()){
  feed.replaceChildren();
  for(const m of rows){
   const line=document.createElement("div");
   line.style.cssText="padding:10px;margin:7px 0;border-radius:12px;background:#f1e6d8;color:#373a38;overflow-wrap:anywhere";
   const who=document.createElement("strong");who.textContent=m.sender_id===getUser()?.id?"You":(profiles.get(m.sender_id)||"Family member");
   const when=document.createElement("small");when.textContent=" · "+new Date(m.created_at).toLocaleString();
   const body=document.createElement("div");body.textContent=m.body;
   line.append(who,when,body);feed.append(line);
  }
 }
 async function load(){
  const sb=getClient(),family=getFamilyId(),user=getUser();
  if(!sb||!family||!user){say("Sign in to Family Sync to use chat.");return;}
  const {data,error}=await sb.from("family_chat_messages").select("id,sender_id,body,created_at").eq("family_id",family).order("created_at",{ascending:false}).limit(100);
  if(error){say("Chat is unavailable right now. Please try again.");return;}
  const {data:people}=await sb.from("family_profiles").select("user_id,display_name").eq("family_id",family);
  const names=new Map((people||[]).map(p=>[p.user_id,p.display_name]));
  show((data||[]).reverse(),names);say("");
 }
 send.addEventListener("click",async()=>{
  if(busy)return;
  const sb=getClient(),family=getFamilyId(),user=getUser(),body=input.value.trim();
  if(!sb||!family||!user){say("Sign in to send a message.");return;}
  if(!body||body.length>2000){say("Write a message of up to 2,000 characters.");return;}
  busy=true;send.disabled=true;
  try{
   const {error}=await sb.from("family_chat_messages").insert({family_id:family,sender_id:user.id,body});
   if(error)throw error;
   input.value="";await load();
  }catch{say("Couldn't send. Your message is still here; try again.");}
  finally{busy=false;send.disabled=false;}
 });
 load();
 const refresh=()=>{if(document.querySelector("#chatView")?.classList.contains("active"))load();};
 const timer=setInterval(refresh,12000);
 return ()=>clearInterval(timer);
}
