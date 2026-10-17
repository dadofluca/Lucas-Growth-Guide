import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {Script} from "node:vm";

test("all inline HTML scripts parse as classic JS or ES modules",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const matches=[...html.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi)];
 assert.ok(matches.length>=5,"expected multiple inline scripts");
 const temp=mkdtempSync(join(tmpdir(),"luca-script-check-"));
 try{
  for(const [i,match] of matches.entries()){
   const attrs=match[1],body=match[2];
   if(/\\bsrc\\s*=/.test(attrs)||!body.trim())continue;
   if(/\\btype\\s*=\\s*["']module["']/.test(attrs)){
    const path=join(temp,`inline-${i}.mjs`);
    writeFileSync(path,body);
    const check=spawnSync(process.execPath,["--check",path],{encoding:"utf8"});
    assert.equal(check.status,0,`module script ${i}: ${check.stderr}`);
   }else{
    assert.doesNotThrow(()=>new Script(body,{filename:`index.html script ${i}`}));
   }
  }
 }finally{rmSync(temp,{recursive:true,force:true});}
});
