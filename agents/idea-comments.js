/** Discussions share the parent idea's visibility; drafts never cross account/family scopes. */
export function mountIdeaComments({root,getClient,getFamilyId,getUser,getPerson=()=>''}){
 let scope='',disposed=false,ideas=new Set(),profiles=new Map();
 const threads=new Map(),family=()=>{const f=getFamilyId();return typeof f==='object'?f?.id:f},current=()=>family()+':'+getUser()?.id;
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node};
 const name=id=>{const n=profiles.get(id);return n&&!/^device-/i.test(n)?n:''};
 const state=id=>{if(!threads.has(id))threads.set(id,{rows:[],draft:'',pending:null,open:false,loaded:false,sending:false,loading:false,error:'',limit:50,more:false,token:0});return threads.get(id)};
 const panel=id=>[...root.querySelectorAll('[data-idea-discussion]')].find(p=>p.dataset.ideaDiscussion===id);
 const valid=(key,id)=>!disposed&&scope===key&&current()===key&&ideas.has(id);
 function draw(id){
  const p=panel(id),s=threads.get(id);if(!p||!s)return;
  p.querySelector('summary').textContent='Discussion'+(s.loaded?' · '+s.rows.length+(s.more?'+':'')+' comment'+(s.rows.length===1&&!s.more?'':'s'):'');
  const rows=p.querySelector('.ideaCommentList');rows.replaceChildren();
  if(s.loaded&&!s.rows.length)rows.append(el('li','ideaCommentEmpty','Start the conversation.'));
  for(const row of s.rows){const item=el('li','ideaComment'),header=el('div','ideaCommentHeader');header.append(el('strong','',name(row.author_id)||row.author_name||'Family member'));const time=el('time','',new Date(row.created_at).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}));time.dateTime=row.created_at;header.append(time);item.append(header,el('p','ideaCommentBody',row.body));if(row.author_id===getUser()?.id){const b=el('button','tiny','Delete my comment');b.type='button';b.dataset.commentDelete=row.id;b.disabled=s.sending;item.append(b)}rows.append(item);}
  p.querySelector('[data-comment-status]').textContent=s.error||(s.loading?'Loading discussion…':'');
  const text=p.querySelector('textarea');if(text.value!==s.draft)text.value=s.draft;text.disabled=s.sending;
  p.querySelector('[type=submit]').disabled=s.sending;
  const more=p.querySelector('[data-comment-more]');more.hidden=!s.more;more.disabled=s.loading||s.sending;
 }
 async function load(id){
  const key=scope,s=state(id),sb=getClient();if(!sb||!valid(key,id)||s.sending)return;
  const token=++s.token;s.loading=true;s.error='';draw(id);
  try{const r=await sb.from('family_idea_comments').select('id,idea_id,author_id,author_name,body,created_at').eq('family_id',family()).eq('idea_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(s.limit+1);
   if(!valid(key,id)||token!==s.token)return;if(r.error)throw r.error;
   s.more=(r.data||[]).length>s.limit;s.rows=(r.data||[]).slice(0,s.limit).reverse();s.loaded=true;
  }catch{if(valid(key,id)&&token===s.token)s.error='Couldn’t load this discussion. Try Refresh discussion.';}
  finally{if(valid(key,id)&&token===s.token){s.loading=false;draw(id)}}
 }
 function sync(nextIdeas,nextProfiles=[]){
  const key=current();if(key!==scope){scope=key;threads.clear();root.querySelectorAll('[data-idea-discussion]').forEach(p=>p.remove());}
  ideas=new Set(nextIdeas.map(i=>i.id));profiles=new Map(nextProfiles.map(p=>[p.user_id,p.display_name]));
  for(const id of threads.keys())if(!ideas.has(id))threads.delete(id);
  for(const idea of nextIdeas){let p=panel(idea.id),s=state(idea.id);if(!p){const card=[...root.querySelectorAll('[data-idea-id]')].find(c=>c.dataset.ideaId===idea.id);if(!card)continue;p=el('details','ideaDiscussion');p.dataset.ideaDiscussion=idea.id;p.append(el('summary','','Discussion'),el('ol','ideaCommentList'));const status=el('p','ideaCommentStatus');status.dataset.commentStatus='';status.setAttribute('role','status');p.append(status);const more=el('button','tiny','Show earlier comments');more.type='button';more.dataset.commentMore='';more.hidden=true;p.append(more);const form=el('form','ideaCommentForm'),label=el('label','','Add a comment'),text=el('textarea');text.maxLength=1200;text.rows=3;text.required=true;text.placeholder='Talk through this idea…';text.setAttribute('aria-label','Comment on '+idea.title);label.append(text);const submit=el('button','','Post comment');submit.type='submit';const refresh=el('button','tiny','Refresh discussion');refresh.type='button';refresh.dataset.commentRefresh='';form.append(label,submit,refresh);p.append(form);card.append(p);p.open=s.open;}
   draw(idea.id);if(s.open&&!s.sending)void load(idea.id);
  }
 }
 const toggle=e=>{const p=e.target;if(!p.matches?.('[data-idea-discussion]'))return;const s=state(p.dataset.ideaDiscussion);s.open=p.open;if(p.open)void load(p.dataset.ideaDiscussion)};
 const input=e=>{const p=e.target.closest('[data-idea-discussion]');if(!p||!e.target.matches('textarea'))return;const s=state(p.dataset.ideaDiscussion);s.draft=e.target.value;if(s.pending?.body!==s.draft.trim())s.pending=null};
 const submit=async e=>{
  const p=e.target.closest('[data-idea-discussion]');if(!p)return;e.preventDefault();const id=p.dataset.ideaDiscussion,s=state(id),key=scope,uid=getUser()?.id,fid=family(),body=s.draft.trim();if(s.sending||!valid(key,id)||!uid||!body||body.length>1200)return;
  if(!s.pending||s.pending.body!==body)s.pending={id:crypto.randomUUID(),body,author_name:(name(uid)||getPerson()||'Family member').trim().slice(0,40)||'Family member'};
  const value={...s.pending,idea_id:id,family_id:fid,author_id:uid};s.sending=true;s.error='';s.token++;draw(id);
  try{const sb=getClient();let r=await sb.from('family_idea_comments').insert(value).select('id');
   // A lost response can be retried with the same ID without making a second comment.
   if(r.error?.code==='23505'){r=await sb.from('family_idea_comments').select('id,body,author_id').eq('family_id',fid).eq('idea_id',id).eq('id',value.id);if(!r.error&&!r.data?.some(row=>row.id===value.id&&row.body===body&&row.author_id===uid))throw Error('Unconfirmed retry');}
   if(r.error||!r.data?.length)throw r.error||Error('No comment saved');if(!valid(key,id))return;s.draft='';s.pending=null;s.sending=false;await load(id);if(valid(key,id)){s.error='Comment posted.';draw(id)}
  }catch{if(valid(key,id))s.error='Couldn’t post. Your comment is still here. Try again.';}
  finally{if(valid(key,id)){s.sending=false;draw(id)}}
 };
 const click=async e=>{const p=e.target.closest('[data-idea-discussion]');if(!p)return;const id=p.dataset.ideaDiscussion,s=state(id),key=scope;if(e.target.closest('[data-comment-refresh]')){void load(id);return}if(e.target.closest('[data-comment-more]')){s.limit+=50;void load(id);return}const button=e.target.closest('[data-comment-delete]');if(!button||s.sending)return;const row=s.rows.find(r=>r.id===button.dataset.commentDelete);if(!row||row.author_id!==getUser()?.id||!confirm('Delete your comment?'))return;s.sending=true;s.token++;draw(id);try{const r=await getClient().from('family_idea_comments').delete().eq('id',row.id).eq('idea_id',id).eq('family_id',family()).eq('author_id',getUser().id).select('id');if(r.error||!r.data?.length)throw r.error||Error('No comment deleted');if(!valid(key,id))return;s.sending=false;await load(id);}catch{if(valid(key,id))s.error='Couldn’t delete your comment. Try again.';}finally{if(valid(key,id)){s.sending=false;draw(id)}}};
 root.addEventListener('toggle',toggle,true);root.addEventListener('input',input);root.addEventListener('submit',submit);root.addEventListener('click',click);
 return {sync,destroy(){disposed=true;threads.clear();root.removeEventListener('toggle',toggle,true);root.removeEventListener('input',input);root.removeEventListener('submit',submit);root.removeEventListener('click',click)}};
}
