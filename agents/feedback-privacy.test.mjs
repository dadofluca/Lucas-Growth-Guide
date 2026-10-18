import test from "node:test";import assert from "node:assert/strict";import {mkdtempSync,writeFileSync,readFileSync,rmSync} from "node:fs";import {tmpdir} from "node:os";import {join} from "node:path";import {spawnSync} from "node:child_process";
test("feedback triage honors consent and redacts credentials",()=>{
 const dir=mkdtempSync(join(tmpdir(),"luca-feedback-"));
 try{
  const input=join(dir,"export.json");
  writeFileSync(input,JSON.stringify([
   {category:"bug",title:"Fix crash sk-abcdefghijklmnopqrstuvwxyz123",details:"Call 401-555-0123; mail test@example.com; github_pat_abcdefghijklmnopqrstuvwxyz1234567890",agent_review_approved:true},
   {category:"idea",title:"Unapproved private suggestion",details:"Keep this private",agent_review_approved:false},
   {category:"design",title:"Revoked suggestion",details:"Never export",agent_review_approved:false}
  ]));
  const result=spawnSync(process.execPath,[new URL("./feedback-review.mjs",import.meta.url).pathname,input],{cwd:dir,encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
  const out=readFileSync(join(dir,"artifacts/approved-feedback-review.json"),"utf8");
  const parsed=JSON.parse(out);assert.equal(parsed.reviewCount,1);
  assert.match(out,/\[secret\]/);assert.match(out,/\[phone\]/);assert.match(out,/\[email\]/);
  assert.doesNotMatch(out,/sk-abcdefghijklmnopqrstuvwxyz123|github_pat_|401-555-0123|test@example.com|Unapproved private suggestion|Revoked suggestion/);
  assert.equal(parsed.queue[0].autoMerge,false);assert.equal(parsed.queue[0].autoDeploy,false);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
