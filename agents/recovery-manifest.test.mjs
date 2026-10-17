import test from "node:test";
import assert from "node:assert/strict";
import {buildRecoveryManifest} from "./recovery-manifest.mjs";
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
