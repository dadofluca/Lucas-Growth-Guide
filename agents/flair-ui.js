import {bannerFor} from './achievements.js';
export function profileBanner(flair){
 const badge=bannerFor(flair);if(!badge)return null;
 const el=document.createElement('span');el.className='profileBanner flair-'+badge.tone;el.dataset.banner=badge.id;
 const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=badge.icon;
 const title=document.createElement('span');title.textContent=badge.name;el.append(icon,title);return el;
}
