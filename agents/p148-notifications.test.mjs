import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
require('./sleep-inference.js');require('./sleep-data.js');require('./bottle-rhythm.js');
const rules=require('./notification-rules.js');
const device={enabled:true,feed_enabled:true,timezone:'America/New_York',quiet_start:'21:00',quiet_end:'06:00'};
const feed=(id,at)=>({id,at,oz:8,babyId:'test-baby'});
test('P149: old inferred bedtime cannot pause every future feed; explicit ongoing sleep stays paused',()=>{
 const rows=[feed('last','2026-10-19T11:00:00-04:00'),{id:'old',at:'2026-10-17T21:10:00-04:00',notes:'Down for the night at 9:10 pm',tags:['sleep']}];
 const now='2026-10-19T14:00:00-04:00';assert.equal(rules.feedReminder(rows,device,now).key,'feed:last');
 const active={id:'active',at:rows[1].at,tags:['sleep'],details:{sleep:{kind:'night',status:'in_progress',start_at:rows[1].at,end_at:null}}};
 assert.equal(rules.feedReminder([...rows,active],device,now),null);
 assert.equal(rules.asleep([rows[1]],'2026-10-18T06:00:00-04:00','America/New_York'),true);
});
test('P148: one feed key uses the last bottle; a newly logged bottle cancels the old reminder',()=>{
 const rows=[feed('first','2026-10-19T08:00:00-04:00'),feed('last','2026-10-19T11:00:00-04:00')];
 assert.equal(rules.feedReminder(rows,device,'2026-10-19T14:00:00-04:00').key,'feed:last');
 assert.equal(rules.feedReminder([...rows,feed('new','2026-10-19T13:59:00-04:00')],device,'2026-10-19T14:00:00-04:00'),null);
 assert.equal(rules.feedReminder(rows,device,'2026-10-19T17:00:00-04:00'),null,'stale historical bottles must not cause an overdue alert');
});
test('P148: quiet hours cross midnight in the recipient time zone including daylight saving',()=>{
 assert.equal(rules.quiet(device,'2026-10-20T01:00:00Z'),true);assert.equal(rules.quiet(device,'2026-10-20T10:00:00Z'),false);
 assert.equal(rules.quiet(device,'2026-11-01T05:30:00Z'),true);assert.equal(rules.quiet(device,'2026-11-01T06:30:00Z'),true);
 assert.equal(rules.quiet({...device,timezone:'Asia/Tokyo'},'2026-10-19T14:00:00Z'),true);
 assert.equal(rules.quiet({...device,timezone:'broken'},Date.now()),true);
 assert.equal(rules.quiet({...device,quiet_start:'06:00',quiet_end:'06:00'},Date.now()),true);
});
test('P148: recorded naps and unresolved night sleep suppress reminders until their real wake time',()=>{
 const rows=[feed('first','2026-10-19T08:00:00-04:00'),feed('last','2026-10-19T11:00:00-04:00')];
 const nap={id:'nap',at:'2026-10-19T13:00:00-04:00',tags:['sleep'],details:{sleep:{kind:'nap',status:'in_progress',start_at:'2026-10-19T13:00:00-04:00',end_at:null}}};
 assert.equal(rules.feedReminder([...rows,nap],device,'2026-10-19T14:00:00-04:00'),null);
 const completed={...nap,details:{sleep:{...nap.details.sleep,status:'complete',end_at:'2026-10-19T14:10:00-04:00'}}};
 assert.equal(rules.feedReminder([...rows,completed],device,'2026-10-19T14:11:00-04:00').key,'feed:last');
 assert.equal(rules.feedReminder(rows,{...device,feed_enabled:false},'2026-10-19T14:00:00-04:00'),null);
});
test('P148: server sleep inference resolves local clock notes rather than assuming UTC',()=>{
 const rows=[{id:'bed',at:'2026-10-18T22:15:00-04:00',notes:'Down for the night at 10:15 pm',tags:['sleep']},{id:'wake',at:'2026-10-19T07:18:00-04:00',notes:'Slept last night until 7 am',tags:['other']}];
 const sessions=globalThis.LucaSleep.resolve(rows,+new Date('2026-10-19T15:00:00Z'),'America/New_York');
 assert.equal(sessions.get('bed').minutes,525);assert.equal(sessions.get('bed').end,+new Date('2026-10-19T07:00:00-04:00'));
 const notes=[{id:'nap',at:'2026-10-19T15:05:00-04:00',notes:'Napped 2–3 pm',tags:['sleep']}];
 assert.equal(globalThis.LucaSleep.resolve(notes,+new Date('2026-10-19T16:00:00-04:00'),'America/New_York').get('nap').start,+new Date('2026-10-19T14:00:00-04:00'));
});
test('P148: explicit server time zones preserve genuine daytime bottle spacing',()=>{
 const rows=[feed('one','2026-10-19T16:00:00-04:00'),feed('two','2026-10-19T19:45:00-04:00')];
 assert.equal(globalThis.LucaBottleRhythm.estimate(rows,{now:+new Date('2026-10-20T01:00:00Z'),timeZone:'America/New_York'}).minutes,225);
});
test('P148: checkout links reject scripts, credentials, local networks and misleading push-provider hosts',()=>{
 assert.equal(rules.safeProductURL('https://www.example.com/formula?size=32'), 'https://www.example.com/formula?size=32');
 for(const link of ['javascript:alert(1)','data:text/html,hi','http://store.example/x','https://user:pass@store.example/x','https://127.0.0.1/x','https://[::1]/','https://localhost/x','https://router.local/x'])assert.equal(rules.safeProductURL(link),null,link);
 assert.equal(rules.validPushEndpoint('https://web.push.apple.com/QFakeTestEndpoint'),true);
 for(const endpoint of ['https://push.apple.com.attacker.example/send','https://localhost/send','http://web.push.apple.com/send','https://web.push.apple.com@attacker.example/send'])assert.equal(rules.validPushEndpoint(endpoint),false,endpoint);
});
test('P148: service worker always displays a push and opens only validated checkout links or the family app',async()=>{
 const listeners={},shown=[],opened=[];const context={URL,console,Promise,Number,String,Uint8Array,globalThis:null};context.self=context;context.globalThis=context;context.importScripts=()=>{};context.LucaNotificationRules=rules;
 context.registration={scope:'https://app.example/family/',showNotification:async(...args)=>shown.push(args)};context.navigator={};context.clients={openWindow:async url=>opened.push(url),matchAll:async()=>[]};context.addEventListener=(name,fn)=>listeners[name]=fn;
 vm.runInNewContext(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),context);
 let wait;listeners.push({data:{json:()=>({title:'Formula low',body:'Tap to open',data:{url:'https://store.example/formula'}})},waitUntil:p=>{wait=p;}});await wait;assert.equal(shown.length,1);
 listeners.notificationclick({notification:{data:{url:'https://store.example/formula'},close(){}},waitUntil:p=>{wait=p;}});await wait;assert.equal(opened.at(-1),'https://store.example/formula');
 listeners.notificationclick({notification:{data:{url:'javascript:alert(1)'},close(){}},waitUntil:p=>{wait=p;}});await wait;assert.equal(opened.at(-1),'https://app.example/family/');
 listeners.push({data:{json(){throw Error('broken');}},waitUntil:p=>{wait=p;}});await wait;assert.equal(shown.length,2);
 const focused=[],posted=[];context.clients.matchAll=async()=>[{url:'https://app.example/unrelated/',focus(){throw Error('must not replace another app');}},{url:'https://app.example/family/demo.html',focus(){throw Error('must not replace practice');}},{url:'https://app.example/family/index.html',focus:async()=>focused.push(true),postMessage:message=>posted.push(message)}];
 listeners.notificationclick({notification:{data:{url:'https://app.example/family/?notify=chat&family=fixture'},close(){}},waitUntil:p=>{wait=p;}});await wait;assert.equal(focused.length,1);assert.equal(posted[0].type,'luca:notification-open');assert.equal(opened.length,2,'an existing app is focused without reloading its draft or another app');
});
