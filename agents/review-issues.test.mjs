import test from "node:test";
import assert from "node:assert/strict";
import {makeReviewIssues} from "./review-issues.mjs";
test("review issue contains actionable safe steps",()=>{
 const r=makeReviewIssues([{agent:"watchdog",code:"flow_failed",severity:"high"}]);
 assert.equal(r.issues.length,1);
 assert.match(r.issues[0].body,/regression coverage/);
 assert.equal(r.issues[0].autoMerge,false);
 assert.equal(r.issues[0].autoCreate,false);
});
test("untrusted descriptions and credentials are never copied",()=>{
 const r=makeReviewIssues([{agent:"atlas",code:"possible_duplicate",severity:"medium",description:"secret description",token:"private_token",evidence:{note:"sensitive"}}]);
 assert.doesNotMatch(JSON.stringify(r),/secret description|private_token|sensitive/);
});
test("closed and duplicate findings do not produce issues",()=>{
 const r=makeReviewIssues([{code:"possible_duplicate",fingerprint:"a"},{code:"possible_duplicate",fingerprint:"a"},{code:"old",status:"closed"}]);
 assert.equal(r.issues.length,1);
});
