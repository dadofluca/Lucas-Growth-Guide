import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
test("preview build removes Supabase client initialization, worker registration, and sync startup",()=>{
 execFileSync(process.execPath,["agents/build-demo-preview.mjs"]);
 const html=readFileSync("artifacts/luca-preview/index.html","utf8");
 assert.match(html,/PREVIEW ONLY/);
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/const SUPABASE_URL="",SUPABASE_KEY="";let sb=null;/);
 assert.doesNotMatch(html,/supabase\.createClient\(SUPABASE_URL,SUPABASE_KEY\)/);
 assert.doesNotMatch(html,/navigator\.serviceWorker\.register/);
 assert.doesNotMatch(html,/setTimeout\(\(\)=>\{try\{setupSync\(\)/);
});
