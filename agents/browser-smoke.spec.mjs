import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";

test('P145: save bedtime with TBD fields, finish the same shared record next morning, and clear red reminders',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});await page.clock.setFixedTime(new Date('2026-10-20T21:30:00Z'));
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('[data-quick="nap"]').click();await page.locator('[data-sleep-kind="night"]').click();await expect(page.locator('#sleepOngoing')).toBeChecked();await expect(page.locator('#sleepEnd')).toBeDisabled();await expect(page.locator('#sleepEntryWakeups')).toBeDisabled();await expect(page.locator('#sleepEnd')).toHaveValue('');await page.locator('#sleepCaregiver').fill('Sam and Maddie');await page.locator('#sleepSave').click();await expect(page.locator('#unfinishedSleepCard')).toBeVisible();await expect(page.locator('#timeline .sleepPending')).toHaveCount(1);await expect(page.locator('#timeline .chips')).toContainText('Sam');await expect(page.locator('#timeline .chips')).toContainText('Maddie');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')||'[]').length)).toBe(1);const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events'))[0]);expect(first.caregivers).toEqual(['Sam','Maddie']);expect(first.details.sleep.end_at).toBeNull();expect(first.details.sleep.wakeups).toBeNull();await page.locator('#unfinishedSleepCard').scrollIntoViewIfNeeded();await page.screenshot({animations:'disabled',path:'test-results/p145-ongoing-night-390.png'});
 await page.clock.setFixedTime(new Date('2026-10-21T08:00:00Z'));await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await expect(page.locator('#unfinishedSleepCard')).toBeVisible();await expect(page.locator('#timeline .sleepPending')).toHaveCount(0);await page.locator('[data-finish-sleep]').click();await expect(page.locator('#sleepOngoing')).not.toBeChecked();await expect(page.locator('#sleepEnd')).toBeEnabled();await expect(page.locator('#sleepCaregiver')).toHaveValue('Sam, Maddie');await page.locator('#sleepEnd').fill('2026-10-21T07:00');await page.locator('#sleepEntryWakeups').fill('3');await page.locator('#sleepEntryAwake').fill('20');await page.locator('#sleepSave').click();await expect(page.locator('#unfinishedSleepCard')).toBeHidden();
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await expect(page.locator('#unfinishedSleepCard')).toBeHidden();const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')));expect(rows).toHaveLength(1);expect(rows[0].id).toBe(first.id);expect(rows[0].details.sleep.wakeups).toBe(3);expect(rows[0].details.sleep.status).toBeUndefined();await page.locator('nav [data-tab="insights"]').click();await expect(page.locator('#sleepTrends')).toContainText('9h 10m');await expect(page.locator('#sleepTrends')).toContainText('3 / night');
});

test('P145: unfinished sleep saves offline, keeps unknown counts and is editable from History',async({page})=>{
 await page.setViewportSize({width:320,height:740});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});await page.clock.setFixedTime(new Date('2026-10-20T22:00:00Z'));
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('[data-quick="nap"]').click();await page.locator('[data-sleep-kind="night"]').click();await page.locator('#sleepCaregiver').fill('Sam & Maddie');await page.screenshot({animations:'disabled',path:'test-results/p145-tbd-editor-320.png'});await page.evaluate(()=>window.syntheticOffline=true);await page.locator('#sleepSave').click();await expect(page.locator('#unfinishedSleepCard')).toBeVisible();await page.locator('#syncDot').click();await expect(page.locator('#syncDot')).toContainText('pending');await page.evaluate(()=>window.syntheticOffline=false);await page.locator('#syncDot').click();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('nav [data-tab="history"]').click();await page.locator('.historyDay summary').first().click();await expect(page.locator('.historyEvent.sleepPending')).toHaveCount(1);await page.locator('[data-history-edit]').click();await expect(page.locator('#sleepOngoing')).toBeChecked();await expect(page.locator('#sleepEntryWakeups')).toHaveValue('');await expect(page.locator('#sleepCaregiver')).toHaveValue('Sam, Maddie');
});

test('P144: caregiver buttons add and remove people while creating and editing the same event',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('#moreBtn').click();
 const person=name=>page.locator('#manualComposer [data-person="'+name+'"]');await page.locator('#manualComposer [data-tag="bath"]').click();await person('Sam').click();await person('Luca').click();await expect(person('Sam')).toHaveAttribute('aria-pressed','true');await expect(person('Luca')).toHaveAttribute('aria-pressed','true');await expect(person('Sam')).toHaveClass(/on/);await page.locator('#saveEntry').click();await expect(page.locator('#timeline .entry')).toHaveCount(1);await expect(page.locator('#timeline .chips')).toContainText('Sam');await expect(page.locator('#timeline .chips')).toContainText('Luca');
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('#timeline [data-edit]').click();await expect(person('Sam')).toHaveAttribute('aria-pressed','true');await expect(person('Luca')).toHaveAttribute('aria-pressed','true');await person('Nona').click();await expect(person('Sam')).toHaveClass(/on/);await expect(person('Luca')).toHaveClass(/on/);await expect(person('Nona')).toHaveClass(/on/);await person('Luca').click();await expect(person('Luca')).toHaveAttribute('aria-pressed','false');await expect(person('Sam')).toHaveAttribute('aria-pressed','true');await page.screenshot({animations:'disabled',path:'test-results/p144-caregivers-edit-390.png'});await page.locator('#saveEntry').click();
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')));expect(rows.filter(r=>r.tags?.includes('bath'))).toHaveLength(1);expect(rows.find(r=>r.tags?.includes('bath')).caregivers).toEqual(['Sam','Nona']);
});

test('P144: age chapters offer a full deck and stable daily selection',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.clock.setFixedTime(new Date('2026-10-20T16:00:00Z'));await page.route('https://znhqaqvocexjsnklnqre.supabase.co/**',r=>r.abort());await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.locator('nav [data-tab="insights"]').click();
 for(const month of [9,10,11,12]){await page.locator('[data-chapter="'+month+'"]').click();const ideas=[];for(let i=0;i<3;i++){ideas.push(await page.locator('#ageDiscovery p').first().innerText());await page.locator('#ageIdeaNext').click();}expect(new Set(ideas).size).toBe(3);expect(await page.locator('#ageDiscovery p').first().innerText()).toBe(ideas[0]);await page.locator('#ageIdeaPrevious').click();expect(await page.locator('#ageDiscovery p').first().innerText()).toBe(ideas[2]);}
 await page.locator('[data-chapter="10"]').click();const daily=await page.locator('#ageDiscovery p').first().innerText();await page.reload();await page.locator('nav [data-tab="insights"]').click();await page.locator('[data-chapter="10"]').click();expect(await page.locator('#ageDiscovery p').first().innerText()).toBe(daily);await page.locator('#ageIdeaNext').scrollIntoViewIfNeeded();await page.screenshot({animations:'disabled',path:'test-results/p144-age-deck-320.png'});
});

test('P144: personal updates keep stars scoped, preserve read marks and link to the correct chart',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{localStorage.setItem('luca-caregiver','Sam');if(!localStorage.getItem('qa-profiles'))localStorage.setItem('qa-profiles',JSON.stringify([{family_id:'qa-family',user_id:'qa-user',display_name:'Sam',avatar_preset:'dadasDude',flair:{unlocked:['first-checkin','block-party'],banner:'first-checkin'}}]));if(!localStorage.getItem('qa-remote-events'))localStorage.setItem('qa-remote-events',JSON.stringify(['Sam','KJ'].map((person,i)=>({id:'qa-star-'+i,baby_id:'qa-baby',family_id:'qa-family',event_time:new Date().toISOString(),event_type:'other',tags:['stars'],caregivers:[person],created_by:'someone-else',details:{starChart:{version:1,action:'award',person,delta:i?7:3,reason:person==='Sam'?'Sam private receipt':'KJ private receipt'}}}))));});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('#personalUpdatesButton').click();await expect(page.locator('#personalUpdatesList')).toContainText('Fresh Recruit');await expect(page.locator('#personalUpdatesList')).toContainText('Block Party');await expect(page.locator('#personalUpdatesList')).toContainText('Sam private receipt');await expect(page.locator('#personalUpdatesList')).not.toContainText('KJ private receipt');await page.screenshot({animations:'disabled',path:'test-results/p144-personal-updates-390.png'});
 await page.locator('#updatesLab').click();await expect(page.locator('#personalUpdatesList')).toContainText('Fresh out of the chaos lab');await page.screenshot({animations:'disabled',path:'test-results/p144-chaos-lab-390.png'});await page.locator('#markUpdatesRead').click();await expect(page.locator('#personalUpdatesBadge')).toBeHidden();await page.locator('#closePersonalUpdates').click();await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('#personalUpdatesButton').click();await expect(page.locator('#personalUpdatesList')).toContainText('Fresh Recruit');await expect(page.locator('#personalUpdatesBadge')).toBeHidden();await page.locator('#personalUpdatesList [data-update-id="stars:qa-star-0"]').click();await expect(page.locator('#starsView')).toHaveClass(/active/);await expect(page.locator('#starPerson')).toHaveValue('Sam');await expect(page.locator('#starBalance')).toHaveText('3');await page.locator('#starReason').fill('A fresh receipt');await page.locator('#starAward').click();await expect(page.locator('#personalUpdatesBadge')).toHaveText('1');await page.locator('#personalUpdatesButton').click();await expect(page.locator('#personalUpdatesList .unread')).toHaveCount(1);await expect(page.locator('#personalUpdatesList .unread')).toContainText('A fresh receipt');
 await page.evaluate(()=>{localStorage.setItem('luca-caregiver','Nona');window.dispatchEvent(new Event('luca:session-changed'));});await expect(page.locator('#personalUpdatesIdentity')).toContainText('For Nona');await expect(page.locator('#personalUpdatesList')).not.toContainText('Sam private receipt');await page.evaluate(()=>window.dispatchEvent(new CustomEvent('luca:personal-achievements',{detail:{family:'wrong-family',baby:'qa-baby',user:'qa-user',cards:[{id:'bad',name:'Foreign card'}]}})));await expect(page.locator('#personalUpdatesList')).not.toContainText('Foreign card');
});

test('P143: chat keeps compact messages and composer visible, preserves reading position, supports photo removal',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);
 await page.addInitScript(()=>{
  localStorage.setItem('qa-profiles',JSON.stringify([{family_id:'qa-family',user_id:'qa-user',display_name:'Sam',avatar_preset:'dadasDude',flair:{banner:'weekly-mvp',unlocked:['weekly-mvp']}}]));
  if(!localStorage.getItem('qa-chat'))localStorage.setItem('qa-chat',JSON.stringify(Array.from({length:18},(_,i)=>({id:'compact-'+i,sender_id:'qa-user',body:'Family moment '+(18-i)+' — Luca is running this household.',created_at:new Date(Date.now()-i*60000).toISOString()}))));
 });
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.locator('nav [data-tab="chat"]').click();
 await expect(page.locator('.familyChatMessage')).toHaveCount(18);await expect(page.locator('#familyChatFeed')).toContainText("Dada's Dude");
 const frame=await page.evaluate(()=>{const feed=document.querySelector('#familyChatFeed'),r=feed.getBoundingClientRect(),nav=document.querySelector('nav').getBoundingClientRect(),composer=document.querySelector('.chatComposer').getBoundingClientRect();return {height:r.height,bottom:r.bottom,composer:composer.y,composerBottom:composer.bottom,nav:nav.y,overflow:document.documentElement.scrollWidth>innerWidth,visible:[...feed.children].filter(x=>{const b=x.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom}).length,atBottom:feed.scrollHeight-feed.clientHeight-feed.scrollTop};});
 expect(frame.height).toBeGreaterThan(450);expect(frame.visible).toBeGreaterThanOrEqual(4);expect(frame.composerBottom).toBeLessThanOrEqual(frame.nav);expect(frame.atBottom).toBeLessThan(5);expect(frame.overflow).toBe(false);
 await expect(page.locator('#familyChatFeed .callingCard').first()).toBeVisible();expect((await page.locator('#familyChatFeed .callingCard').first().boundingBox()).height).toBeLessThan(26);
 await page.locator('#familyChatFeed').evaluate(el=>{el.scrollTop=0;el.firstElementChild.dataset.unchanged='yes';});await page.locator('nav [data-tab="chat"]').click();await expect.poll(()=>page.locator('#familyChatFeed').evaluate(el=>el.scrollTop)).toBe(0);await expect(page.locator('#familyChatFeed [data-unchanged="yes"]')).toHaveCount(1);
 await expect(page.locator('#chatLatest')).toBeVisible();await page.locator('#chatLatest').click();await expect(page.locator('#chatLatest')).toBeHidden();
 await page.locator('#familyChatText').fill('A compact message\nwith a second line');await page.locator('#familyChatSend').click();await expect(page.locator('.chatBody').last()).toHaveText('A compact message\nwith a second line');await expect(page.locator('#familyChatText')).toHaveValue('');
 await page.locator('#familyChatMedia').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('synthetic image')});await expect(page.locator('#familyChatMediaPreview')).toContainText('test.png');await page.locator('#familyChatRemove').click();await expect(page.locator('#familyChatMediaPreview')).toBeEmpty();
 await page.screenshot({animations:'disabled',path:'test-results/p143-chat-390.png'});
 await page.setViewportSize({width:320,height:480});await page.locator('#familyChatText').fill('Keyboard-sized viewport');await expect.poll(()=>page.locator('#familyChatFeed').evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThan(5);const send=await page.locator('#familyChatSend').boundingBox();expect(send.y+send.height).toBeLessThanOrEqual(480);expect(send.x+send.width).toBeLessThanOrEqual(320);await page.screenshot({animations:'disabled',path:'test-results/p143-chat-320.png'});
});

