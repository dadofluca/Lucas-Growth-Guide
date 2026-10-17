import test from "node:test";
import assert from "node:assert/strict";
import {buildRecoveryManifest,previewRecoveryEvents,prepareRecoveryRows,commitApprovedRecovery} from "./recovery-manifest.mjs";
const e={id:"emergency-123",text:"6 oz and poop",recorded_at:"2026-10-17T12:00:00Z",caregiver:"Sam",reviewed:true};
test("reviewed backup becomes uncommitted manifest",()=>{
 const result=buildRecoveryManifest({format:"luca-emergency-reviewed-v1",entries:[e]});
 assert.equal(result.records[0].readyToInsert,false);
 assert.equal(result.requiresExplicitCommit,true);
});
test("repeated emergency source ids rejected",()=>{
 assert.throws(()=>buildRecoveryManifest({format:"luca-emergency-reviewed-v1",entries:[e,e]}));
});
test("unreviewed or malformed entries rejected",()=>{
 assert.throws(()=>buildRecoveryManifest({format:"luca-emergency-reviewed-v1",entries:[{...e,reviewed:false}]}));
 assert.throws(()=>buildRecoveryManifest({format:"wrong",entries:[]}));
});

test("compound note can be split into two explicitly approved events",()=>{
 const m=buildRecoveryManifest({format:"luca-emergency-reviewed-v1",entries:[e]});
 const result=previewRecoveryEvents(m,[
  {approved:true,source_id:e.id,part:1,event_type:"bottle",amount_oz:6,event_time:e.recorded_at},
  {approved:true,source_id:e.id,part:2,event_type:"poop",event_time:e.recorded_at}
 ]);
 assert.equal(result.records.length,2);assert.equal(result.dryRun,true);
 assert.notEqual(result.records[0].part,result.records[1].part);
});
test("recovery rejects repeated parts and invalid bottle amounts",()=>{
 const m=buildRecoveryManifest({format:"luca-emergency-reviewed-v1",entries:[e]});
 const d={approved:true,source_id:e.id,part:1,event_type:"bottle",amount_oz:6,event_time:e.recorded_at};
 assert.throws(()=>previewRecoveryEvents(m,[d,d]));
 assert.throws(()=>previewRecoveryEvents(m,[{...d,amount_oz:0}]));
});

test("recovery rows carry separate idempotency keys and caller identity",()=>{
 const m=buildRecoveryManifest({format:"luca-emergency-reviewed-v1",entries:[e]});
 const preview=previewRecoveryEvents(m,[{approved:true,source_id:e.id,part:1,event_type:"bottle",amount_oz:6,event_time:e.recorded_at},{approved:true,source_id:e.id,part:2,event_type:"poop",event_time:e.recorded_at}]);
 const rows=prepareRecoveryRows(preview,{babyId:"00000000-0000-4000-8000-000000000001",userId:"00000000-0000-4000-8000-000000000002"});
 assert.equal(rows.length,2);assert.notEqual(rows[0].details.emergency_source_id,rows[1].details.emergency_source_id);
 assert.equal(rows[0].created_by,"00000000-0000-4000-8000-000000000002");
 assert.throws(()=>prepareRecoveryRows(preview,{}));
});

test("recovery commit rejects missing session before any database write",async()=>{
 const preview={dryRun:true,records:[]};
 let writes=0;
 const client={auth:{getUser:async()=>({data:{user:{id:"different"}}})},from:()=>{writes++;throw Error("unexpected DB access")}};
 await assert.rejects(()=>commitApprovedRecovery(client,preview,{babyId:"00000000-0000-4000-8000-000000000001",userId:"00000000-0000-4000-8000-000000000002"}),/session mismatch/);
 assert.equal(writes,0);
});
