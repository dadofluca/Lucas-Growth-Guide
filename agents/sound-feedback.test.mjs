import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("sound has an accessible on/off setting and explicit test button",()=>{
 assert.match(html,/id="profileSound"/);assert.match(html,/id="profileSoundTest"/);
 assert.match(html,/localStorage\.setItem\("luca-sound"/);
});
test("missing or blocked Web Audio cannot prevent care logging",()=>{
 assert.match(html,/if\(!Ctx\)return null/);
 assert.match(html,/function safeAudio\(fn\)/);
 assert.match(html,/safeAudio\(fart\)/);
 assert.match(html,/safeAudio\(bottleLogSound\)/);
});
test("intro jingle no longer starts on arbitrary first touch",()=>{
 assert.doesNotMatch(html,/document\.addEventListener\("pointerdown",function unlock/);
});