test('P143: Insights shows real log patterns and browseable age chapters without Teddy',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);
 await page.addInitScript(()=>{if(!localStorage.getItem('qa-remote-events')){const rows=[];for(let i=0;i<6;i++){const d=new Date();d.setDate(d.getDate()-i);d.setHours(8,0,0,0);rows.push({id:'insight-'+i,baby_id:'qa-baby',family_id:'qa-family',event_time:d.toISOString(),amount_oz:8,event_type:'feeding',tags:[],caregivers:['Sam','Luca'],notes:'Shared bottle'});}localStorage.setItem('qa-remote-events',JSON.stringify(rows));}});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('nav [data-tab="insights"]').click();
 await expect(page.locator('#insightTrends')).toContainText('The usual bottle');await expect(page.locator('#insightTrends')).toContainText('8 oz');await expect(page.locator('#insightTrends')).toContainText('The tiny pit crew');await expect(page.locator('.sparkDay')).toHaveCount(7);
 await page.locator('[data-chapter="10"]').click();await expect(page.locator('#ageDiscovery')).toContainText('cause-and-effect');await expect(page.locator('#ageIdeaCount')).toContainText('of 3');await expect(page.locator('[data-chapter="10"]')).toHaveAttribute('aria-pressed','true');expect(await page.locator('[data-chapter="10"]').evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe(await page.locator('[data-chapter="9"]').evaluate(el=>getComputedStyle(el).backgroundColor));
 await page.locator('#insightTrends').scrollIntoViewIfNeeded();await page.screenshot({animations:'disabled',path:'test-results/p143-insights-patterns-390.png'});await page.locator('[data-chapter="11"]').click();await expect(page.locator('#ageDiscovery')).toContainText('Tiny gestures');await page.locator('#ageDiscovery').scrollIntoViewIfNeeded();await page.screenshot({animations:'disabled',path:'test-results/p143-insights-chapters-390.png'});
});

test("app loads and core tabs are reachable without a signed-in session",async({page})=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await expect(page.locator("body")).toBeVisible();
 await expect(page.locator("#syncDot")).not.toHaveText("Checking family sync…");
 await expect(page.locator('nav button[data-tab="chat"]')).toBeVisible();
 await page.locator('nav button[data-tab="chat"]').click();
 await expect(page.locator("#chatView")).toHaveClass(/active/);
 await expect(page.locator("#familyChatStatus")).toContainText(/sign in|family sync/i);
 await page.locator("#navMore").click();
 await expect(page.locator("#sideMenu")).toHaveClass(/open/);
 await page.locator("#menuFamily").click();
 await expect(page.locator("#profileView")).toHaveClass(/active/);
 await expect(page.locator("#profileStatus")).toContainText(/sign in|family sync/i);
 await expect(page.locator('a[href="./emergency.html"]')).toHaveCount(1);
});

test("emergency log page remains available without external services",async({page})=>{
 await page.route("https://**/*",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/emergency.html",{waitUntil:"domcontentloaded"});
 await expect(page.locator("body")).toContainText(/emergency|offline/i);
});

test("emergency entry persists after reload and can be exported",async({page})=>{
 await page.goto("http://127.0.0.1:8765/emergency.html",{waitUntil:"domcontentloaded"});
 await page.locator("#who").fill("Test caregiver");
 await page.locator("#note").fill("Synthetic QA entry: 6 oz at 8:30");
 await page.locator("#save").click();
 await expect(page.locator("#entries")).toContainText("Synthetic QA entry: 6 oz at 8:30");
 await page.reload();
 await expect(page.locator("#entries")).toContainText("Synthetic QA entry: 6 oz at 8:30");
 const downloadPromise=page.waitForEvent("download");
 await page.locator("#export").click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toMatch(/\.json$/);
 const backup=JSON.parse(readFileSync(await download.path(),"utf8"));
 expect(backup.format).toBe("luca-emergency-log-v1");
 expect(backup.entries).toEqual(expect.arrayContaining([expect.objectContaining({caregiver:"Test caregiver",text:"Synthetic QA entry: 6 oz at 8:30",source:"emergency-local"})]));
});

test("emergency log refuses empty entries and preserves a saved entry when deletion is cancelled",async({page})=>{
 await page.goto("http://127.0.0.1:8765/emergency.html",{waitUntil:"domcontentloaded"});
 await page.locator("#save").click();
 await expect(page.locator("#notice")).toContainText("Write an event");
 await page.locator("#note").fill("Synthetic QA: wet diaper");
 await page.locator("#save").click();
 await expect(page.locator("#entries")).toContainText("Synthetic QA: wet diaper");
 page.once("dialog",dialog=>dialog.dismiss());
 await page.locator("#entries button").first().click();
 await expect(page.locator("#entries")).toContainText("Synthetic QA: wet diaper");
});

test("emergency page is available offline after service-worker installation",async({browser})=>{
 const context=await browser.newContext({serviceWorkers:"allow"});
 const page=await context.newPage();
 try{
  await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
  await page.evaluate(async()=>{
   if(!("serviceWorker" in navigator))throw new Error("Service workers unavailable");
   await navigator.serviceWorker.register("./sw.js");
   await navigator.serviceWorker.ready;
  });
  await expect.poll(async()=>page.evaluate(()=>navigator.serviceWorker.controller!==null),{timeout:15000}).toBe(true);
  await context.setOffline(true);
  await page.goto("http://127.0.0.1:8765/emergency.html",{waitUntil:"domcontentloaded"});
  await expect(page.locator("h1")).toContainText("emergency log");
 }finally{await context.close();}
});

test("emergency recovery review never silently syncs records",async({page})=>{
 let remoteWrites=0;
 await page.route("https://**/*",route=>{
  if(["POST","PUT","PATCH","DELETE"].includes(route.request().method()))remoteWrites++;
  return route.abort();
 });
 await page.goto("http://127.0.0.1:8765/emergency.html",{waitUntil:"domcontentloaded"});
 await page.locator("#note").fill("Synthetic QA: 7 oz bottle");
 await page.locator("#save").click();
 await page.locator("#review").click();
 await expect(page.locator("#recovery")).toBeVisible();
 await expect(page.locator("#reviewItems")).toContainText("Synthetic QA: 7 oz bottle");
 expect(remoteWrites).toBe(0);
});

test("sign-out and family tabs do not expose previous messages to a guest",async({page})=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await page.locator('nav button[data-tab="chat"]').click();
 await expect(page.locator("#familyChatStatus")).toContainText(/sign in|family sync/i);
 await expect(page.locator("#familyChatFeed")).toBeEmpty();
 await page.locator("#navMore").click();
  await expect(page.locator("#sideMenu")).toHaveClass(/open/);
  await page.locator("#menuFamily").click();
 await expect(page.locator("#familyProfileList")).toBeEmpty();
});

test("mobile-size viewport can navigate Family Chat, profiles, and emergency backup",async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 try{
  await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
  await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
  await page.locator('nav button[data-tab="chat"]').click();
  await expect(page.locator("#chatView")).toHaveClass(/active/);
  await page.locator("#navMore").click();
  await expect(page.locator("#sideMenu")).toHaveClass(/open/);
  await page.locator("#menuFamily").click();
  await expect(page.locator("#profileView")).toHaveClass(/active/);
  await page.goto("http://127.0.0.1:8765/emergency.html",{waitUntil:"domcontentloaded"});
  await expect(page.locator("#save")).toBeVisible();
  await expect(page.locator("#export")).toBeVisible();
 }finally{await context.close();}
});

test("reviewed emergency export includes only selected corrected entries",async({page})=>{
 await page.goto("http://127.0.0.1:8765/emergency.html",{waitUntil:"domcontentloaded"});
 for(const note of ["QA selected bottle","QA excluded diaper"]){
  await page.locator("#note").fill(note);
  await page.locator("#save").click();
 }
 await page.locator("#review").click();
 await page.locator('#reviewItems input[type="checkbox"]').first().check();
 await page.locator("#reviewItems textarea").first().fill("QA corrected bottle: 8 oz");
 const downloading=page.waitForEvent("download");
 await page.locator("#exportReviewed").click();
 const file=await downloading;
 const payload=JSON.parse(readFileSync(await file.path(),"utf8"));
 expect(payload.format).toBe("luca-emergency-reviewed-v1");
 expect(payload.entries).toHaveLength(1);
 expect(payload.entries[0]).toEqual(expect.objectContaining({text:"QA corrected bottle: 8 oz",reviewed:true}));
 await expect(page.locator("#notice")).toContainText("NOT been imported");
});

test("confirmed emergency deletion survives reload and does not appear in backup",async({page})=>{
 await page.goto("http://127.0.0.1:8765/emergency.html",{waitUntil:"domcontentloaded"});
 await page.locator("#note").fill("Synthetic QA: delete this entry");
 await page.locator("#save").click();
 page.once("dialog",dialog=>dialog.accept());
 await page.locator("#entries button").first().click();
 await expect(page.locator("#entries")).not.toContainText("Synthetic QA: delete this entry");
 await page.reload();
 await expect(page.locator("#entries")).not.toContainText("Synthetic QA: delete this entry");
 const downloading=page.waitForEvent("download");
 await page.locator("#export").click();
 const file=await downloading;
 const payload=JSON.parse(readFileSync(await file.path(),"utf8"));
 expect(payload.entries.some(entry=>entry.text==="Synthetic QA: delete this entry")).toBe(false);
});

test("phone layout keeps family forms full width and care dock out of the way",async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 try{
  await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
  await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
  for(const tab of ["chat","profile"]){
   if(tab==="profile"){await page.locator("#navMore").click();await page.locator("#menuFamily").click();}
    else await page.locator('nav button[data-tab="'+tab+'"]').click();
   await expect(page.locator("#careDock")).toBeHidden();
   const selector=tab==="chat"?"#familyChatText":"#profileName";
   const field=page.locator(selector);
   await expect(field).toBeVisible();
   const box=await field.boundingBox();
   expect(box).not.toBeNull();
   expect(box.x).toBeGreaterThanOrEqual(0);
   expect(box.x+box.width).toBeLessThanOrEqual(391);
  }
 }finally{await context.close();}
});


test("edited event displays saved description and keeps original message collapsible",async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("luca-log-v2",JSON.stringify([{id:"synthetic-edit-1",at:new Date().toISOString(),oz:null,tags:["sleep"],people:["Sam"],notes:"Nap ended at 6:15 PM",sourceText:"Currently went down for a nap at 5:10",source:"smart"}])));
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 const card=page.locator(".entry").filter({hasText:"Nap ended at 6:15 PM"}).first();
 await expect(card).toBeVisible();
 await expect(card.locator(".note").first()).toContainText("Nap ended at 6:15 PM");
 await expect(card.locator("details summary")).toContainText("Original message");
 await expect(card.locator("details")).not.toHaveAttribute("open",/./);
 await card.locator("details summary").click();
 await expect(card.locator("details")).toContainText("Currently went down for a nap at 5:10");
 await page.reload();
 await expect(page.locator(".entry").filter({hasText:"Nap ended at 6:15 PM"}).first()).toBeVisible();
});


test("P69 shows original-only notes directly and hides unnecessary original dropdown",async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("luca-log-v2",JSON.stringify([{id:"synthetic-note",at:new Date().toISOString(),oz:null,tags:["poop"],people:["Nona"],notes:"",sourceText:"Changed a diaper at 8 PM",source:"smart"}])));
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 const entry=page.locator(".entry").filter({hasText:"Changed a diaper at 8 PM"}).first();
 await expect(entry).toBeVisible();
 await expect(entry.locator(".note").first()).toContainText("Changed a diaper at 8 PM");
 await expect(entry.locator("details")).toHaveCount(0);
});


