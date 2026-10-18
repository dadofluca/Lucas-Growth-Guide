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
test("quick bottle opens 4–8 oz picker and never launches a native prompt",()=>{
 assert.match(quickHandler,/openQuickBottle\(b\)/);
 assert.doesNotMatch(quickHandler,/window\.prompt/);
 for(const oz of [4,5,6,7,8])assert.match(html,new RegExp('data-quick-oz="'+oz+'"'));
 assert.match(html,/at:new Date\(\)\.toISOString\(\)/);
});
test("quick actions require confirmation, not an immediate save",()=>{
 assert.doesNotMatch(quickHandler,/saveEvent\(|insert\(|smartSave"\)\.click/);
});
