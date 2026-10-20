/* Friend practice mode: local sample data, isolated storage, no real service client. */
(function(){
 'use strict';
 const prefix='luca-practice-v1:',native=window.localStorage,nativeSession=window.sessionStorage;
 function isolated(storage){return {getItem:k=>storage.getItem(prefix+k),setItem:(k,v)=>storage.setItem(prefix+k,String(v)),removeItem:k=>storage.removeItem(prefix+k),clear(){for(let i=storage.length-1;i>=0;i--){const k=storage.key(i);if(k?.startsWith(prefix))storage.removeItem(k);}},key:i=>Array.from({length:storage.length},(_,n)=>storage.key(n)).filter(k=>k?.startsWith(prefix))[i]?.slice(prefix.length)||null,get length(){return Array.from({length:storage.length},(_,n)=>storage.key(n)).filter(k=>k?.startsWith(prefix)).length;}};}
 try{Object.defineProperty(window,'localStorage',{value:isolated(native)});Object.defineProperty(window,'sessionStorage',{value:isolated(nativeSession)});}catch{window.LucaDemo={ready:false};return;}
 const read=table=>JSON.parse(localStorage.getItem('db:'+table)||'[]'),write=(table,rows)=>localStorage.setItem('db:'+table,JSON.stringify(rows));
 const day=(offset,h,m=0)=>{const d=new Date();d.setDate(d.getDate()+offset);d.setHours(h,m,0,0);return d.toISOString();};
 if(!localStorage.getItem('db:family_star_identities'))write('family_star_identities',[{family_id:'practice-family',user_id:'practice-user',person:'Test Pilot'}]);
 if(!localStorage.getItem('db:family_idea_managers'))write('family_idea_managers',[{family_id:'practice-family',user_id:'practice-user'}]);
 if(!localStorage.getItem('seeded')){
  const morning=new Date().getHours()<10?-1:0,now=Date.now(),napStart=new Date(now-3*3600000),napEnd=new Date(now-2*3600000),fmt=d=>d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  write('baby_events',[
   {id:'practice-bed',baby_id:'practice-baby',event_time:day(morning-1,22,15),event_type:'sleep',tags:['sleep'],caregivers:['Sam'],note:'Down for the night at 10:15 pm',created_by:'practice-user',details:{}},
   {id:'practice-wake',baby_id:'practice-baby',event_time:day(morning,7,18),event_type:'other',tags:['other'],caregivers:['Sam'],note:'Slept last night until 7 am, 2 wakeups',created_by:'practice-user',details:{}},
   {id:'practice-bottle',baby_id:'practice-baby',event_time:new Date(now-3600000).toISOString(),event_type:'feed',tags:[],caregivers:['Nona'],amount_oz:6,note:'Sample bottle · try editing this',created_by:'practice-nona',details:{}},
   {id:'practice-nap',baby_id:'practice-baby',event_time:napStart.toISOString(),event_type:'sleep',tags:['sleep'],caregivers:['Nona'],note:'Napped '+fmt(napStart)+'–'+fmt(napEnd),created_by:'practice-nona',details:{}}
  ]);
  write('family_profiles',[{family_id:'practice-family',user_id:'practice-user',display_name:'Test Pilot',bio:'Here for the test flight.',avatar_preset:'dadasDude',flair:{}},{family_id:'practice-family',user_id:'practice-nona',display_name:'Sample Nona',bio:'Sample profile',avatar_preset:'sharkBite',flair:{}}]);
  write('family_chat_messages',[{id:'practice-chat',family_id:'practice-family',sender_id:'practice-nona',body:'Welcome to practice mode. Make a mess. The real logs are safe.',created_at:new Date(now-600000).toISOString()}]);
  write('luca_schedule',[{id:'practice-work-a',family_id:'practice-family',person:'Sam',kind:'work',start_at:day(0,6),end_at:day(0,15)},{id:'practice-work-b',family_id:'practice-family',person:'Maddie',kind:'work',start_at:day(0,7),end_at:day(0,19)}]);
  localStorage.setItem('luca-caregiver','Test Pilot');localStorage.setItem('luca-sound','off');localStorage.setItem('seeded','1');sessionStorage.setItem('hideSync','1');
 }
 const canonical=value=>JSON.stringify(value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,JSON.parse(canonical(v))])):value);
 function query(table){
  let action='read',payload=null,filters=[],single=false,count=false,head=false,ordering=null,maximum=null,options={};
  const q={select(_columns,opts={}){count=!!opts.count;head=!!opts.head;return q},insert(v){action='insert';payload=v;return q},upsert(v,o={}){action='upsert';payload=v;options=o;return q},update(v){action='update';payload=v;return q},delete(){action='delete';return q},eq(k,v){filters.push(row=>k==='flair'?canonical(row.flair||{})===canonical(JSON.parse(v)):row[k]===v);return q},in(k,v){filters.push(row=>v.includes(row[k]));return q},gte(k,v){filters.push(row=>row[k]>=v);return q},lt(k,v){filters.push(row=>row[k]<v);return q},order(k,o={}){ordering={k,ascending:o.ascending!==false};return q},limit(n){maximum=n;return q},single(){single=true;return q},maybeSingle(){single=true;return q},abortSignal(){return q},then(resolve,reject){return Promise.resolve().then(()=>{
   let rows=read(table),selected=rows.filter(row=>filters.every(f=>f(row))),result=selected;
   if(action==='insert'||action==='upsert'){
    result=[];for(const value of Array.isArray(payload)?payload:[payload]){const keys=(options.onConflict||'id').split(','),old=action==='upsert'?rows.find(row=>keys.every(k=>row[k]===value[k])):null;
     if(action==='insert'&&value.id&&rows.some(row=>row.id===value.id))return {data:null,error:{code:'23505'}};
     if(old&&options.ignoreDuplicates){result.push(old);continue;}
     const saved={id:crypto.randomUUID(),created_at:new Date().toISOString(),...(table==='family_idea_reviews'?{updated_at:new Date().toISOString()}:{}),...(table==='family_profiles'?{flair:{}}:{}),...old,...value};rows=old?rows.map(row=>row===old?saved:row):[...rows,saved];result.push(saved);
    }write(table,rows);
   }else if(action==='update'){if(table==='family_idea_reviews')payload={...payload,updated_at:new Date().toISOString()};result=selected.map(row=>({...row,...payload}));write(table,rows.map(row=>selected.includes(row)?{...row,...payload}:row));}
   else if(action==='delete')write(table,rows.filter(row=>!selected.includes(row)));
   if(ordering)result=[...result].sort((a,b)=>String(a[ordering.k]).localeCompare(String(b[ordering.k]))*(ordering.ascending?1:-1));
   const total=result.length;if(maximum!=null)result=result.slice(0,maximum);
   return {data:head?null:structuredClone(single?result[0]||null:result),count:count?total:null,error:null};
  }).then(resolve,reject);}};return q;
 }
 const channel={on(){return channel},subscribe(){return channel}};
 const media=new Map();
 const client={from:query,auth:{getUser:async()=>({data:{user:{id:'practice-user',email:'test-pilot@example.invalid'}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({error:null}),signInWithOtp:async()=>({error:{message:'Practice mode does not send emails.'}})},rpc:async name=>name==='my_family_setup'?{data:[{family_id:'practice-family',baby_id:'practice-baby'}],error:null}:{data:null,error:{message:'Family access is disabled in practice mode.'}},channel:()=>channel,removeChannel:async()=>{},functions:{invoke:async()=>({data:{answer:'Practice Teddy here. This is a local example reply. Try logging a bottle, editing History, changing your avatar, or assigning sample coverage.'},error:null})},storage:{from:()=>({upload:async(path,file)=>{media.set(path,URL.createObjectURL(file));return {data:{path},error:null}},createSignedUrl:async path=>({data:{signedUrl:media.get(path)||''},error:null})})}};
 window.LucaDemo={ready:true,client,reset(){localStorage.clear();sessionStorage.clear();location.reload();}};
 document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('demoReset')?.addEventListener('click',()=>{if(confirm('Reset only this practice playground?'))window.LucaDemo.reset();});
  document.querySelector('[data-practice-backup]')?.addEventListener('click',event=>{event.preventDefault();window.toast?.('The backup log is separate from this practice playground.');});
 });
})();