test("P87 runtime version agrees with displayed badge",async({page})=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await expect(page.locator("#patchBadge")).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>window.LUCA_PATCH)).toBe(await page.locator("#buildVersion").innerText());
});


test("P71 poop row tap opens care dock on iPhone",async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 try{
  await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
  await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
  await page.evaluate(()=>document.getElementById("bootCinematic")?.remove());
  await page.locator("#careHead").tap();
  await expect(page.locator("#careDock")).toHaveClass(/open/);
  await page.locator("#carePoop").tap();
  await expect(page.locator("#careDock")).toHaveClass(/open/);
 }finally{await context.close()}
});


test("P89 iPhone visual guard: drawer labels are readable and bottom dock fits",async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
 const page=await context.newPage();
 try{
  await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
  await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
  const nav=page.locator("nav[aria-label='Main navigation']");
  const navBox=await nav.boundingBox();
  expect(navBox).not.toBeNull();
  expect(navBox.height).toBeLessThan(125);
  expect(navBox.x).toBeGreaterThanOrEqual(0);
  expect(navBox.x+navBox.width).toBeLessThanOrEqual(391);
  const visibleNav=nav.locator("button:visible");
  await expect(visibleNav).toHaveCount(5);
  for(const button of await visibleNav.all()){
   const rect=await button.boundingBox();
   expect(rect.x).toBeGreaterThanOrEqual(navBox.x-1);
   expect(rect.x+rect.width).toBeLessThanOrEqual(navBox.x+navBox.width+1);
  }
  await page.locator("#navMore").click();
  await expect(page.locator("#sideMenu")).toHaveClass(/open/);
  const row=page.locator("#menuInsights");
  const colors=await row.evaluate(el=>({fg:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor,fill:getComputedStyle(el).webkitTextFillColor}));
  const parse=color=>{const values=String(color).match(/[0-9]+/g);return values&&values.length>=3?values.slice(0,3).map(Number):null};
  const fg=parse(colors.fill==="currentcolor"?colors.fg:colors.fill)||parse(colors.fg),bg=parse(colors.bg);
  expect(fg).not.toBeNull();expect(bg).not.toBeNull();
  const luminance=rgb=>rgb.map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
  const a=luminance(fg),b=luminance(bg);
  expect((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)).toBeGreaterThanOrEqual(4.5);
  await expect(row).toBeVisible();
 }finally{await context.close();}
});


test("P89 accessibility: magnified phone and larger text keep menu accessible",async({browser})=>{
 const context=await browser.newContext({viewport:{width:320,height:690},isMobile:true,hasTouch:true,deviceScaleFactor:3,reducedMotion:"reduce"});
 const page=await context.newPage();
 try{
  await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
  await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
  await page.addStyleTag({content:"html{font-size:125%!important}"});
  await page.locator("#navMore").click();
  await expect(page.locator("#sideMenu")).toHaveClass(/open/);
  for(const selector of ["#menuInsights","#menuFamily"]){
   const el=page.locator(selector);await expect(el).toBeVisible();
   const rect=await el.boundingBox();expect(rect.width).toBeGreaterThan(120);
   expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(321);
   const size=await el.evaluate(node=>parseFloat(getComputedStyle(node).fontSize));
   expect(size).toBeGreaterThanOrEqual(16);
  }
  await page.locator("#menuFamily").click();
  await expect(page.locator("#profileView")).toHaveClass(/active/);
  await expect(page.locator("#profileName")).toBeVisible();
 }finally{await context.close();}
});


for(const width of [320,375,390,430]) test(`P90 Watchdog: menu fits ${width}px phone`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:"reduce"});
 const page=await context.newPage();
 try{
  await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
  await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
  await page.locator("#navMore").click();
  await expect(page.locator("#sideMenu")).toHaveClass(/open/);
  for(const selector of ["#menuInsights","#menuFamily"]){
   const rect=await page.locator(selector).boundingBox();
   expect(rect).not.toBeNull();
   expect(rect.x).toBeGreaterThanOrEqual(-1);
   expect(rect.x+rect.width).toBeLessThanOrEqual(width+1);
  }
  await page.locator("#closeMenu").click();
  await expect(page.locator("#sideMenu")).not.toHaveClass(/open/);
 }finally{await context.close();}
});
test("P91 chat peek retries immediately when Family Sync becomes ready",async({page})=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await expect(page.locator("#drawerChatPreview")).toContainText("Connecting to Family Chat");
 const result=await page.evaluate(async()=>{
  let calls=0;
  const mock={from:()=>({select:()=>({eq:()=>({order:()=>({limit:async()=>{calls++;return {data:[],error:null}}})})})})};
  window.addEventListener("luca:chat-session-request",e=>e.detail({client:mock,family:"synthetic-family",user:"synthetic-user"}));
  window.dispatchEvent(new CustomEvent("luca:family-session-ready"));
  await new Promise(resolve=>setTimeout(resolve,100));
  return calls;
 });
 expect(result).toBe(1);
 await expect(page.locator("#drawerChatPreview")).toContainText("No messages yet");
});


test("P91 chat history renders even when profile lookup stalls",async({page})=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 const result=await page.evaluate(async()=>{
  const {mountFamilyChat}=await import("./agents/family-chat.js");
  const feed=document.createElement("div"),input=document.createElement("textarea"),send=document.createElement("button"),status=document.createElement("div");
  const client={from:table=>table==="family_chat_messages"?{select:()=>({eq:()=>({order:()=>({limit:async()=>({data:[{id:"synthetic-chat",sender_id:"someone-else",body:"Synthetic QA hello",created_at:"2026-01-01T00:00:00Z"}],error:null})})})})}:{select:()=>({eq:()=>new Promise(()=>{})})}};
  const dispose=mountFamilyChat({getClient:()=>client,getFamilyId:()=>"synthetic-family",getUser:()=>({id:"synthetic-user"}),feed,input,send,status});
  await new Promise(resolve=>setTimeout(resolve,200));
  const text=feed.textContent;
  dispose();
  return text;
 });
 expect(result).toContain("Synthetic QA hello");
});


test("P95 history always displays an explicit result, never a blank panel",async({page})=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await page.evaluate(()=>document.getElementById("bootCinematic")?.remove());
 await page.locator('nav [data-tab="history"]').click();
 await expect(page.locator("#historyView")).toHaveClass(/active/);
 await expect(page.locator("#history")).not.toBeEmpty();
 await expect(page.locator("#history .historyEmpty")).toContainText("Your story starts here.");
 await expect(page.locator("#historyCount")).toContainText("0 entries");
});


test("P95 family authentication does not falsely claim timeline synchronization",async({page})=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 const source=await page.locator("script").allTextContents();
 const app=source.join("\n");
 expect(app).toContain('timelineLoaded=await pullShared()');
 expect(app).toContain('const timelineLoaded=await pullShared()');
 expect(app).toContain('function pullShared(){return careEvents.refresh()}');
});

test("P96 bottom navigation highlights History and de-emphasizes Today",async({page})=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await page.evaluate(()=>document.getElementById("bootCinematic")?.remove());
 await page.locator('nav [data-tab="history"]').click();
 await expect(page.locator('nav [data-tab="history"]')).toHaveClass(/active/);
 await expect(page.locator('nav [data-tab="today"]')).not.toHaveClass(/active/);
 const styles=await page.evaluate(()=>({history:getComputedStyle(document.querySelector('nav [data-tab="history"]')).backgroundColor,today:getComputedStyle(document.querySelector('nav [data-tab="today"]')).backgroundColor}));
 expect(styles.history).not.toBe(styles.today);
});


test("P97 bottom navigation has the same surface on Today and History",async({page})=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await page.evaluate(()=>document.getElementById("bootCinematic")?.remove());
 const style=()=>page.locator("nav").evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,bottom:s.bottom,width:s.width,radius:s.borderTopLeftRadius}});
 await page.locator('nav [data-tab="today"]').click();const today=await style();
 await page.locator('nav [data-tab="history"]').click();const history=await style();
 expect(history).toEqual(today);
 await expect(page.locator('nav [data-tab="history"]')).toHaveClass(/active/);
 await expect(page.locator('nav [data-tab="today"]')).not.toHaveClass(/active/);
});


test("P99 History day opens and shows individual event details",async({page})=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await page.evaluate(()=>document.getElementById("bootCinematic")?.remove());
 await page.evaluate(()=>{a=[{id:"qa-feed",at:"2026-10-17T09:00:00",oz:8,tags:[],people:["Sam"],notes:"Morning bottle",remote:false},{id:"qa-poop",at:"2026-10-17T09:20:00",oz:null,tags:["poop"],people:["Maddie"],notes:"Big diaper",remote:false}];renderHistory()});
 await page.locator('nav [data-tab="history"]').click();
 const d=page.locator('#history details.historyDay').first();
 await expect(d).toContainText("2 entries");
 await d.locator("summary").click();
 await expect(d).toHaveAttribute("open","");
 await expect(d).toContainText("8 oz bottle");
 await expect(d).toContainText("Morning bottle");
 await expect(d).toContainText("Maddie");
 await expect(d).toContainText("Big diaper");
});


test("P100 History event Edit opens populated composer and Delete has a confirmation",async({page})=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await page.evaluate(()=>document.getElementById("bootCinematic")?.remove());
 await page.evaluate(()=>{a=[{id:"qa-history-edit",at:"2026-10-17T09:00:00",oz:8,tags:[],people:["Sam"],notes:"QA morning bottle",remote:false}];renderHistory()});
 await page.locator('nav [data-tab="history"]').click();
 await page.locator('#history details summary').first().click();
 await expect(page.locator('#history button[data-history-edit]')).toBeVisible();
 await expect(page.locator('#history button[data-history-delete]')).toBeVisible();
 await page.locator('#history button[data-history-edit]').click();
 await expect(page.locator("#todayView")).toHaveClass(/active/);
 await expect(page.locator("#composerTitle")).toHaveText("Editing entry");
 await expect(page.locator("#notes")).toHaveValue("QA morning bottle");
 await page.locator('nav [data-tab="history"]').click();
 const historyDay=page.locator('#history details').first();
 if((await historyDay.getAttribute("open"))===null){await historyDay.locator("summary").click()}
 page.once("dialog",dialog=>dialog.dismiss());
 await page.locator('#history button[data-history-delete]').click();
 await expect(page.locator('#history button[data-history-edit]')).toHaveCount(1);
});

test("P107: compact title stays in document flow and clears Today controls on narrow phones",async({page})=>{
 await page.setViewportSize({width:320,height:680});
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 const title=page.locator(".persistentTitle");
 await expect(title).toBeVisible();
 const layout=await page.evaluate(()=>{
  const t=document.querySelector(".persistentTitle"),h=document.querySelector("#todayView .top");
  const a=t.getBoundingClientRect(),b=h.getBoundingClientRect(),s=getComputedStyle(t);
  return {position:s.position,top:a.top,bottom:a.bottom,nextTop:b.top,width:a.width,viewport:innerWidth};
 });
 expect(layout.position).toBe("relative");
 expect(layout.bottom).toBeLessThanOrEqual(layout.nextTop+1);
 expect(layout.width).toBeLessThanOrEqual(layout.viewport);
});

test("P110: navigation stays compact, light and tappable on small phones",async({page})=>{
 await page.setViewportSize({width:320,height:680});
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 const nav=await page.evaluate(()=>{
  const el=document.querySelector("nav"),s=getComputedStyle(el),btn=el.querySelector('button[data-tab="today"]');
  return {height:el.getBoundingClientRect().height,background:s.backgroundColor,buttonHeight:btn.getBoundingClientRect().height,buttonWidth:btn.getBoundingClientRect().width};
 });
 expect(nav.height).toBeLessThan(115);
 expect(nav.buttonHeight).toBeGreaterThanOrEqual(44);
 expect(nav.buttonWidth).toBeGreaterThanOrEqual(44);
 expect(nav.background).not.toBe("rgb(23, 35, 44)");
});

test("P112: Today entry does not reserve 70vh",async({page})=>{
 await page.setViewportSize({width:390,height:700});
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 const m=await page.evaluate(()=>{
  const el=document.querySelector("#todayView .quickhome");
  return {minHeight:getComputedStyle(el).minHeight,buttons:el.querySelectorAll(".heroBtn").length};
 });
 expect(m.minHeight).toBe("0px");
 expect(m.buttons).toBeGreaterThan(0);
});

test("P135: hero Poop opens a compact size and wet/messy picker",async({page})=>{
 await page.setViewportSize({width:390,height:750});
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await page.locator('.heroBtn[data-quick="poop"]').click();
 await expect(page.locator("#manualComposer")).toBeHidden();
 await expect(page.locator("#quickPoopPicker")).toBeVisible();
 await expect(page.locator("#quickPoopSize")).toHaveValue("3");
 await expect(page.locator("#quickPoopWet")).not.toBeChecked();
 await expect(page.locator("#quickPoopSave")).toHaveText("Log diaper · now");
});

