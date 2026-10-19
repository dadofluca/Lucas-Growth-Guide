/* Small anchored care pickers. Opening one never creates a care record. */
(function(root){
 "use strict";
 function mount({bottle,poop,save,toast,caregiver,beforeOpen,bottleSound,poopFeedback}){
  let active=null,anchor=null,busy=false;
  const amounts=[...bottle.querySelectorAll('[data-quick-oz]')];
  const person=poop.querySelector('#quickPoopCaregiver'),other=poop.querySelector('#quickPoopOther');
  const size=poop.querySelector('#quickPoopSize'),wet=poop.querySelector('#quickPoopWet');
  const submit=poop.querySelector('#quickPoopSave');
  const names=['Sam','Maddie','Nona','Jay','Boppa','Yolanda','Lindsay','KJ','Luca'];
  const helpers=new Map();
  for(const [picker,id] of [[bottle,'quickBottleHelper'],[poop,'quickPoopHelper']]){
   const details=document.createElement('details');details.className='quickSharedCredit';
   details.innerHTML='<summary>＋ Share credit</summary><label for="'+id+'">Also credit</label><select id="'+id+'"><option value="">Just one person</option>'+names.map(n=>'<option>'+n+'</option>').join('')+'</select><small>One event. Each person gets credit.</small>';
   (picker===poop?person:bottle.querySelector('.quickBottleCredit')).after(details);helpers.set(picker,details.querySelector('select'));details.addEventListener('toggle',place);
  }
  function place(){
   if(!active||!anchor)return;
   const r=anchor.getBoundingClientRect(),vv=window.visualViewport;
   const width=Math.min(active===bottle?336:350,(vv?.width||innerWidth)-24);
   const leftMin=(vv?.offsetLeft||0)+12,topMin=(vv?.offsetTop||0)+12;
   const bottom=(vv?.offsetTop||0)+(vv?.height||innerHeight)-88;
   active.style.width=width+'px';
   active.style.maxHeight=Math.max(180,bottom-topMin)+'px';
   const h=active.offsetHeight;
   const below=r.bottom+9;
   const top=below+h<=bottom?below:Math.max(topMin,Math.min(r.top-h-9,bottom-h));
   active.style.left=Math.max(leftMin,Math.min(r.right-width,leftMin+(vv?.width||innerWidth)-24-width))+'px';
   active.style.top=top+'px';
  }
  function close(restore=false){
   if(!active)return;
   active.hidden=true;anchor?.setAttribute('aria-expanded','false');
   const previous=anchor;active=null;anchor=null;
   document.body.classList.remove('quickPickerOpen');
   if(restore&&previous?.isConnected)previous.focus({preventScroll:true});
  }
  function open(kind,trigger){
   const next=kind==='bottle'?bottle:poop;
   if(active===next&&anchor===trigger){close(true);return;}
   close();beforeOpen?.();anchor=trigger||document.querySelector(kind==='bottle'?'#topQuickBottle':'#topQuickPoop');active=next;
   helpers.get(next).value='';helpers.get(next).closest('details').open=false;
   if(next===poop){
    size.value='3';wet.checked=false;other.value='';other.hidden=true;
    const current=String(caregiver()||'').trim();
    person.replaceChildren();
    for(const name of [...new Set([...names,...(current?[current]:[])])]){const option=document.createElement('option');option.value=name;option.textContent=name;person.append(option);}
    const option=document.createElement('option');option.value='other';option.textContent='Someone else…';person.append(option);person.value=current||'Sam';
    size.dispatchEvent(new Event('input',{bubbles:true}));
   }else bottle.querySelector('.quickBottleCredit').textContent='Credit: '+caregiver()+' · now';
   next.hidden=false;anchor?.setAttribute('aria-expanded','true');document.body.classList.add('quickPickerOpen');place();
   // Prevent focus scrolling the page when the picker floats beside a shortcut.
   (next===bottle?amounts[0]:person).focus({preventScroll:true});
  }
  person.addEventListener('change',()=>{other.hidden=person.value!=='other';if(!other.hidden)other.focus({preventScroll:true});place();});
  for(const button of amounts)button.addEventListener('click',()=>{
   if(busy||active!==bottle)return;
   const amount=Number(button.dataset.quickOz);if(![4,5,6,7,8].includes(amount))return;
   busy=true;amounts.forEach(b=>b.disabled=true);
   const trigger=anchor;
   try{
    const event={id:crypto.randomUUID(),at:new Date().toISOString(),oz:amount,tags:[],people:root.LucaFamilyStars.names([caregiver(),helpers.get(bottle).value]),notes:'',source:'quick-bottle'};
    void save(event);close(true);toast(amount+' oz bottle saved on this phone ✓','feed');bottleSound?.();
    root.LucaPlayfulness?.savedBottle(trigger);
   }finally{busy=false;amounts.forEach(b=>b.disabled=false);}
  });
  poop.querySelector('form').addEventListener('submit',e=>{
   e.preventDefault();if(busy||active!==poop)return;
   const who=(person.value==='other'?other.value:person.value).trim();
   if(!who){other.setCustomValidity('Enter the caregiver name.');other.reportValidity();return;}
   other.setCustomValidity('');
   const value=Number(size.value),labels=['','smear','small','medium','large','diaper disaster'];
   if(!labels[value])return;
   busy=true;submit.disabled=true;
   try{
    const event={id:crypto.randomUUID(),at:new Date().toISOString(),oz:null,tags:['poop'],people:root.LucaFamilyStars.names([who,helpers.get(poop).value]),notes:'Poop size: '+labels[value]+(wet.checked?'; wet/messy':''),details:{poop:{size:value,wet:wet.checked}},source:'quick-poop'};
    void save(event);close(true);toast('Poop saved on this phone · '+who+' ✓','poop');poopFeedback?.();
   }finally{busy=false;submit.disabled=false;}
  });
  other.addEventListener('input',()=>other.setCustomValidity(''));
  bottle.querySelector('#quickBottleCancel').addEventListener('click',()=>close(true));
  poop.querySelector('#quickPoopCancel').addEventListener('click',()=>close(true));
  document.addEventListener('pointerdown',e=>{if(active&&!active.contains(e.target)&&!anchor?.contains(e.target))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();close(true);}});
  document.addEventListener('click',e=>{if(e.target.closest('nav button,.menuRow,#moreBtn,[data-quick="nap"]'))close();});
  window.addEventListener('resize',place);window.addEventListener('scroll',place,{passive:true});
  window.visualViewport?.addEventListener('resize',place);
  return {openBottle:trigger=>open('bottle',trigger),openPoop:trigger=>open('poop',trigger),close};
 }
 root.LucaQuickActions={mount};
})(globalThis);
