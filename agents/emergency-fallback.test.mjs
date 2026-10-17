import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../emergency.html",import.meta.url),"utf8");
const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
test("emergency fallback is independent of the main app",()=>{
 assert.match(html,/luca_emergency_log_v1/);
 assert.match(html,/localStorage\.setItem\(KEY/);
 assert.doesNotMatch(html,/supabase\.co|createClient\(/);
});
test("emergency backup requires manual review before recovery export",()=>{
 assert.match(html,/id="review"/);
 assert.match(html,/id="exportReviewed"/);
 assert.match(html,/input:checked/);
 assert.match(html,/NOT been imported into shared history/);
});
test("service worker retains current emergency cache during activation",()=>{
 assert.match(sw,/if\(k!==CACHE\)await caches\.delete\(k\)/);
 assert.match(sw,/caches\.open\(CACHE\)\.then\(c=>c\.add\(EMERGENCY\)\)/);
});