test("P135: top Poop opens compact confirmation without the full log",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await expect(page.locator("#topQuickBottle")).toBeVisible();
 await expect(page.locator("#topQuickPoop")).toBeVisible();
 const box=await page.locator("#topQuickPoop").boundingBox();
 expect(box.width).toBeGreaterThanOrEqual(44);
 expect(box.height).toBeGreaterThanOrEqual(44);
 await page.locator("#topQuickPoop").click();
 await expect(page.locator("#manualComposer")).toBeHidden();
 await expect(page.locator("#quickPoopPicker")).toBeVisible();
 await expect(page.locator("#quickPoopSave")).toHaveText("Log diaper · now");
});

test("P121: narrow phone keeps top quick actions and navigation tappable",async({page})=>{
 await page.setViewportSize({width:320,height:700});
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 const m=await page.evaluate(()=>{
  const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
  return {title:box(".persistentTitle"),heading:box("#todayView .top"),nav:box("nav"),poop:box("#topQuickPoop"),bottle:box("#topQuickBottle"),viewport:innerWidth};
 });
 expect(m.title.bottom).toBeLessThanOrEqual(m.heading.y+2);
 expect(m.nav.height).toBeLessThan(115);
 for(const b of [m.poop,m.bottle]){
  expect(b.width).toBeGreaterThanOrEqual(44);
  expect(b.height).toBeGreaterThanOrEqual(44);
  expect(b.x+b.width).toBeLessThanOrEqual(m.viewport+2);
 }
});

test("P125: capture phone-sized Today and History views for review",async({page},testInfo)=>{
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 for(const width of [320,390]){
  await page.setViewportSize({width,height:780});
  await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
  await page.evaluate(()=>document.getElementById("bootCinematic")?.remove());
  await page.screenshot({path:testInfo.outputPath("today-"+width+".png"),fullPage:true});
  await page.locator('nav button[data-tab="history"]').click();
  await page.screenshot({path:testInfo.outputPath("history-"+width+".png"),fullPage:true});
 }
});

test("P126: quick Bottle logs immediately when choosing 4–8 oz",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 page.on("dialog",dialog=>{throw new Error("Unexpected native dialog: "+dialog.message())});
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await page.locator("#topQuickBottle").click();
 await expect(page.locator("#quickBottlePicker")).toBeVisible();
 await expect(page.locator("#manualComposer")).toBeHidden();
 for(const oz of [4,5,6,7,8])await expect(page.locator('#quickBottlePicker [data-quick-oz="'+oz+'"]')).toBeVisible();
 await page.locator('#quickBottlePicker [data-quick-oz="6"]').click();
 await expect(page.locator("#quickBottlePicker")).toBeHidden();
 await expect(page.locator("#oz")).toHaveText("6");
 await expect(page.locator("#feeds")).toHaveText("1");
});
// A synthetic authenticated backend exercises the real UI and care queue without family data.
async function syntheticCareBackend(page){
 page.on("pageerror",error=>console.log("SYNTHETIC PAGE ERROR:",error.message));
 page.on("console",message=>{if(message.type()==="error")console.log("SYNTHETIC CONSOLE:",message.text())});
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>window.syntheticClient};'}));
 await page.addInitScript(()=>{
  window.syntheticOffline=false;
  const read=()=>JSON.parse(localStorage.getItem('qa-remote-events')||'[]');
  const write=rows=>localStorage.setItem('qa-remote-events',JSON.stringify(rows));
  function query(table){
   let op='read',payload=null,filters={},ignoreDuplicates=false,countRequested=false,rangeStart=0,rangeEnd=null;
   const q={insert(v){op='insert';payload=v;return q},update(v){op='update';payload=v;return q},upsert(v,options){op='upsert';payload=v;ignoreDuplicates=!!options?.ignoreDuplicates;return q},delete(){op='delete';return q},select(columns,options){countRequested=!!options?.count;return q},eq(k,v){filters[k]=v;return q},in(){return q},order(){return q},limit(){return q},single(){return q},gte(){return q},lt(){return q},abortSignal(){return q},
    range(start,end){rangeStart=start;rangeEnd=end;return q;},then(resolve,reject){return Promise.resolve().then(async()=>{
     if(table==='family_profiles'){
      if(op==='update'&&payload?.flair&&window.syntheticProfileOffline)return {data:null,error:{code:'network'}};
      if(op==='upsert'&&window.syntheticProfileSaveDelay)await new Promise(resolve=>setTimeout(resolve,window.syntheticProfileSaveDelay));
      let profiles=JSON.parse(localStorage.getItem('qa-profiles')||'[]');
      if(op==='upsert'&&!(ignoreDuplicates&&profiles.some(x=>x.user_id===payload.user_id))){const old=profiles.find(x=>x.user_id===payload.user_id)||{};profiles=profiles.filter(x=>x.user_id!==payload.user_id);profiles.push({...old,...payload});}
      if(op==='update'&&payload?.flair&&window.syntheticFlairConflictOnce){window.syntheticFlairConflictOnce=false;profiles=profiles.map(x=>x.user_id===filters.user_id?{...x,flair:{...(x.flair||{}),unlocked:[...(x.flair?.unlocked||[]),'block-party'],eggs:['block-party']}}:x);localStorage.setItem('qa-profiles',JSON.stringify(profiles));return {data:[],error:null};}
      const matches=x=>Object.entries(filters).every(([k,v])=>k==='flair'?JSON.stringify(x.flair||{})===v:x[k]===v);
      const matched=profiles.filter(matches).map(x=>x.user_id);if(op==='update')profiles=profiles.map(x=>matches(x)?{...x,...payload}:x);
      localStorage.setItem('qa-profiles',JSON.stringify(profiles));
      return {data:op==='update'?profiles.filter(x=>matched.includes(x.user_id)):profiles.filter(matches),error:null};
     }
     if(table==='family_chat_messages'){let rows=JSON.parse(localStorage.getItem('qa-chat')||'[]');if(op==='insert'){rows.push({...payload,id:crypto.randomUUID(),created_at:new Date().toISOString()});localStorage.setItem('qa-chat',JSON.stringify(rows));}rows=rows.filter(x=>!filters.sender_id||x.sender_id===filters.sender_id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));return {data:countRequested?null:rows,count:countRequested?rows.length:null,error:null};}
     if(table!=='baby_events')return {data:[],error:null};
     if(window.syntheticOffline)return {data:null,error:{code:'network'}};
     const rows=read();
     if(op==='insert'){if(rows.some(x=>x.id===payload.id))return {error:{code:'23505'}};write([...rows,payload]);return {data:payload,error:null};}
     if(op==='update'){const old=rows.find(x=>x.id===filters.id);if(!old)return {error:{code:'PGRST116'}};const saved={...old,...payload};write(rows.map(x=>x.id===saved.id?saved:x));return {data:saved,error:null};}
     if(op==='delete'){write(rows.filter(x=>x.id!==filters.id));return {data:[{id:filters.id}],error:null};}
     const matching=rows.filter(x=>Object.entries(filters).every(([key,value])=>x[key]===value));
     return {data:filters.id?matching[0]:rangeEnd==null?matching:matching.slice(rangeStart,rangeEnd+1),error:null};
    }).then(resolve,reject);}
   };return q;
  }
  const channel={on(){return channel},subscribe(){return channel}};
  window.syntheticClient={auth:{getUser:async()=>({data:{user:{id:'qa-user',email:'synthetic@example.invalid'}}}),onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}},rpc:async()=>({data:[{baby_id:'qa-baby',family_id:'qa-family'}]}),from:query,channel:()=>channel,removeChannel:async()=>{}};
  if(!localStorage.getItem('luca-caregiver'))localStorage.setItem('luca-caregiver','Synthetic caregiver');localStorage.setItem('luca-sound','off');sessionStorage.setItem('hideSync','1');
 });
}

test('P132: quick bottle survives refresh, History editing, offline retry and reload without duplication',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());
 await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('#topQuickBottle').click();await page.locator('[data-quick-oz="6"]').click();
 await expect(page.locator('#quickBottlePicker')).toBeHidden();await expect(page.locator('#oz')).toHaveText('6');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')||'[]').length)).toBe(1);
 await page.locator('nav button[data-tab="history"]').click();await page.locator('#historyView details summary').first().click();await page.locator('#historyView [data-history-edit]').first().click();
 await expect(page.locator('#manualComposer')).toBeVisible();await expect(page.locator('#composerTitle')).toHaveText('Editing entry');
 await expect(page.locator('#manualComposer')).toHaveAttribute('data-editing','true');
 await expect(page.locator('#chatPeekTab')).toBeHidden();await expect(page.locator('#careDock')).toBeHidden();
 await page.locator('#manualComposer [data-oz="7"]').click();await page.locator('#time').fill('09:15');
 await page.evaluate(()=>window.syntheticOffline=true);await page.locator('#saveEntry').click();
 await expect(page.locator('#manualComposer')).toBeHidden();await expect(page.locator('#oz')).toHaveText('7');
 await page.locator('#syncDot').click();await expect(page.locator('#syncDot')).toContainText('pending');
 await page.evaluate(()=>window.syntheticOffline=false);await page.locator('#syncDot').click();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await expect(page.locator('#oz')).toHaveText('7');await expect(page.locator('#feeds')).toHaveText('1');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')));
 expect(saved).toHaveLength(1);expect(saved[0].amount_oz).toBe(7);expect(new Date(saved[0].event_time).getHours()).toBe(9);expect(new Date(saved[0].event_time).getMinutes()).toBe(15);
});

test('P132: loaded build and runtime use the same visible version',async({page})=>{
 await page.setViewportSize({width:320,height:700});await page.route('https://znhqaqvocexjsnklnqre.supabase.co/**',route=>route.abort());
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#buildVersion')).toBeVisible();await expect(page.locator('#buildVersion')).toHaveText('P145');
 await expect(page.locator('#lucaNow')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>window.LUCA_PATCH)).toBe('P145');
});


test('P133: original artwork filters, saves, reloads and follows the family member into chat',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);
 await page.addInitScript(()=>{
  if(!localStorage.getItem('qa-profiles'))localStorage.setItem('qa-profiles',JSON.stringify([{family_id:'qa-family',user_id:'qa-user',display_name:'Synthetic caregiver',bio:'',avatar_preset:'bear'}]));
  localStorage.setItem('qa-chat',JSON.stringify([{id:'qa-message',sender_id:'qa-user',body:'Synthetic family message',created_at:new Date().toISOString()}]));
 });
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('#navMore').click();await page.locator('#menuFamily').click();
 await expect(page.locator('.avatarChoice')).toHaveCount(59);
 await expect(page.locator('#profileAvatar')).toBeHidden();
 await page.getByRole('button',{name:'Diaper duty',exact:true}).click();
 await expect(page.getByRole('button',{name:'Teddy Trooper',exact:true})).toBeHidden();
 await expect(page.getByRole('button',{name:'Diaper Doom',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'All',exact:true}).click();
 await page.getByRole('searchbox',{name:'Find an avatar'}).fill('Teddy');
 await expect(page.locator('.avatarChoice:visible')).toHaveCount(1);
 await page.getByRole('button',{name:'Teddy Trooper',exact:true}).click();
 await expect(page.locator('.armoryPreview')).toContainText('Teddy Trooper');
 const portrait=page.locator('.armoryPreview img');await expect(portrait).toHaveAttribute('src',/avatar-armory-original.png/);
 await expect.poll(()=>portrait.evaluate(img=>img.complete&&img.naturalWidth)).toBe(1312);
 await page.locator('#profileSave').click();await expect(page.locator('#profileStatus')).toHaveText('Profile saved.');
 await expect.poll(()=>portrait.evaluate(img=>img.complete&&img.naturalWidth)).toBe(1312);
 await page.getByRole('searchbox',{name:'Find an avatar'}).fill('');
 await page.locator('.armoryHeader').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:'test-results/p133-armory-390.png'});
 await page.reload();await page.locator('#navMore').click();await page.locator('#menuFamily').click();
 await expect(page.locator('.armoryPreview')).toContainText('Teddy Trooper');
 await page.locator('nav button[data-tab="chat"]').click();
 await expect(page.locator('#familyChatFeed [data-avatar-key="teddyTrooper"] img')).toHaveAttribute('src',/avatar-armory-original.png/);
 await expect(page.locator('#familyChatFeed')).toContainText('Synthetic family message');
});

