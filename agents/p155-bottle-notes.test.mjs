import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fixture(){const ctx=vm.createContext({a:[],editId:null,ozPick:null,tags:new Set(),localStorage:{getItem:()=>null},$:()=>({value:ctx.input})});vm.runInContext(html.slice(html.indexOf('let smartItems=[]'),html.indexOf('function renderSmart()')),ctx);return ctx;}
test('P155: bottle then comma then ounces is one fully quantified feed',()=>{
 const ctx=fixture();for(const input of ['Bottle, 8 oz','Bottle; 8 ounces','Bottle: 8oz','8 oz, bottle','Bottle, 7.5 oz at 7:30 am']){ctx.input=input;const rows=JSON.parse(vm.runInContext('JSON.stringify(smartParseText(input))',ctx));assert.equal(rows.length,1,input);assert.equal(rows[0].kind,'feed');assert.equal(rows[0].oz,input.includes('7.5')?7.5:8);assert(!rows[0].needsFeedDetail,input);}
});
test('P155: attached bottle amount preserves independent diaper and caregiver',()=>{
 const ctx=fixture();ctx.input='Maddie gave a bottle, 8 oz at 7:30 am; Sam changed a poop diaper';const rows=JSON.parse(vm.runInContext('JSON.stringify(smartParseText(input))',ctx));assert.equal(rows.length,2);assert.equal(rows[0].oz,8);assert.equal(rows[0].credit,'Maddie');assert.equal(rows[0].clock.min,30);assert.equal(rows[1].kind,'poop');assert.equal(rows[1].credit,'Sam');
});
test('P155: exact bottle-only manual notes supply ounces without rewriting their text',()=>{
 const ctx=fixture();for(const input of ['Bottle, 8 oz','8 ounces bottle.','bottle 7.5oz']){ctx.input=input;assert.equal(vm.runInContext('manualBottleAmount()',ctx),input.includes('7.5')?7.5:8);assert.equal(ctx.input,input);}
});
test('P155: ambiguous, planned, negated, water, remaining and mixed notes do not auto-count',()=>{
 const ctx=fixture();for(const input of ['No bottle, 8 oz','Bottle, 8 oz tomorrow','Prepare bottle, 8 oz','Bottle, 8 oz water','Bottle, 8 oz left','Bottle, 8 oz, poop','Bottle, 0 oz','Bottle, 100 oz','8 oz','Bottle, eight oz']){ctx.input=input;assert.equal(vm.runInContext('manualBottleAmount()',ctx),null,input);}
});
test('P155: explicit amounts and categories win; editing never undoes a deliberately cleared amount',()=>{
 const ctx=fixture();ctx.input='Bottle, 8 oz';ctx.ozPick=6;assert.equal(vm.runInContext('manualBottleAmount()',ctx),null);ctx.ozPick=null;ctx.tags.add('poop');assert.equal(vm.runInContext('manualBottleAmount()',ctx),null);ctx.tags.clear();ctx.editId='old';ctx.a=[{id:'old',oz:8}];assert.equal(vm.runInContext('manualBottleAmount()',ctx),null);ctx.a[0].oz=null;assert.equal(vm.runInContext('manualBottleAmount()',ctx),8);
});
