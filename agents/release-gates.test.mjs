import test from "node:test";
import assert from "node:assert/strict";
import {checks,assessReadiness} from "./release-gates.mjs";
test("no evidence never means ready",()=>{const x=assessReadiness();assert.equal(x.ready,false);assert.equal(x.results.length,checks.length);});
test("a failed check blocks release",()=>{const x=assessReadiness({unit:{status:"failed",evidenceUrl:"https://example.org/fail"}});assert.equal(x.ready,false);assert.equal(x.results[0].status,"failed");});
test("passing claims require an evidence URL",()=>{const x=assessReadiness({unit:{status:"passed"}});assert.equal(x.results[0].status,"unverified");});
test("automated deployment and merge are disabled",()=>{const x=assessReadiness();assert.equal(x.automaticMerge,false);assert.equal(x.automaticDeployment,false);});
