import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("entry composer offers close and explicit discard",()=>{
 assert.match(html,/id="closeComposer"/);
 assert.match(html,/id="discardComposer"/);
 assert.match(html,/Cancel \/ discard entry/);
});
test("close preserves draft, discard clears it",()=>{
 assert.match(html,/\$\("#closeComposer"\)\.onclick=\(\)=>\$\("#manualComposer"\)\.classList\.add\("hiddenOldComposer"\)/);
 assert.match(html,/\$\("#discardComposer"\)\.onclick=\(\)=>\{reset\(\);\$\("#manualComposer"\)\.classList\.add/);
});
test("More toggles and successful save closes composer",()=>{
 assert.match(html,/\$\("#moreBtn"\)\.onclick=\(\)=>\{const form=.*?classList\.toggle\("hiddenOldComposer"\)/);
 assert.match(html,/Entry logged ✓"\);reset\(\);\$\("#manualComposer"\)\.classList\.add/);
});
