import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),start=html.indexOf('async function connectFamilySync(){'),code=html.slice(start,html.indexOf('\n}\n',start)+3);
function flow(result){const modes=[],events=[];let queries=0;const context=vm.createContext({sb:{auth:{getUser:async()=>result},rpc:async()=>{queries++;return {data:[]};}},syncUser:{id:'previous'},syncBaby:'previous-baby',syncFamily:'previous-family',syncDeadline:task=>task,window:{dispatchEvent:event=>events.push(event.type)},Event,showSync:(mode,message)=>modes.push({mode,message})});vm.runInContext(code,context);return {context,modes,events,queries:()=>queries,run:()=>vm.runInContext('connectFamilySync()',context)};}
test('P139: a missing auth session opens sign-in without attempting a family lookup',async()=>{
 const f=flow({data:{user:null},error:{name:'AuthSessionMissingError',message:'Auth session missing!',status:400}});
 assert.equal(await f.run(),false);assert.equal(f.modes[0].mode,'login');assert.equal(f.context.syncUser,null);assert.equal(f.context.syncBaby,null);assert.equal(f.queries(),0);assert.deepEqual(f.events,['luca:session-changed']);
});
test('P139: signed-out result without an error still opens sign-in',async()=>{
 const f=flow({data:{user:null},error:null});assert.equal(await f.run(),false);assert.equal(f.modes[0].mode,'login');assert.equal(f.queries(),0);
});
test('P139: a genuine auth failure remains a failure and retains existing family context',async()=>{
 const f=flow({data:{user:null},error:{name:'AuthRetryableFetchError',message:'Network unavailable'}});
 await assert.rejects(f.run(),error=>error.name==='AuthRetryableFetchError');assert.equal(f.context.syncUser.id,'previous');assert.equal(f.context.syncBaby,'previous-baby');assert.equal(f.queries(),0);assert.equal(f.modes.length,0);
});
test('P139: auth errors paired with a user are never accepted as a verified session',async()=>{
 const f=flow({data:{user:{id:'unverified'}},error:{name:'AuthSessionMissingError'}});await assert.rejects(f.run());assert.equal(f.queries(),0);assert.equal(f.context.syncUser.id,'previous');
});
