import test from "node:test";
import assert from "node:assert/strict";
import {buildDailyInsights,summarizeRoutines} from "./teddy.mjs";
test("Teddy counts only observed bottle records",()=>{
 const events=[{event_type:"bottle",amount_oz:8},{event_type:"bottle",amount_oz:6},{event_type:"bottle",amount_oz:null},{event_type:"poop"}];
 const result=summarizeRoutines(events);
 assert.equal(result.observedBottleCount,2);
 assert.equal(result.observedBottleOz,14);
 assert.match(result.note,/missing logs cannot be inferred/i);
});
test("Teddy respects local date boundaries",()=>{
 const events=[{event_type:"bottle",amount_oz:8,event_time:"2026-10-18T02:30:00Z"},
 {event_type:"bottle",amount_oz:4,event_time:"2026-10-18T12:30:00Z"}];
 const result=buildDailyInsights(events,{day:"2026-10-17",timezone:"America/New_York"});
 assert.equal(result.observed.bottles,1);
 assert.equal(result.observed.ounces,8);
 assert.equal(result.clinicalAdvice,false);
});
test("Teddy never fills in absent events",()=>{
 const result=buildDailyInsights([],{day:"2026-10-17",timezone:"America/New_York"});
 assert.equal(result.observed.bottles,0);
 assert.match(result.insights.join(" "),/Missing logs are not evidence/);
});
