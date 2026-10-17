import test from "node:test";
import assert from "node:assert/strict";
import {caregiverPhrases} from "./caregiver-language-corpus.mjs";
test("synthetic corpus includes typo, ambiguous, combined and caregiver examples",()=>{
 assert.ok(caregiverPhrases.length>=15);
 for(const item of caregiverPhrases){assert.ok(item.input&&Array.isArray(item.expected)&&item.note);}
 assert.ok(caregiverPhrases.some(x=>x.input.includes("80z")));
 assert.ok(caregiverPhrases.some(x=>x.expected.length>1));
 assert.ok(caregiverPhrases.some(x=>x.expected.length===0));
 assert.ok(caregiverPhrases.some(x=>x.input.includes("Nona")));
});
