import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");const sync=readFileSync(new URL("../sync-fix.js",import.meta.url),"utf8");
test("poop slider is optional and saved with one manual event",()=>{assert.match(html,/id="poopSize"/);assert.match(html,/id="poopWet"/);assert.match(html,/let poopExtra=tags.has\("poop"\)/);assert.match(html,/notes:\[originalNotes,poopExtra\]/)});
test("insights use recorded recent history, not fabricated milestones",()=>{assert.match(html,/id="insightTrends"/);assert.match(html,/gaps.length>=3/);assert.match(html,/Missing logs can distort this/);assert.match(html,/No guesses from missing entries/)});
test("Teddy shows service errors",()=>{assert.match(sync,/error\?\.context\?\.json/);assert.match(sync,/Teddy could not reach the AI service/)});
