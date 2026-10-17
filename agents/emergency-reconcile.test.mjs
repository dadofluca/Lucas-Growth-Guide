import test from "node:test";
import assert from "node:assert/strict";
import {proposeEmergencyImports} from "./emergency-reconcile.mjs";
const entry=(id,text)=>({id,text,caregiver:"Sam",recorded_at:"2026-10-17T15:30:00.000Z"});
const pack=entries=>({format:"luca-emergency-log-v1",entries});
test("bottle is suggested but never automatically imported",()=>{
 const x=proposeEmergencyImports(pack([entry("entry-00001","8 oz bottle")]));
 assert.equal(x.candidates[0].amount_oz,8);
 assert.equal(x.candidates[0].status,"suggested");
 assert.equal(x.readyForAutomaticImport,0);
});
test("multiple events require review",()=>{
 const x=proposeEmergencyImports(pack([entry("entry-00002","6 oz bottle and poop")]));
 assert.equal(x.candidates[0].status,"needs_review");
});
test("repeated source IDs cannot create duplicate imports",()=>{
 const x=proposeEmergencyImports(pack([entry("entry-00003","wet diaper"),entry("entry-00003","wet diaper")]),[{source_id:"entry-00004"}]);
 assert.equal(x.candidates[1].status,"duplicate");
});
test("bad exports and invalid entries are rejected",()=>{
 assert.throws(()=>proposeEmergencyImports({format:"wrong",entries:[]}));
 assert.equal(proposeEmergencyImports(pack([entry("x","nap")])).candidates[0].status,"invalid");
});
