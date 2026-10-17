import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("./family-chat.js",import.meta.url),"utf8");
test("chat assigns a monotonically increasing request id",()=>{
 assert.match(src,/requestId=0/);
 assert.match(src,/request=\+\+requestId/);
});
test("chat ignores responses after newer refresh or unmount",()=>{
 assert.match(src,/disposed\|\|request!==requestId/);
 assert.match(src,/disposed=true;requestId\+\+;clearInterval\(timer\)/);
});
