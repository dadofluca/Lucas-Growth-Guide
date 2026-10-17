import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const js=readFileSync(new URL("./family-chat.js",import.meta.url),"utf8");
const sql=readFileSync(new URL("../supabase/migrations/20261017_family_chat.sql",import.meta.url),"utf8");
test("family chat is a main tab with a separate composer",()=>{
 assert.match(html,/data-tab="chat"/);
 assert.match(html,/id="chatView"/);
 assert.match(html,/id="familyChatText"/);
 assert.match(html,/mountFamilyChat/);
});
test("chat only reads family-scoped messages and never inserts care events",()=>{
 assert.match(js,/eq\("family_id",family\)/);
 assert.match(js,/family_chat_messages/);
 assert.doesNotMatch(js,/baby_events|pushEntry|saveEvent/);
 assert.match(js,/body\.textContent=m\.body/);
});
test("server-side family membership and sender identity enforced",()=>{
 assert.match(sql,/enable row level security/);
 assert.match(sql,/family_chat_read/);
 assert.match(sql,/family_chat_send/);
 assert.match(sql,/sender_id=\(select auth\.uid\(\)\)/);
 assert.doesNotMatch(sql,/grant .* to anon/);
});

test("chat ignores stale refresh results and stops updates after unmount",()=>{
 assert.match(js,/requestId=0,disposed=false/);
 assert.match(js,/if\(disposed\|\|request!==requestId\)return/g);
 assert.match(js,/if\(getFamilyId\(\)!==family\|\|getUser\(\)\?\.id!==user\.id\)\{feed\.replaceChildren\(\)/);
 assert.match(js,/disposed=true;requestId\+\+;clearInterval\(timer\)/);
});

test("chat and profile tabs can initialize after family sign-in",()=>{
 assert.match(html,/if\(!chatStarted&&\(!syncFamily\|\|!syncUser\)\)/);
 assert.match(html,/if\(!sb\|\|!syncFamily\|\|!syncUser\)\{document\.querySelector\("#profileStatus"\)/);
});

test("chat clears prior messages when network fetch fails",()=>{
 assert.match(js,/if\(error\)\{feed\.replaceChildren\(\);say\("Chat is unavailable/);
});
test("chat send checks session before writing and retains draft after session switch",()=>{
 assert.match(js,/if\(busy\|\|disposed\)return/);
 assert.match(js,/if\(disposed\|\|getFamilyId\(\)!==family\|\|getUser\(\)\?\.id!==user\.id\)/);
 assert.match(js,/if\(!disposed&&getFamilyId\(\)===family&&getUser\(\)\?\.id===user\.id\)/);
});

test("chat tab remounts after family switch without duplicate send listeners",()=>{
 assert.match(html,/chatSession!==session/);
 assert.match(html,/chatDispose\?\.\(\)/);
 assert.match(js,/send\.removeEventListener\("click",onSend\)/);
});
