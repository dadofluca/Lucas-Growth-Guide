/* Personal cosmetic themes. No care writes, timed rewards or paid model calls. */
export const themes=[
 {id:'autumn',name:'Autumn original',description:'The familiar warm stone and sage.',colors:['#e5ddcf','#d7d8c6','#8b6146'],requires:[]},
 {id:'sea-glass',name:'Sea Glass',description:'Cool mist, eucalyptus and a quieter horizon.',colors:['#dbe3db','#c9d9d2','#4d766e'],requires:[]},
 {id:'peach-static',name:'Peach Static',description:'Soft apricot with a little lavender interference.',colors:['#ebdcd2','#ddd4df','#805e70'],requires:[]},
 {id:'field-notes',name:'Field Notes',description:'Olive, warm brass and tiny mission-control details.',colors:['#dfdfcb','#cdd4bd','#776238'],requires:['first-watch'],hint:'Your first saved care entry opens this field kit.'},
 {id:'aurora-protocol',name:'Aurora Protocol',description:'Pearl mint, violet light and an earned aurora frame.',colors:['#dedde9','#c7dfd6','#6d6087'],requires:['block-party','silent-operator'],hint:'A little celebration. A little silence. Two classified discoveries share a frequency.'},
 {id:'golden-hour',name:'Golden Hour',description:'Honey light, soft olive and a quiet-legend portrait halo.',colors:['#eee0c4','#d8dbbf','#87642e'],requires:['quiet-legend'],hint:'For the hands doing the care while someone else keeps the notes.'}
];
export function availableThemes(ids=[]){const set=new Set(ids);return themes.filter(t=>t.requires.every(id=>set.has(id)));}
export const themeScope=c=>c?.family&&c?.user&&c?.baby?[c.family,c.user].join(':'):'';
export function mountThemes({getContext,host}){
 let session='',cards=[],chosen='autumn',ready=false,previous=new Set(),announcement='';
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const ctx=()=>{const c=getContext()||{};return {...c,family:typeof c.family==='object'?c.family?.id:c.family,user:typeof c.user==='object'?c.user?.id:c.user};};
 const storageKey=()=> 'luca-theme:v1:'+session;
 function apply(id){const valid=availableThemes(cards).some(t=>t.id===id);document.body.dataset.theme=valid?id:'autumn';}
 function paint(){
  host.replaceChildren();host.append(el('div','kicker','YOUR CORNER OF THE CHAOS'),el('h2','','Make it yours'),el('p','why','Your theme changes this phone for your account. The family’s screens and care records stay as they are.'));
  const grid=el('div','themeGrid'),available=availableThemes(cards);
  for(const t of themes){const unlocked=available.some(x=>x.id===t.id),b=el('button','themeChoice'+(unlocked?'':' themeLocked'));b.type='button';b.dataset.themeChoice=t.id;b.disabled=!unlocked;b.setAttribute('aria-pressed',String(document.body.dataset.theme===t.id));
   const swatch=el('span','themeSwatch');swatch.style.background='linear-gradient(125deg,'+t.colors.join(',')+')';swatch.setAttribute('aria-hidden','true');b.append(swatch,el('strong','',t.name),el('small','',unlocked?t.description:t.hint),el('span','themeState',!unlocked?'✧ Discover to unlock':document.body.dataset.theme===t.id?'✓ Wearing this':t.requires.length?'Unlocked · wear theme':'Wear theme'));
   b.onclick=()=>{if(!availableThemes(cards).some(x=>x.id===t.id))return;chosen=t.id;apply(chosen);try{if(session)localStorage.setItem(storageKey(),chosen);}catch{}announcement=t.name+' equipped.';window.dispatchEvent(new Event('luca:cosmetic-feedback'));paint();};grid.append(b);
  }
  host.append(grid);const status=el('p','themeStatus',announcement||(!session?'Connect Family sync to keep a personal theme.':ready?'Cosmetics earned. Logs untouched.':'Checking your discoveries…'));status.id='themeStatus';status.setAttribute('role','status');host.append(status);
  const label=el('label','','Touch feedback'),select=el('select');select.id='profileHaptics';select.setAttribute('aria-label','Optional touch feedback');for(const [v,text]of [['off','Off'],['on','Subtle · where supported']]){const option=el('option','',text);option.value=v;select.append(option);}select.value=localStorage.getItem('luca-haptics')||'off';label.append(select);host.append(label,el('small','why',typeof navigator.vibrate==='function'?'A short optional tap when you equip a theme.':'This browser does not offer vibration feedback; the visual feedback still works.'));
  select.onchange=()=>{localStorage.setItem('luca-haptics',select.value);if(select.value==='on')navigator.vibrate?.(8);};
 }
 function publish(){const c=ctx();window.dispatchEvent(new CustomEvent('luca:personal-cosmetics',{detail:{family:c.family,user:c.user,baby:c.baby,items:availableThemes(cards).filter(t=>t.requires.length).map(t=>({id:'cosmetic:'+t.id,kind:'cosmetic',icon:'✧',title:t.name+' unlocked',body:'Your earned theme is ready in Family → Make it yours.',tab:'profile'}))}}));}
 function refresh(){const next=themeScope(ctx());if(next!==session){session=next;cards=[];ready=false;previous=new Set();announcement='';chosen='autumn';try{chosen=session?localStorage.getItem(storageKey())||'autumn':'autumn';}catch{}apply('autumn');paint();window.dispatchEvent(new Event('luca:request-personal-achievements'));}else paint();}
 window.addEventListener('luca:personal-achievements',e=>{const c=ctx(),d=e.detail;if(d?.family!==c.family||d?.user!==c.user||d?.baby!==c.baby)return;cards=(d.cards||[]).map(x=>x.id);const unlocked=availableThemes(cards),next=new Set(unlocked.map(t=>t.id));if(ready){const fresh=unlocked.filter(t=>t.requires.length&&!previous.has(t.id));if(fresh.length){announcement='Theme unlocked: '+fresh.map(t=>t.name).join(' + ')+'. Choose it here.';const status=document.getElementById('funStatus');if(status){status.textContent=announcement;setTimeout(()=>{if(status.textContent===announcement)status.textContent='';},4500);}}}previous=next;ready=true;apply(chosen);paint();publish();});
 for(const event of ['luca:family-session-ready','luca:session-changed'])window.addEventListener(event,refresh);
 window.addEventListener('storage',e=>{if(e.key===storageKey()){chosen=localStorage.getItem(storageKey())||'autumn';apply(chosen);paint();}});refresh();if(!session)apply('autumn');paint();
 return {refresh};
}
