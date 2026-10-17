import {test} from "node:test";
import {strict as assert} from "node:assert";
import {inspectCoverage} from "./scout.mjs";
import {inspectHealth} from "./guardian.mjs";
import {summarizeRoutines} from "./teddy.mjs";
import {proposeFix} from "./builder.mjs";
test("Scout detects overlapping shifts for same caregiver",()=>{
 const shifts=[{id:"1",family_id:"f",caregiver_id:"a",start_time:"2026-10-17T08:00:00Z",end_time:"2026-10-17T12:00:00Z"},{id:"2",family_id:"f",caregiver_id:"a",start_time:"2026-10-17T11:00:00Z",end_time:"2026-10-17T14:00:00Z"}];
 assert.equal(inspectCoverage(shifts).findings[0].code,"overlapping_caregiver_shifts");
});
test("Guardian flags errors without copying raw sensitive payloads",()=>{
 const out=inspectHealth([{component:"muse",status:"error",payload:"PRIVATE"}]);
 assert.equal(out.findings[0].severity,"high");
 assert.equal(JSON.stringify(out).includes("PRIVATE"),false);
});
test("Teddy counts only observed bottles",()=>{
 assert.equal(summarizeRoutines([{event_type:"bottle",amount_oz:8},{event_type:"nap"}]).observedBottleOz,8);
});
test("Builder cannot auto deploy",()=>{
 const p=proposeFix({code:"possible_duplicate"});
 assert.equal(p.autoDeploy,false);
 assert.equal(p.action,"draft_pr_only");
});
