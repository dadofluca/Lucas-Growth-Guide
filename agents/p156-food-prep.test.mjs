import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {evaluateAchievements,bannerFor} from './achievements.js';
const stars=createRequire(import.meta.url)('./family-stars.js'),html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function parse(input){const ctx=vm.createContext({a:[],localStorage:{getItem:()=>null},input});vm.runInContext(html.slice(html.indexOf('let smartItems=[]'),html.indexOf('function renderSmart()')),ctx);return JSON.parse(vm.runInContext('JSON.stringify(smartParseText(input))',ctx));}
test('P156: completed homemade batch is preparation, not an eaten meal or bottle',()=>{
 for(const input of ['Maddie made a big batch of homemade baby food: carrots, peas and chicken, 8 oz','Sam prepped a batch of baby food at 4:15 pm','Nona blended homemade baby puree']){const rows=parse(input);assert.equal(rows.length,1,input);assert.equal(rows[0].kind,'foodprep');assert.equal(rows[0].oz,undefined);assert.equal(rows[0].note,input);}
 const [row]=parse('Maddie made a batch of baby food at 4:15 pm');assert.equal(row.credit,'Maddie');assert.equal(row.clock.h12,4);assert.equal(row.clock.min,15);
});
test('P156: plans and negation never create completed prep; ordinary food remains food',()=>{
 for(const text of ['Maddie will make a batch of baby food tomorrow','Maddie did not make a batch of baby food','Have you made a batch of baby food?','Maddie has not prepared homemade baby food'])assert.deepEqual(parse(text).map(e=>e.kind),['other'],text);
 assert(!parse('Nona fed homemade food that Maddie made').some(e=>e.kind==='foodprep'));
 assert(parse('Nona fed chicken and broccoli at 12:45 pm').some(e=>e.kind==='solids'));
});
test('P156: independent care alongside prep remains independent with its own credit',()=>{
 for(const separator of ['; ',' and then ',' and ']){const rows=parse('Maddie made a batch of baby food'+separator+'Sam gave 8 oz at 5 pm');assert.equal(rows.length,2);assert.equal(rows.find(e=>e.kind==='foodprep').credit,'Maddie');assert.equal(rows.find(e=>e.kind==='feed').oz,8);assert.equal(rows.find(e=>e.kind==='feed').credit,'Sam');}
});
test('P156: five derived care points per batch, not a spendable Star ledger mutation',()=>{
 assert.equal(stars.points({tags:['foodprep'],event_type:'foodprep'}),5);assert.equal(stars.points({event_type:'foodprep'}),5);assert.equal(stars.points({tags:['foodprep','solids']}),6);assert.equal(stars.points({tags:['stars','foodprep']}),0);assert.equal(stars.state([{id:'batch',tags:['foodprep'],people:['Sam']}],'Sam').balance,0);
});
const now=new Date('2026-10-21T20:00:00Z'),identities=[{user_id:'maker',person:'Maddie'},{user_id:'logger',person:'Sam'}];
const batch=i=>({id:'batch-'+i,babyId:'baby',at:'2026-10-21T12:00:00Z',tags:['foodprep'],people:['Maddie'],createdBy:'logger'});
test('P156: milestones at 1, 3 and 10 reward the linked cook, not the logger',()=>{
 for(const [count,id] of [[1,'tiny-sous-chef'],[3,'freezer-fairy'],[10,'puree-professional']]){const events=Array.from({length:count},(_,i)=>batch(i)),result=evaluateAchievements({events,userId:'maker',identities,babyId:'baby',now});assert.equal(result.metrics.foodBatches,count);assert(result.unlocked.includes(id));assert.equal(evaluateAchievements({events,userId:'logger',identities,now}).metrics.foodBatches,0);assert.equal(bannerFor({unlocked:result.unlocked,banner:id}).id,id);}
});
test('P156: duplicate IDs, another baby, future and test rows do not unlock kitchen cards',()=>{
 const one=batch(1),events=[one,one,{...batch(2),babyId:'other'},{...batch(3),at:'2030-01-01'},{...batch(4),test_event:true}];const r=evaluateAchievements({events,userId:'maker',identities,babyId:'baby',now});assert.equal(r.metrics.foodBatches,1);assert(!r.unlocked.includes('freezer-fairy'));assert.equal(evaluateAchievements({events:[one],userId:'maker',now}).metrics.foodBatches,0);
});
