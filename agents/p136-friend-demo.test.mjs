import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {randomUUID} from 'node:crypto';
import {friendDemo} from './build-friend-demo.mjs';
const source=readFileSync(new URL('./demo-mode.js',import.meta.url),'utf8');
function storage(){const map=new Map();return {getItem:k=>map.get(String(k))??null,setItem:(k,v)=>map.set(String(k),String(v)),removeItem:k=>map.delete(String(k)),clear:()=>map.clear(),key:i=>[...map.keys()][i]??null,get length(){return map.size;}};}
function playground(local=storage(),session=storage()){
 const context={localStorage:local,sessionStorage:session,crypto:{randomUUID},structuredClone,document:{addEventListener(){}},location:{reload(){}},URL};context.window=context;
 runInNewContext(source,context);return context;
}
test('friend demo removes the real service client and blocks outgoing connections, install and backup escapes',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),demo=friendDemo(html);
 assert.match(demo,/connect-src 'none'/);assert.match(demo,/worker-src 'none'/);assert.match(demo,/Practice mode · sample data/);
 assert.doesNotMatch(demo,/sb_publishable_|navigator\.serviceWorker\.register|cdn\.jsdelivr|rel="manifest"|href="\.\/emergency.html"/);
 assert.equal(readFileSync(new URL('../demo.html',import.meta.url),'utf8'),demo);
 assert.throws(()=>friendDemo(html.replace('let sb=null;','let sb=undefined;')),/refusing an unisolated demo/);
});
test('practice edits, deletes, persistence and reset never read or overwrite real local history or session',async()=>{
 const local=storage(),session=storage();local.setItem('luca-log-v2','REAL HISTORY SENTINEL');session.setItem('real-session','REAL SESSION');
 let context=playground(local,session),client=context.LucaDemo.client;
 assert.equal(context.localStorage.getItem('luca-log-v2'),null);assert.equal(context.sessionStorage.getItem('real-session'),null);
 let rows=(await client.from('baby_events').select('*')).data;assert.equal(rows.length,4);
 const bottle=rows.find(r=>r.id==='practice-bottle');await client.from('baby_events').update({amount_oz:8}).eq('id',bottle.id).select().single();
 await client.from('baby_events').delete().eq('id','practice-nap');
 await client.from('baby_events').insert({id:'new-local',baby_id:'practice-baby',note:'Sample only'});
 context.localStorage.setItem('luca-log-v2','FAKE HISTORY');context.sessionStorage.setItem('real-session','FAKE SESSION');
 context=playground(local,session);client=context.LucaDemo.client;
 assert.equal((await client.from('baby_events').select().eq('id',bottle.id).single()).data.amount_oz,8);
 assert.equal((await client.from('baby_events').select().eq('id','practice-nap')).data.length,0);
 assert.equal((await client.from('baby_events').select().eq('id','new-local')).data.length,1);
 assert.equal(local.getItem('luca-log-v2'),'REAL HISTORY SENTINEL');assert.equal(session.getItem('real-session'),'REAL SESSION');
 context.LucaDemo.reset();assert.equal(local.getItem('luca-log-v2'),'REAL HISTORY SENTINEL');assert.equal(session.getItem('real-session'),'REAL SESSION');
 context=playground(local,session);assert.equal((await context.LucaDemo.client.from('baby_events').select()).data.length,4);
});
test('practice profiles support banner compare-and-swap without clobbering avatar and name edits',async()=>{
 const {client}=playground().LucaDemo;
 await client.from('family_profiles').upsert({family_id:'practice-family',user_id:'practice-user',display_name:'Friend',avatar_preset:'teddyTrooper'},{onConflict:'family_id,user_id'});
 const first=await client.from('family_profiles').update({flair:{unlocked:['first-checkin'],banner:'first-checkin'}}).eq('user_id','practice-user').eq('flair','{}').select();assert.equal(first.data.length,1);
 const stale=await client.from('family_profiles').update({flair:{}}).eq('user_id','practice-user').eq('flair','{}').select();assert.equal(stale.data.length,0);
 const saved=(await client.from('family_profiles').select().eq('user_id','practice-user').single()).data;assert.equal(saved.display_name,'Friend');assert.equal(saved.avatar_preset,'teddyTrooper');assert.equal(saved.flair.banner,'first-checkin');
});
test('practice storage fails closed when storage isolation is unavailable',()=>{
 const context={sessionStorage:storage(),document:{addEventListener(){}}};Object.defineProperty(context,'localStorage',{value:storage(),configurable:false});context.window=context;
 runInNewContext(source,context);assert.equal(context.LucaDemo.ready,false);assert.equal(context.localStorage.length,0);
});

test('offline practice navigation cannot consult or return the cached production app',async()=>{
 const listeners=new Map();let cacheReads=0,response;
 runInNewContext(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),{URL,Response,importScripts(){},self:{location:{origin:'https://example.test'},addEventListener:(type,callback)=>listeners.set(type,callback)},fetch:()=>Promise.reject(new Error('Synthetic offline')),caches:{match(){cacheReads++;return Promise.resolve(new Response('REAL APP SENTINEL'));}}});
 listeners.get('fetch')({request:{url:'https://example.test/Lucas-Growth-Guide/demo.html',method:'GET',mode:'navigate'},respondWith:promise=>response=promise});
 const body=await (await response).text();assert.match(body,/Practice mode is offline/);assert.doesNotMatch(body,/REAL APP SENTINEL/);assert.equal(cacheReads,0);
});
