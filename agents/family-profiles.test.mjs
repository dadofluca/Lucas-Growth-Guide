import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const js=readFileSync(new URL("./family-profiles.js",import.meta.url),"utf8");
const sql=readFileSync(new URL("../supabase/migrations/20261017_family_profiles.sql",import.meta.url),"utf8");
test("family profiles have a main navigation tab and own editor",()=>{
 assert.match(html,/data-tab="profile"/);assert.match(html,/id="profileSave"/);assert.match(html,/family-profiles\.js/);
});
test("profile saves use signed-in identity and family scope",()=>{
 assert.match(js,/user_id:user\.id/);assert.match(js,/family_id:family/);assert.match(js,/family_profiles/);
});
test("last-active is based on visible app heartbeat and not a permanent online claim",()=>{
 assert.match(js,/visibilityState!=="visible"/);assert.match(js,/last_active_at/);assert.match(js,/Active recently/);
});
test("family membership and self-update are enforced by RLS",()=>{
 assert.match(sql,/enable row level security/);assert.match(sql,/family_profiles_read/);assert.match(sql,/family_profiles_update/);assert.match(sql,/user_id=\(select auth\.uid\(\)\)/);
});
