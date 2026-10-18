// Cosmetic achievements, derived from real records. No points affect care decisions.
export const achievements=[
 {id:'first-checkin',name:'Fresh Recruit',icon:'✦',tone:'sage',tier:'starter',description:'You showed up. The tiny boss appreciates a warm body.',target:1,metric:'visits',hint:'Open the app while signed in. Your first card is ready.'},
 {id:'first-diaper',name:'First Responder',icon:'🧻',tone:'clay',tier:'starter',description:'One diaper logged. Welcome to the containment team.',target:1,metric:'diapers',hint:'Log your first poop diaper.'},
 {id:'sleep-scribe',name:'Ceasefire Clerk',icon:'☾',tone:'lavender',tier:'starter',description:'A sleep entry logged. The boss has temporarily stopped issuing demands.',target:1,metric:'sleep',hint:'Log your first sleep entry.'},
 {id:'quality-control',name:'Actually, It Was 7 oz',icon:'✎',tone:'sage',description:'You corrected a care entry. Accuracy is the real flex.',target:1,metric:'edits',hint:'Edit one of your own care entries.'},
 {id:'return-ticket',name:'Back for More',icon:'↻',tone:'gold',description:'Two days checking in. Apparently the job is permanent.',target:2,metric:'visits',hint:'Visit on 2 different days.'},
 {id:'care-cadet',name:'Triple Threat',icon:'✧',tone:'sage',description:'Bottle, diaper, sleep. A well-documented little empire.',target:3,metric:'careTypes',hint:'Record a bottle, poop diaper and sleep entry.'},
 {id:'no-sleep-club',name:'Caffeine Corps',icon:'☕',tone:'lavender',description:'Three overnight care entries. Your coffee has a coffee.',target:3,metric:'night',hint:'Record 3 care events that happened before 5 AM.'},
 {id:'silent-operator',name:'Silent Operator',icon:'⌁',tone:'lavender',hidden:true,description:'Quiet Mode engaged. Even your clicks have been sworn to secrecy.',hint:'The quiet professionals know when to go silent.'},
 {id:'label-maker',name:'Bottle Inspector',icon:'⌕',tone:'gold',hidden:true,description:'You inspected the bottle label twice. Quality control has become personal.',hint:'The bottle label rewards a closer look.'},
 {id:'crew-master',name:'Certified Chaos Crew',icon:'★',tone:'gold',mastery:true,description:'All four starter cards collected. The household is still chaos. You are now certified.',target:4,metric:'starterSet',hint:'Collect Fresh Recruit, Reporting for Duty, First Responder and Ceasefire Clerk.'},
 {id:'first-watch',tier:'starter',name:'Reporting for Duty',icon:'✦',tone:'sage',description:'Your first saved care entry. The tiny boss has staff.',target:1,metric:'total',hint:'Log your first care entry.'},
 {id:'bottle-service',name:'Bottle Service',icon:'🍼',tone:'gold',description:'Ten bottles logged. Your smallest regular tips in burps.',target:10,metric:'bottles',hint:'Log 10 bottles.'},
 {id:'bottle-streak',name:'Milk Run',icon:'⚡',tone:'gold',description:'Bottles on three days in a row. A very small supply chain.',target:3,metric:'bottleStreak',hint:'Log a bottle on 3 consecutive days.'},
 {id:'diaper-streak',name:'Diaper Department',icon:'💩',tone:'clay',description:'Three days of diaper logs. Employee of the mess.',target:3,metric:'diaperStreak',hint:'Log a poop diaper on 3 consecutive days.'},
 {id:'code-brown',name:'Code Brown',icon:'☣',tone:'clay',description:'A wet, messy diaper disaster. You have seen things.',target:1,metric:'disasters',hint:'Log a diaper disaster with Wet / messy checked.'},
 {id:'paper-trail',name:'Keeper of Receipts',icon:'▤',tone:'sage',description:'25 care entries logged. The evidence is overwhelming.',target:25,metric:'total',hint:'Log 25 care entries.'},
 {id:'on-a-roll',name:'On a Roll',icon:'◷',tone:'lavender',description:'Seven consecutive days with a care log. Quietly legendary.',target:7,metric:'careStreak',hint:'Log care on 7 consecutive days.'},
 {id:'night-shift',name:'Graveyard Shift',icon:'☾',tone:'lavender',description:'Care recorded between midnight and 5 AM. Coffee has entered the chat.',target:1,metric:'night',hint:'Log a care event that happened between midnight and 5 AM.'},
 {id:'weekly-mvp',name:'Weekly MVP',icon:'🏆',tone:'gold',description:'Most entries in a completed week with at least two active loggers. Ties share the crown.',target:1,metric:'weeklyWins',hint:'Lead a completed calendar week with 5+ logs and at least 2 active family loggers.'},
 {id:'ghost-mode',name:'Ghost Mode',icon:'👻',tone:'lavender',description:'Three days checking in, no logs or messages yet. Elite lurking.',target:1,metric:'ghost',hint:'Visit on 3 different days before your first care log or chat message.'},
 {id:'off-the-rails',name:'Off the Rails',icon:'💨',tone:'clay',description:'You found the limits of diaper engineering.',hidden:true,hint:'Some messes are beyond measurement.'},
 {id:'block-party',name:'Block Party',icon:'🧸',tone:'sage',description:'You found a party hiding in a very small block.',hidden:true,hint:'The little L has a surprisingly active social life.'},
 {id:'bottle-orbit',name:'Launch Control',icon:'🚀',tone:'gold',description:'A bottle briefly escaped Earth. The log stayed put.',hidden:true,hint:'Bottle service occasionally achieves escape velocity.'}
];
const ids=new Set(achievements.map(a=>a.id));
const eggIds=new Set(achievements.filter(a=>a.hidden).map(a=>a.id));
export const dateKey=value=>{const d=new Date(value);return Number.isNaN(+d)?'':[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const dayNumber=key=>Date.parse(key+'T12:00:00Z')/86400000;
const unique=values=>[...new Set(values)];
export function normalizeFlair(value){
 const f=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 return {version:1,unlocked:unique((Array.isArray(f.unlocked)?f.unlocked:[]).filter(x=>ids.has(x))),eggs:unique((Array.isArray(f.eggs)?f.eggs:[]).filter(x=>eggIds.has(x))),visits:unique((Array.isArray(f.visits)?f.visits:[]).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(dayNumber(x)))).sort().slice(-31),banner:ids.has(f.banner)?f.banner:''};
}
export function mergeFlair(server,local,{banner}={}){
 const a=normalizeFlair(server),b=normalizeFlair(local);
 const merged=normalizeFlair({unlocked:[...a.unlocked,...b.unlocked],eggs:[...a.eggs,...b.eggs],visits:[...a.visits,...b.visits],banner:banner===undefined?a.banner:banner});
 if(!merged.unlocked.includes(merged.banner))merged.banner='';
 return merged;
}
export function maxStreak(keys){
 const days=unique(keys.filter(Boolean)).map(dayNumber).sort((a,b)=>a-b);let best=0,run=0,previous=null;
 for(const d of days){run=previous!==null&&d-previous===1?run+1:1;best=Math.max(best,run);previous=d;}return best;
}
export function weekKey(value){const d=new Date(value);d.setDate(d.getDate()-(d.getDay()+6)%7);return dateKey(d);}
export function evaluateAchievements({events=[],userId,flair={},chatCount=null,now=new Date(),babyId=null}={}){
 const f=normalizeFlair(flair),today=dateKey(now),nowMs=+new Date(now),seen=new Set();
 const valid=events.filter(e=>{
  const id=String(e.syncId||e.id||''),at=+new Date(e.at);
  if(!id||seen.has(id)||!Number.isFinite(at)||at>nowMs+60000||(babyId&&e.babyId&&e.babyId!==babyId)||e.test_event||e.details?.test_event)return false;
  seen.add(id);return true;
 });
 // Author IDs survive edits. Caregiver credit remains independent in the leaderboard.
 const mine=userId?valid.filter(e=>(e.createdBy||e.created_by)===userId):[];
 const bottles=mine.filter(e=>Number(e.oz)>0),diapers=mine.filter(e=>(e.tags||[]).includes('poop')||e.event_type==='poop');
 const weeks=new Map();
 for(const e of valid){const author=e.createdBy||e.created_by;if(!author)continue;const key=weekKey(e.at);if(!weeks.has(key))weeks.set(key,new Map());const scores=weeks.get(key);scores.set(author,(scores.get(author)||0)+1);}
 let weeklyWins=0;
 for(const [key,scores] of weeks){if(key>=weekKey(now)||scores.size<2)continue;const top=Math.max(...scores.values());if(top>=5&&scores.get(userId)===top)weeklyWins++;}
 const current=weeks.get(weekKey(now))||new Map(),top=current.size?Math.max(...current.values()):0;
 const leaders=[...current].filter(([,n])=>n===top).map(([id])=>id);
 const metrics={visits:f.visits.filter(k=>k<=today).length,sleep:mine.filter(e=>(e.tags||[]).includes('sleep')||e.event_type==='sleep').length,edits:mine.filter(e=>e.details?.edited_at).length,careTypes:[bottles.length>0,diapers.length>0,mine.some(e=>(e.tags||[]).includes('sleep')||e.event_type==='sleep')].filter(Boolean).length,total:mine.length,bottles:bottles.length,diapers:diapers.length,bottleStreak:maxStreak(bottles.map(e=>dateKey(e.at))),diaperStreak:maxStreak(diapers.map(e=>dateKey(e.at))),careStreak:maxStreak(mine.map(e=>dateKey(e.at))),disasters:diapers.filter(e=>(e.details?.poop?.size===5&&e.details?.poop?.wet===true)||/Poop size: diaper disaster; wet\/messy/i.test(e.notes||'')).length,night:mine.filter(e=>new Date(e.at).getHours()<5).length,weeklyWins,ghost:mine.length===0&&chatCount===0&&f.visits.filter(k=>k<=today).length>=3?1:0};
 metrics.starterSet=[metrics.visits>0,metrics.total>0,metrics.diapers>0,metrics.sleep>0].filter(Boolean).length;
 const eligible=achievements.filter(a=>a.hidden?f.eggs.includes(a.id):metrics[a.metric]>=a.target).map(a=>a.id);
 const unlocked=unique([...f.unlocked,...eligible]);
 return {metrics,unlocked,newlyUnlocked:eligible.filter(id=>!f.unlocked.includes(id)),weekly:{leaders,count:top,mine:current.get(userId)||0,start:weekKey(now)}};
}
export function bannerFor(flair){const f=normalizeFlair(flair);return f.unlocked.includes(f.banner)?achievements.find(a=>a.id===f.banner)||null:null;}
