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

test("profile view clears prior family on sign-out or account switch",()=>{
 assert.match(js,/if\(!client\|\|!family\|\|!user\)\{list\.replaceChildren\(\)/);
 assert.match(js,/if\(getFamilyId\(\)!==family\|\|getUser\(\)\?\.id!==user\.id\)\{list\.replaceChildren\(\)/);
});

test("profile refresh rejects stale asynchronous responses and clears offline content",()=>{
 assert.match(js,/request=\+\+requestId/);
 assert.match(js,/if\(disposed\|\|request!==requestId\)return/);
 assert.match(js,/if\(error\)\{list\.replaceChildren\(\)/);
});
test("profile saves check family session and unmount cleanup",()=>{
 assert.match(js,/if\(disposed\|\|getFamilyId\(\)!==family\|\|getUser\(\)\?\.id!==user\.id\)/);
 assert.match(js,/disposed=true;requestId\+\+;clearInterval\(timer\);list\.replaceChildren\(\)/);
});

test("profile tab remounts on session switch without duplicate save listeners",()=>{
 assert.match(html,/profileSession!==session/);
 assert.match(html,/profileDispose\?\.\(\)/);
 assert.match(js,/save\.removeEventListener\("click",onSave\)/);
});
