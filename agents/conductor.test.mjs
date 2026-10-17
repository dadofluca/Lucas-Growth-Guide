import test from "node:test";
import assert from "node:assert/strict";
import {prioritizeFindings,summarizeQueue} from "./conductor.mjs";
test("data integrity outranks visual polish",()=>{
 const q=prioritizeFindings([{agent:"watchdog",code:"contrast",severity:"low",area:"design"},
 {agent:"atlas",code:"missing_feed",severity:"high",area:"data"}]);
 assert.equal(q[0].code,"missing_feed");assert.equal(q[0].autoDeploy,false);
});
test("duplicate findings are not repeatedly assigned",()=>{
 const q=prioritizeFindings([{fingerprint:"x",code:"broken",severity:"medium"},{fingerprint:"x",code:"broken",severity:"medium"}]);
 assert.equal(q.length,1);
});
test("resolved findings are excluded",()=>assert.equal(prioritizeFindings([{code:"fixed",status:"resolved"}]).length,0));
test("security and care data always require review",()=>{
 const q=prioritizeFindings([{code:"auth_bug",severity:"critical",area:"auth"},{code:"log_bug",severity:"high",area:"data"}]);
 assert.ok(q.every(f=>f.approvalRequired&&!f.autoDeploy));
});
test("Spark receives design improvements, never auto deploys",()=>{
 const q=prioritizeFindings([{code:"seasonal_theme",severity:"low",area:"design"}]);
 assert.equal(q[0].assignedTo,"spark");
 assert.equal(summarizeQueue(q).automaticDeployments,0);
});
