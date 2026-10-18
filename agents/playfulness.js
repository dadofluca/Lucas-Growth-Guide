/* Decorative surprises never change a field value, intercept a save, or block a tap. */
(function(root){
 'use strict';
 const read=(key,fallback)=>{try{return localStorage.getItem(key)||fallback;}catch{return fallback;}};
 const motion=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const enabled=()=>read('luca-surprises','on')!=='off'&&read('luca-personality','dark')!=='off';
 let lastRocket=0,lastClick=0,mounted=false,clickSound=()=>{};
 function unlock(id){window.dispatchEvent(new CustomEvent('luca:easter-egg',{detail:{id}}));}
 function decorate(emoji,target,animation){
  if(!motion()||!target)return;
  const r=target.getBoundingClientRect(),el=document.createElement('span');
  el.className='lucaStunt '+animation;el.textContent=emoji;el.setAttribute('aria-hidden','true');
  el.style.left=Math.max(20,Math.min(innerWidth-60,r.left+r.width/2-20))+'px';el.style.top=Math.max(20,Math.min(innerHeight-80,r.top))+'px';document.body.append(el);
  el.addEventListener('animationend',()=>el.remove(),{once:true});setTimeout(()=>el.remove(),1800);
 }
 function savedBottle(target){
  if(!enabled()||!motion()||Date.now()-lastRocket<45000||Math.random()>=.07)return;
  lastRocket=Date.now();decorate('🍼',target,'bottleOrbit');unlock('bottle-orbit');
 }
 function mount({click}={}){
  if(mounted)return;mounted=true;clickSound=click||(()=>{});
  for(const [id,key,fallback] of [['profileSurprises','luca-surprises','on'],['profileClicks','luca-clicks','on']]){
   const field=document.getElementById(id);if(!field)continue;field.value=read(key,fallback);
   field.addEventListener('change',()=>{try{localStorage.setItem(key,field.value);}catch{}});
  }
  document.addEventListener('click',e=>{
   const target=e.target.closest('button,summary');
   if(!target||target.disabled||read('luca-sound','on')==='off'||read('luca-clicks','on')==='off'||Date.now()-lastClick<60)return;
   // Care confirmations already have their own optional feedback.
   if(target.matches('.confirm,[data-quick-oz],#profilePoopTest,#profileSoundTest,#profileGlugTest,#profileRefreshTest'))return;
   lastClick=Date.now();clickSound();
  });
  for(const input of document.querySelectorAll('#poopSize,#quickPoopSize')){
   const shell=document.createElement('div');shell.className='poopMeter';input.before(shell);shell.append(input);
   const stunt=document.createElement('span');stunt.className='meterStunt';stunt.textContent='💩';stunt.setAttribute('aria-hidden','true');
   const quip=document.createElement('small');quip.className='meterQuip';quip.setAttribute('aria-live','polite');shell.append(stunt,quip);
   let atMax=false,spent=false;
   input.addEventListener('input',()=>{
    const value=Number(input.value),label=['','Smear','Small','Medium','Large','Diaper disaster'][value];
    input.setAttribute('aria-valuetext',label);
    const target=document.getElementById(input.id==='poopSize'?'poopSizeLabel':'quickPoopSizeLabel');if(target)target.textContent=label;
    if(value===5&&!atMax&&!spent&&enabled()&&motion()&&Math.random()<.28){
     spent=true;shell.classList.add('railBroken');quip.textContent='The scale has resigned. Fair enough.';unlock('off-the-rails');
     setTimeout(()=>{shell.classList.remove('railBroken');quip.textContent='';},1700);
    }
    atMax=value===5;
   });
  }
  const quiet=document.getElementById('profileSound');quiet?.addEventListener('change',()=>{if(quiet.value==='off'&&enabled())unlock('silent-operator');});
  let inspections=0,lastInspection=0;document.getElementById('bottleInspector')?.addEventListener('click',e=>{if(!enabled())return;const now=Date.now();inspections=now-lastInspection<700?inspections+1:1;lastInspection=now;if(inspections>=2){inspections=0;unlock('label-maker');decorate('🍼 ✧',e.currentTarget,'blockParty');}});
  let taps=[];
  document.querySelector('.persistentTitle .titleL')?.addEventListener('click',e=>{
   if(!enabled())return;const now=Date.now();taps=taps.filter(t=>now-t<4000);taps.push(now);
   if(taps.length<7)return;taps=[];unlock('block-party');decorate('🧸 ✦',e.currentTarget,'blockParty');
   const status=document.querySelector('#funStatus');if(status){status.textContent='Secret block party. Guest list: you.';setTimeout(()=>status.textContent='',3500);}
  });
 }
 root.LucaPlayfulness={mount,savedBottle,enabled,motion};
})(globalThis);
