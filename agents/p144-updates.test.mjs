import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url),stars=require('./family-stars.js'),updates=require('./personal-updates.js'),insights=require('./insights.js');
const context={family:'family',baby:'baby',user:'sam-user',person:'Sam'},now=new Date(2026,9,20,16);
const award=(id,person,delta=3,action='award')=>({...stars.entry(action,{person,delta,reason:person+' reward'},id,now),babyId:'baby'});
test('P144: age chapters rotate daily and manual browsing visits each idea before repeating',()=>{
 for(const month of [9,10,11,12]){const a=insights.chapterTip(month,{date:now}),b=insights.chapterTip(month,{date:new Date(2026,9,21,16)});assert.equal(a.total,3);assert.notEqual(a.index,b.index);assert.deepEqual(insights.chapterTip(month,{date:new Date(2026,9,20,2)}),a);const deck=Array.from({length:3},(_,index)=>insights.chapterTip(month,{index}));assert.equal(new Set(deck.map(x=>x.try)).size,3);assert.equal(insights.chapterTip(month,{index:3}).try,deck[0].try);assert.equal(insights.chapterTip(month,{index:-1}).try,deck[2].try);}
});
test('P144: signed-out inbox reveals only public release news',()=>{
 assert.deepEqual(updates.collect({entries:[award('one','Sam')],unlocked:[{id:'hidden',name:'Secret'}],now}).map(x=>x.kind),['release']);
});
test('P144: personal Stars filter person, baby, reversals and future entries',()=>{
 const one=award('one','Sam'),kj=award('kj','KJ'),foreign={...award('foreign','Sam',99),babyId:'another-baby'},future={...award('future','Sam'),at:new Date(2026,9,22).toISOString()};const original=JSON.stringify([one,kj,foreign,future]);
 const result=updates.collect({context,entries:[one,kj,foreign,future],now});assert.deepEqual(result.filter(x=>x.kind==='stars').map(x=>x.id),['stars:one']);assert.equal(JSON.stringify([one,kj,foreign,future]),original);
 const undo={...stars.entry('undo',{person:'Sam',ref:'one'},'undo',now),babyId:'baby'};assert.equal(updates.collect({context,entries:[one,undo],now}).some(x=>x.id==='stars:one'),false);
});
test('P144: bonus notifications are claim invitations and never create or duplicate awards',()=>{
 const bath={id:'bath',babyId:'baby',at:now.toISOString(),tags:['bath'],people:['Sam']};const first=updates.collect({context,entries:[bath],now});assert.equal(first.filter(i=>i.kind==='bonus').length,1);assert.match(first.find(i=>i.kind==='bonus').body,/Claim/);assert.equal(stars.state([bath],'Sam').balance,0);
 const bonus=stars.entry('bonus',{person:'Sam',delta:1,key:'sam:suds',reason:'Suds'},'bonus',now);assert.equal(updates.collect({context,entries:[bath,bonus],now}).some(i=>i.id==='bonus:sam:suds'),false);
});
test('P144: read-state scope separates family, baby, user and chosen identity',()=>{
 const keys=[updates.scope(context),...['family','baby','user','person'].map(k=>updates.scope({...context,[k]:'different'}))];assert.equal(new Set(keys).size,5);assert.equal(updates.scope({...context,user:null}),'signed-out');
});
test('P144: obsolete edit caregiver override is removed; canonical toggle persists both states',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),sync=readFileSync(new URL('../sync-fix.js',import.meta.url),'utf8');assert.doesNotMatch(sync,/people\.clear\(\)/);assert.match(html,/people\.has\(p\)\?people\.delete\(p\):people\.add\(p\)/);assert.match(html,/b\.setAttribute\("aria-pressed",String\(people\.has\(p\)\)\)/);assert.match(html,/form\.querySelectorAll\("\[data-person\]"\)/);
});
