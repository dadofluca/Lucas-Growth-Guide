/** Family Ideas board. Private ideas remain visible only to their author. */
export function mountIdeas({getClient,getFamilyId,getUser,root}){
 let cancelled=false;
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 root.innerHTML='<form id="ideaForm"><label>Title <input id="ideaTitle" maxlength="100" minlength="3" required placeholder="What should we improve?"></label><label>Details <textarea id="ideaDetails" maxlength="2000" placeholder="What happened or what would make this better?"></textarea></label><label>Type <select id="ideaCategory"><option value="idea">Idea</option><option value="bug">Bug</option><option value="design">Design</option><option value="question">Question</option></select></label><label>Who can see this? <select id="ideaVisibility"><option value="family">Family board</option><option value="private">Private — only me</option></select></label><button type="submit" class="confirm">Post suggestion</button></form><p id="ideaStatus" role="status"></p><div id="ideaList"></div>';
 const $=id=>root.querySelector("#"+id),status=$("ideaStatus"),list=$("ideaList");
 const family=()=>{const f=getFamilyId();return typeof f==="object"?f?.id:f};
 async function load(){
  const sb=getClient(),fid=family(),user=getUser();
  if(!sb||!fid||!user?.id){status.textContent="Sign in to Family Sync to see or post suggestions.";return}
  status.textContent="Loading suggestions…";
  const {data,error}=await sb.from("family_ideas").select("id,title,details,category,visibility,status,created_at,author_id,agent_review_approved").eq("family_id",fid).order("created_at",{ascending:false}).limit(100);
  if(cancelled)return;
  if(error){status.textContent="Board unavailable. The Family Ideas database setup may still be pending.";return}
  status.textContent=data.length?data.length+" suggestion(s)":"No suggestions yet. Add the first one!";
  list.innerHTML=data.map(x=>'<article class="card"><div class="kicker">'+esc(x.category)+' · '+esc(x.status)+' · '+(x.visibility==="private"?"🔒 Private":"👪 Family")+'</div><h3>'+esc(x.title)+'</h3><p style="white-space:pre-wrap">'+esc(x.details)+'</p><small>'+esc(new Date(x.created_at).toLocaleString())+'</small>'+(x.author_id===user.id?'<label class="muted"><input type="checkbox" data-agent-review="'+esc(x.id)+'" '+(x.agent_review_approved?'checked':'')+'> Allow agents to review</label><button type="button" data-remove="'+esc(x.id)+'" class="tiny">Delete my suggestion</button>':"")+'</article>').join("");
 }
 $("ideaForm").addEventListener("submit",async e=>{
  e.preventDefault();const sb=getClient(),fid=family(),user=getUser();if(!sb||!fid||!user?.id){status.textContent="Sign in first.";return}
  const title=$("ideaTitle").value.trim(),details=$("ideaDetails").value.trim();
  if(title.length<3){status.textContent="Please enter a longer title.";return}
  const button=e.target.querySelector('button[type="submit"]');button.disabled=true;status.textContent="Posting…";
  try{const {error}=await sb.from("family_ideas").insert({family_id:fid,author_id:user.id,title,details,category:$("ideaCategory").value,visibility:$("ideaVisibility").value});
   if(error)throw error;e.target.reset();await load()}catch{status.textContent="Couldn't post. Check Family Sync and board setup."}finally{button.disabled=false}
 });
 list.addEventListener("change",async e=>{const box=e.target.closest("[data-agent-review]");if(!box)return;
 const approved=box.checked;box.disabled=true;
 const {error}=await getClient().from("family_ideas").update({agent_review_approved:approved}).eq("id",box.dataset.agentReview).eq("family_id",family()).eq("author_id",getUser().id);
 if(error){box.checked=!approved;status.textContent="Could not update agent permission."}else status.textContent=approved?"Approved for agent review.":"Agent review approval removed.";
 box.disabled=false;
 });
 list.addEventListener("click",async e=>{const id=e.target.closest("[data-remove]")?.dataset.remove;if(!id)return;
  if(!confirm("Delete your suggestion?"))return;
  const {error}=await getClient().from("family_ideas").delete().eq("id",id).eq("family_id",family()).eq("author_id",getUser().id);
  if(error)status.textContent="Couldn't delete suggestion.";else await load();
 });
 load();return()=>{cancelled=true};
}
