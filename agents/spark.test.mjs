import test from "node:test";
import assert from "node:assert/strict";
import {sparkBacklog} from "./spark.mjs";
test("Spark defaults to low-impact enhancements",()=>{
 const p=sparkBacklog();assert.ok(p.length>=2);
 assert.ok(!p.some(x=>x.id==="private_gallery"));
 assert.ok(p.every(x=>x.autoDeploy===false&&x.stage==="proposal"));
});
test("gallery requires explicit consideration and security review",()=>{
 const p=sparkBacklog({includeLarge:true});
 assert.ok(p.find(x=>x.id==="private_gallery").safeguards.includes("security review before release"));
});
