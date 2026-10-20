/* Family caregiver names are care-credit labels, independent of app accounts. */
(function(root){
 'use strict';
 const clean=value=>String(value||'').trim().replace(/\s+/g,' ');
 function validate(value){const name=clean(value);if(!name||name.length>40||/[<>\x00-\x1f,;+&]/.test(name)||/\s+and\s+/i.test(name)||/^other$/i.test(name))throw Error('Enter one caregiver name, up to 40 characters.');return name;}
 function mount({host,getContext,defaults,onChange}){
  host.innerHTML='<h2>Caregiver names</h2><p>Add anyone who helps with care, even if they don’t use the app.</p><div id="caregiverRoster" class="choices"></div><form id="addCaregiverForm"><label for="newCaregiverName">New caregiver’s name</label><input id="newCaregiverName" maxlength="40" autocomplete="off" placeholder="e.g. Aunt Maria"><button type="submit" class="confirm" id="addCaregiver">Add caregiver</button></form><p id="caregiverRosterStatus" role="status" aria-live="polite"></p>';
  const list=host.querySelector('#caregiverRoster'),input=host.querySelector('input'),button=host.querySelector('button'),status=host.querySelector('[role=status]');
  list.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
  let scope='',rows=[],revision=0,busy=false;
  const key=c=>c.family&&c.user?.id?c.family+':'+c.user.id:'';
  const names=()=>{const values=key(getContext())===scope?rows.map(r=>r.name):[];const seen=new Set();return [...defaults,...values].filter(n=>{const k=n.toLocaleLowerCase();if(seen.has(k))return false;seen.add(k);return true;});};
  function paint(){list.replaceChildren(...names().map(name=>{const chip=document.createElement('span');chip.className='chip';chip.style.cssText='max-width:100%;white-space:normal;overflow-wrap:anywhere';chip.textContent=name;return chip;}));button.disabled=busy||!key(getContext());onChange(names());}
  async function load(){
   const c=getContext(),next=key(c),rev=++revision;if(next!==scope){scope=next;rows=[];input.value='';busy=false;paint();}
   if(!next){status.textContent='Connect Family sync to add caregivers.';return;}
   try{const {data,error}=await c.client.from('family_caregivers').select('id,name').eq('family_id',c.family).order('name');if(rev!==revision||key(getContext())!==next)return;if(error)throw error;rows=data||[];paint();status.textContent='Shared with this family. Choose a name when logging care.';}catch{if(rev===revision)status.textContent='Couldn’t load saved caregivers. Reconnect and try again.';}
  }
  host.querySelector('form').onsubmit=async event=>{
   event.preventDefault();if(busy)return;const c=getContext(),current=key(c);if(!current){status.textContent='Connect Family sync first.';return;}
   let name;try{name=validate(input.value);}catch(e){status.textContent=e.message;return;}
   if(names().some(n=>n.toLocaleLowerCase()===name.toLocaleLowerCase())){status.textContent=name+' is already in the caregiver list.';return;}
   busy=true;paint();
   try{const {error}=await c.client.from('family_caregivers').insert({family_id:c.family,name,created_by:c.user.id});if(key(getContext())!==current)return;if(error)throw error;input.value='';await load();if(key(getContext())===current)status.textContent=name+' added. Ready to choose when logging care.';}catch(e){if(key(getContext())===current)status.textContent=e.code==='23505'?'That name is already saved. Reopen Family to refresh.':'Couldn’t save. Your name is still here; reconnect and try again.';}finally{if(key(getContext())===current){busy=false;paint();}}
  };
  for(const event of ['luca:family-session-ready','luca:session-changed'])root.addEventListener(event,load);
  document.querySelector('nav [data-tab="profile"]')?.addEventListener('click',load);
  root.addEventListener('online',load);setInterval(()=>{if(document.visibilityState==='visible'&&!busy)void load();},60000);
  root.LucaCaregivers.names=names;paint();void load();return {load,names};
 }
 root.LucaCaregivers={mount,validate};
})(window);
