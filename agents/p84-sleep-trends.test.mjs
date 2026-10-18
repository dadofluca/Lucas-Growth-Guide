import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("P84 Insights includes 7 and 30 day sleep trend summaries",()=>{
 for(const id of ["sleepTrends","sleep7","sleep30","sleepAwakeMinutes"])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/function sleepStats\(entries,days=7,now=new Date\(\)\)/);
 assert.match(html,/function renderSleepTrends\(\)/);
 assert.match(html,/try\{renderSleepCheckin\(\)\}catch\(err\)/);assert.match(html,/try\{renderSleepTrends\(\)\}catch\(err\)/);
});
test("P84 sleep reporting does not count unknown sleep or wakeups as zero",()=>{
 assert.match(html,/night:null,wakes:null,awake:null/); 
 assert.match(html,/nightCount:night\.length/);
 assert.match(html,/if\(awake\)row\.awake=/);
 assert.match(html,/if\(m\)\{const n=/);
 assert.match(html,/Need a full night \+ timed naps/);
 assert.match(html,/not illness or growth-spurt diagnoses/);
});
test("P84 check-in captures optional awake minutes without inventing actual sleep",()=>{
 assert.match(html,/awakeText===""\?"":" · awake minutes: "/);
 assert.match(html,/if\(awakeText!==""/);
 assert.match(html,/Math\.max\(0,x\.night-x\.awake\)/);
});
