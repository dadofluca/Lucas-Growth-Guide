import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
require('./sleep-inference.js');require('./sleep-data.js');
const {estimate}=require('./bottle-rhythm.js');
const at=(hour,minute=0,day=19)=>new Date(2026,9,day,hour,minute).toISOString();
const bottle=(hour,minute=0,day=19)=>({id:`b-${day}-${hour}-${minute}`,at:at(hour,minute,day),oz:8});
const now=at(20);
const sleep=(start,end,kind='nap')=>({id:'sleep',at:start,tags:['sleep'],details:{sleep:{kind,start_at:start,end_at:end}}});

test('P140: overnight feeds cannot inflate a three-hour daytime rhythm',()=>{
 const rows=[0,4,7,10,13,16].map(h=>bottle(h)),before=JSON.stringify(rows),r=estimate(rows,{now});
 assert.equal(r.minutes,180);assert.deepEqual(r.intervals,[180,180,180]);assert.equal(r.nextAt,+new Date(at(19)));assert.ok(r.excludedNight>0);assert.equal(JSON.stringify(rows),before);
});
test('P140: a daytime gap spanning a confirmed nap is excluded rather than stretched or shortened',()=>{
 const r=estimate([bottle(7),bottle(11),bottle(14),sleep(at(9),at(10))],{now});
 assert.deepEqual(r.intervals,[180]);assert.equal(r.excludedSleep,1);assert.equal(r.minutes,180);
});
test('P140: contextual nap notes and linked night notes exclude their bottle gaps',()=>{
 const rows=[bottle(6),bottle(9),bottle(12),bottle(16),{id:'bed',at:at(22,15,18),notes:'Down for the night at 10:15'},{id:'wake',at:at(7,18),notes:'Slept last night until 7 am'},{id:'nap',at:at(13),notes:'Napped 13–14'}];
 const r=estimate(rows,{now});assert.deepEqual(r.intervals,[180]);assert.equal(r.excludedSleep,2);assert.equal(r.minutes,180);
});
test('P140: an incomplete sleep boundary rejects the crossing gap',()=>{
 const r=estimate([bottle(7),bottle(10),bottle(13),{id:'partial',at:at(9),notes:'Fell asleep at 9 am'}],{now});
 assert.deepEqual(r.intervals,[180]);assert.equal(r.excludedSleep,1);
});
test('P140: a genuine 225-minute daytime average remains 225 minutes with a matching due time',()=>{
 const r=estimate([bottle(7),bottle(10,45),bottle(14,30)],{now});
 assert.equal(r.minutes,225);assert.equal(r.nextAt,+new Date(at(18,15)));assert.equal(r.learned,true);
});
test('P140: only overnight or sleep-crossing data uses a labeled fallback, not a learned night average',()=>{
 const r=estimate([bottle(1),bottle(5)],{now});assert.equal(r.learned,false);assert.equal(r.minutes,180);assert.equal(r.intervals.length,0);
 const empty=estimate([],{now});assert.equal(empty.nextAt,null);assert.equal(empty.last,null);
});
test('P140: unsorted, repeated, future and long-gap records do not distort learning',()=>{
 const r=estimate([bottle(16),bottle(7),bottle(10),bottle(10),bottle(21),{id:'bad',at:'invalid',oz:8}],{now:at(17)});
 assert.deepEqual(r.intervals,[360,180]);assert.equal(r.last.at,at(16));assert.equal(r.minutes,270);
 const long=estimate([bottle(6),bottle(13)],{now});assert.equal(long.learned,false);
});
test('P140: local daytime boundaries and wake-at-bottle boundaries admit valid daytime gaps',()=>{
 const r=estimate([bottle(6),bottle(9),bottle(18),bottle(21),sleep(at(21,0,18),at(6),'night')],{now:at(22)});
 assert.deepEqual(r.intervals,[180,180]);assert.equal(r.excludedSleep,0);
});
test('P140: KJ is recognized in natural-language and suffix caregiver attribution',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),ctx=vm.createContext({a:[],localStorage:{getItem:()=>null}});
 vm.runInContext(html.slice(html.indexOf('let smartItems=[]'),html.indexOf('function renderSmart()')),ctx);
 for(const text of ['Kj gave 8 oz at 12 pm','8 oz - KJ']){ctx.input=text;const items=JSON.parse(vm.runInContext('JSON.stringify(smartParseText(input))',ctx));assert.equal(items[0].credit,'KJ');assert.equal(items[0].oz,8);}
 ctx.input='Sam gave 8 oz at 9 am; KJ changed a poop diaper';const items=JSON.parse(vm.runInContext('JSON.stringify(smartParseText(input))',ctx));assert.equal(items.find(x=>x.kind==='feed').credit,'Sam');assert.equal(items.find(x=>x.kind==='poop').credit,'KJ');
});

test('P141: mentioning baby Luca does not steal caregiver credit; Luca remains a selectable choice',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),ctx=vm.createContext({a:[],localStorage:{getItem:()=>null}});
 vm.runInContext(html.slice(html.indexOf('let smartItems=[]'),html.indexOf('function renderSmart()')),ctx);
 ctx.input='Nona gave Luca 8 oz at 12 pm';const [named]=JSON.parse(vm.runInContext('JSON.stringify(smartParseText(input))',ctx));assert.equal(named.credit,'Nona');
 ctx.input='Luca drank 8 oz at 12 pm';const [unnamed]=JSON.parse(vm.runInContext('JSON.stringify(smartParseText(input))',ctx));assert.notEqual(unnamed.credit,'Luca');
 ctx.renderSmart=()=>{};vm.runInContext(html.slice(html.indexOf('function handleSmartAction(event)'),html.indexOf('for(const id of ["#quickText"')),ctx);
 ctx.action={target:{closest:()=>({dataset:{changecredit:'0'}})}};vm.runInContext('smartItems=smartParseText(input);handleSmartAction(action)',ctx);assert.ok(JSON.parse(vm.runInContext('JSON.stringify(smartItems[0].creditChoices)',ctx)).includes('Luca'));
 ctx.action={target:{closest:()=>({dataset:{creditchoice:'0',person:'Luca'}})}};vm.runInContext('handleSmartAction(action)',ctx);assert.equal(vm.runInContext('smartItems[0].credit',ctx),'Luca');
});
