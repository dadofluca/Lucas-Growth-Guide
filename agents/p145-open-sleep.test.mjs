import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url);require('./sleep-inference.js');const sleep=require('./sleep-data.js'),stars=require('./family-stars.js'),rhythm=require('./bottle-rhythm.js');
const at=(day,hour)=>new Date(2026,9,day,hour).toISOString(),now=at(20,8),start=at(19,21);
const entry={id:'one-night',babyId:'baby',at:start,tags:['sleep'],people:['Sam','Maddie'],details:{sleep:sleep.build({start,kind:'night',ongoing:true,now:at(19,22),wakeups:0,awake:0})}};
test('P145: an ongoing night records a real start and null end/counts, never zero or an invented future wake',()=>{
 const s=entry.details.sleep;assert.equal(s.status,'in_progress');assert.equal(s.end_at,null);assert.equal(s.wakeups,null);assert.equal(s.awake_minutes,null);const session=sleep.session(entry,[entry],now);assert.equal(session.ongoing,true);assert.equal(session.complete,false);assert.equal(session.minutes,null);
 assert.throws(()=>sleep.build({start:at(20,10),ongoing:true,now}),/future/);assert.throws(()=>sleep.build({start:'',ongoing:true,now}),/fell asleep/);
});
test('P145: ongoing sleep is excluded from completed totals and is not silently completed by a wake note',()=>{
 const wake={id:'wake-note',babyId:'baby',at:at(20,7),tags:['other'],notes:'Woke up at 7 am'};const stats=sleep.summarize([entry,wake],7,new Date(now));assert.equal(stats.night,null);assert.equal(stats.nightCount,0);assert.equal(stats.last24,null);assert.equal(sleep.session(entry,[entry,wake],now).ongoing,true);
 const done={...entry,details:{sleep:sleep.build({start,end:at(20,7),kind:'night',wakeups:0,now})}};const result=sleep.summarize([done],7,new Date(now));assert.equal(result.night,600);assert.equal(result.nightCount,1);assert.equal(result.wakes,0);assert.equal(result.partialCount,0);assert.equal(sleep.session(done).ongoing,false);
});
test('P145: bottle spacing excludes the entire unresolved sleep window',()=>{
 const nap={...entry,at:at(20,9),details:{sleep:sleep.build({start:at(20,9),kind:'nap',ongoing:true,now:at(20,15)})}};
 const feeds=[7,10,13].map(hour=>({id:'b'+hour,at:at(20,hour),oz:8}));const result=rhythm.estimate([...feeds,nap],{now:at(20,15)});assert.deepEqual(result.intervals,[]);assert.equal(result.excludedSleep,2);
});
test('P145: caregiver names accept and, ampersands, plus and commas without joining two people',()=>{
 for(const text of ['Sam and Maddie','sam & MADDIE','Sam + Maddie','Sam, Maddie'])assert.deepEqual(stars.names([text]),['Sam','Maddie']);assert.deepEqual(stars.names(['Sam and Maddie','Sam','Aunt Candy']),['Sam','Maddie','Aunt Candy']);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),ctx=vm.createContext({a:[],localStorage:{getItem:()=>null}});vm.runInContext(html.slice(html.indexOf('let smartItems=[]'),html.indexOf('function renderSmart()')),ctx);ctx.input='Sam and Maddie gave 8 oz at 9 pm';const [parsed]=JSON.parse(vm.runInContext('JSON.stringify(smartParseText(input))',ctx));assert.deepEqual(parsed.credits,['Sam','Maddie']);
});
