import test from "node:test";
import assert from "node:assert/strict";
import {planAgentWork} from "./agent-planner.mjs";
test("agent planner prioritizes integrity and device QA",()=>{
 const p=planAgentWork();
 assert.equal(p.priorities[0].id,"care-data-integrity");
 assert.equal(p.priorities[1].id,"real-device-qa");
 assert.equal(p.releaseReady,false);
});
test("agent planner is review only and bounds input",()=>{
 const p=planAgentWork({findings:Array.from({length:70},()=>({code:"test",severity:"high"}))});
 assert.equal(p.findings.length,50);
 assert.equal(p.mayModifyProduction,false);
 assert.equal(p.mayAutoMerge,false);
});
