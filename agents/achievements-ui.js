import {achievements,evaluateAchievements,normalizeFlair,mergeFlair,dateKey} from './achievements.js';
import {profileBanner} from './flair-ui.js';
import {avatarImage,avatarLabel} from './family-profiles.js';

export function mountAchievements({getContext,getEntries,host}){
 let session='',generation=0,profiles=[],identities=[],self=null,flair=normalizeFlair({}),chatCount=null,result=null;
 let category='all';let loading=false,saving=false,dirty=false,revision=0,debounce=null,notice='',pendingBanner;
 const context=()=>{const c=getContext();return {...c,family:typeof c.family==='object'?c.family?.id:c.family};};
 const key=c=>c.family&&c.user?.id?c.family+':'+c.user.id:'';
 const current=(c,g=generation)=>generation===g&&key(context())===key(c);
 const localKey=c=>'luca-flair-pending:'+key(c);
 const readPending=c=>{try{return JSON.parse(localStorage.getItem(localKey(c))||'null');}catch{return null;}};
 function storePending(c){try{localStorage.setItem(localKey(c),JSON.stringify({flair,banner:pendingBanner}));}catch{}}
 function clearPending(c){try{localStorage.removeItem(localKey(c));}catch{}}
 const element=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
 function changed(c){dirty=true;revision++;storePending(c);}
 function calculate(c){
  result=evaluateAchievements({events:getEntries(),userId:c.user.id,babyId:c.baby,flair,chatCount,identities});
  if(result.newlyUnlocked.length){flair={...flair,unlocked:result.unlocked};changed(c);}
 }
 function publishPersonal(){const c=context();if(!self||!session||key(c)!==session)return;window.dispatchEvent(new CustomEvent('luca:personal-achievements',{detail:{family:c.family,baby:c.baby,user:c.user.id,cards:achievements.filter(a=>flair.unlocked.includes(a.id)).map(({id,name,icon,description})=>({id,name,icon,description}))}}));}
 function paint(){
  const oldPortrait=host.querySelector('.achievementHero .avatarPortrait');
  host.replaceChildren();const c=context();const teaser=document.getElementById('starterCardTeaser');if(teaser){teaser.hidden=!self||!!flair.banner||!result?.unlocked.length;const count=result?.unlocked.length||1;teaser.textContent='✦ '+count+' calling card'+(count===1?'':'s')+' ready · choose yours ↗';}
  if(!session||key(c)!==session){host.append(element('p','muted','Sign in to Family Sync to collect achievements.'));return;}
  if(!self){host.append(element('p','muted',notice||'Opening your trophy cabinet…'));return;}
  publishPersonal();
  const hero=element('div','achievementHero');
  hero.append(oldPortrait?.dataset.avatarKey===(self.avatar_preset||'bear')?oldPortrait:avatarImage(self.avatar_preset||'bear',64,true));
  const identity=element('div','achievementIdentity');identity.append(element('strong','',self.display_name||'You'),element('span','avatarCharacter',avatarLabel(self.avatar_preset)));
  const banner=profileBanner(flair);if(banner)identity.append(banner);else identity.append(element('small','muted','Choose an earned banner below.'));
  hero.append(identity);host.append(hero);
  const score=element('div','achievementScore');score.append(element('strong','',String(result?.unlocked.length||0)),element('span','', ' / '+achievements.length+' unlocked'));
  const progress=document.createElement('progress');progress.max=achievements.length;progress.value=result?.unlocked.length||0;progress.setAttribute('aria-label','Achievements unlocked');score.append(progress);host.append(score);
  const week=element('div','weeklyHighlight');week.append(element('span','achievementEyebrow','THIS WEEK’S PACE'));
  const leaders=result?.weekly.leaders||[],names=leaders.map(id=>profiles.find(p=>p.user_id===id)?.display_name||'Family member');
  week.append(element('strong','',names.length?names.join(' + '):'A fresh page'));
  week.append(element('small','',names.length?result.weekly.count+' entries logged'+(names.length>1?' · shared lead':''):'The first care log starts the week.'));host.append(week);
  const tools=element('div','achievementTools');tools.append(element('h2','','Calling cards'));
  if(flair.banner){const clear=element('button','tiny','No banner');clear.type='button';clear.dataset.equipBanner='';tools.append(clear);}
  host.append(tools,element('p','achievementFoot','Most cards celebrate entries you logged. Quiet Legend celebrates care others credited to you. Hidden finds reveal themselves along the way.'));
  const grid=element('div','achievementGrid');
  const filters=element('div','callingCardFilters');for(const [value,label] of [['all','All cards'],['starter','Easy starters'],['ready','Unlocked'],['hidden','Classified']]){const button=element('button','',label);button.type='button';button.dataset.cardCategory=value;button.setAttribute('aria-pressed',String(category===value));filters.append(button);}host.append(filters);
  const ordered=[...achievements].sort((a,b)=>(a.tier==='starter'?0:a.hidden?2:1)-(b.tier==='starter'?0:b.hidden?2:1));
  for(const badge of ordered){
   const unlocked=flair.unlocked.includes(badge.id),equipped=unlocked&&flair.banner===badge.id;
   if(category==='starter'&&badge.tier!=='starter'||category==='ready'&&!unlocked||category==='hidden'&&!badge.hidden)continue;
   const card=element('article','achievementCard'+(unlocked?' unlocked':' locked')+(equipped?' equipped':''));card.dataset.achievement=badge.id;
   card.append(element('span','achievementIcon flair-'+(unlocked?badge.tone:'locked'),unlocked||!badge.hidden?badge.icon:'?'));
   card.append(element('h3','',badge.hidden&&!unlocked?'Classified nonsense':badge.name));
   card.append(element('p','',unlocked?badge.description:badge.hint));
   if(unlocked){
    const preview=profileBanner({unlocked:flair.unlocked,banner:badge.id});if(preview)card.append(preview);
    const button=element('button','tiny',equipped?'✓ Equipped':'Equip card');button.type='button';button.dataset.equipBanner=badge.id;button.setAttribute('aria-pressed',String(equipped));button.disabled=equipped;card.append(button);
   }else if(!badge.hidden){
    const count=Math.min(badge.target,result?.metrics[badge.metric]||0),label=element('small','achievementProgress',count+' / '+badge.target);card.append(label);
   }else card.append(element('small','achievementProgress','Hidden achievement'));
   grid.append(card);
  }
  host.append(grid);
  const status=element('p','achievementStatus',notice||(dirty?'Banner collection saved on this phone. Sync pending.':'Banners appear on your profile and in Family Chat.'));status.id='achievementStatus';status.setAttribute('role','status');host.append(status);
  const refresh=element('button','tiny','Refresh achievements');refresh.type='button';refresh.dataset.refreshAchievements='';refresh.disabled=loading||saving;host.append(refresh);
 }
 async function flush(){
  if(saving||!dirty||!self)return;const c=context(),g=generation;if(!c.client||key(c)!==session)return;
  saving=true;let conflict=false;const version=revision,snapshot=structuredClone(flair);
  try{
   // A narrow compare-and-swap preserves profile drafts and concurrent discoveries on another device.
   const {data,error}=await c.client.from('family_profiles').update({flair:snapshot}).eq('family_id',c.family).eq('user_id',c.user.id).eq('flair',JSON.stringify(self.flair||{})).select('user_id,flair');
   if(!current(c,g))return;
   if(error)throw error;
   if(!data?.some(p=>p.user_id===c.user.id)){conflict=true;return;}
   self={...self,flair:snapshot};profiles=profiles.map(p=>p.user_id===c.user.id?self:p);
   if(revision===version){dirty=false;pendingBanner=undefined;clearPending(c);notice='Collection synced. Your banner is ready for Family Chat.';}
   window.dispatchEvent(new CustomEvent('luca:profile-flair',{detail:{family:c.family,user:c.user.id,flair:snapshot}}));
  }catch{if(current(c,g)){notice='Saved on this phone. Reconnect and tap Refresh to sync your collection.';storePending(c);}}
  finally{if(current(c,g)){saving=false;paint();if(conflict)void refresh();else if(dirty&&revision!==version)void flush();}}
 }
 async function refresh(){
  const c=context(),next=key(c);
  if(next!==session){session=next;generation++;profiles=[];identities=[];self=null;flair=normalizeFlair({});chatCount=null;result=null;loading=false;saving=false;dirty=false;pendingBanner=undefined;notice='';}
  if(!next||!c.client||!c.user){paint();return;}
  if(loading)return;loading=true;const g=generation;
  try{
   const responses=await Promise.allSettled([
    c.client.from('family_profiles').select('user_id,display_name,avatar_preset,flair').eq('family_id',c.family),
    c.client.from('family_chat_messages').select('id',{count:'exact',head:true}).eq('family_id',c.family).eq('sender_id',c.user.id),
    c.client.from('family_star_identities').select('user_id,person').eq('family_id',c.family)
   ]);
   if(!current(c,g))return;
   const people=responses[0];if(people.status!=='fulfilled'||people.value.error)throw new Error('Profile unavailable');
   profiles=people.value.data||[];self=profiles.find(p=>p.user_id===c.user.id)||null;
   if(!self){notice='Finish Family Sync, then refresh your collection.';paint();return;}
   const chat=responses[1];chatCount=chat.status==='fulfilled'&&!chat.value.error&&Number.isInteger(chat.value.count)?chat.value.count:null;
   const linked=responses[2];identities=linked.status==='fulfilled'&&!linked.value.error?linked.value.data||[]:[];
   const pending=readPending(c);if(pending&&pendingBanner===undefined&&Object.hasOwn(pending,'banner'))pendingBanner=pending.banner;
   const local=mergeFlair(pending?.flair,flair,{banner:pendingBanner});
   flair=mergeFlair(self.flair,local,{banner:pendingBanner});
   const today=dateKey(new Date());if(document.visibilityState==='visible'&&!flair.visits.includes(today)){flair=normalizeFlair({...flair,visits:[...flair.visits,today]});changed(c);}
   calculate(c);
   if(JSON.stringify(normalizeFlair(self.flair))!==JSON.stringify(flair))changed(c);
   notice='';paint();void flush();
  }catch{if(current(c,g)){notice='Achievements are unavailable right now. Your care logs are unchanged.';paint();}}
  finally{if(current(c,g)){loading=false;paint();}}
 }
 function update(){
  const c=context();if(key(c)!==session||!self){void refresh();return;}
  calculate(c);paint();void flush();
 }
 host.addEventListener('click',e=>{
  const filter=e.target.closest('[data-card-category]');if(filter){category=filter.dataset.cardCategory;paint();return;}
  const equip=e.target.closest('[data-equip-banner]');
  if(equip){const id=equip.dataset.equipBanner;if(id&&!flair.unlocked.includes(id))return;pendingBanner=id;flair={...flair,banner:id};changed(context());notice='';paint();void flush();return;}
  if(e.target.closest('[data-refresh-achievements]'))void refresh();
 });
 window.addEventListener('luca:easter-egg',e=>{
  const c=context(),id=e.detail?.id;if(key(c)!==session||!self||!achievements.some(a=>a.hidden&&a.id===id))return;
  if(!flair.eggs.includes(id)){flair={...flair,eggs:[...flair.eggs,id]};changed(c);update();
   const name=achievements.find(a=>a.id===id).name;const status=document.getElementById('funStatus');if(status){status.textContent='Achievement unlocked: '+name+'. Find your banner in Achievements.';setTimeout(()=>status.textContent='',4500);}
  }
 });
 window.addEventListener('luca:care-updated',()=>{clearTimeout(debounce);debounce=setTimeout(update,350);});
 window.addEventListener('luca:family-session-ready',refresh);window.addEventListener('luca:session-changed',refresh);
 window.addEventListener('luca:request-personal-achievements',publishPersonal);
 window.addEventListener('online',refresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
 document.querySelector('[data-tab="achievements"]')?.addEventListener('click',refresh);
 setInterval(()=>{if(!document.hidden&&document.querySelector('#achievementsView.active'))void refresh();},60000);
 void refresh();
 return {refresh};
}
