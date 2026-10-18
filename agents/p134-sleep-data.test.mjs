import test from "node:test";
import assert from "node:assert/strict";
import sleep from "./sleep-data.js";
const now=new Date("2026-10-18T18:00:00Z");
const event=(id,start,end,options={})=>({id,at:start,tags:["sleep"],details:{sleep:sleep.build({start,end,...options,now})}});

test("sleep intervals validate timestamps and preserve an unknown awake count",()=>{
 const s=sleep.build({start:"2026-10-18T10:00:00Z",end:"2026-10-18T11:30:00Z",now});
 assert.equal(s.awake_minutes,null);assert.equal(s.wakeups,null);assert.equal(sleep.session({details:{sleep:s}}).minutes,90);
 assert.throws(()=>sleep.build({start:"",end:now,now}),/Choose/);
 assert.throws(()=>sleep.build({start:now,end:now,now}),/follow/);
 assert.throws(()=>sleep.build({start:now,end:"2026-10-19T01:00:00Z",now}),/future/);
 assert.throws(()=>sleep.build({start:"2026-10-17T01:00:00Z",end:now,now}),/24 hours/);
 assert.throws(()=>sleep.build({start:"2026-10-18T10:00:00Z",end:"2026-10-18T11:00:00Z",awake:61,now}),/minutes awake/);
});
test("overnight periods retain their two dates and subtract only supplied awake minutes",()=>{
 const e=event("night","2026-10-17T21:00:00Z","2026-10-18T07:00:00Z",{kind:"night",awake:40,wakeups:3});
 const stats=sleep.summarize([e],7,now);assert.equal(stats.night,600);assert.equal(stats.actualNight,560);assert.equal(stats.last24,560);assert.equal(stats.wakes,3);
 const unknown=event("night-unknown","2026-10-17T21:00:00Z","2026-10-18T07:00:00Z",{kind:"night"});
 const other=sleep.summarize([unknown],7,now);assert.equal(other.actualNight,null);assert.equal(other.wakes,null);assert.equal(other.night,600);
});
test("overlapping and duplicate intervals cannot inflate recorded time",()=>{
 const one=event("a","2026-10-18T10:00:00Z","2026-10-18T11:30:00Z"),two=event("b","2026-10-18T11:00:00Z","2026-10-18T12:00:00Z");
 const stats=sleep.summarize([one,{...one,id:"copy"},two],7,now);assert.equal(stats.last24,120);assert.equal(stats.nap,120);assert.equal(stats.napSessions,2);
});
test("missing days and vague overnight notes do not invent duration or zero wakeups",()=>{
 const stats=sleep.summarize([{id:"note",at:"2026-10-18T10:29:00Z",tags:["other"],notes:"Slept last night until 7 am, maybe 3 wakeups"}],7,now);
 assert.equal(stats.last24,null);assert.equal(stats.night,null);assert.equal(stats.wakes,null);assert.equal(stats.partialCount,1);
});
test("legacy naps and morning check-ins still contribute once",()=>{
 const nap={id:"old-nap",at:"2026-10-18T10:30:00Z",tags:["sleep"],notes:"Nap 10:30 AM–12:40 PM (2h 10m)"};
 const night={id:"old-night",at:"2026-10-18T07:00:00Z",tags:["sleep"],notes:"Morning sleep check-in · 10h 0m in bed · wakeups: 2 · awake minutes: 30"};
 const stats=sleep.summarize([nap,night],7,now);assert.equal(stats.nap,130);assert.equal(stats.night,600);assert.equal(stats.actualNight,570);assert.equal(stats.last24,700);
});
test("elapsed time follows timezone offsets across a daylight-saving transition",()=>{
 const s=sleep.build({start:"2026-11-01T01:30:00-04:00",end:"2026-11-01T01:30:00-05:00",kind:"night",now:"2026-11-01T12:00:00Z"});
 assert.equal(sleep.session({details:{sleep:s}}).minutes,60);
});
test("rolling 24-hour summaries clip a window crossing the boundary",()=>{
 const e=event("boundary","2026-10-17T15:00:00Z","2026-10-17T20:00:00Z",{kind:"night"});
 assert.equal(sleep.summarize([e],7,now).last24,120);
});
