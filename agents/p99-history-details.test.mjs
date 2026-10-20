import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("History has accessible expandable date summaries and event rows",()=>{
 assert.match(html,/function renderHistory\(\)/);
 assert.match(html,/<details class="historyDay"/);
 assert.match(html,/<summary>/);
 assert.match(html,/class="historyEvent(?:["']| )/);
 assert.match(html,/Caregiver:/);
 assert.match(html,/historyNote/);
 assert.match(html,/function render\(\)\{[\s\S]*?renderHistory\(\)/);
});
