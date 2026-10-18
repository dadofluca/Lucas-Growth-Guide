import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import sleep from "./sleep-data.js";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("P84 Insights includes 7 and 30 day sleep trend summaries",()=>{
 for(const id of ["sleepTrends","sleep7","sleep30","sleepAwakeMinutes"])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/function sleepStats\(entries,days=7,now=new Date\(\)\)/);
 assert.match(html,/function renderSleepTrends\(\)/);
 assert.match(html,/try\{renderSleepCheckin\(\)\}catch\(err\)/);assert.match(html,/try\{renderSleepTrends\(\)\}catch\(err\)/);
});
test("P84 sleep reporting does not count unknown sleep or wakeups as zero",()=>{
 const stats=sleep.summarize([{id:"unknown-night",at:"2026-10-18T07:00:00",tags:["sleep"],notes:"Nighttime bedtime"}],7,new Date("2026-10-18T12:00:00"));
 assert.equal(stats.night,null);assert.equal(stats.wakes,null);assert.equal(stats.actualNight,null);assert.equal(stats.nightCount,0);assert.equal(stats.partialCount,1);
});
test("P84 check-in captures optional awake minutes without inventing actual sleep",()=>{
 assert.match(html,/awakeText===""\?"":" · awake minutes: "/);
 assert.match(html,/if\(awakeText!==""/);
 const entry={id:"night",at:"2026-10-18T07:00:00",tags:["sleep"],notes:"Morning sleep check-in · 10h 0m in bed · wakeups: 2 · awake minutes: 45"};
 const stats=sleep.summarize([entry],7,new Date("2026-10-18T12:00:00"));assert.equal(stats.night,600);assert.equal(stats.actualNight,555);assert.equal(stats.wakes,2);
});
