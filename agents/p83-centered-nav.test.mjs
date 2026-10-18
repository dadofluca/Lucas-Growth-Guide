import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("P83 navigation has five visible destinations with Today centered",()=>{
 const nav=html.match(/<nav aria-label="Main navigation">([\s\S]*?)<\/nav>/)?.[1];assert.ok(nav);
 const labels=[...nav.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].filter(x=>!x[0].includes("navHidden")).map(x=>x[1].replace(/<b>.*?<\/b>/g,"").replace(/<[^>]*>/g,"").trim());
 assert.deepEqual(labels,["Insights","History","Today","Chat","More"]);
 assert.match(nav,/class="active navHome" data-tab="today"/);
 assert.match(html,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
});
test("P83 secondary sections remain reachable through More without breaking profile and ideas click hooks",()=>{
 for(const id of ["menuSupplies","menuIdeas","menuFamily","menuHistory","menuSchedule","menuLeaderboard"])assert.match(html,new RegExp('id="'+id+'"'));
 for(const tab of ["supplies","ideas","profile"])assert.match(html,new RegExp('class="navHidden" data-tab="'+tab+'"'));
 assert.match(html,/\$\("#navMore"\)\.onclick=/);
 assert.match(html,/b\.classList\.contains\("navHidden"\)\?\$\("#navMore"\):b/);
 assert.match(html,/\$\("#sideShade"\)\.onclick=closeMenu/);
});