test('P133: personality preferences persist, quiet mode stays silent, and reduced motion is respected',async({page})=>{
 await page.setViewportSize({width:320,height:700});await syntheticCareBackend(page);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{document.getElementById('bootCinematic')?.remove();window.qaAudioStarts=0;window.AudioContext=class{constructor(){window.qaAudioStarts++;throw new Error('Audio started in quiet mode');}};});
 await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('#topQuickBottle').click();await page.locator('[data-quick-oz="5"]').click();
 await expect(page.locator('#toast .toastQuip')).toContainText('tiny dictator');
 await page.evaluate(()=>window.lucaSound.saved());expect(await page.evaluate(()=>window.qaAudioStarts)).toBe(0);
 await page.locator('#navMore').click();await page.locator('#menuFamily').click();
 await page.locator('#profilePersonality').selectOption('off');
 await page.reload();await expect.poll(()=>page.evaluate(()=>window.lucaFeedbackLine?.('feed'))).toBe('');
 await page.locator('#topQuickBottle').click();await page.locator('[data-quick-oz="4"]').click();
 await expect(page.locator('#toast')).toContainText('saved on this phone');await expect(page.locator('#toast .toastQuip')).toHaveCount(0);
 expect(await page.locator('#todayView').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('P133: avatar changes during a slow save remain a visible unsaved draft',async({page})=>{
 await syntheticCareBackend(page);
 await page.addInitScript(()=>localStorage.setItem('qa-profiles',JSON.stringify([{family_id:'qa-family',user_id:'qa-user',display_name:'Synthetic caregiver',bio:'',avatar_preset:'bear'}])));
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('#navMore').click();await page.locator('#menuFamily').click();
 await page.getByRole('searchbox',{name:'Find an avatar'}).fill('Teddy');await page.getByRole('button',{name:'Teddy Trooper',exact:true}).click();
 await page.evaluate(()=>window.syntheticProfileSaveDelay=1500);await page.locator('#profileSave').click();
 await page.getByRole('searchbox',{name:'Find an avatar'}).fill('Diaper Doom');await page.getByRole('button',{name:'Diaper Doom',exact:true}).click();
 await expect(page.locator('#profileStatus')).toContainText('newer changes are still unsaved');
 await expect(page.locator('.armoryPreview')).toContainText('Diaper Doom');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-profiles'))[0].avatar_preset)).toBe('teddyTrooper');
 await page.evaluate(()=>window.syntheticProfileSaveDelay=0);await page.locator('#profileSave').click();await expect(page.locator('#profileStatus')).toHaveText('Profile saved.');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-profiles'))[0].avatar_preset)).toBe('diaperDoom');
});

test('P134: nap start/end, offline time edit, retry, reload and sleep statistics stay in sync',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());
 await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('[data-quick="nap"]').click();await expect(page.locator('#sleepComposer')).toBeVisible();
 const times=await page.evaluate(()=>{const local=d=>LucaSleep.dateKey(d)+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');return {start:local(new Date(Date.now()-120*60000)),end:local(new Date(Date.now()-30*60000)),later:local(new Date(Date.now()-15*60000))};});
 await page.locator('#sleepStart').fill(times.start);await page.locator('#sleepEnd').fill(times.end);await expect(page.locator('#sleepDuration')).toHaveText('1h 30m');
 await page.screenshot({animations:'disabled',path:'test-results/p134-sleep-editor-390.png'});await page.locator('#sleepSave').click();await expect(page.locator('#sleepComposer')).toBeHidden();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')||'[]').length)).toBe(1);
 await page.locator('nav [data-tab="insights"]').click();await expect(page.locator('#sleepTrends')).toContainText('1h 30m');
 await page.locator('nav [data-tab="history"]').click();await page.locator('#history details summary').first().click();await page.locator('[data-history-edit]').first().click();
 await expect(page.locator('#sleepComposer')).toHaveAttribute('data-editing','true');await expect(page.locator('#sleepStart')).toHaveValue(times.start);
 await page.locator('#sleepEnd').fill(times.later);await page.evaluate(()=>window.syntheticOffline=true);await page.locator('#sleepSave').click();
 await page.locator('#syncDot').click();await expect(page.locator('#syncDot')).toContainText('pending');
 await page.evaluate(()=>window.syntheticOffline=false);await page.locator('#syncDot').click();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('nav [data-tab="insights"]').click();
 await expect(page.locator('#sleepTrends')).toContainText('1h 45m');
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')));expect(rows).toHaveLength(1);expect(rows[0].details.sleep.start_at).toBeTruthy();expect(rows[0].details.sleep.end_at).toBeTruthy();
 await page.locator('#sleepTrends').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({animations:'disabled',path:'test-results/p134-sleep-stats-390.png'});
});

test('P134: overnight dates and awake minutes are explicit, and invalid intervals never save',async({page})=>{
 await page.setViewportSize({width:320,height:740});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('[data-quick="nap"]').click();await page.getByRole('button',{name:'Night sleep',exact:true}).click();
 await page.locator('#sleepOngoing').uncheck();await page.locator('#sleepStart').fill('');
 await page.locator('#sleepSave').click();await expect(page.locator('#sleepValidation')).toContainText('Choose');
 const times=await page.evaluate(()=>{const end=new Date();end.setHours(7,0,0,0);if(end>Date.now())end.setDate(end.getDate()-1);const start=new Date(end);start.setDate(start.getDate()-1);start.setHours(21,0,0,0);const local=d=>LucaSleep.dateKey(d)+'T'+String(d.getHours()).padStart(2,'0')+':00';return {start:local(start),end:local(end)};});
 await page.locator('#sleepStart').fill(times.end);await page.locator('#sleepEnd').fill(times.start);await page.locator('#sleepSave').click();await expect(page.locator('#sleepValidation')).toContainText('Wake-up must follow');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')||'[]').length)).toBe(0);
 await page.locator('#sleepStart').fill(times.start);await page.locator('#sleepEnd').fill(times.end);await page.locator('#sleepEntryWakeups').fill('3');await page.locator('#sleepEntryAwake').fill('30');
 await expect(page.locator('#sleepDuration')).toHaveText('10h');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({animations:'disabled',path:'test-results/p134-night-editor-320.png'});await page.locator('#sleepSave').click();await page.locator('nav [data-tab="insights"]').click();
 await expect(page.locator('#sleepTrends')).toContainText('9h 30m');await expect(page.locator('.sleepMetric').nth(1).locator('strong')).toHaveText('0');await expect(page.locator('#sleepTrends')).toContainText('3 / night');
 await page.locator('#sleep30').click();await expect(page.locator('#sleep30')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#sleepTrends')).toContainText('9h 30m');
});

test('P134: refined actions have readable text and light surfaces across drawers and Family Ideas',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 async function contrast(selector){
  await expect(page.locator(selector)).toBeVisible();
  const value=await page.locator(selector).evaluate(el=>{const s=getComputedStyle(el),lum=c=>c.match(/[0-9.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);const bg=lum(s.backgroundColor),fg=lum(s.webkitTextFillColor||s.color);return {ratio:(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05),background:bg};});
  expect(value.ratio).toBeGreaterThanOrEqual(4.5);expect(value.background).toBeGreaterThan(.5);
 }
 await contrast('#quickUnderstand');await page.screenshot({animations:'disabled',path:'test-results/p134-today-390.png'});
 await page.locator('#navMore').click();await contrast('#menuFamily');await page.screenshot({animations:'disabled',path:'test-results/p134-menu-390.png'});
 await page.locator('#menuIdeas').click();await contrast('#familyIdeasRoot button[type="submit"]');await page.locator('#familyIdeasRoot').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({animations:'disabled',path:'test-results/p134-ideas-390.png'});
 await page.locator('nav [data-tab="today"]').click();await page.locator('#chatPeekTab').click();await contrast('#drawerOpenChat');await page.screenshot({animations:'disabled',path:'test-results/p134-chat-peek-390.png'});
});

for(const width of [320,390])test('P135: anchored quick care works without moving the page at '+width+'px',async({page})=>{
 await page.setViewportSize({width,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 const before=await page.locator('.quickhome').boundingBox();
 await page.locator('#topQuickBottle').click();await expect(page.locator('#quickBottlePicker')).toBeVisible();
 const box=await page.locator('#quickBottlePicker').boundingBox(),after=await page.locator('.quickhome').boundingBox();
 expect(Math.abs(before.y-after.y)).toBeLessThan(2);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);
 expect(box.y+box.height).toBeLessThan(756);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')||'[]').length)).toBe(0);
 await page.screenshot({animations:'disabled',path:'test-results/p135-bottle-popout-'+width+'.png'});
 await page.keyboard.press('Escape');await expect(page.locator('#quickBottlePicker')).toBeHidden();await expect(page.locator('#topQuickBottle')).toBeFocused();
 await page.locator('#topQuickPoop').click();await expect(page.locator('#quickPoopPicker')).toBeVisible();await expect(page.locator('#manualComposer')).toBeHidden();
 const poop=await page.locator('#quickPoopPicker').boundingBox();expect(poop.x).toBeGreaterThanOrEqual(0);expect(poop.x+poop.width).toBeLessThanOrEqual(width);expect(poop.y+poop.height).toBeLessThan(756);
 await page.locator('#quickPoopCaregiver').selectOption('Yolanda');await page.locator('#quickPoopWet').check();
 await page.locator('#quickPoopSize').fill('5');await page.screenshot({animations:'disabled',path:'test-results/p135-diaper-popout-'+width+'.png'});
 await page.evaluate(()=>window.syntheticOffline=true);await page.locator('#quickPoopSave').click();
 await expect(page.locator('#quickPoopPicker')).toBeHidden();await expect(page.locator('#poops')).toHaveText('1');
 await page.evaluate(()=>window.syntheticOffline=false);await page.locator('#syncDot').click();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')));expect(rows).toHaveLength(1);expect(rows[0].caregivers).toEqual(['Yolanda']);expect(rows[0].details.poop).toEqual({size:5,wet:true});
 await page.locator('#topQuickPoop').click();await expect(page.locator('#quickPoopSize')).toHaveValue('3');await expect(page.locator('#quickPoopWet')).not.toBeChecked();await page.locator('#quickPoopCancel').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')).length)).toBe(1);
 await page.locator('nav [data-tab="history"]').click();await page.locator('.historyDay summary').first().click();await page.locator('[data-history-edit]').first().click();
 await expect(page.locator('#poopSize')).toHaveValue('5');await expect(page.locator('#poopWet')).toBeChecked();await page.locator('#poopSize').fill('2');await page.locator('#poopWet').uncheck();await page.locator('#saveEntry').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events'))[0].details.poop)).toEqual({size:2,wet:false});
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('nav [data-tab="history"]').click();await page.locator('.historyDay summary').first().click();await page.locator('[data-history-edit]').first().click();await expect(page.locator('#poopSize')).toHaveValue('2');await expect(page.locator('#poopWet')).not.toBeChecked();
});

test('P135: hidden click discovery equips a banner that survives reload and appears beside Dada’s Dude in chat',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{if(!localStorage.getItem('qa-profiles'))localStorage.setItem('qa-profiles',JSON.stringify([{family_id:'qa-family',user_id:'qa-user',display_name:'Synthetic caregiver',bio:'',avatar_preset:'dadasDude',flair:{}}]));localStorage.setItem('qa-chat',JSON.stringify([{id:'qa-message',sender_id:'qa-user',body:'Synthetic family message',created_at:new Date().toISOString()}]));});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-profiles'))[0].flair?.visits?.length)).toBe(1);
 for(let i=0;i<7;i++)await page.locator('.persistentTitle .titleL').click();
 await page.locator('#navMore').click();await page.locator('#menuAchievements').click();await expect(page.locator('#achievementsView')).toHaveClass(/active/);
 const badge=page.locator('[data-achievement="block-party"]');await expect(badge).toHaveClass(/unlocked/);await badge.locator('[data-equip-banner]').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-profiles'))[0].flair.banner)).toBe('block-party');
 await page.evaluate(()=>scrollTo(0,0));await expect.poll(()=>page.locator('.achievementHero img').evaluate(img=>img.complete&&img.naturalWidth)).toBe(1312);await page.screenshot({animations:'disabled',fullPage:true,path:'test-results/p135-achievements-390.png'});
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('nav [data-tab="chat"]').click();
 await expect(page.locator('#familyChatFeed .avatarCharacter')).toHaveText("Dada's Dude");await expect(page.locator('#familyChatFeed .profileBanner')).toContainText('Block Party');
 await expect(page.locator('#familyChatFeed [data-avatar-key="dadasDude"] img')).toHaveAttribute('src',/avatar-armory-original.png/);await expect.poll(()=>page.locator('#familyChatFeed [data-avatar-key="dadasDude"] img').evaluate(img=>img.complete&&img.naturalWidth)).toBe(1312);await page.locator('#familyChatFeed [data-avatar-key="dadasDude"] img').evaluate(async img=>{await img.decode();await new Promise(requestAnimationFrame);});const frame=await page.locator('#familyChatFeed [data-avatar-key="dadasDude"] img').evaluate(img=>{const a=img.getBoundingClientRect(),b=img.parentElement.getBoundingClientRect();return {image:{x:a.x,y:a.y,width:a.width,height:a.height},portrait:{x:b.x,y:b.y,width:b.width,height:b.height},opacity:getComputedStyle(img).opacity};});console.log('CHAT PORTRAIT FRAME',JSON.stringify(frame));expect(frame.image.width).toBeGreaterThan(300);expect(frame.image.x).toBeLessThan(frame.portrait.x);expect(frame.image.y).toBeLessThan(frame.portrait.y);expect(frame.opacity).toBe('1');await page.screenshot({animations:'disabled',path:'test-results/p135-chat-banner-390.png'});
 await page.locator('#navMore').click();await page.locator('#menuFamily').click();await expect(page.locator('#familyProfileList .profileBanner')).toContainText('Block Party');
});

test('P135: a rare falling slider is decorative, unlocks a banner and leaves the confirmed diaper unchanged',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-profiles'))?.[0]?.flair?.visits?.length)).toBe(1);
 await page.locator('#topQuickPoop').click();await page.evaluate(()=>Math.random=()=>.1);await page.locator('#quickPoopSize').fill('5');
 await expect(page.locator('#quickPoopSize')).toHaveValue('5');await expect(page.locator('#quickPoopSizeLabel')).toHaveText('Diaper disaster');await expect(page.locator('#quickPoopPicker .poopMeter')).toHaveClass(/railBroken/);
 await page.locator('#quickPoopWet').check();await page.locator('#quickPoopSave').click();await expect(page.locator('#poops')).toHaveText('1');
 await page.locator('#navMore').click();await page.locator('#menuAchievements').click();await expect(page.locator('[data-achievement="off-the-rails"]')).toHaveClass(/unlocked/);await expect(page.locator('[data-achievement="code-brown"]')).toHaveClass(/unlocked/);
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')));expect(rows).toHaveLength(1);expect(rows[0].details.poop).toEqual({size:5,wet:true});
});

test('P135: History filters the real journal and edit/delete controls preserve care integrity',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('#topQuickBottle').click();await page.locator('[data-quick-oz="6"]').click();await page.locator('#topQuickPoop').click();await page.locator('#quickPoopCaregiver').selectOption('Lindsay');await page.locator('#quickPoopSave').click();
 await page.locator('nav [data-tab="history"]').click();await page.locator('.historyDay summary').first().click();await expect(page.locator('.historyEvent')).toHaveCount(2);
 await page.evaluate(()=>document.getElementById('toast').classList.remove('on'));await page.screenshot({animations:'disabled',path:'test-results/p135-history-390.png'});
 await page.locator('#historySearch').fill('Lindsay');await expect(page.locator('.historyEvent')).toHaveCount(1);await expect(page.locator('.historyEvent')).toContainText('Lindsay');
 await page.locator('#historySearch').fill('');await page.locator('#historyKind').selectOption('bottle');await expect(page.locator('.historyEvent')).toHaveCount(1);
 await page.locator('[data-history-edit]').click();await expect(page.locator('#manualComposer')).toBeVisible();await page.locator('#manualComposer [data-oz="7"]').click();await page.locator('#saveEntry').click();
 await page.locator('nav [data-tab="history"]').click();await expect(page.locator('.historyEvent')).toContainText('7 oz bottle');
 page.once('dialog',dialog=>dialog.dismiss());await page.locator('[data-history-delete]').click();await expect(page.locator('.historyEvent')).toHaveCount(1);
 page.once('dialog',dialog=>dialog.accept());await page.locator('[data-history-delete]').click();await expect(page.locator('.historyEvent')).toHaveCount(0);
 await page.locator('#historyKind').selectOption('all');await expect(page.locator('.historyEvent')).toHaveCount(1);await expect(page.locator('.historyEvent')).toContainText('Lindsay');
});

