import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("History renders before optional sleep, drawer and leaderboard panels",()=>{
 const start=html.indexOf("function render(){");
 const end=html.indexOf("\n$(\"#emailLogin\")",start);
 assert.ok(start>=0&&end>start);
 const render=html.slice(start,end);
 for(const name of ["renderSleepCheckin()","renderSleepTrends()","renderDrawer()","renderLeaderboard()"]){
  assert.ok(render.indexOf('$(\"#history\").innerHTML')>=0);
  assert.ok(render.indexOf('$(\"#history\").innerHTML')<render.indexOf(name),name+" must not block History");
 }
});
test("event sync reports query failures distinctly from auth readiness",()=>{
 assert.match(html,/timelineLoaded=await pullShared\(\)/);
 assert.match(html,/Timeline sync failed/);
 assert.match(html,/render\(\);return false\}let remoteRows=/);
});
