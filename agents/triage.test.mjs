import test from "node:test";
import assert from "node:assert/strict";
import {prepareReviewQueue} from "./triage.mjs";
test("audit finding becomes Builder review task",()=>{
 const result=prepareReviewQueue([{agent:"atlas",code:"possible_duplicate",severity:"medium",fingerprint:"a"}]);
 assert.equal(result.tasks[0].assignedTo,"builder");
 assert.equal(result.tasks[0].area,"data");
 assert.equal(result.tasks[0].proposal.action,"draft_pr_only");
 assert.equal(result.tasks[0].autoDeploy,false);
});
test("triage exposes only allowlisted fields",()=>{
 const result=prepareReviewQueue([{code:"user_report_pending",severity:"medium",description:"sensitive note",evidence:{privateValue:"private"}}]);
 assert.equal(result.tasks[0].code,"user_report_pending");
 assert.equal(result.tasks[0].evidence,undefined);
 assert.equal(result.tasks[0].description,undefined);
 assert.equal(result.containsFamilyRecords,false);
});
test("duplicates deduplicated and closed findings excluded",()=>{
 const result=prepareReviewQueue([{code:"possible_duplicate",fingerprint:"x"},{code:"possible_duplicate",fingerprint:"x"},{code:"closed",status:"closed"}]);
 assert.equal(result.tasks.length,1);
});
test("invalid input rejected",()=>assert.throws(()=>prepareReviewQueue({}),TypeError));
