import test from "node:test";
import assert from "node:assert/strict";
import {assessSyntheticRuns,criticalFlows} from "./watchdog.mjs";
test("missing checks are not represented as passed",()=>{const x=assessSyntheticRuns([]);assert.equal(x.passed,0);assert.equal(x.findings.length,criticalFlows.length);});
test("failed feeding persistence check is high severity",()=>{const x=assessSyntheticRuns([{flowId:"bottle",status:"failed"}]);assert.ok(x.findings.some(f=>f.flowId==="bottle"&&f.severity==="high"));assert.equal(x.productionMutation,false);});
test("all synthetic checks passed",()=>{const x=assessSyntheticRuns(criticalFlows.map(f=>({flowId:f.id,status:"passed"})));assert.equal(x.passed,criticalFlows.length);assert.equal(x.findings.length,0);});
