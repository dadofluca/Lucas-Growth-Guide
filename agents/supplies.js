/* One supplies owner: family-scoped products, pending statuses and explicit legacy import. */
(function(root){
 'use strict';
 function create({host,getContext,onRows,toast}){
  const rules=root.LucaNotificationRules,read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}},write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  let rows=[],scope='',flight=null,revision=0,profiles=[],editing=null;
  const key=c=>c.family&&c.user?.id?c.family+':'+c.user.id:'unconnected';
  const pendingKey=c=>'luca-supplies-pending-v2:'+key(c),cacheKey=c=>'luca-supplies-cache-v2:'+key(c);
  const context=()=>{const c=getContext();return {...c,user:c.user?{...c.user}:null};};
  const same=c=>key(c)===key(getContext());
  const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;if(className)el.className=className;return el;};
  const button=(text,action)=>{const b=node('button',text,'tiny');b.type='button';b.onclick=action;return b;};
  const dialog=document.createElement('dialog');dialog.className='supplyProductDialog';dialog.id='supplyProductDialog';dialog.setAttribute('aria-labelledby','supplyProductTitle');document.body.append(dialog);
  function buyerOptions(select,value=select.value){select.replaceChildren();const everyone=node('option','Everyone with supply alerts on');everyone.value='';select.append(everyone);for(const p of profiles){const option=node('option',p.display_name||'Family member');option.value=p.user_id;select.append(option);}select.value=value||'';}
  function pending(c=context()){return read(pendingKey(c))||{};}
  function queue(name,status='good'){name=String(name||'').trim();if(!name||name.length>80||!['good','low','ordered'].includes(status))return;const c=context(),p=pending(c);Object.defineProperty(p,name,{value:{status,revision:crypto.randomUUID()},enumerable:true,configurable:true,writable:true});write(pendingKey(c),p);render();if(c.family&&c.user)void pull();}
  function render(){
   const c=context(),next=key(c);if(next!==scope){scope=next;revision++;rows=read(cacheKey(c))||[];profiles=[];onRows(rows);if(dialog.open)dialog.close();}
   host.replaceChildren();const p=pending(c),shown=rows.map(row=>({...row,status:p[row.name]?.status||row.status,pending:!!p[row.name]}));
   for(const [name,value] of Object.entries(p))if(!shown.some(s=>s.name.toLowerCase()===name.toLowerCase()))shown.push({id:'local:'+name,name,status:value.status,pending:true,local:true});
   for(const item of shown){
    const card=node('article',null,'entry supplyCard');card.dataset.supplyCard=item.id;
    const top=node('div',null,'entrytop');top.append(node('b',item.name),node('span',item.status==='low'?'⚠ Running low':item.status==='ordered'?'📦 Ordered':'✓ Good','chip'));card.append(top);
    if(item.product_name)card.append(node('p',item.product_name+(item.product_variant?' · '+item.product_variant:''),'supplyProductName'));
    else card.append(node('p','Choose the exact product and size your family buys.','why'));
    const link=rules.safeProductURL(item.product_url);if(link)card.append(node('small',new URL(link).hostname,'supplyRetailer'));
    if(item.buyer_user_id){const buyer=profiles.find(p=>p.user_id===item.buyer_user_id);card.append(node('small','Buyer: '+(buyer?.display_name||'Designated family member'),'supplyRetailer'));}
    if(item.pending)card.append(node('p','Saved on this phone · waiting to sync','why'));
    const actions=node('div',null,'actions');
    actions.append(button(item.status==='good'?'Running low':'Restocked',()=>setStatus(item.id,item.status==='good'?'low':'good')));
    if(item.status==='low')actions.append(button('Ordered',()=>setStatus(item.id,'ordered')));
    if(link){const a=node('a','Open saved product','tiny supplyBuy');a.href=link;a.target='_blank';a.rel='noopener noreferrer';actions.append(a);}
    actions.append(button(item.product_name||link?'Edit product':'Choose product',()=>openEditor(item)));
    if(item.local)actions.append(button('Remove',()=>{const p=pending();delete p[item.name];write(pendingKey(context()),p);render();}));card.append(actions);host.append(card);
   }
   if(!shown.length)host.append(node('p',c.family?'Loading your family’s supplies…':'Connect Family sync, or save a supply on this phone.','why'));
   host.append(button('+ Add a supply',()=>openEditor(null)));
   const unconnected=key(c)!=='unconnected'?read('luca-supplies-pending-v2:unconnected')||{}:{},legacy=read('luca-pending-supplies')||{};
   const imports={...Object.fromEntries(Object.entries(legacy).map(([n,s])=>[n,{status:s}])),...unconnected};
   if(c.family&&Object.keys(imports).length){const box=node('div',null,'supplyImport');box.append(node('p','Supplies saved before connecting: '+Object.keys(imports).join(', ')),button('Review & add to this family',()=>{
    if(!confirm('Add these saved supply statuses to this family?\n'+Object.entries(imports).map(([n,v])=>n+': '+v.status).join('\n')))return;
    const p=pending(c);for(const [name,value] of Object.entries(imports))p[name]={status:['good','low','ordered'].includes(value.status)?value.status:'low',revision:crypto.randomUUID()};write(pendingKey(c),p);localStorage.removeItem('luca-pending-supplies');localStorage.removeItem('luca-supplies-pending-v2:unconnected');render();void pull();}));host.append(box);}
  }
  async function ensure(){const c=context();if(!c.client||!c.family||!c.user)return;
   if(root.LucaDemo){const {data}=await c.client.from('family_supplies').select('*').eq('family_id',c.family);for(const name of ['Formula','Water','Diapers','Wipes'])if(!(data||[]).some(x=>x.name===name))await c.client.from('family_supplies').insert({family_id:c.family,name,status:'good',updated_by:c.user.id});return;}
   const {error}=await c.client.rpc('ensure_default_supplies',{target_family:c.family});if(error)throw error;
  }
  async function pull(){
   const c=context();render();if(!c.client||!c.family||!c.user)return false;
   if(flight?.scope===key(c))return flight.promise;
   const rev=revision;
   const promise=(async()=>{try{
    let result=await c.client.from('family_supplies').select('*').eq('family_id',c.family).order('name');if(result.error)throw result.error;
    let fetched=result.data||[];
    for(const [name,entry] of Object.entries(pending(c))){
     const item=fetched.find(x=>x.name.toLowerCase()===name.toLowerCase()),payload={status:entry.status,updated_by:c.user.id};
     const save=item?await c.client.from('family_supplies').update(payload).eq('id',item.id).eq('family_id',c.family):await c.client.from('family_supplies').insert({family_id:c.family,name,...payload});
     if(save.error)continue;
     const latest=pending(c);if(latest[name]?.revision===entry.revision){delete latest[name];write(pendingKey(c),latest);}
    }
    result=await c.client.from('family_supplies').select('*').eq('family_id',c.family).order('name');if(result.error)throw result.error;
    if(!same(c)||rev!==revision)return false;rows=result.data||[];write(cacheKey(c),rows);onRows(rows);render();
    const [people,members]=await Promise.all([c.client.from('family_profiles').select('user_id,display_name').eq('family_id',c.family),c.client.from('family_members').select('user_id').eq('family_id',c.family)]);if(same(c)&&rev===revision&&!people.error&&!members.error){const allowed=new Set((members.data||[]).map(m=>m.user_id));profiles=(people.data||[]).filter(p=>root.LucaDemo||allowed.has(p.user_id));render();const chooser=dialog.querySelector('#supplyBuyer');if(dialog.open&&chooser)buyerOptions(chooser);}
    return true;
   }catch{if(same(c)){if(!host.querySelector('.supplySyncError'))host.append(node('p','Couldn’t refresh supplies. Saved items and pending changes are retained.','why supplySyncError'));}return false;}})();
   flight={scope:key(c),promise};try{return await promise;}finally{if(flight?.promise===promise)flight=null;}
  }
  async function setStatus(id,status){
   if(!['good','low','ordered'].includes(status))return;
   const c=context(),item=rows.find(x=>String(x.id)===String(id)),name=item?.name||(String(id).startsWith('local:')?String(id).slice(6):null);if(!name)return;
   queue(name,status);toast('Saved '+name.toLowerCase()+' status on this phone.');
   if(c.family&&await pull()&&same(c)&&!pending(c)[name])toast(status==='low'?name+' is running low · family synced':name+' marked '+(status==='ordered'?'ordered':'restocked'));
  }
  function openEditor(item){
   const c=context();editing=item;dialog.replaceChildren();
   const form=node('form');form.id='supplyProductForm';const heading=node('h2',item?'Choose '+item.name.toLowerCase():'Add a supply');heading.id='supplyProductTitle';form.append(heading);
   const input=(label,id,value,max=140)=>{const wrap=node('label',label),field=node('input');field.id=id;field.value=value||'';field.maxLength=max;wrap.append(field);form.append(wrap);return field;};
   const name=input('Supply','supplyName',item?.name,80);name.required=true;
   const product=input('Exact product','supplyProductName',item?.product_name);product.placeholder='Brand and product name';
   const variant=input('Size / variant','supplyProductVariant',item?.product_variant,100);variant.placeholder='Diaper size, can size, pack count…';
   const url=input('Product or checkout link','supplyProductURL',item?.product_url,2048);url.type='url';url.placeholder='https://…';
   const buyerLabel=node('label','Who should get this supply’s alert?'),buyer=node('select');buyer.id='supplyBuyer';buyerOptions(buyer,item?.buyer_user_id);buyerLabel.append(buyer);form.append(buyerLabel);
   form.append(node('p','Save the product your family uses. A notification opens this link; you review and place the order at the store.','why'));
   const message=node('p');message.id='supplyProductStatus';message.setAttribute('role','status');const actions=node('div',null,'notificationActions'),save=node('button','Save product','confirm');save.type='submit';save.id='supplyProductSave';actions.append(save,button('Cancel',()=>dialog.close()));form.append(message,actions);dialog.append(form);dialog.showModal();
   form.onsubmit=async event=>{event.preventDefault();const n=name.value.trim(),raw=url.value.trim(),link=rules.safeProductURL(raw);if(raw&&!link){message.textContent='Use a secure https product or checkout link.';return;}if(!c.client||!c.family||!c.user){message.textContent='Connect Family sync before saving shared products.';return;}if(!same(c)){message.textContent='Family changed. Close and reopen this product.';return;}
    const payload={name:n,product_name:product.value.trim()||null,product_variant:variant.value.trim()||null,product_url:link,buyer_user_id:buyer.value||null,updated_by:c.user.id};save.disabled=true;message.textContent='Saving…';
    try{const target=item&&!item.local?item:rows.find(x=>x.name.toLowerCase()===n.toLowerCase());const {error}=target?await c.client.from('family_supplies').update(payload).eq('id',target.id).eq('family_id',c.family):await c.client.from('family_supplies').insert({family_id:c.family,status:item?.status||'good',...payload});if(error)throw error;if(!same(c))return;if(item?.local){const p=pending(c);delete p[item.name];write(pendingKey(c),p);}dialog.close();await pull();toast('Supply product saved for your family.');}catch{message.textContent='Couldn’t save. Check the connection and supply name, then retry. Your choices are still here.';}finally{save.disabled=false;}
   };
  }
  root.addEventListener('luca:session-changed',()=>{render();void pull();});root.addEventListener('online',()=>void pull());
  render();return {render,pull,ensure,setStatus,addLocal:queue,editLocal:name=>openEditor({id:'local:'+name,name,status:pending()[name]?.status||'good',local:true}),removeLocal:name=>{const p=pending();delete p[name];write(pendingKey(context()),p);render();}};
 }
 root.LucaSupplies={create};
})(window);
