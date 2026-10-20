/* A read-only personal inbox. Read cursors stay on this device, separate from care. */
(function(root){
 'use strict';
 const release={id:'release:p146',title:'Fresh out of the chaos lab',version:'P146',icon:'✦',kind:'release',tab:'lab',body:'The family suggestion box has entered its useful era.',features:[['💡','Names, votes and updates','See who suggested what, vote, and find new family posts from Home.'],['🛠','Sam has the final say','Sam’s review desk records decisions and replies. Authors get an in-app update. No automatic repair worker is connected.'],['★','Everyone’s stars','See the whole family first, then tap a person for their goals and receipts.']]};
 const scope=c=>c?.family&&c?.baby&&c?.user?[c.family,c.baby,c.user,String(c.person||'').trim().toLowerCase()].join(':'):'signed-out';
 function collect({context={},entries=[],unlocked=[],ideas=[],now=Date.now()}={}){
  const items=[release];if(scope(context)==='signed-out')return items;
  items.push(...ideas.filter(i=>i?.kind==='idea'&&i.id&&i.tab==='ideas'));
  const seen=new Set();for(const card of unlocked){if(!card?.id||seen.has(card.id))continue;seen.add(card.id);items.push({id:'card:'+card.id,kind:'card',icon:card.icon||'✦',title:card.name,body:'Calling card unlocked · '+(card.description||'Your collection has grown.'),tab:'achievements'});}
  const stars=root.LucaFamilyStars,person=String(context.person||'').trim();if(!stars||!person)return items;
  const matching=entries.filter(e=>!e.babyId||e.babyId===context.baby),s=stars.state(matching.filter(e=>new Date(e.at)<=now),person);
  for(const e of [...s.active].reverse().slice(0,15)){const d=e.details.starChart;items.push({id:'stars:'+String(e.syncId||e.id),kind:'stars',icon:'★',title:d.action==='redeem'?'Reward redeemed':d.delta>0?'+'+d.delta+' stars for '+person:'Star adjustment: '+d.delta,body:d.reason||'A little above & beyond.',at:e.at,tab:'stars',person});}
  if(s.opening&&s.ledger.some(e=>e.details.starChart.action==='opening'))items.push({id:'opening:'+String(s.ledger.find(e=>e.details.starChart.action==='opening').syncId||s.ledger.find(e=>e.details.starChart.action==='opening').id),kind:'stars',icon:'★',title:person+'’s star chart is ready',body:s.opening+' stars already earned when the chart began.',tab:'stars',person});
  for(const b of stars.bonuses(matching,person,now).filter(b=>!s.claimed.has(b.key)))items.push({id:'bonus:'+b.key,kind:'bonus',icon:'✧',title:b.name+' · +'+b.stars+' stars ready',body:'Claim this grown-up side quest in your Star chart.',tab:'stars',person});
  if(s.goalData&&!s.redeemed&&s.balance>=s.goalData.stars)items.push({id:'reward:'+s.goalId,kind:'reward',icon:'🎁',title:'Reward unlocked',body:s.goalData.reward+' · ready to redeem in your Star chart.',tab:'stars',person});
  return items;
 }
 function mount({getContext,getEntries,onRoute}){
  const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const bubble=el('button','updatesBubble');bubble.id='personalUpdatesButton';bubble.type='button';bubble.setAttribute('aria-label','Your updates');bubble.setAttribute('aria-haspopup','dialog');bubble.setAttribute('aria-expanded','false');bubble.append(el('span','','✦'));const badge=el('span','updatesBadge');badge.id='personalUpdatesBadge';bubble.append(badge);document.body.append(bubble);
  const teaser=el('div','releaseTeaser');teaser.id='releaseTeaser';const peek=el('button','','✦ Fresh out of the chaos lab · P146 ↗');peek.type='button';peek.id='releasePeek';const dismiss=el('button','','×');dismiss.type='button';dismiss.setAttribute('aria-label','Dismiss release teaser');teaser.append(peek,dismiss);document.querySelector('.persistentTitle')?.after(teaser);
  const dialog=el('dialog','personalUpdates');dialog.id='personalUpdatesDialog';dialog.setAttribute('aria-labelledby','personalUpdatesTitle');const head=el('header','updatesHead'),heading=el('div');heading.append(el('small','','THE LITTLE VICTORIES DEPARTMENT'));const title=el('h2','','Your updates');title.id='personalUpdatesTitle';heading.append(title);const close=el('button','','Close');close.id='closePersonalUpdates';close.type='button';head.append(heading,close);const identity=el('p','updatesIdentity');identity.id='personalUpdatesIdentity';const tabs=el('div','updatesTabs');const personal=el('button','','For you'),lab=el('button','','Chaos lab');personal.type=lab.type='button';personal.id='updatesForYou';lab.id='updatesLab';tabs.append(personal,lab);const body=el('div','updatesBody');body.id='personalUpdatesList';const mark=el('button','updatesMark','Mark all read');mark.type='button';mark.id='markUpdatesRead';dialog.append(head,identity,tabs,body,mark);document.body.append(dialog);
  let session='',unlocked=[],ideas=[],items=[],read=new Set(),dismissed=false,tab='personal',invoker=null;
  const ctx=()=>{const c=getContext()||{};return {...c,family:typeof c.family==='object'?c.family?.id:c.family,user:typeof c.user==='object'?c.user?.id:c.user};};
  const storageKey=()=> 'luca-updates-seen:v1:'+session;
  const save=()=>{try{localStorage.setItem(storageKey(),JSON.stringify({ids:[...read].slice(-200),dismissed}));}catch{}};
  function acknowledge(ids){ids.forEach(id=>read.add(id));save();refresh();}
  function paint(){
   const c=ctx(),fresh=items.filter(i=>!read.has(i.id));badge.textContent=fresh.length>9?'9+':String(fresh.length);badge.hidden=!fresh.length;bubble.setAttribute('aria-label','Your updates'+(fresh.length?' · '+fresh.length+' unread':''));teaser.hidden=dismissed||read.has(release.id);
   identity.textContent=scope(c)==='signed-out'?'Sign in for your calling cards and stars.':(c.person?'For '+c.person+' · ':'')+'Your unlocks and star activity. Read marks stay on this phone.';
   personal.setAttribute('aria-pressed',String(tab==='personal'));lab.setAttribute('aria-pressed',String(tab==='lab'));body.replaceChildren();
   if(tab==='lab'){
    const card=el('article','releaseBrief');card.append(el('small','',release.version+' · '+(read.has(release.id)?'Caught up':'New')),el('h3','',release.title),el('p','',release.body));for(const [icon,label,copy]of release.features){const row=el('div','releaseFeature');row.append(el('span','',icon));const text=el('div');text.append(el('strong','',label),el('p','',copy));row.append(text);card.append(row);}const got=el('button','confirm',read.has(release.id)?'All caught up ✓':'Got it · carry on');got.type='button';got.id='acknowledgeRelease';got.onclick=()=>{acknowledge([release.id]);dialog.close();};card.append(got);body.append(card);
   }else{
    const own=items.filter(i=>i.kind!=='release').sort((a,b)=>Number(read.has(a.id))-Number(read.has(b.id)));
    if(!own.length)body.append(el('p','updatesEmpty',scope(c)==='signed-out'?'Connect Family sync to see your own little victories here.':'Your next unlocks and star awards will land here. The tiny boss has a very relaxed awards committee.'));
    for(const item of own){const b=el('button','updateItem'+(read.has(item.id)?'':' unread'));b.type='button';b.dataset.updateId=item.id;const copy=el('span','updateCopy');copy.append(el('strong','',item.title),el('small','',item.body));if(item.at)copy.append(el('small','updateDate',new Date(item.at).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})));b.append(el('span','updateIcon',item.icon),copy,el('span','',read.has(item.id)?'↗':'●'));b.onclick=()=>{acknowledge([item.id]);dialog.close();onRoute(item.tab,item.person);};body.append(b);}
    const news=el('button','updatesNews',read.has(release.id)?'Visit the chaos lab ↗':'✦ New in P146 · open the chaos lab');news.type='button';news.onclick=()=>{tab='lab';paint();};body.append(news);
   }
   mark.disabled=!fresh.length;
  }
  function refresh(){const c=ctx(),next=scope(c);if(next!==session){session=next;unlocked=[];ideas=[];read=new Set();dismissed=false;try{const stored=JSON.parse(localStorage.getItem(storageKey())||'null');if(Array.isArray(stored?.ids))read=new Set(stored.ids.filter(x=>typeof x==='string'));dismissed=stored?.dismissed===true;}catch{}window.dispatchEvent(new Event('luca:request-personal-achievements'));window.dispatchEvent(new Event('luca:request-idea-updates'));}items=collect({context:c,entries:getEntries(),unlocked,ideas});paint();}
  function open(which,trigger){refresh();invoker=trigger||bubble;tab=which||(!read.has(release.id)?'lab':'personal');paint();if(!dialog.open)dialog.showModal();bubble.setAttribute('aria-expanded','true');close.focus();}
  bubble.onclick=()=>open('personal',bubble);peek.onclick=()=>open('lab',peek);dismiss.onclick=()=>{dismissed=true;save();paint();};close.onclick=()=>dialog.close();personal.onclick=()=>{tab='personal';paint();};lab.onclick=()=>{tab='lab';paint();};mark.onclick=()=>acknowledge(items.map(i=>i.id));dialog.addEventListener('close',()=>{bubble.setAttribute('aria-expanded','false');invoker?.focus({preventScroll:true});});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  window.addEventListener('luca:personal-achievements',e=>{const c=ctx(),d=e.detail;if(d?.family!==c.family||d?.user!==c.user||d?.baby!==c.baby)return;unlocked=Array.isArray(d.cards)?d.cards:[];items=collect({context:c,entries:getEntries(),unlocked,ideas});paint();});
  window.addEventListener('luca:idea-updates',e=>{const c=ctx(),d=e.detail;if(d?.family!==c.family||d?.user!==c.user)return;ideas=Array.isArray(d.items)?d.items:[];items=collect({context:c,entries:getEntries(),unlocked,ideas});paint();});
  for(const name of ['luca:care-updated','luca:family-session-ready','luca:session-changed'])window.addEventListener(name,refresh);
  window.addEventListener('storage',e=>{if(e.key===storageKey()){session='';refresh();}});
  document.querySelector('#menuUpdates')?.addEventListener('click',()=>{document.querySelector('#closeMenu')?.click();open('personal',bubble);});refresh();window.dispatchEvent(new Event('luca:request-personal-achievements'));return {refresh,open};
 }
 const api={release,scope,collect,mount};root.LucaUpdates=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
