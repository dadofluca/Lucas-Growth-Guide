import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("P85 has five visible nav items with Today centered",()=>{
 const nav=html.match(/<nav aria-label="Main navigation">([\s\S]*?)<\/nav>/)?.[1];assert.ok(nav);
 const labels=[...nav.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].filter(x=>!x[0].includes("navHidden")).map(x=>x[1].replace(/<b>.*?<\/b>/g,"").replace(/<[^>]*>/g,"").trim());
 assert.deepEqual(labels,["Insights","History","Today","Chat","More"]);
 for(const id of ["menuFamily","menuIdeas","menuHistory","menuSupplies","navMore"])assert.match(html,new RegExp('id="'+id+'"'));
});
test("P85 same-minute bedtimes are de-duplicated visually, without deleting family data",()=>{
 assert.match(html,/function bedtimeKey\(e\)/);
 assert.match(html,/function visibleCareEvents\(events\)/);
 assert.match(html,/visibleCareEvents\(a\.filter/);
 assert.match(html,/if\(existing\)\{toast\("Bedtime already logged/);
 assert.doesNotMatch(html,/function visibleCareEvents[\s\S]*?function persist\(\)/);
});
test("P85 double-click save is guarded and edits retain original identity",()=>{
 assert.match(html,/let entrySaveBusy=false/);
 assert.match(html,/if\(entrySaveBusy\)return/);
 assert.match(html,/entrySaveBusy=true/);
 assert.match(html,/finally\{entrySaveBusy=false/);
 assert.match(html,/id:editId\|\|Date\.now\(\)/);
 assert.match(html,/a=a\.map\(x=>x\.id===editId\?e:x\)/);
});