test('P135: surprise opt-out and quiet clicks persist, while an offline banner retries after reload',async({page})=>{
 await page.setViewportSize({width:320,height:740});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('#topQuickBottle').click();await page.locator('[data-quick-oz="4"]').click();
 await page.locator('#navMore').click();await page.locator('#menuAchievements').click();const badge=page.locator('[data-achievement="first-watch"]');await expect(badge).toHaveClass(/unlocked/);
 await page.evaluate(()=>window.syntheticProfileOffline=true);await badge.locator('[data-equip-banner]').click();await expect(page.locator('#achievementStatus')).toContainText('Reconnect');
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-profiles'))[0].flair.banner)).toBe('first-watch');
 await page.locator('#navMore').click();await page.locator('#menuFamily').click();await page.locator('#profileSurprises').selectOption('off');await page.locator('#profileClicks').selectOption('off');
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.evaluate(()=>{window.qaAudioStarts=0;window.AudioContext=class{constructor(){window.qaAudioStarts++;throw new Error('Quiet audio');}};Math.random=()=>0;});
 await page.locator('#topQuickPoop').click();await page.locator('#quickPoopSize').fill('5');await expect(page.locator('#quickPoopPicker .poopMeter')).not.toHaveClass(/railBroken/);
 await page.keyboard.press('Escape');expect(await page.evaluate(()=>window.qaAudioStarts)).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('P135: simultaneous discoveries from another device merge before a banner is equipped',async({page})=>{
 await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('#topQuickBottle').click();await page.locator('[data-quick-oz="6"]').click();
 await page.locator('#navMore').click();await page.locator('#menuAchievements').click();await expect(page.locator('[data-achievement="first-watch"]')).toHaveClass(/unlocked/);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-profiles'))[0].flair.unlocked.includes('first-watch'))).toBe(true);
 await page.evaluate(()=>window.syntheticFlairConflictOnce=true);await page.locator('[data-achievement="first-watch"] [data-equip-banner]').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-profiles'))[0].flair.banner)).toBe('first-watch');
 const flair=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-profiles'))[0].flair);expect(flair.unlocked).toEqual(expect.arrayContaining(['first-watch','block-party']));expect(flair.eggs).toContain('block-party');
});

// P136 fixtures are synthetic: no production account or records are used.
test('P136: clear bedtime, wake and abbreviated nap notes count once, and inferred editing confirms a correction',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.clock.setFixedTime(new Date('2026-10-18T16:00:00Z'));
 await page.addInitScript(()=>{if(!localStorage.getItem('qa-remote-events'))localStorage.setItem('qa-remote-events',JSON.stringify([
  {id:'context-bed',baby_id:'qa-baby',created_by:'qa-user',event_time:'2026-10-17T22:15:00Z',event_type:'sleep',tags:['sleep'],caregivers:['Nona'],note:'Down for the night at 10:15',details:{}},
  {id:'context-wake',baby_id:'qa-baby',created_by:'qa-user',event_time:'2026-10-18T07:18:00Z',event_type:'other',tags:['other'],caregivers:['Sam'],note:'Slept last night until 7 am, maybe 3 wakeups, little cranky in the night with stomach and farting issues',details:{}},
  {id:'context-nap',baby_id:'qa-baby',created_by:'qa-user',event_time:'2026-10-18T08:00:00Z',event_type:'sleep',tags:['sleep'],caregivers:['Nona'],note:'Napped 8–9',details:{}}
 ]));});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await expect(page.locator('.entry').filter({hasText:'Napped 8–9'})).toContainText('Nap · 1h · inferred');await expect(page.locator('.entry').filter({hasText:'Slept last night until 7 am'})).toContainText('Night sleep · 8h 45m · inferred');
 await page.locator('nav [data-tab="insights"]').click();await expect(page.locator('#sleepTrends')).toContainText('8h 45m');await expect(page.locator('#sleepTrends')).toContainText('1h');await expect(page.locator('.sleepStatsFoot')).toContainText('2 sleep windows inferred');await expect(page.locator('.sleepMissing')).toHaveCount(0);
 await page.locator('#sleepTrends').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({animations:'disabled',path:'test-results/p136-contextual-sleep-390.png'});
 await page.locator('nav [data-tab="history"]').click();await page.locator('.historyDay summary').first().click();await page.locator('[data-history-edit="context-wake"]').click();
 await expect(page.locator('#sleepStart')).toHaveValue('2026-10-17T22:15');await expect(page.locator('#sleepEnd')).toHaveValue('2026-10-18T07:00');await expect(page.locator('#sleepEntryWakeups')).toHaveValue('');await expect(page.locator('.sleepEditorFoot')).toContainText('inferred from your notes');
 await page.locator('#sleepStart').fill('2026-10-17T22:30');await page.locator('#sleepSave').click();await expect(page.locator('#sleepComposer')).toBeHidden();
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('nav [data-tab="insights"]').click();await expect(page.locator('#sleepTrends')).toContainText('8h 30m');
 const data=await page.evaluate(()=>({stats:sleepStats(a),rows:JSON.parse(localStorage.getItem('qa-remote-events'))}));expect(data.stats.nightCount).toBe(1);expect(data.stats.partialCount).toBe(0);expect(data.rows).toHaveLength(3);expect(data.rows.find(r=>r.id==='context-bed').note).toBe('Down for the night at 10:15');expect(data.rows.find(r=>r.id==='context-wake').note).toContain('maybe 3 wakeups');
});

test('P136: an immediate starter card and classified click discoveries are discoverable on phones',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{if(!localStorage.getItem('qa-profiles'))localStorage.setItem('qa-profiles',JSON.stringify([{family_id:'qa-family',user_id:'qa-user',display_name:'Synthetic caregiver',bio:'',avatar_preset:'dadasDude',flair:{}}]));});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await expect(page.locator('#starterCardTeaser')).toBeVisible();await page.locator('#starterCardTeaser').click();await expect(page.locator('[data-achievement="first-checkin"]')).toHaveClass(/unlocked/);
 await page.locator('[data-card-category="starter"]').click();await expect(page.locator('.achievementCard')).toHaveCount(4);await page.locator('[data-achievement="first-checkin"] [data-equip-banner]').click();
 await expect(page.locator('.achievementHero .callingCard')).toContainText('Fresh Recruit');await expect(page.locator('.achievementHero .callingCard')).toContainText('STARTER');await expect(page.locator('[data-achievement="first-checkin"] button')).toHaveText('✓ Equipped');
 await expect.poll(()=>page.locator('.achievementHero img').evaluate(img=>img.complete&&img.naturalWidth)).toBe(1312);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({animations:'disabled',path:'test-results/p136-starter-cards-390.png'});
 await page.locator('nav [data-tab="today"]').click();await expect(page.locator('#starterCardTeaser')).toBeHidden();await page.locator('#topQuickBottle').click();await page.locator('#bottleInspector').dblclick();await page.keyboard.press('Escape');
 await page.locator('#navMore').click();await page.locator('#menuFamily').click();await page.locator('#profileSound').selectOption('off');
 await page.locator('#profileAchievements').click();await page.locator('[data-card-category="hidden"]').click();await expect(page.locator('[data-achievement="silent-operator"]')).toHaveClass(/unlocked/);await expect(page.locator('[data-achievement="label-maker"]')).toHaveClass(/unlocked/);await expect(page.locator('.achievementCard.locked').first()).toContainText('Classified nonsense');
 await page.locator('[data-achievement="label-maker"] [data-equip-banner]').click();await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-profiles'))[0].flair.banner)).toBe('label-maker');
});

