import test from "node:test";
import assert from "node:assert/strict";
import {sparkResearchTopics,sparkResearchBrief} from "./spark-research.mjs";
test("Spark researches clean UX as well as jokes and audio",()=>{
 for(const id of ["calm-navigation","microinteractions","sound-feedback","seasonal-style","delight-easter-eggs","family-engagement"])
  assert.ok(sparkResearchTopics.some(x=>x.id===id));
});
test("Spark does not invent sources or silently deploy proposals",()=>{
 const a=sparkResearchBrief({topic:"sound-feedback"});
 assert.equal(a.stage,"needs-research");assert.equal(a.sourceCount,0);assert.equal(a.autoDeploy,false);
 const b=sparkResearchBrief({topic:"sound-feedback",findings:[{sourceUrl:"https://example.org/article",summary:"Relevant observation"},{sourceUrl:"not a source",summary:"bad"}]});
 assert.equal(b.sourceCount,1);assert.equal(b.stage,"research-review");
 assert.equal(b.approvalRequired,true);
});
test("unknown research topics are rejected",()=>assert.throws(()=>sparkResearchBrief({topic:"invented"})));
