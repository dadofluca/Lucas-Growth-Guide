import {Script} from "node:vm";
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
 assert.match(sw,/if\(k\.startsWith\("luca-"\)&&k!==CACHE\)await caches\.delete\(k\)/);
 assert.match(sw,/caches\.open\(CACHE\)\.then\(async c=>\{await c\.add\(EMERGENCY\)/);
});

test("emergency standalone script parses without the main app bundle",()=>{
 const start=html.indexOf("<script>"),end=html.indexOf("</script>",start); const match=start>=0&&end>start?[null,html.slice(start+8,end)]:null;
 assert.ok(match,"inline emergency script exists");
 assert.doesNotThrow(()=>new Script(match[1],{filename:"emergency.html"}));
});

test("emergency response is cloned before asynchronous cache update",()=>{
 assert.match(sw,/const copy=r\.clone\(\);caches\.open\(CACHE\)\.then\(c=>c\.put\(EMERGENCY,copy\)\)/);
 assert.doesNotMatch(sw,/c\.put\(EMERGENCY,r\.clone\(\)\)/);
});

test("offline navigation resolves a cached page before error response",()=>{
 assert.match(sw,/await caches\.match\("\.\/index\.html"\)/);
 assert.match(sw,/await caches\.match\(EMERGENCY\)/);
 assert.doesNotMatch(sw,/caches\.match\("\.\/index\.html"\)\|\|Response\.error\(\)/);
});

test("service worker does not intercept private cross-origin APIs or non-GET writes",()=>{
 assert.match(sw,/e\.request\.method!=="GET"/);
 assert.match(sw,/new URL\(e\.request\.url\)\.origin!==self\.location\.origin/);
});

test("service worker caches only known static file types",()=>{
 assert.match(sw,/const staticAsset=/);
 assert.match(sw,/if\(!staticAsset\)return/);
 assert.match(sw,/webmanifest/);
});
