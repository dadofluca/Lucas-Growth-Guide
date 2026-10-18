import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Execute the real inline deletion functions against isolated fake state, never production data.
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const extract=(name)=>{const start=html.indexOf("async function "+name+"(");assert.ok(start>=0,name+" missing");const open=html.indexOf("{",start);let depth=0;for(let i=open;i<html.length;i++){if(html[i]==="{")depth++;if(html[i]==="}"&&!--depth)return html.slice(start,i+1);}throw Error("unclosed "+name)};
const functions=extract("deleteRemote")+"\n"+extract("del");
function harness(response){const events=[{id:"synthetic-event",remote:true}],calls=[];let saves=0,draws=0;
 const fake={from:()=>({delete:()=>({eq:async()=>response})})};
 const run=new Function("sb","syncBaby","a","persist","render","toast","confirm","calls",functions+"\nreturn {del,events:()=>a};");
 const h=run(fake,"synthetic-baby",events,()=>saves++,()=>draws++,msg=>calls.push(msg),()=>true,calls);
 return {h,calls,get saves(){return saves},get draws(){return draws}};
}
test("remote delete success removes local entry only after server confirmation",async()=>{const x=harness({error:null});await x.h.del("synthetic-event");assert.equal(x.h.events().length,0);assert.equal(x.saves,1);assert.deepEqual(x.calls,["Entry deleted"])});
test("remote delete rejected by server preserves local entry",async()=>{const x=harness({error:{message:"synthetic denied"}});await x.h.del("synthetic-event");assert.equal(x.h.events().length,1);assert.equal(x.saves,0);assert.match(x.calls[0],/Delete failed/)});
test("remote delete network exception preserves local entry",async()=>{const x=harness(Promise.reject(new Error("synthetic offline")));await x.h.del("synthetic-event");assert.equal(x.h.events().length,1);assert.equal(x.saves,0);assert.match(x.calls[0],/Delete failed/)});
