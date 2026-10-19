/* Shared credit and Stars are derived from records; no storage or network here. */
(function(root){
 'use strict';
 const people=['KJ','Sam','Maddie','Luca','Nona','Jay','Boppa','Yolanda','Lindsay'];
 const identity=name=>String(name||'').trim().toLowerCase();
 function names(values){const seen=new Set();return (values||[]).map(x=>String(x||'').trim()).filter(x=>x&&!seen.has(identity(x))&&seen.add(identity(x)));}
 const isLedger=e=>(e.tags||[]).includes('stars')||!!e.details?.starChart;
 function points(e){if(isLedger(e))return 0;const tags=new Set(e.tags||[]),type=e.event_type;return (Number(e.oz)>0||type==='feed'?1:0)+(tags.has('poop')||type==='poop'?3:0)+(tags.has('solids')||type==='solids'?1:0)+(tags.has('medicine')||type==='medicine'?1:0)+(tags.has('bath')||type==='bath'?2:0);}
 function rows(entries){const seen=new Set();return entries.filter(e=>{const key=String(e.syncId||e.id||'');if(!key||seen.has(key))return false;seen.add(key);return true;});}
 function state(entries,person,now=new Date()){
  const ledger=rows(entries).filter(isLedger).filter(e=>identity(e.details?.starChart?.person)===identity(person)).sort((a,b)=>new Date(a.at)-new Date(b.at)||String(a.id).localeCompare(String(b.id)));
  const valid=new Map(ledger.map(e=>[String(e.syncId||e.id),e]));
  const group=d=>d.action==='bonus'?'bonus:'+d.key:d.action==='redeem'?'redeem:'+(d.key||d.ref):null;
  const reversed=new Set(ledger.filter(e=>e.details.starChart.action==='undo'&&['award','bonus','redeem'].includes(valid.get(String(e.details.starChart.ref))?.details.starChart.action)).map(e=>String(e.details.starChart.ref)));
  const reversedGroups=new Set([...reversed].map(id=>group(valid.get(id).details.starChart)).filter(Boolean));
  for(const e of ledger)if(reversedGroups.has(group(e.details.starChart)))reversed.add(String(e.syncId||e.id));
  const used=new Set(),active=[];
  for(const e of ledger){const d=e.details.starChart,id=String(e.syncId||e.id);if(reversed.has(id))continue;if(!['award','bonus','redeem'].includes(d.action)||!Number.isInteger(d.delta)||Math.abs(d.delta)>1000)continue;
   const key=group(d);if(key&&used.has(key))continue;if(key)used.add(key);active.push(e);
  }
  const openingRow=ledger.find(e=>e.details.starChart.action==='opening'&&Number.isInteger(e.details.starChart.delta)&&e.details.starChart.delta>=0),opening=openingRow?.details.starChart.delta||0,balance=opening+active.reduce((n,e)=>n+e.details.starChart.delta,0),goal=ledger.filter(e=>e.details.starChart.action==='goal').at(-1)||null;
  const goalData=goal?.details.starChart,goalId=goal?String(goal.syncId||goal.id):null;
  const redeemed=goalId?active.some(e=>e.details.starChart.action==='redeem'&&e.details.starChart.ref===goalId):false;
  const day=value=>{const d=new Date(value);return [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-');},days=new Set(active.filter(e=>e.details.starChart.delta>0).map(e=>day(e.at)));
  let streak=0,cursor=new Date(now);cursor.setHours(12,0,0,0);if(!days.has(day(cursor)))cursor.setDate(cursor.getDate()-1);while(days.has(day(cursor))){streak++;cursor.setDate(cursor.getDate()-1);}
  const lastUndo=ledger.filter(e=>e.details.starChart.action==='undo'&&valid.get(String(e.details.starChart.ref))?.details.starChart.ref===goalId).at(-1);
  return {person,opening,balance,ledger,active,reversed,goal,goalId,goalData,redeemed,streak,goalClaimKey:goalId+':'+(lastUndo?.syncId||lastUndo?.id||'first'),claimed:new Set(ledger.filter(e=>e.details.starChart.action==='bonus').map(e=>e.details.starChart.key))};
 }
 const bonusRules=[{id:'pit-crew',name:'Two-person Pit Crew',stars:1,description:'Bottle teamwork. One holds, one handles logistics.',matches:e=>Number(e.oz)>0&&names(e.people).length>1},{id:'suds',name:'Suds & Regrets',stars:1,description:'A bath completed. Everyone is slightly wetter now.',matches:e=>(e.tags||[]).includes('bath')||e.event_type==='bath'},{id:'hazard',name:'Hazard Pay',stars:2,description:'A wet diaper disaster. The uniform did not survive.',matches:e=>e.details?.poop?.size===5&&e.details?.poop?.wet===true},{id:'night',name:'Unpaid Night Shift',stars:1,description:'Care between midnight and 5 AM. HR sends its condolences.',matches:e=>points(e)>0&&new Date(e.at).getHours()<5}];
 const bonusSince=Date.parse('2026-10-19T21:38:05Z');
 function bonuses(entries,person,now=Date.now()){
  if(['kj','luca'].includes(identity(person)))return [];
  const care=rows(entries).filter(e=>!isLedger(e)&&new Date(e.at)>=bonusSince&&new Date(e.at)<=now&&names(e.people).some(n=>identity(n)===identity(person))).sort((a,b)=>new Date(a.at)-new Date(b.at));
  return bonusRules.map(rule=>{const source=care.find(rule.matches);return source?{...rule,key:identity(person)+':'+rule.id,source:String(source.syncId||source.id)}:null;}).filter(Boolean);
 }
 function entry(action,{person,delta=0,reason='',stars,reward='',ref='',key='',source=''},id,now=new Date()){
  person=String(person||'').trim();if(!person||person.length>40)throw Error('Choose a name.');
  if(!['award','goal','redeem','bonus','undo','opening'].includes(action))throw Error('Unknown star action.');
  if(action==='opening'&&(!Number.isInteger(delta)||delta<0||delta>1000))throw Error('Check the opening balance.');
  if(['award','bonus','redeem'].includes(action)&&(!Number.isInteger(delta)||delta===0||Math.abs(delta)>1000))throw Error('Choose a whole number from 1 to 1,000 stars.');
  if(action==='goal'&&(!Number.isInteger(stars)||stars<1||stars>1000||!reward.trim()))throw Error('Add a reward and a target from 1 to 1,000 stars.');
  return {id,at:new Date(now).toISOString(),oz:null,tags:['stars'],people:[person],notes:reason.slice(0,240),event_type:'other',source:'star-chart',details:{starChart:{version:1,action,person,delta,reason:reason.slice(0,240),...(action==='goal'?{stars,reward:reward.trim().slice(0,120)}:{}),ref,key,source}}};
 }
 const api={people,names,isLedger,points,state,bonuses,entry};root.LucaFamilyStars=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
