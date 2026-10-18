import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function parser(){const context=vm.createContext({a:[],localStorage:{getItem:()=>null}});vm.runInContext(html.slice(html.indexOf('let smartItems=[]'),html.indexOf('function renderSmart()')),context);return {parse(text){context.input=text;return JSON.parse(vm.runInContext('JSON.stringify(smartParseText(input))',context));},needs(item){context.item=item;return vm.runInContext('Boolean(smartNeedsChoice(item))',context);}};}
const meal='Half a jar of food (chicken, sweet potato, broccoli, and avocado mixed) at 12:45 fed by Nona';
test('P138: a detailed meal fed by Nona is one solids event, not an extra bottle',()=>{
 const p=parser(),items=p.parse(meal);assert.equal(items.length,1);const [item]=items;
 assert.equal(item.kind,'solids');assert.equal(item.credit,'Nona');assert.equal(item.note,meal);assert.equal(item.raw,meal);
 assert.equal(item.clock.h12,12);assert.equal(item.clock.min,45);assert.equal(item.clock.ambiguous,true);assert.equal(p.needs(item),true);
 item.clockChoice='PM';assert.equal(p.needs(item),false);
});
test('P138: removing an unresolved bottle leaves independently valid solids savable',()=>{
 const p=parser(),items=p.parse(meal+' and a bottle');assert.equal(items.length,2);
 const remaining=items.filter(item=>item.kind!=='feed');assert.equal(remaining.length,1);
 remaining[0].clockChoice='PM';assert.equal(remaining.some(p.needs),false);
});
test('P138: actual bottle plus solids retains both events and their separate stated times',()=>{
 const p=parser(),items=p.parse('Sam gave 8 oz at 9 am; Nona gave avocado at 12:45 pm');
 assert.equal(items.length,2);const bottle=items.find(x=>x.kind==='feed'),food=items.find(x=>x.kind==='solids');
 assert.equal(bottle.oz,8);assert.equal(bottle.clock.h12,9);assert.equal(bottle.credit,'Sam');assert.equal(food.clock.h12,12);assert.equal(food.clock.min,45);
 assert.equal(bottle.clock.ap,'am');assert.equal(food.clock.ap,'pm');
});
test('P138: unspecified feeding asks what food instead of assuming bottle ounces',()=>{
 const p=parser(),[item]=p.parse('Nona fed him at 12:45 pm');assert.equal(item.kind,'feed');assert.equal(item.feedChoice,null);assert.equal(item.needsFeedDetail,true);assert.equal(p.needs(item),true);
});
test('P138: explicit bottle still requires ounces; explicit solids keep written ingredients',()=>{
 const p=parser(),[bottle]=p.parse('Nona gave a bottle at 12:45 pm');assert.equal(bottle.feedChoice,'bottle');assert.equal(p.needs(bottle),true);
 const [food]=p.parse('Nona fed chicken and broccoli at 12:45 pm');assert.equal(food.kind,'solids');assert.match(food.note,/chicken and broccoli/);assert.equal(food.clock.ap,'pm');assert.equal(p.needs(food),false);
});
