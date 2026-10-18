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
 assert.match(js,/disposed=true;requestId\+\+;clearInterval\(timer\);save\.removeEventListener\("click",onSave\);[\s\S]*list\.replaceChildren\(\)/);
});

test("profile tab remounts on session switch without duplicate save listeners",()=>{
 assert.match(html,/profileSession!==session/);
 assert.match(html,/profileDispose\?\.\(\)/);
 assert.match(js,/save\.removeEventListener\("click",onSave\)/);
});

test("P68 profile exposes backup log and support without floating emergency overlay",()=>{
 assert.match(html,/href="\.\/emergency\.html"/);
 assert.match(html,/id="profileReportIssue"/);
 assert.doesNotMatch(html,/id="lucaEmergencyLink"/);
 for(const preset of ["lion","panda","koala","penguin","dino","robot","astronaut","sun","star"]){assert.match(js,new RegExp(preset+':'));assert.match(html,new RegExp('value="'+preset+'"'));}
});
test("P68 family chat has compact composer and send control",()=>{
 assert.match(html,/class="chatComposer"/);
 assert.match(html,/id="familyChatText"/);
 assert.match(html,/id="familyChatSend"/);
});

test("app HTML and compatibility runtime agree on release badge",()=>{
 const runtime=readFileSync(new URL("../sync-fix.js",import.meta.url),"utf8");
 const htmlBadge=html.match(/id="patchBadge"[^>]*>\s*(P\d+)\s*<\/div>/);
 const runtimeBadge=runtime.match(/const LUCA_RUNTIME=\{version:'(P\d+)'/);
 assert.ok(htmlBadge,"main HTML must declare a visible patch badge");
 assert.ok(runtimeBadge,"runtime must declare its version");
 assert.equal(htmlBadge[1],runtimeBadge[1],"runtime patch must not override HTML with an older version");
});

test("Family Ideas board has explicit privacy and server-enforced family scope",()=>{
 const sql=readFileSync(new URL("../supabase/migrations/20261018_family_ideas.sql",import.meta.url),"utf8");
 const ideas=readFileSync(new URL("./family-ideas.js",import.meta.url),"utf8");
 assert.match(html,/id="ideasView"/);assert.match(html,/data-tab="ideas"/);
 assert.match(sql,/enable row level security/);assert.match(sql,/visibility='family' or author_id=/);
 assert.match(sql,/from public.family_members/);assert.match(sql,/revoke all on public.family_ideas from anon/);
 assert.match(ideas,/Private — only me/);assert.match(ideas,/getClient\(\)\.from\("family_ideas"\)/);
});

test("Spark scheduled audit and feedback reviewer require approval",()=>{
 const workflow=readFileSync(new URL("../.github/workflows/safe-agent-schedule.yml",import.meta.url),"utf8");
 const spark=readFileSync(new URL("./spark-audit.mjs",import.meta.url),"utf8");
 const review=readFileSync(new URL("./feedback-review.mjs",import.meta.url),"utf8");
 assert.match(workflow,/node agents\/spark-audit\.mjs/);
 assert.match(workflow,/artifacts\/spark-design-audit\.json/);
 assert.match(spark,/autoDeploy:false/);
 assert.match(review,/agent_review_approved!==true/);
 assert.match(review,/autoMerge:false,autoDeploy:false/);
});

test("P71 Ideas form is responsive, Teddy dock collapses and new poops trigger sound",()=>{
 assert.match(html,/#familyIdeasRoot form\{display:grid/);
 assert.match(html,/#familyIdeasRoot textarea\{min-height:116px/);
 assert.match(html,/\.careDock:not\(\.open\) \.careItems\{display:none!important\}/);
 assert.match(html,/if\(!editId&&e.tags.includes\("poop"\)\)playPoopFun\(\)/);
 assert.match(html,/function fart\(\)\{\s*if\(!lucaSoundEnabled\(\)\)return/);
 assert.match(html,/const poopAudioPool=realPoopSounds\.map/);
});

test("Feedback review approval is author controlled and revocable",()=>{
 const sql=readFileSync(new URL("../supabase/migrations/20261018_agent_feedback_approval.sql",import.meta.url),"utf8");
 const ui=readFileSync(new URL("./family-ideas.js",import.meta.url),"utf8");
 assert.match(sql,/agent_review_approved boolean not null default false/);
 assert.match(sql,/grant update\(agent_review_approved\)/);
 assert.match(sql,/author_id=\(select auth.uid\(\)\)/);
 assert.match(ui,/data-agent-review/);assert.match(ui,/agent_review_approved:approved/);
});

test("P73 offers explicit recorded fart preview for iPhone sound checks",()=>{
 assert.match(html,/id="profilePoopClip"/);
 assert.match(html,/id="profilePoopTest"/);
 assert.match(html,/poopTest\?\.addEventListener\("click"/);
 assert.match(html,/await audio\.play\(\)/);
 assert.match(html,/Sound blocked\. Check silent mode/);
});
