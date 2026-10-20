import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('function sleepRangeLabel('),source.indexOf('function renderUnfinishedSleep('));
test('P149: History sleep details show known wake-ups and awake minutes without inventing unknowns',()=>{
 const context={careSleep:e=>e};vm.createContext(context);vm.runInContext(fn,context);
 const sleep={complete:true,start:Date.parse('2026-10-19T22:53:00Z'),end:Date.parse('2026-10-20T07:00:00Z'),wakeups:2,awake:null};
 assert.match(context.sleepRangeLabel(sleep),/2 wake-ups/);assert.doesNotMatch(context.sleepRangeLabel(sleep),/min awake/);
 assert.match(context.sleepRangeLabel({...sleep,wakeups:0,awake:0}),/0 wake-ups · 0 min awake/);
 assert.match(context.sleepRangeLabel({...sleep,wakeups:1,awake:20}),/1 wake-up · 20 min awake/);
 assert.doesNotMatch(context.sleepRangeLabel({...sleep,wakeups:null}),/wake-up/);
 assert.match(context.sleepRangeLabel({...sleep,ongoing:true}),/TBD/);
 assert.match(context.sleepRangeLabel({...sleep,complete:false}),/2 wake-ups/);
});
