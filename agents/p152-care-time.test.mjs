import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),time=require('./care-time.js');
test('P152: explicit periods preserve evening, morning, noon and midnight when changing the clock',()=>{
 for(const [clock,period,hour] of [['6:30','PM',18],['6:30','AM',6],['12:00','PM',12],['12:00','AM',0]])assert.equal(time.parse('2026-10-20',clock,period).getHours(),hour);
 assert.equal(time.format(new Date(2026,9,20,18,51)).period,'PM');assert.equal(time.format(new Date(2026,9,20,18,51)).clock,'6:51');
 for(const value of ['18:30','0:30','6:90','6',''])assert.throws(()=>time.parse('2026-10-20',value,'PM'));assert.throws(()=>time.parse('2026-02-30','6:30','PM'));
});
test('P152: 6:30 PM in New York saves as 22:30 UTC, with a distinct 6:30 AM and rejected DST gap',()=>{
 const result=execFileSync(process.execPath,['-e',"const t=require('./agents/care-time.js');let gap=false;try{t.parse('2026-03-08','2:30','AM')}catch{gap=true}console.log(JSON.stringify({pm:t.parse('2026-10-20','6:30','PM').toISOString(),am:t.parse('2026-10-20','6:30','AM').toISOString(),gap}));"],{cwd:new URL('..',import.meta.url),env:{...process.env,TZ:'America/New_York'},encoding:'utf8'});
 assert.deepEqual(JSON.parse(result),{pm:'2026-10-20T22:30:00.000Z',am:'2026-10-20T10:30:00.000Z',gap:true});
});
