import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const quickHandler=html.match(/document\.querySelectorAll\("\[data-quick\]"\)\.forEach\(b=>b\.onclick=.*?\);\$\("#moreBtn"\)/s)?.[0]||"";
test("quick actions no longer write into natural language text input",()=>{
 assert.ok(quickHandler,"quick action handler must exist");
 assert.doesNotMatch(quickHandler,/\$\("#quickText"\)\.value\s*\+=/);
 assert.match(quickHandler,/smartParseText\(value\)/);
 assert.match(quickHandler,/inlineClarify/);
});
test("bottle button asks for amount rather than silently choosing eight ounces",()=>{
 assert.match(quickHandler,/window\.prompt/);
 assert.match(quickHandler,/entered===null/);
 assert.match(quickHandler,/amount>16/);
});
test("quick actions require confirmation, not an immediate save",()=>{
 assert.doesNotMatch(quickHandler,/saveEvent\(|insert\(|smartSave"\)\.click/);
});
