import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {existsSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const report=readFileSync(new URL("./report-widget.js",import.meta.url),"utf8");
const worker=readFileSync(new URL("../supabase/functions/agent-audit/index.ts",import.meta.url),"utf8");
test("app includes a reachable report button and module",()=>{
 assert.match(html,/Report a problem/);
 assert.match(html,/agents\/report-widget\.js/);
 assert.ok(existsSync(new URL("./report-widget.js",import.meta.url)));
});
test("reports require authenticated user and use family-scoped table",()=>{
 assert.match(report,/auth\.getUser\(\)/);
 assert.match(report,/agent_user_reports/);
 assert.doesNotMatch(report,/SUPABASE_SERVICE_ROLE_KEY/);
});
test("worker requires authorization and does not log private report descriptions",()=>{
 assert.match(worker,/token!==key/);
 assert.match(worker,/verify_jwt|service.role|service-role/i);
 assert.doesNotMatch(worker,/description[,}]/);
});
test("PWA does not embed service role credentials",()=>{
 assert.doesNotMatch(html,/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/);
});

test("audit catches null bottle quantities rather than coercing null to zero",()=>{
 assert.match(worker,/e\.amount_oz===null/);
});
test("agent findings use idempotent fingerprint insertion",()=>{
 assert.match(worker,/on_conflict=fingerprint/);
 assert.match(worker,/resolution=ignore-duplicates/);
});
