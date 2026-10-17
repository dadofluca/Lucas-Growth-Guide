import test from "node:test";
import assert from "node:assert/strict";
import {prepareBuilderPatch} from "./builder-patch.mjs";
const finding={code:"qa_note"};
test("review-only Builder patch accepts allowlisted docs",()=>{
 const p=prepareBuilderPatch({finding,files:[{path:"docs/spark-design-research.md",content:"A reviewable UX proposal."}]});
 assert.equal(p.mayAutoMerge,false);assert.equal(p.mayDeploy,false);assert.equal(p.mayWriteBabyEvents,false);
});
test("Builder cannot edit app or database or workflows",()=>{
 for(const path of ["index.html","supabase/migrations/20261017_family_chat.sql",".github/workflows/luca-autonomous-monitor.yml"])
 assert.throws(()=>prepareBuilderPatch({finding,files:[{path,content:"oops"}]}));
});
test("Builder rejects invalid findings and suspected secrets",()=>{
 assert.throws(()=>prepareBuilderPatch({finding:{code:"../../bad"},files:[{path:"agents/README.md",content:"hi"}]}));
 assert.throws(()=>prepareBuilderPatch({finding,files:[{path:"agents/README.md",content:"SUPABASE_SERVICE_ROLE_KEY=abc"}]}));
});
