import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("timeline reads delegate to the tested care queue and retain visible error feedback",()=>{
 assert.match(html,/function pullShared\(\)\{return careEvents\.refresh\(\)\}/);
 assert.match(html,/cached history retained/);
});
