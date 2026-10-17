/**
 * In-app report widget. Call mountAgentReportWidget({ supabase, familyId })
 * only after a verified authenticated family session is established.
 * Never include secrets or full baby records in descriptions.
 */
export function mountAgentReportWidget({supabase,familyId,container=document.body}){
 if(!supabase || !familyId)throw new Error("Authenticated Supabase client and family ID required");
 const root=document.createElement("section");
 root.setAttribute("aria-label","Report an app problem");
 root.style.cssText="margin:16px 0;padding:16px;border:1px solid #8ca9bc;border-radius:16px;background:#11283a;color:#fff";
 const heading=document.createElement("h2");heading.textContent="Report a problem";root.append(heading);
 const form=document.createElement("form");
 const category=document.createElement("select");category.setAttribute("aria-label","Problem category");
 for(const [value,label] of [["bug","App bug"],["data","Incorrect log"],["schedule","Schedule"],["suggestion","Suggestion"],["other","Other"]]){
  const option=document.createElement("option");option.value=value;option.textContent=label;category.append(option);
 }
 const desc=document.createElement("textarea");desc.placeholder="What happened? What did you expect?";desc.required=true;desc.minLength=10;desc.maxLength=2000;
 desc.setAttribute("aria-label","Describe the problem");
 const submit=document.createElement("button");submit.type="submit";submit.textContent="Send to support agents";
 const status=document.createElement("p");status.setAttribute("role","status");
 for(const el of [category,desc,submit])el.style.cssText="display:block;width:100%;margin:10px 0;padding:12px;background:#eef7ff;color:#102536;border-radius:9px";
 form.append(category,desc,submit,status);root.append(form);
 const history=document.createElement("div");history.setAttribute("aria-label","Recent family reports");root.append(history);container.append(root);
 async function refreshReports(){
  const {data,error}=await supabase.from("agent_user_reports").select("id,category,status,created_at").eq("family_id",familyId).order("created_at",{ascending:false}).limit(10);
  history.replaceChildren();
  if(error){const p=document.createElement("p");p.textContent="Report history unavailable.";history.append(p);return;}
  const title=document.createElement("h3");title.textContent="Recent reports";history.append(title);
  if(!data?.length){const p=document.createElement("p");p.textContent="No reports yet.";history.append(p);return;}
  for(const r of data){
   const line=document.createElement("p");line.textContent=`${r.category} · ${r.status} · ${new Date(r.created_at).toLocaleDateString()}`;
   line.style.cssText="padding:9px 0;border-bottom:1px solid #ffffff24";history.append(line);
  }
 }
 refreshReports();
 form.addEventListener("submit",async e=>{
  e.preventDefault();submit.disabled=true;status.textContent="Sending...";
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();
   if(authError||!user)throw new Error("Please sign in first");
   const {error}=await supabase.from("agent_user_reports").insert({family_id:familyId,reporter_id:user.id,category:category.value,description:desc.value.trim()});
   if(error)throw error;
   desc.value="";status.textContent="Report submitted. The team can review it.";await refreshReports();
  }catch(err){status.textContent="Could not submit. Please try again or check your connection.";}
  finally{submit.disabled=false;}
 });
 return root;
}
