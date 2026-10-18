import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("empty remote result cannot erase cached remote care events",()=>{
 assert.match(html,/!remoteRows\.length&&a\.some\(e=>e\.remote\)/);
 assert.match(html,/cached history retained/);
 const guard=html.indexOf("if(!remoteRows.length&&a.some(e=>e.remote))");
 const overwrite=html.indexOf("a=[...remoteRows,...pending.filter",guard);
 assert.ok(guard>=0&&overwrite>guard);
 assert.match(html.slice(guard,overwrite),/render\(\);return false/);
});
