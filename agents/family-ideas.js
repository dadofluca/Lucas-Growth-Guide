/** Family board; database policies, not display names, authorize the review desk. */
import {statusLabels,joinIdeas,ideaUpdates,approvedExport} from './family-ideas-model.js';
export function mountIdeas({getClient,getFamilyId,getUser,getPerson=()=>'',root}){
 let cancelled=false,request=0,items=[],manager=false,busy=false,read=new Set(),scope='';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 root.innerHTML='<div class="ideasProtocol"><b>The suggestion box has a paper trail.</b><p>Family votes help Sam choose. Sam has the final say. No automatic repair worker is connected: an approved idea still needs a proposal, tests, and Sam’s publication approval.</p><button type="button" id="ideaRefresh">↻ Refresh board</button><button type="button" id="ideaExport" hidden>Export approved review brief</button></div><form id="ideaForm"><label>Posting as<input id="ideaAuthorName" maxlength="40" required placeholder="Your name"></label><label>Title <input id="ideaTitle" maxlength="100" minlength="3" required placeholder="What should we improve?"></label><label>Details <textarea id="ideaDetails" maxlength="2000" placeholder="What happened? What did you expect?"></textarea></label><label>Type <select id="ideaCategory"><option value="idea">Idea</option><option value="bug">Bug</option><option value="design">Design</option><option value="question">Question</option></select></label><label>Who can see this? <select id="ideaVisibility"><option value="family">Family board</option><option value="private">Private — only me</option></select></label><button type="submit" class="confirm">Post suggestion</button></form><p id="ideaStatus" role="status"></p><div id="ideaList"></div>';
 const $=id=>root.querySelector('#'+id),status=$('ideaStatus'),list=$('ideaList');
 const bubble=document.createElement('button');bubble.type='button';bubble.id='ideasBubble';bubble.className='ideasBubble';bubble.hidden=true;bubble.innerHTML='💡 <span id="ideasUnread"></span>';bubble.setAttribute('aria-label','New family ideas');document.body.append(bubble);
 const family=()=>{const f=getFamilyId();return typeof f==='object'?f?.id:f};
 const key=()=> 'luca-ideas-read:v1:'+scope;
 const active=()=>document.getElementById('ideasView')?.classList.contains('active');
 function saveRead(){try{localStorage.setItem(key(),JSON.stringify([...read].slice(-500)));}catch{}}
 function markRead(){if(!active())return;items.forEach(i=>read.add(i.id));saveRead();paintBadge();}
 function paintBadge(){const count=items.filter(i=>i.visibility==='family'&&!read.has(i.id)&&i.author_id!==getUser()?.id).length;bubble.hidden=!count;bubble.querySelector('span').textContent=count>9?'9+':count;bubble.setAttribute('aria-label',count+' new family ideas');}
 function publish(){const same=scope===family()+':'+getUser()?.id;window.dispatchEvent(new CustomEvent('luca:idea-updates',{detail:{family:family(),user:getUser()?.id,items:same?ideaUpdates(items,getUser()?.id):[]}}));}
 function paint(){
  list.innerHTML=items.map(i=>'<article class="card ideaCard" data-idea-id="'+esc(i.id)+'"><div class="kicker">'+esc(i.category)+' · '+esc(statusLabels[i.status]||i.status)+' · '+(i.visibility==='private'?'🔒 Private':'👪 Family')+'</div><h3>'+esc(i.title)+'</h3><div class="ideaAuthor">Posted by '+esc(i.authorName)+'</div><p class="ideaDetails">'+esc(i.details)+'</p><small>'+esc(new Date(i.created_at).toLocaleString())+'</small><div class="ideaVotes" role="group" aria-label="Vote on '+esc(i.title)+'"><button type="button" data-vote="1" data-id="'+esc(i.id)+'" aria-pressed="'+(i.myVote===1)+'" aria-label="Upvote '+esc(i.title)+'">↑ '+i.up+'</button><button type="button" data-vote="-1" data-id="'+esc(i.id)+'" aria-pressed="'+(i.myVote===-1)+'" aria-label="Downvote '+esc(i.title)+'">↓ '+i.down+'</button><small>Votes inform. Sam decides.</small></div>'+(i.review?'<div class="ideaResponse"><b>Sam’s update · '+esc(statusLabels[i.status])+'</b><p>'+esc(i.review.response||'Status updated.')+'</p></div>':'')+(manager&&i.visibility==='family'?'<details class="ideaReview"><summary>Sam’s build desk</summary><label>Status<select data-review-status="'+esc(i.id)+'">'+Object.entries(statusLabels).map(([k,v])=>'<option value="'+k+'" '+(i.status===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label>Reply to the person who sent this<textarea data-review-response="'+esc(i.id)+'" maxlength="1200" rows="2">'+esc(i.review?.response||'')+'</textarea></label><button type="button" data-review-save="'+esc(i.id)+'">Save update & notify author</button><small>“Addressed” is your confirmation, not an automatic claim that a fix shipped.</small></details>':'')+(i.author_id===getUser()?.id?'<label class="ideaConsent"><input type="checkbox" data-agent-review="'+esc(i.id)+'" '+(i.agent_review_approved?'checked':'')+'> Allow agents to review this post</label><button type="button" data-remove="'+esc(i.id)+'" class="tiny">Delete my suggestion</button>':'')+'</article>').join('');
  $('ideaExport').hidden=!manager;paintBadge();publish();
 }
 async function load({quiet=false}={}){
  const sb=getClient(),fid=family(),user=getUser(),token=++request,next=fid+':'+user?.id;
  if(next!==scope){if(scope)$('ideaForm').reset();$('ideaAuthorName').value='';scope=next;items=[];read=new Set();manager=false;list.replaceChildren();bubble.hidden=true;try{read=new Set(JSON.parse(localStorage.getItem(key())||'[]'));}catch{}}
  if(!sb||!fid||!user?.id){items=[];bubble.hidden=true;status.textContent='Sign in to Family Sync to see or post suggestions.';publish();return;}
  if(!quiet)status.textContent='Loading suggestions…';
  try{
   const [ideas,profiles,votes,reviews,managers]=await Promise.all([
    sb.from('family_ideas').select('id,title,details,category,visibility,status,created_at,author_id,author_name,agent_review_approved').eq('family_id',fid).order('created_at',{ascending:false}).limit(100),
    sb.from('family_profiles').select('user_id,display_name').eq('family_id',fid),
    sb.from('family_idea_votes').select('idea_id,user_id,value').eq('family_id',fid).limit(2000),
    sb.from('family_idea_reviews').select('idea_id,status,response,updated_at').eq('family_id',fid).limit(100),
    sb.from('family_idea_managers').select('user_id').eq('family_id',fid).eq('user_id',user.id)
   ]);
   if(cancelled||token!==request||fid!==family()||user.id!==getUser()?.id)return;
   if(ideas.error)throw ideas.error;
   manager=!managers.error&&!!managers.data?.length;
   if(!$('ideaAuthorName').value){const profile=profiles.data?.find(p=>p.user_id===user.id);$('ideaAuthorName').value=/^device-/i.test(profile?.display_name||'')?(getPerson()||''):(profile?.display_name||getPerson()||'');}
   items=joinIdeas(ideas.data||[],reviews.data||[],votes.data||[],profiles.data||[],user.id);
   status.textContent=items.length+' suggestion'+(items.length===1?'':'s')+(votes.error||reviews.error?' · Voting/review unavailable; try Refresh.':'');
   // Do not replace an open review form or lose the manager’s draft during polling.
   if(!quiet||!list.querySelector('details[open]'))paint();else{paintBadge();publish();}
   markRead();
  }catch{if(!cancelled&&token===request)status.textContent='Board unavailable. Your draft is still here. Try Refresh.';}
 }
 async function mutate(work,success){if(busy)return;const fid=family(),uid=getUser()?.id;busy=true;try{const r=await work();if(r.error)throw r.error;if(Array.isArray(r.data)&&r.data.length===0)throw Error('No authorized rows updated');if(fid!==family()||uid!==getUser()?.id)return;await load();status.textContent=success;}catch{status.textContent='Couldn’t save that change. Try again; your draft is still here.';}finally{busy=false;}}
 $('ideaForm').addEventListener('submit',async e=>{
  e.preventDefault();const sb=getClient(),fid=family(),user=getUser();if(!sb||!fid||!user?.id){status.textContent='Sign in first.';return;}if(busy)return;
  const title=$('ideaTitle').value.trim(),details=$('ideaDetails').value.trim();if(title.length<3)return;
  const button=e.target.querySelector('button[type="submit"]');button.disabled=true;
  await mutate(async()=>{const result=await sb.from('family_ideas').insert({family_id:fid,author_id:user.id,author_name:$('ideaAuthorName').value.trim(),title,details,category:$('ideaCategory').value,visibility:$('ideaVisibility').value});if(!result.error&&fid===family()&&user.id===getUser()?.id)e.target.reset();return result;},'Suggestion posted. Thanks for making the chaos better.');button.disabled=false;
 });
 list.addEventListener('change',async e=>{const box=e.target.closest('[data-agent-review]');if(!box)return;const approved=box.checked;box.disabled=true;await mutate(()=>getClient().from("family_ideas").update({agent_review_approved:approved}).eq('id',box.dataset.agentReview).eq('family_id',family()).eq('author_id',getUser().id),approved?'Approved for review. No worker is connected yet.':'Agent review permission removed.');box.disabled=false;});
 list.addEventListener('click',async e=>{
  const vote=e.target.closest('[data-vote]'),remove=e.target.closest('[data-remove]'),review=e.target.closest('[data-review-save]');
  if(vote){const i=items.find(i=>i.id===vote.dataset.id);if(!i)return;await mutate(()=>{const q=getClient().from('family_idea_votes'),v=Number(vote.dataset.vote);return i.myVote===v?q.delete().eq('idea_id',i.id).eq('family_id',family()).eq('user_id',getUser().id):q.upsert({idea_id:i.id,family_id:family(),user_id:getUser().id,value:v},{onConflict:'idea_id,user_id'});},'Vote saved.');}
  if(remove&&confirm('Delete your suggestion?'))await mutate(()=>getClient().from('family_ideas').delete().eq('id',remove.dataset.remove).eq('family_id',family()).eq('author_id',getUser().id),'Suggestion deleted.');
  if(review&&manager){const i=items.find(i=>i.id===review.dataset.reviewSave),article=review.closest('article');if(!i)return;const value={status:article.querySelector('[data-review-status]').value,response:article.querySelector('[data-review-response]').value.trim(),reviewer_id:getUser().id};review.disabled=true;await mutate(()=>i.review?getClient().from('family_idea_reviews').update(value).eq('idea_id',i.id).eq('family_id',family()).select('idea_id'):getClient().from('family_idea_reviews').insert({...value,idea_id:i.id,family_id:family()}),'Update saved. The author will see it in Your updates when they open the app.');review.disabled=false;}
 });
 $('ideaRefresh').onclick=()=>load();
 $('ideaExport').onclick=()=>{const blob=new Blob([JSON.stringify(approvedExport(items),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='luca-approved-ideas.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 bubble.onclick=()=>{document.querySelector('nav [data-tab="ideas"]')?.click();markRead();};
 const enter=()=>{setTimeout(markRead,0);};document.querySelector('nav [data-tab="ideas"]')?.addEventListener('click',enter);
 const session=()=>load(),visible=()=>{if(document.visibilityState==='visible')load({quiet:true});};
 window.addEventListener('luca:family-session-ready',session);window.addEventListener('luca:session-changed',session);document.addEventListener('visibilitychange',visible);window.addEventListener('luca:request-idea-updates',publish);
 const timer=setInterval(()=>{if(document.visibilityState==='visible')load({quiet:true});},45000);load();
 return()=>{cancelled=true;request++;clearInterval(timer);bubble.remove();window.removeEventListener('luca:family-session-ready',session);window.removeEventListener('luca:session-changed',session);document.removeEventListener('visibilitychange',visible);window.removeEventListener('luca:request-idea-updates',publish);document.querySelector('nav [data-tab="ideas"]')?.removeEventListener('click',enter);};
}
