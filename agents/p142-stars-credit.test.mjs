import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {evaluateAchievements} from './achievements.js';
const require=createRequire(import.meta.url),stars=require('./family-stars.js');require('./sleep-inference.js');const sleep=require('./sleep-data.js');
const now=new Date('2026-10-20T16:00:00Z');let nextId=0;
const record=(action,data={})=>stars.entry(action,{person:'KJ',...data},'star-'+(++nextId),now);
const opening=record('opening',{delta:33}),state=(entries,person,at)=>stars.state([opening,...entries],person,at);
function parser(){const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),ctx=vm.createContext({a:[],localStorage:{getItem:()=>null}});vm.runInContext(html.slice(html.indexOf('let smartItems=[]'),html.indexOf('function renderSmart()')),ctx);return text=>{ctx.input=text;return JSON.parse(vm.runInContext('JSON.stringify(smartParseText(input))',ctx));};}

test('P142: shared care normalizes people and one bottle still has one intake amount',()=>{
 const people=stars.names(['Sam','Luca','Sam',' sam ','']);assert.deepEqual(people,['Sam','Luca']);
 const e={id:'feed',at:now,oz:8,people};assert.equal(stars.points(e),1);assert.equal([e].reduce((n,x)=>n+x.oz,0),8);
 const parse=parser(),items=parse('Sam and Luca shared 8 oz at 12 pm');assert.equal(items.length,1);assert.deepEqual(items[0].credits,['Sam','Luca']);
 assert.equal(parse('Nona gave Luca 8 oz at 12 pm')[0].credit,'Nona');
});
test('P142: bath synonyms parse as care, preserve attribution/time and earn two points',()=>{
 const parse=parser();for(const word of ['bath','bathed','bathing','shower','showered','wash up','wash-up','sponge bath','washed Luca']){
  const items=parse('Nona '+word+' at 4:15 pm');assert.equal(items.length,1,word);assert.equal(items[0].kind,'bath',word);assert.equal(items[0].credit,'Nona');assert.equal(items[0].clock.h12,4);assert.equal(items[0].clock.min,15);
 }
 const mixed=parse('Sam gave 8 oz at 9 am; Nona gave a bath at 10 am');assert.equal(mixed.length,2);assert.equal(mixed.find(x=>x.kind==='bath').clock.h12,10);
 assert.equal(stars.points({tags:['bath']}),2);assert.equal(stars.points({tags:['bath','poop'],oz:8}),6);
 for(const text of ['No bath today','Nona washed bottles','Nona will shower tomorrow'])assert.equal(parse(text).some(x=>x.kind==='bath'),false,text);
});
test('P142: KJ starts at 33 and independent awards merge without replacing a balance',()=>{
 assert.equal(stars.state([],'KJ').balance,0);
 assert.equal(state([],'KJ').balance,33);assert.equal(state([],'Sam').balance,0);
 const one=record('award',{delta:2}),two=record('award',{delta:3});assert.equal(state([two,one,one],'KJ').balance,38);assert.equal(state([one,two],'KJ').balance,38);
 assert.equal(state([record('award',{person:'Sam',delta:5})],'KJ').balance,33);
});
test('P142: goals, redemption and undo retain a visible ledger without double spending',()=>{
 const goal=record('goal',{stars:30,reward:'Movie night'}),spend=record('redeem',{delta:-30,ref:goal.id,reason:'Movie night'}),duplicate=record('redeem',{delta:-30,ref:goal.id});
 const entries=[goal,spend,duplicate];assert.equal(state(entries,'KJ').balance,3);assert.equal(state(entries,'KJ').redeemed,true);
 const undo=record('undo',{ref:spend.id});assert.equal(state([goal,spend,undo,record('undo',{ref:spend.id})],'KJ').balance,33);assert.equal(state([goal,spend,undo],'KJ').redeemed,false);
 assert.equal(state([...entries,undo],'KJ').balance,33);const restored=state([...entries,undo],'KJ'),again=record('redeem',{delta:-30,ref:goal.id,key:restored.goalClaimKey});assert.equal(state([...entries,undo,again],'KJ').balance,3);
});
test('P142: duplicate bonus claims count once and child charts never auto-earn adult bonuses',()=>{
 const event={id:'bath',at:now,tags:['bath'],people:['Sam','KJ','Luca']};const [bonus]=stars.bonuses([event],'Sam',+now);assert.equal(bonus.id,'suds');assert.equal(stars.bonuses([event],'KJ',+now).length,0);assert.equal(stars.bonuses([event],'Luca',+now).length,0);
 const a=record('bonus',{person:'Sam',delta:1,key:bonus.key}),b=record('bonus',{person:'Sam',delta:1,key:bonus.key});assert.equal(state([a,b],'Sam').balance,1);
 assert.equal(stars.bonuses([{...event,at:'2026-01-01T00:00:00Z'}],'Sam',+now).length,0);
});
test('P142: star awards cannot create care points, sleep windows or logger achievements',()=>{
 const entry=record('award',{person:'Sam',delta:2,reason:'Down for the night at 10 pm until 7 am'});entry.createdBy='sam';
 assert.equal(stars.points(entry),0);assert.equal(sleep.resolve([entry]).size,0);assert.equal(evaluateAchievements({events:[entry],userId:'sam',now}).metrics.total,0);
 const bath={id:'bath',at:now,createdBy:'sam',tags:['bath']};assert.ok(evaluateAchievements({events:[bath],userId:'sam',now}).unlocked.includes('suds-and-regrets'));
});
test('P142: invalid star amounts and goals cannot enter the ledger',()=>{
 for(const delta of [0,1.5,Infinity,1001])assert.throws(()=>record('award',{delta}));
 assert.throws(()=>record('goal',{stars:0,reward:'Toy'}));assert.throws(()=>record('goal',{stars:20,reward:''}));
});