test('P136: friend playground edits, deletes, chats, profiles and resets without touching native history or backend',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});const errors=[],remote=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(new URL(request.url()).origin!=='http://127.0.0.1:8765')remote.push(request.url());});
 await page.route('https://**/*',route=>route.abort());
 await page.addInitScript(()=>{window.qaNativeStorage=localStorage;window.qaNativeSession=sessionStorage;if(!localStorage.getItem('qa-native-seeded')){localStorage.setItem('luca-log-v2','REAL FAMILY HISTORY SENTINEL');localStorage.setItem('qa-real-session','REAL AUTH SENTINEL');sessionStorage.setItem('qa-real','REAL SESSION SENTINEL');localStorage.setItem('qa-native-seeded','1');}});
 await page.goto('http://127.0.0.1:8765/demo.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#demoNotice')).toContainText('Practice mode');await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await expect(page.locator('#timeline')).not.toContainText('REAL FAMILY');await page.locator('#topQuickBottle').click();await page.locator('[data-quick-oz="7"]').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('db:baby_events')).length)).toBe(5);
 await page.locator('nav [data-tab="history"]').click();await page.locator('#historyKind').selectOption('bottle');for(const day of await page.locator('.historyDay:not([open]) summary').all())await day.click();
 await page.locator('[data-history-edit="practice-bottle"]').click();await page.locator('#notes').fill('Friend edited this sample');await page.locator('#manualComposer [data-oz="8"]').click();await page.locator('#saveEntry').click();
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('nav [data-tab="history"]').click();await page.locator('#historySearch').fill('Friend edited');await page.locator('.historyDay summary').click();await expect(page.locator('.historyEvent')).toContainText('8 oz bottle');
 page.once('dialog',dialog=>dialog.accept());await page.locator('[data-history-delete="practice-bottle"]').click();await expect(page.locator('.historyEvent')).toHaveCount(0);
 await page.locator('nav [data-tab="chat"]').click();await page.locator('#familyChatText').fill('Practice message');await page.locator('#familyChatSend').click();await expect(page.locator('#familyChatFeed')).toContainText('Practice message');await expect(page.locator('#familyChatFeed .familyChatMessage').filter({hasText:'Practice message'})).toContainText("Dada's Dude");
 await page.locator('#navMore').click();await page.locator('#menuFamily').click();await page.locator('#profileName').fill('Friend Test Pilot');await page.locator('#profileSave').click();await expect(page.locator('#profileStatus')).toHaveText('Profile saved.');
 const state=await page.evaluate(()=>({real:qaNativeStorage.getItem('luca-log-v2'),auth:qaNativeStorage.getItem('qa-real-session'),session:qaNativeSession.getItem('qa-real'),demo:localStorage.getItem('luca-log-v2')}));expect(state.real).toBe('REAL FAMILY HISTORY SENTINEL');expect(state.auth).toBe('REAL AUTH SENTINEL');expect(state.session).toBe('REAL SESSION SENTINEL');expect(state.demo).toContain('practice');
 await page.locator('nav [data-tab="today"]').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({animations:'disabled',path:'test-results/p136-friend-playground-390.png'});
 page.once('dialog',dialog=>dialog.accept());await page.locator('#demoReset').click();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('db:baby_events')).length)).toBe(4);
 expect(await page.evaluate(()=>qaNativeStorage.getItem('luca-log-v2'))).toBe('REAL FAMILY HISTORY SENTINEL');expect(remote).toEqual([]);expect(errors).toEqual([]);
});

test('P136: practice schedule changes persist locally and revert removes only sample coverage',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://127.0.0.1:8765/demo.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('#navMore').click();await page.locator('#menuSchedule').click();await expect(page.locator('.scheduleDay48')).toHaveCount(7);const card=page.locator('.scheduleDay48').filter({has:page.locator('.work48').filter({hasText:'Sam'})}).first(),day=await card.getAttribute('data-schedule-day');await card.locator('.scheduleDayTop48').click();await page.locator('.addMgr63').click();await page.locator('[data-p63="Nona"]').click();await expect(page.locator('.st57')).toHaveValue('07:00');await expect(page.locator('.en57')).toHaveValue('15:00');await page.locator('.save57').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('db:luca_schedule')).filter(r=>r.kind==='coverage').length)).toBe(1);await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('#navMore').click();await page.locator('#menuSchedule').click();
 await page.locator('[data-schedule-day="'+day+'"] .scheduleDayTop48').click();await expect(page.locator('.coverList63')).toContainText('Nona');page.once('dialog',dialog=>dialog.accept());await page.locator('.revertMgr63').click();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('db:luca_schedule')).length)).toBe(2);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('db:luca_schedule')).every(r=>r.kind==='work'))).toBe(true);
});

for(const locale of ['en-US','es-DO'])test('P137: practice schedule keeps the selected New Year date in '+locale,async({browser})=>{
 const context=await browser.newContext({locale,viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();try{
  await page.clock.setFixedTime(new Date('2026-12-31T16:00:00Z'));
  await page.goto('http://127.0.0.1:8765/demo.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
  await page.evaluate(()=>{localStorage.setItem('db:luca_schedule',JSON.stringify([
   {id:'new-year-sam',family_id:'practice-family',person:'Sam',kind:'work',start_at:'2027-01-01T06:00:00Z',end_at:'2027-01-01T15:00:00Z'},
   {id:'new-year-maddie',family_id:'practice-family',person:'Maddie',kind:'work',start_at:'2027-01-01T07:00:00Z',end_at:'2027-01-01T19:00:00Z'}
  ]));});
  await page.locator('#navMore').click();await page.locator('#menuSchedule').click();
  const card=page.locator('[data-schedule-day="2027-01-01"]');await expect(card).toBeVisible();await card.locator('.scheduleDayTop48 b').click();await expect(page.locator('.workMgr63')).toHaveCount(2);
  await page.locator('.closeMgr63').click();await card.locator('.scheduleDayTop48').click();await expect(page.locator('.workMgr63')).toHaveCount(2);
  await page.locator('.addMgr63').click();await page.locator('[data-p63="Nona"]').click();await expect(page.locator('.st57')).toHaveValue('07:00');await expect(page.locator('.en57')).toHaveValue('15:00');await page.locator('.save57').click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('db:luca_schedule')).filter(r=>r.kind==='coverage').length)).toBe(1);
  const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('db:luca_schedule')));expect(rows.filter(r=>r.kind==='work')).toHaveLength(2);expect(rows.find(r=>r.kind==='coverage')).toMatchObject({person:'Nona',start_at:'2027-01-01T07:00:00.000Z',end_at:'2027-01-01T15:00:00.000Z'});
  await expect(card).toContainText('Nona');await card.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await page.screenshot({animations:'disabled',path:'test-results/p137-new-year-'+locale+'-390.png'});
 }finally{await context.close();}
});

test('P138: Nona meal preserves the full food description, stated time and one solids record after reload',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});await page.clock.setFixedTime(new Date('2026-10-18T13:50:00Z'));
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 const text='Half a jar of food (chicken, sweet potato, broccoli, and avocado mixed) at 12:45 fed by Nona';
 await page.locator('#quickText').fill(text);await page.locator('#quickUnderstand').click();await expect(page.locator('#inlineItems .smartItem')).toHaveCount(1);await expect(page.locator('#inlineItems')).not.toContainText('How many ounces');await expect(page.locator('#inlineItems .smartMealNote')).toHaveText(text);
 await expect(page.locator('#inlineSave')).toBeDisabled();await expect(page.locator('#smartChoiceStatus')).toContainText('choose AM or PM');await page.locator('#inlineItems [data-smartchoice][data-choice="PM"]').click();await expect(page.locator('#inlineSave')).toBeEnabled();
 await page.locator('#inlineItems [data-changecredit]').click();await expect(page.locator('#inlineSave')).toBeDisabled();await page.locator('#inlineItems [data-creditchoice][data-person="Nona"]').click();await expect(page.locator('#inlineSave')).toBeEnabled();await page.locator('#inlineSave').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')).length)).toBe(1);await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('#bootCinematic .introSkip').click();await expect(page.locator('#bootCinematic')).toHaveCount(0);
 const card=page.locator('#timeline .entry').filter({hasText:text});await expect(card).toHaveCount(1);await expect(card.locator('.note').first()).toHaveText(text);await expect(card.locator('details')).toHaveCount(0);await expect(card.locator('.entrytop')).toContainText('12:45 PM');await expect(card.locator('.chips')).toContainText('Nona');
 const [row]=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')));expect(row.amount_oz).toBeNull();expect(row.tags).toEqual(['solids']);expect(row.note).toBe(text);expect(row.details.sourceText).toBe(text);expect(row.event_time).toBe('2026-10-18T12:45:00.000Z');
 await card.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await page.screenshot({animations:'disabled',path:'test-results/p138-nona-solids-390.png'});
});

test('P138: removing an unresolved bottle and correcting a draft cannot leave a hidden save blocker',async({page})=>{
 await page.setViewportSize({width:320,height:740});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});await page.clock.setFixedTime(new Date('2026-10-18T13:50:00Z'));
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('#quickText').fill('Nona gave avocado and a bottle at 12:45 pm');await page.locator('#quickUnderstand').click();await expect(page.locator('#inlineItems .smartItem')).toHaveCount(2);await expect(page.locator('#inlineSave')).toBeDisabled();
 await page.locator('#inlineItems .smartItem').filter({hasText:'Feeding'}).locator('[data-smartremove]').click();await expect(page.locator('#inlineItems .smartItem')).toHaveCount(1);await expect(page.locator('#inlineSave')).toBeEnabled();
 await page.locator('#inlineSave').click();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')).length)).toBe(1);
 await page.locator('#quickText').fill('Nona gave banana at 12:50 pm');await page.locator('#quickUnderstand').click();await expect(page.locator('#inlineSave')).toBeEnabled();
 const corrected='Nona gave chicken and broccoli at 12:55 pm';await page.locator('#quickText').fill(corrected);await expect(page.locator('#inlineClarify')).toBeHidden();await expect(page.locator('#inlineSave')).toBeDisabled();await page.locator('#quickUnderstand').click();await expect(page.locator('#inlineItems .smartMealNote')).toHaveText(corrected);await page.locator('#inlineSave').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')).length)).toBe(2);const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')));expect(rows.every(r=>r.amount_oz==null&&r.tags.includes('solids'))).toBe(true);expect(rows.find(r=>r.note===corrected).event_time).toBe('2026-10-18T12:55:00.000Z');expect(rows.some(r=>r.note==='Nona gave banana at 12:50 pm')).toBe(false);
});

test('P140: bottle estimate excludes overnight feeds and a logged nap in local time',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/New_York',reducedMotion:'reduce'}),page=await context.newPage();
 try{
  await syntheticCareBackend(page);await page.clock.setFixedTime(new Date('2026-10-19T20:00:00Z'));
  await page.addInitScript(()=>{
   const at=h=>new Date(2026,9,19,h,0).toISOString();
   const rows=[1,5,8,12,15].map(h=>({id:'qa-feed-'+h,baby_id:'qa-baby',event_type:'feed',event_time:at(h),amount_oz:8,tags:[],caregivers:['KJ'],note:'Synthetic bottle'}));
   rows.push({id:'qa-nap',baby_id:'qa-baby',event_type:'sleep',event_time:at(9),amount_oz:null,tags:['sleep'],caregivers:['Nona'],note:'Synthetic nap',details:{sleep:{kind:'nap',start_at:at(9),end_at:at(10)}}});
   if(!localStorage.getItem('qa-remote-events'))localStorage.setItem('qa-remote-events',JSON.stringify(rows));
  });
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
  await expect(page.locator('#heroWhy')).toContainText('1 recent daytime interval');await expect(page.locator('#heroWhy')).toContainText('180 minutes');await expect(page.locator('#heroWhy')).toContainText('Recorded sleep and overnight gaps');await expect(page.locator('#heroNext')).toHaveText('6:00 PM');
  await page.locator('.heroNext').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({animations:'disabled',path:'test-results/p140-daytime-bottle-390.png'});
  await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await expect(page.locator('#heroNext')).toHaveText('6:00 PM');await expect(page.locator('#heroWhy')).toContainText('180 minutes');
 }finally{await context.close();}
});

for(const caregiver of ['KJ','Luca'])test('P141: '+caregiver+' can log quick care and retain credit through editing and reload',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(name=>localStorage.setItem('luca-caregiver',name),caregiver);
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await expect(page.locator('#deviceCaregiver')).toHaveValue(caregiver);
 await page.locator('#topQuickBottle').click();await expect(page.locator('.quickBottleCredit')).toContainText(caregiver);await page.locator('[data-quick-oz="6"]').click();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')||'[]').length)).toBe(1);
 await page.locator('#timeline [data-edit]').first().click();await expect(page.locator('#manualComposer [data-person="'+caregiver+'"]')).toHaveClass(/on/);await page.locator('#manualComposer [data-oz="7"]').click();await page.locator('#saveEntry').click();await expect(page.locator('#manualComposer')).toBeHidden();await expect(page.locator('#oz')).toHaveText('7');
 await page.locator('#topQuickPoop').click();await page.locator('#quickPoopCaregiver').selectOption(caregiver);await page.screenshot({animations:'disabled',path:'test-results/p141-'+caregiver.toLowerCase()+'-caregiver-390.png'});await page.locator('#quickPoopSave').click();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')||'[]').length)).toBe(2);
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await expect(page.locator('#timeline .entry')).toHaveCount(2);await expect(page.locator('#manualComposer [data-person="'+caregiver+'"]')).toHaveCount(1);
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')));expect(rows.every(r=>r.caregivers.length===1&&r.caregivers[0]===caregiver)).toBe(true);expect(rows.find(r=>r.event_type==='feed').amount_oz).toBe(7);expect(rows.some(r=>r.tags.includes('poop'))).toBe(true);
});

