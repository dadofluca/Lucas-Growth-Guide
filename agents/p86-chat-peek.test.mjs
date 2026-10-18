import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const runtime=readFileSync(new URL("../sync-fix.js",import.meta.url),"utf8");
test("compatibility runtime remains without obsolete badge",()=>{
 assert.doesNotMatch(html,/id="patchBadge"/);
 assert.match(runtime,/version:document\.getElementById\("buildVersion"\)/);
});
test("P87 right drawer is family chat preview, not redundant timeline",()=>{
 assert.match(html,/id="drawerChatPreview"/);
 assert.match(html,/id="drawerOpenChat"/);
 assert.match(html,/id="chatPeekTab"/);
 assert.match(html,/id="chatUnreadBadge" hidden/);
 assert.doesNotMatch(html,/id="drawerTimeline"/);
 assert.match(html,/window\.dispatchEvent\(new Event\("luca:chat-peek"\)\)/);
});
test("P87 edge gestures only open from 24px edge with strong horizontal intent",()=>{
 assert.match(html,/t\.clientX<=24\?"left":t\.clientX>=w-24\?"right":null/);
 assert.match(html,/Math\.abs\(dx\)<75/);
 assert.match(html,/Math\.abs\(dx\)<Math\.abs\(dy\)\*1\.6/);
 assert.match(html,/if\(g\.edge==="right"&&dx<0\)\{openDrawer\(\)\}/);
});
test("P87 chat peek uses family-scoped authenticated reads, no stored message bodies",()=>{
 assert.match(html,/\.from\("family_chat_messages"\)\.select\("id,sender_id,body,created_at,media_path,media_type"\)\.eq\("family_id",family\)/);
 assert.match(html,/seenKey=\(f,u\)=>"luca-chat-seen:"\+f\+":"\+u/);
 assert.match(html,/body\.textContent=m\.body\|\|/);
 assert.match(html,/peekBadge\.hidden=!unread/);
});
