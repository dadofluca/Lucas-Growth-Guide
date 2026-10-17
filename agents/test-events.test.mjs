import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {makeSyntheticEvent,summarizeTestRun} from "./test-events.mjs";
const runId="e8477a48-a60d-4c8a-85d3-5cf37dca42af";
test("test records never reference real baby or family IDs",()=>{
 const e=makeSyntheticEvent({runId,eventType:"bottle",amountOz:8});
 assert.equal(e.agent,"watchdog");assert.equal(e.amount_oz,8);
 assert.equal("baby_id" in e,false);assert.equal("family_id" in e,false);
 assert.equal("caregivers" in e,false);
});
test("invalid synthetic bottle cannot be written",()=>{
 assert.throws(()=>makeSyntheticEvent({runId,eventType:"bottle",amountOz:0}),RangeError);
});
test("test activity is reported separately",()=>{
 const s=summarizeTestRun([{status:"verified"},{status:"failed"}]);
 assert.equal(s.realCareEventsAdded,0);assert.equal(s.failed,1);
});
test("migration denies family-client access to test events",()=>{
 const sql=readFileSync(new URL("../supabase/migrations/20261017_agent_test_events.sql",import.meta.url),"utf8");
 assert.match(sql,/revoke all on public\.agent_test_events from anon, authenticated/);
 assert.doesNotMatch(sql,/insert into public\.baby_events/i);
});