test('P142: shared bottle credit and bath points survive save, edit and reload',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});await page.clock.setFixedTime(new Date('2026-10-20T16:00:00Z'));await page.addInitScript(()=>localStorage.setItem('luca-caregiver','Sam'));
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');
 await page.locator('#topQuickBottle').click();await page.locator('#quickBottlePicker summary').click();await page.locator('#quickBottleHelper').selectOption('Luca');await page.locator('[data-quick-oz="8"]').click();await expect(page.locator('#oz')).toHaveText('8');await expect(page.locator('#feeds')).toHaveText('1');
 await page.locator('#timeline [data-edit]').first().click();await expect(page.locator('#manualComposer [data-person="Sam"]')).toHaveClass(/on/);await expect(page.locator('#manualComposer [data-person="Luca"]')).toHaveClass(/on/);await page.locator('#notes').fill('Sam made it. Luca held it.');await page.locator('#saveEntry').click();
 await page.locator('#quickText').fill('Sam and Luca shared 8 oz at 12 pm');await page.locator('#quickUnderstand').click();await expect(page.locator('#inlineItems')).toContainText('Sam + Luca');await page.locator('#inlineItems [data-changecredit]').click();await page.locator('#inlineItems [data-creditchoice][data-person="Sam"]').click();await page.locator('#inlineItems [data-creditchoice][data-person="Luca"]').click();await page.locator('#inlineSave').click();await expect(page.locator('#feeds')).toHaveText('2');
 await page.locator('#quickText').fill('Sam gave Luca a shower at 1:15 pm');await page.locator('#quickUnderstand').click();await expect(page.locator('#inlineItems .smartItem')).toHaveCount(1);await expect(page.locator('#inlineItems')).toContainText('Bath');await page.locator('#inlineSave').click();
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('#bootCinematic .introSkip').click();await expect(page.locator('#bootCinematic')).toHaveCount(0);await expect(page.locator('#oz')).toHaveText('16');await expect(page.locator('#feeds')).toHaveText('2');await expect(page.locator('#timeline .entry')).toHaveCount(3);
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')));expect(rows.filter(x=>x.event_type==='feed').every(x=>JSON.stringify(x.caregivers)==='["Sam","Luca"]')).toBe(true);expect(rows.find(x=>x.tags.includes('bath')).event_time).toBe('2026-10-20T13:15:00.000Z');
 await page.locator('#navMore').click();await page.locator('#menuLeaderboard').click();await expect(page.locator('.lbRow').filter({hasText:'Sam'})).toContainText('4 pts');await expect(page.locator('.lbRow').filter({hasText:'Luca'})).toContainText('2 pts');await page.screenshot({animations:'disabled',path:'test-results/p142-shared-bath-390.png'});
});

test('P142: KJ starts at 33 stars, earns a reward, redeems, corrects and syncs offline awards',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{if(!localStorage.getItem('qa-remote-events'))localStorage.setItem('qa-remote-events',JSON.stringify([{id:'qa-kj-opening',baby_id:'qa-baby',event_time:'2026-10-19T21:38:05Z',event_type:'other',tags:['stars'],caregivers:['KJ'],details:{starChart:{version:1,action:'opening',person:'KJ',delta:33}}}]));});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('#navMore').click();await page.locator('#menuStars').click();await expect(page.locator('#starsView')).toHaveClass(/active/);await expect(page.locator('#starPerson')).toHaveValue('KJ');await expect(page.locator('#starBalance')).toHaveText('33');await page.screenshot({animations:'disabled',path:'test-results/p142-kj-stars-390.png'});
 await page.locator('#starAmount').fill('2');await page.locator('#starReason').fill('Helped without being asked');await page.locator('#starAward').click();await expect(page.locator('#starBalance')).toHaveText('35');
 await page.locator('#starGoalEditor summary').click();await page.locator('#starGoalTarget').fill('35');await page.locator('#starGoalReward').fill('Pick a new book');await page.locator('#starGoalForm button').click();await expect(page.locator('#starRedeem')).toBeVisible();page.once('dialog',d=>d.accept());await page.locator('#starRedeem').click();await expect(page.locator('#starBalance')).toHaveText('0');await expect(page.locator('.starReward')).toContainText('Reward claimed');
 await page.evaluate(()=>window.syntheticOffline=true);await page.locator('#starAmount').fill('1');await page.locator('#starReason').fill('Offline kindness');await page.locator('#starAward').click();await expect(page.locator('#starBalance')).toHaveText('1');await expect(page.locator('#starStatus')).toContainText('waiting');await page.evaluate(()=>window.syntheticOffline=false);await page.locator('nav [data-tab="today"]').click();await page.locator('#syncDot').click();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await expect(page.locator('#timeline .entry')).toHaveCount(0);await expect(page.locator('#feeds')).toHaveText('0');
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('#bootCinematic .introSkip').click();await expect(page.locator('#bootCinematic')).toHaveCount(0);await page.locator('#navMore').click();await page.locator('#menuStars').click();await expect(page.locator('#starBalance')).toHaveText('1');page.once('dialog',d=>d.accept());await page.locator('.starReceipt').filter({hasText:'Offline kindness'}).locator('button').click();await expect(page.locator('#starBalance')).toHaveText('0');await expect(page.locator('.starReceipt').filter({hasText:'Offline kindness'})).toContainText('undone');
 page.once('dialog',d=>d.accept());await page.locator('.starReceipt').filter({hasText:'Pick a new book'}).locator('button').click();await expect(page.locator('#starBalance')).toHaveText('35');await expect(page.locator('#starRedeem')).toBeVisible();
});

test('P142: adult bonus stars are claimable once and never inflate KJ or care totals',async({page})=>{
 await page.setViewportSize({width:320,height:740});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});await page.clock.setFixedTime(new Date('2026-10-20T16:00:00Z'));await page.addInitScript(()=>{const at='2026-10-20T15:00:00Z';localStorage.setItem('qa-remote-events',JSON.stringify([{id:'qa-kj-opening',baby_id:'qa-baby',event_time:'2026-10-19T21:38:05Z',event_type:'other',tags:['stars'],caregivers:['KJ'],details:{starChart:{version:1,action:'opening',person:'KJ',delta:33}}},{id:'qa-bath',baby_id:'qa-baby',event_time:at,event_type:'bath',tags:['bath'],caregivers:['Sam'],details:{}}]));});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('#navMore').click();await page.locator('#menuStars').click();await page.locator('#starPerson').selectOption('Sam');await expect(page.locator('#starBalance')).toHaveText('0');await page.locator('[data-star-bonus="suds"]').click();await expect(page.locator('#starBalance')).toHaveText('1');await expect(page.locator('[data-star-bonus="suds"]')).toBeDisabled();await page.screenshot({animations:'disabled',path:'test-results/p142-adult-stars-320.png'});await page.locator('#starPerson').selectOption('KJ');await expect(page.locator('#starBalance')).toHaveText('33');
 await page.locator('nav [data-tab="today"]').click();await expect(page.locator('#timeline .entry')).toHaveCount(1);await expect(page.locator('#feeds')).toHaveText('0');const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-remote-events')));expect(rows.filter(x=>x.tags.includes('stars')&&x.details?.starChart?.action!=='opening')).toHaveLength(1);
});

test('P142: a large history still loads KJ opening stars from later pages',async({page})=>{
 await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});await page.clock.setFixedTime(new Date('2026-10-20T16:00:00Z'));
 await page.addInitScript(()=>{const rows=Array.from({length:1000},(_,i)=>({id:'qa-old-'+i,baby_id:'qa-baby',event_time:'2026-10-01T12:00:00Z',event_type:'feed',amount_oz:8,tags:[],caregivers:['Sam']}));rows.push({id:'qa-old-opening',baby_id:'qa-baby',event_time:'2026-09-30T12:00:00Z',event_type:'other',tags:['stars'],caregivers:['KJ'],details:{starChart:{version:1,action:'opening',person:'KJ',delta:33}}});localStorage.setItem('qa-remote-events',JSON.stringify(rows));});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await page.locator('#navMore').click();await page.locator('#menuStars').click();await expect(page.locator('#starBalance')).toHaveText('33');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('luca-log-v2')).length)).toBe(1001);
});

test('P139: a new phone can reopen family sign-in, correct a code and stay connected after reload',async({page})=>{
 await page.setViewportSize({width:390,height:844});await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});
 const remote=[];page.on('request',r=>{if(r.url().includes('.supabase.co/'))remote.push(r.url());});
 await page.addInitScript(()=>{
  const client=window.syntheticClient,verified=client.auth.getUser;
  client.auth.getUser=async()=>localStorage.getItem('qa-device-connected')?verified():{data:{user:null},error:{name:'AuthSessionMissingError',message:'Auth session missing!',status:400}};
  window.qaJoinCalls=[];window.qaPasswordCalls=0;
  client.functions={invoke:async(name,{body})=>{window.qaJoinCalls.push({name,body});return body.code==='QA-FAMILY'?{data:{email:'qa-device@example.invalid',password:'synthetic-password'},error:null}:{data:null,error:{name:'FunctionsHttpError',message:'Invalid test code'}};}};
  client.auth.signInWithPassword=async credentials=>{window.qaPasswordCalls++;if(credentials.email!=='qa-device@example.invalid'||credentials.password!=='synthetic-password')return {error:{message:'Invalid test credentials'}};localStorage.setItem('qa-device-connected','1');return {data:{user:{id:'qa-user'}},error:null};};
 });
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());
 await expect(page.locator('#syncDot')).toContainText('connect family sync');await expect(page.locator('#syncDot')).not.toContainText('unavailable');
 await page.locator('#openFamilySync').click();await expect(page.locator('#deviceFamilyCode')).toBeVisible();await page.locator('#dismissSync').click();await expect(page.locator('#authGate')).toBeHidden();
 await page.locator('#syncDot').click();await expect(page.locator('#deviceFamilyCode')).toBeVisible();await expect(page.locator('#authStatus')).toContainText('family code');await page.locator('#dismissSync').click();
 await page.locator('#navMore').click();await page.locator('#menuSync').click();await expect(page.locator('#sideMenu')).not.toHaveClass(/open/);await expect(page.locator('#deviceFamilyCode')).toBeVisible();
 await page.locator('#deviceCaregiver').selectOption('Nona');await page.locator('#deviceFamilyCode').fill('QA-FAMILY');await page.locator('#authGate').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({animations:'disabled',path:'test-results/p139-family-signin-390.png'});
 await page.locator('#deviceFamilyCode').fill('WRONG-TEST-CODE');await page.locator('#deviceJoin').click();await expect(page.locator('#authStatus')).toContainText("Couldn't connect");await expect(page.locator('#deviceJoin')).toBeEnabled();expect(await page.evaluate(()=>window.qaPasswordCalls)).toBe(0);
 await page.locator('#deviceFamilyCode').fill('QA-FAMILY');await page.locator('#deviceJoin').click();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');await expect(page.locator('#authGate')).toBeHidden();
 const join=await page.evaluate(()=>({calls:window.qaJoinCalls,passwordCalls:window.qaPasswordCalls,caregiver:localStorage.getItem('luca-caregiver')}));expect(join.calls[1]).toEqual({name:'join-family-device',body:{code:'QA-FAMILY',caregiver:'Nona'}});expect(join.passwordCalls).toBe(1);expect(join.caregiver).toBe('Nona');
 await page.reload();await expect(page.locator('#syncDot')).toHaveText('☁️ Timeline synced');expect(await page.evaluate(()=>localStorage.getItem('luca-caregiver'))).toBe('Nona');expect(remote).toEqual([]);
});

test('P139: a failed connection check still leaves family sign-in reachable',async({page})=>{
 await syntheticCareBackend(page);await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>{window.syntheticClient.auth.getUser=async()=>{throw {name:'AuthRetryableFetchError',code:'network'};};});
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('bootCinematic')?.remove());await expect(page.locator('#syncDot')).toContainText('Family sync unavailable');await page.locator('#openFamilySync').click();await expect(page.locator('#deviceFamilyCode')).toBeVisible();await expect(page.locator('#deviceJoin')).toBeEnabled();
});

test('P136: offline practice navigation never falls back to real family data cached by the service worker',async({browser})=>{
 const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();try{
  await page.route('https://**/*',route=>route.abort());await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(async()=>{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;});await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller!==null)).toBe(true);
  await context.serviceWorkers()[0].evaluate(()=>{self.fetch=()=>Promise.reject(new TypeError('Synthetic network unavailable'));});await context.setOffline(true);await page.goto('http://127.0.0.1:8765/demo.html',{waitUntil:'domcontentloaded'});await expect(page.locator('h1')).toHaveText('Practice mode is offline');await expect(page.locator('#timeline')).toHaveCount(0);await expect(page.locator('#syncDot')).toHaveCount(0);
 }finally{await context.close();}
});
