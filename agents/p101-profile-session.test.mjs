import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("profile can recover after delayed family authentication",()=>{
 assert.match(html,/function activateFamilyProfiles\(\)/);
 assert.match(html,/addEventListener\("luca:family-session-ready",\(\)=>\{if\(document\.querySelector\("#profileView"\)\?\.classList\.contains\("active"\)\)activateFamilyProfiles\(\)\}/);
 assert.match(html,/addEventListener\("click",activateFamilyProfiles\)/);
});
