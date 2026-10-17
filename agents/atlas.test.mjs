import { test } from "node:test";
import { strict as assert } from "node:assert";
import { inspectBabyEvents } from "./atlas.mjs";
const row=(id,time,oz=8)=>({id,baby_id:"baby-1",event_type:"bottle",event_time:time,amount_oz:oz});
test("flags possible duplicates without mutating records",()=>{
 const rows=[row("a","2026-10-17T12:00:00Z"),row("b","2026-10-17T12:01:00Z")];
 const before=JSON.stringify(rows),r=inspectBabyEvents(rows,{now:new Date("2026-10-18")});
 assert.equal(r.findings.some(f=>f.code==="possible_duplicate"),true);
 assert.equal(JSON.stringify(rows),before);
});
test("does not equate sparse logs with zero feeding",()=>{
 const r=inspectBabyEvents([row("a","2026-10-17T12:00:00Z")],{now:new Date("2026-10-18")});
 assert.equal(r.findings.some(f=>f.code==="sparse_bottle_history"),true);
 assert.equal(r.findings.some(f=>f.code==="missing_feeding"),false);
});
test("ignores cross-family duplicates",()=>{
 const a=row("a","2026-10-17T12:00:00Z"),b={...row("b","2026-10-17T12:00:00Z"),baby_id:"other"};
 assert.equal(inspectBabyEvents([a,b],{now:new Date("2026-10-18")}).findings.some(f=>f.code==="possible_duplicate"),false);
});
test("flags future timestamps",()=>{
 const r=inspectBabyEvents([row("a","2026-10-19T12:00:00Z")],{now:new Date("2026-10-18")});
 assert.equal(r.findings.some(f=>f.code==="future_event"),true);
});
