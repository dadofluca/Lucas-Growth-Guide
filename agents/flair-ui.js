import {bannerFor} from './achievements.js';
export function profileBanner(flair){
 const badge=bannerFor(flair);if(!badge)return null;
 const el=document.createElement('span');el.className='profileBanner callingCard flair-'+badge.tone+(badge.mastery?' masteryCard':'');el.dataset.banner=badge.id;
 const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=badge.icon;
 const copy=document.createElement('span');copy.className='callingCardCopy';const title=document.createElement('strong');title.textContent=badge.name;const tier=document.createElement('small');tier.textContent=badge.mastery?'MASTERY':badge.hidden?'CLASSIFIED':badge.tier==='starter'?'STARTER':'CARE CREW';copy.append(title,tier);el.append(icon,copy);return el;
}
