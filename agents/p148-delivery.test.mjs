import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';

function fixture(){
 const now=+new Date('2026-10-19T14:00:00-04:00'),iso=minutes=>new Date(now+minutes*60000).toISOString(),sent=[];
 const family='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
 const device={id:'device-a',family_id:family,baby_id:'baby-a',user_id:'user-a',endpoint:'https://web.push.apple.com/synthetic-a',p256dh:'fixture',auth:'fixture',enabled:true,feed_enabled:true,chat_enabled:true,supplies_enabled:true,previews:false,quiet_all:false,quiet_start:'21:00',quiet_end:'06:00',timezone:'America/New_York',created_at:iso(-120),settings_at:iso(-120),last_chat_read_at:iso(-120),last_chat_notified_at:iso(-120),active_view:null};
 const tables={
  app_notification_config:[{id:true,app_url:'https://app.example/family/',dispatch_token:'synthetic-worker-token',vapid_public:'synthetic-public',vapid_private:'synthetic-private'}],
  push_devices:[device,{...device,id:'device-b',family_id:other,baby_id:'baby-b',user_id:'user-b',endpoint:'https://web.push.apple.com/synthetic-b'},{...device,id:'device-revoked',user_id:'removed',endpoint:'https://web.push.apple.com/synthetic-revoked'}],
  family_members:[{family_id:family,user_id:'user-a'},{family_id:family,user_id:'user-c'},{family_id:other,user_id:'user-b'}],
  babies:[{id:'baby-a',family_id:family,name:'Fixture A'},{id:'baby-b',family_id:other,name:'Fixture B'}],
  baby_events:[{id:'bottle-a',baby_id:'baby-a',event_time:iso(-180),amount_oz:8,tags:[],details:{}}],
  notification_jobs:[{id:'j-own',family_id:family,kind:'chat',source_id:'own',actor_id:'user-a',happened_at:iso(-.8),expires_at:iso(10)},{id:'j-chat-1',family_id:family,kind:'chat',source_id:'c1',actor_id:'user-c',happened_at:iso(-.6),expires_at:iso(10)},{id:'j-chat-2',family_id:family,kind:'chat',source_id:'c2',actor_id:'user-c',happened_at:iso(-.2),expires_at:iso(10)},{id:'j-supply',family_id:family,kind:'supply',source_id:'supply-a',actor_id:'user-c',happened_at:iso(-.7),expires_at:iso(60)}],
  family_chat_messages:[{id:'own',family_id:family,sender_id:'user-a',body:'Own note',created_at:iso(-.8)},{id:'c1',family_id:family,sender_id:'user-c',body:'PRIVATE FIXTURE TEXT',created_at:iso(-.6)},{id:'c2',family_id:family,sender_id:'user-c',body:'PRIVATE FIXTURE TEXT',created_at:iso(-.2)}],
  family_profiles:[{family_id:family,user_id:'user-c',display_name:'Fixture member'}],
  family_supplies:[{id:'supply-a',family_id:family,name:'Formula',status:'low',low_since:iso(-.7),product_url:'https://store.example/formula',buyer_user_id:'user-a'}],notification_deliveries:[]
 };
 let handler,careReads=0,raceBottle=false;
 const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 const context={URL,Request,Response,AbortSignal,Intl,console,Uint8Array,Date:class extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}},Deno:{env:{get:key=>key==='SUPABASE_URL'?'https://backend.example':'synthetic-service-token'},serve:fn=>{handler=fn;}},webpush:{generateRequestDetails:(_sub,payload)=>({headers:{},body:payload})},fetch:async(url,options={})=>{
  const u=new URL(url);
  if(u.hostname==='web.push.apple.com'){sent.push({endpoint:u.href,...JSON.parse(options.body)});return response({},201);}
  if(u.pathname==='/auth/v1/user')return response({id:options.headers.Authorization==='Bearer foreign'?'user-b':'user-a'});
  const table=u.pathname.replace('/rest/v1/',''),body=options.body?JSON.parse(options.body):null;
  if(table==='rpc/claim_notification_delivery'){const old=tables.notification_deliveries.find(r=>r.device_id===body.target_device&&r.event_key===body.target_key);if(old)return response(null);const row={id:'receipt-'+tables.notification_deliveries.length,device_id:body.target_device,event_key:body.target_key,state:'sending'};tables.notification_deliveries.push(row);return response(row.id);}
  if(table==='baby_events'&&++careReads===2&&raceBottle)tables.baby_events.push({id:'new-bottle',baby_id:'baby-a',event_time:iso(-1),amount_oz:8,tags:[],details:{}});
  let rows=tables[table]||[];
  rows=rows.filter(row=>[...u.searchParams].every(([k,v])=>{if(['select','order','limit','offset'].includes(k))return true;if(v.startsWith('eq.'))return String(row[k])===v.slice(3);if(v.startsWith('gte.'))return row[k]>=v.slice(4);if(v.startsWith('gt.'))return row[k]>v.slice(3);if(v.startsWith('in.('))return v.slice(4,-1).split(',').includes(row[k]);return true;}));
  const order=u.searchParams.get('order');if(order){const [key,direction]=order.split('.');rows=[...rows].sort((a,b)=>String(a[key]).localeCompare(String(b[key]))*(direction==='desc'?-1:1));}
  if(options.method==='PATCH'){for(const row of rows)Object.assign(row,body);}
  const start=+(u.searchParams.get('offset')||0),limit=+(u.searchParams.get('limit')||rows.length);return response(rows.slice(start,start+limit));
 }};context.globalThis=context;
 vm.createContext(context);
 for(const name of ['sleep-inference.js','sleep-data.js','bottle-rhythm.js','notification-rules.js'])vm.runInContext(readFileSync(new URL(name,import.meta.url),'utf8'),context);
 const source=readFileSync(new URL('../supabase/functions/push-notifications/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');vm.runInContext(stripTypeScriptTypes(source),context);
 const call=(body,headers={})=>handler(new Request('https://backend.example/functions/v1/push-notifications',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)}));
 return {sent,tables,device,family,other,iso,race(){raceBottle=true;},call,dispatch:()=>call({action:'dispatch'},{'x-notification-worker':'synthetic-worker-token'})};
}
test('P148: dispatcher sends one feed, one grouped chat and one designated supply alert, then deduplicates retries',async()=>{
 const f=fixture(),result=await f.dispatch();assert.equal(result.status,200);assert.equal(f.sent.length,3);assert(f.sent.every(n=>n.endpoint.endsWith('/synthetic-a')));assert.deepEqual(new Set(f.sent.map(n=>n.data.kind)),new Set(['feed','chat','supply']));
 const chat=f.sent.find(n=>n.data.kind==='chat');assert.equal(chat.body,'2 new family messages.');assert(!JSON.stringify(chat).includes('PRIVATE FIXTURE TEXT'));assert.equal(f.sent.find(n=>n.data.kind==='supply').data.url,'https://store.example/formula');
 assert.equal(f.tables.push_devices.find(d=>d.id==='device-revoked').enabled,false);await f.dispatch();assert.equal(f.sent.length,3);
});
test('P148: logged sleep and a restocked product suppress their pending reminders',async()=>{
 const f=fixture();f.tables.baby_events.push({id:'sleep',baby_id:'baby-a',event_time:f.iso(-20),tags:['sleep'],details:{sleep:{kind:'nap',status:'in_progress',start_at:f.iso(-20),end_at:null}}});f.tables.family_supplies[0].status='good';await f.dispatch();assert.deepEqual(f.sent.map(n=>n.data.kind),['chat']);
});
test('P149: an unresolvable legacy wake clock does not crash feed, chat and supply dispatch',async()=>{
 const f=fixture();
 f.tables.baby_events.push({id:'legacy-note',baby_id:'baby-a',event_time:'2026-10-19T02:00:00-04:00',tags:['other'],note:'Fell asleep at 9 pm and woke at 7 am',details:{}});
 const result=await f.dispatch();assert.equal(result.status,200);assert(f.sent.some(n=>n.data.kind==='chat'));assert(f.sent.some(n=>n.data.kind==='supply'));
});
test('P148: a bottle arriving between calculation and send cancels the stale feed alert',async()=>{
 const f=fixture();f.race();await f.dispatch();assert(!f.sent.some(n=>n.data.kind==='feed'));assert(f.sent.some(n=>n.data.kind==='chat'));
});
test('P148: visible chat and another designated buyer suppress the recipient-specific alerts',async()=>{
 const f=fixture();f.device.active_view='chat';f.device.last_seen_at=f.iso(0);f.tables.family_supplies[0].buyer_user_id='user-c';await f.dispatch();assert.deepEqual(f.sent.map(n=>n.data.kind),['feed']);
});
test('P148: worker authentication and family membership protect config; clients receive only a public key',async()=>{
 const f=fixture();assert.equal((await f.call({action:'dispatch'})).status,401);assert.equal((await f.call({action:'config',family:f.family},{Authorization:'Bearer foreign'})).status,403);const result=await f.call({action:'config',family:f.family},{Authorization:'Bearer own'});assert.deepEqual(await result.json(),{publicKey:'synthetic-public',ready:true});assert.equal(f.sent.length,0);
});
test('P150: selected care categories send once; own, deleted, foreign-baby and disabled entries stay quiet',async()=>{
 const f=fixture();f.device.care_types=['diaper'];
 const add=(id,tags,extra={})=>{f.tables.baby_events.push({id,baby_id:'baby-a',created_by:'user-c',event_time:f.iso(-1),tags,...extra});f.tables.notification_jobs.push({id:'job-'+id,family_id:f.family,kind:'care',source_id:id,actor_id:extra.created_by||'user-c',happened_at:f.iso(-1),expires_at:f.iso(10)});};
 add('diaper',['pee']);add('bottle',[],{amount_oz:8});add('own',['poop'],{created_by:'user-a'});add('foreign',['pee'],{baby_id:'baby-b'});add('deleted',['pee']);f.tables.baby_events=f.tables.baby_events.filter(e=>e.id!=='deleted');
 assert.equal((await f.dispatch()).status,200);assert.deepEqual(f.sent.filter(n=>n.data.kind==='care').map(n=>n.data.event),['diaper']);assert.match(f.sent.find(n=>n.data.kind==='care').data.url,/notify=history/);await f.dispatch();assert.equal(f.sent.filter(n=>n.data.kind==='care').length,1);
 f.device.care_types=[];add('new-diaper',['poop']);await f.dispatch();assert.equal(f.sent.filter(n=>n.data.kind==='care').length,1);
});
test('P150: all-alert quiet hours suppress care and turning off existing categories prevents their delivery',async()=>{
 const f=fixture();Object.assign(f.device,{care_types:['sleep'],feed_enabled:false,chat_enabled:false,supplies_enabled:false,quiet_all:true,quiet_start:'13:00',quiet_end:'15:00'});
 f.tables.baby_events.push({id:'sleep-new',baby_id:'baby-a',created_by:'user-c',tags:['sleep'],event_time:f.iso(-1)});f.tables.notification_jobs.push({kind:'care',family_id:f.family,source_id:'sleep-new',actor_id:'user-c',happened_at:f.iso(-1),expires_at:f.iso(10)});
 await f.dispatch();assert.equal(f.sent.length,0);f.device.quiet_all=false;await f.dispatch();assert.deepEqual(f.sent.map(n=>n.data.kind),['care']);
});
