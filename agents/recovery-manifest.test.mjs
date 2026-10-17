import test from "node:test";
import assert from "node:assert/strict";
import {buildRecoveryManifest,previewRecoveryEvents} from "./recovery-manifest.mjs";
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
