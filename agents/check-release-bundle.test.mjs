import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {inspectBundle} from "./check-release-bundle.mjs";

function fixture(fn){
 const root=mkdtempSync(join(tmpdir(),"luca-bundle-"));
 try{
  for(const name of ["emergency.html","sw.js","family-pin.js","sync-fix.js","manifest.webmanifest"])writeFileSync(join(root,name),"");
  mkdirSync(join(root,"agents"));
  writeFileSync(join(root,"agents","family-chat.js"),"export const chat=true;");
  return fn(root);
 }finally{rmSync(root,{recursive:true,force:true});}
}
test("release bundle checker accepts complete relative module and asset references",()=>fixture(root=>{
 writeFileSync(join(root,"index.html"),'<script type="module">import {chat} from "./agents/family-chat.js";</script><script src="./family-pin.js?v=66"></script>');
 assert.equal(inspectBundle(root).ok,true);
}));
test("release bundle checker fails when referenced media is missing",()=>fixture(root=>{
 writeFileSync(join(root,"index.html"),'<video src="./intro.mov"></video>');
 assert.match(inspectBundle(root).problems.join(" "),/intro\.mov/);
}));
test("release bundle checker rejects path traversal",()=>fixture(root=>{
 writeFileSync(join(root,"index.html"),'<script src="../private.js"></script>');
 assert.match(inspectBundle(root).problems.join(" "),/unsafe reference/);
}));
