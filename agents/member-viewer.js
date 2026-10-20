import {avatarImage,avatarLabel} from './family-profiles.js';
import {achievements,normalizeFlair,evaluateAchievements} from './achievements.js';
import {profileBanner} from './flair-ui.js';
import {availableThemes} from './themes.js';
export function mountMemberViewer({getClient,getFamilyId,getUser,getEntries=()=>[],getBabyId=()=>null}){
 let request=0,invoker=null;
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const family=()=>{const f=getFamilyId();return typeof f==='object'?f?.id:f;};
 const dialog=el('dialog','memberProfile');dialog.id='memberProfileDialog';dialog.setAttribute('aria-labelledby','memberProfileTitle');const close=el('button','memberClose','Close');close.type='button';close.id='closeMemberProfile';const body=el('div');body.id='memberProfileBody';dialog.append(close,body);document.body.append(dialog);close.onclick=()=>dialog.close();
 async function open(id,trigger){const sb=getClient(),fid=family(),user=getUser(),token=++request;if(!sb||!fid||!user?.id)return;invoker=trigger;const loading=el('h2','','Opening their locker…');loading.id='memberProfileTitle';body.replaceChildren(loading);if(!dialog.open)dialog.showModal();close.focus();
  try{const [profile,links]=await Promise.all([sb.from('family_profiles').select('user_id,display_name,bio,avatar_preset,flair').eq('family_id',fid).eq('user_id',id),sb.from('family_star_identities').select('user_id,person').eq('family_id',fid)]);if(token!==request||family()!==fid||getUser()?.id!==user.id)return;if(profile.error)throw profile.error;const p=profile.data?.find(p=>p.user_id===id);if(!p)throw Error('missing');
   const flair=normalizeFlair(p.flair),identities=links.error?[]:links.data||[],credit=evaluateAchievements({events:getEntries(),userId:id,babyId:getBabyId(),identities,flair}).metrics.quietLegend;
   if(credit&&!flair.unlocked.includes('quiet-legend'))flair.unlocked.push('quiet-legend');
   const title=el('h2','',/^device-/i.test(p.display_name||'')?'Family member':p.display_name||'Family member');title.id='memberProfileTitle';body.replaceChildren(avatarImage(p.avatar_preset||'bear',96,true),title,el('p','avatarCharacter',avatarLabel(p.avatar_preset)),el('p','memberBio',p.bio||'No bio added yet.'));const banner=profileBanner(flair);if(banner)body.append(banner);
   const earned=achievements.filter(a=>flair.unlocked.includes(a.id));body.append(el('h3','','Unlocked calling cards · '+earned.length));const grid=el('div','memberCards');for(const a of earned){const card=el('article','memberCard');card.append(el('span','',a.icon),el('strong','',a.name),el('small','',a.description));grid.append(card);}if(!earned.length)grid.append(el('p','why','Their collection is just getting started.'));body.append(grid);
   const cosmetics=availableThemes(flair.unlocked).filter(t=>t.requires.length);if(cosmetics.length){body.append(el('h3','','Earned cosmetics'));for(const t of cosmetics)body.append(el('p','memberCosmetic','✧ '+t.name));}
  }catch{if(token===request){const title=el('h2','','Profile unavailable');title.id='memberProfileTitle';body.replaceChildren(title,el('p','why','Close and try again. Family sync may need reconnecting.'));}}
 }
 document.addEventListener('click',e=>{const button=e.target.closest('[data-family-member]');if(button)void open(button.dataset.familyMember,button);});
 dialog.addEventListener('close',()=>{request++;body.replaceChildren();invoker?.focus({preventScroll:true});});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 for(const name of ['luca:session-changed','luca:family-session-ready'])window.addEventListener(name,()=>{request++;if(dialog.open)dialog.close();body.replaceChildren();});
 return {open};
}
