import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("P82 drawers expose a generous dismiss backdrop and are narrower on phones",()=>{
 assert.match(html,/\.sidePanel\{width:min\(74vw,320px\)!important/);
 assert.match(html,/\.drawerPanel\{width:min\(74vw,320px\)!important/);
 assert.match(html,/\$\("#sideShade"\)\.onclick=closeMenu/);
 assert.match(html,/\$\("#drawerShade"\)\.onclick=closeDrawer/);
 assert.doesNotMatch(html,/if\(dx<-90\)\{closeMenu\(\);openDrawer\(\)\}/);
 assert.match(html,/e\.key==="Escape"/);
});
test("P82 timeline is lighter and readable",()=>{
 assert.match(html,/#timelineDrawer \.drawerPanel\{background:#f7efe3!important/);
 assert.match(html,/#timelineDrawer \.entry\{color:#283e3d!important/);
});
test("P82 poop is 3 points and sleep is tracked but unscored",()=>{
 assert.match(html,/s\.poops\+\+;s\.total\+=3/);
 assert.match(html,/s\.sleep\+\+\}/);
 assert.doesNotMatch(html,/s\.sleep\+\+;s\.total\+\+/);
 assert.match(html,/Naps and nighttime sleep: 0 points/);
});
test("P82 bedtime parsing and optional morning sleep check-in preserve uncertainty",()=>{
 assert.match(html,/nightBedtime:true/);
 assert.match(html,/Nighttime bedtime/);
 assert.match(html,/id="sleepCheckinCard" hidden/);
 assert.match(html,/id="sleepWakeups"/);
 assert.match(html,/id="sleepQuality"/);
 assert.match(html,/Morning sleep check-in/);
 assert.match(html,/in bed/);
 assert.match(html,/if\(!morning\.length\)return/);
 assert.match(html,/if\(checked\|\|localStorage\.getItem/);
});
