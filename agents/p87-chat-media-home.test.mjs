import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const chat=readFileSync(new URL("./family-chat.js",import.meta.url),"utf8");
test("P87 home has only one visible next-feed prediction and compact stats",()=>{
 assert.equal((html.match(/id="heroNext"/g)||[]).length,1);
 assert.equal((html.match(/id="next"/g)||[]).length,1);
 assert.match(html,/class="card compactTodayStats"/);
 assert.match(html,/id="quickText"/);
 assert.match(html,/id="timeline"/);
 assert.match(html,/class="hiddenOldComposer" aria-hidden="true"><span id="next"/);
});
test("P87 chat attachments are restricted to family storage and signed media",()=>{
 for(const id of ["familyChatAttach","familyChatMedia","familyChatMediaPreview"])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(chat,/family-chat-media/);
 assert.match(chat,/createSignedUrl\(m\.media_path,300\)/);
 assert.match(chat,/\.upload\(media_path,file,/);
 assert.match(chat,/file\.size>26214400/);
 assert.match(chat,/\["image","gif","video"\]/);
 assert.match(chat,/media_path,media_type/);
});
