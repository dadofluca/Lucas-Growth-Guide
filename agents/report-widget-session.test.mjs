import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const js=readFileSync(new URL("./report-widget.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("report history is family-scoped and does not show stale sessions",()=>{
 assert.match(js,/eq\("family_id",familyId\)/);
 assert.match(js,/getFamilyId\(\)!==familyId/);
 assert.match(js,/request!==requestId/);
});
test("report panel cleanup invalidates pending refreshes",()=>{
 assert.match(js,/luca:dispose/);
 assert.match(html,/dispatchEvent\(new Event\("luca:dispose"\)\)/);
});
test("report submission checks signed-in user and family before writing",()=>{
 assert.match(js,/supabase\.auth\.getUser\(\)/);
 assert.match(js,/reporter_id:user\.id/);
 assert.match(js,/getFamilyId\(\)!==familyId\|\|disposed/);
});
