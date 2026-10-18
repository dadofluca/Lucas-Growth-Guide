import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";

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
 await expect(page.locator("#history")).toContainText(/No history yet|entries|Loading history/);
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

test("P116: quick Poop opens editable poop-size and wet/messy confirmation",async({page})=>{
 await page.setViewportSize({width:390,height:750});
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await page.locator('.heroBtn[data-quick="poop"]').click();
 await expect(page.locator("#manualComposer")).toBeVisible();
 await expect(page.locator("#poopDetails")).toBeVisible();
 await expect(page.locator('#manualComposer [data-tag="poop"]')).toHaveClass(/on/);
 await expect(page.locator("#poopSize")).toHaveValue("3");
 await expect(page.locator("#poopWet")).not.toBeChecked();
 await expect(page.locator("#saveEntry")).toHaveText("Confirm entry");
});

test("P119: top Poop button opens detailed size and wetness confirmation",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route("https://znhqaqvocexjsnklnqre.supabase.co/**",route=>route.abort());
 await page.goto("http://127.0.0.1:8765/index.html",{waitUntil:"domcontentloaded"});
 await expect(page.locator("#topQuickBottle")).toBeVisible();
 await expect(page.locator("#topQuickPoop")).toBeVisible();
 const box=await page.locator("#topQuickPoop").boundingBox();
 expect(box.width).toBeGreaterThanOrEqual(44);
 expect(box.height).toBeGreaterThanOrEqual(44);
 await page.locator("#topQuickPoop").click();
 await expect(page.locator("#manualComposer")).toBeVisible();
 await expect(page.locator("#poopDetails")).toBeVisible();
 await expect(page.locator("#saveEntry")).toHaveText("Confirm entry");
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
   let op='read',payload=null,filters={},ignoreDuplicates=false;
   const q={insert(v){op='insert';payload=v;return q},update(v){op='update';payload=v;return q},upsert(v,options){op='upsert';payload=v;ignoreDuplicates=!!options?.ignoreDuplicates;return q},delete(){op='delete';return q},select(){return q},eq(k,v){filters[k]=v;return q},order(){return q},limit(){return q},single(){return q},gte(){return q},lt(){return q},abortSignal(){return q},
    then(resolve,reject){return Promise.resolve().then(async()=>{
     if(table==='family_profiles'){
      if(op==='upsert'&&window.syntheticProfileSaveDelay)await new Promise(resolve=>setTimeout(resolve,window.syntheticProfileSaveDelay));
      let profiles=JSON.parse(localStorage.getItem('qa-profiles')||'[]');
      if(op==='upsert'&&!(ignoreDuplicates&&profiles.some(x=>x.user_id===payload.user_id))){profiles=profiles.filter(x=>x.user_id!==payload.user_id);profiles.push(payload);}
      if(op==='update')profiles=profiles.map(x=>Object.entries(filters).every(([k,v])=>x[k]===v)?{...x,...payload}:x);
      localStorage.setItem('qa-profiles',JSON.stringify(profiles));
      return {data:profiles.filter(x=>Object.entries(filters).every(([k,v])=>x[k]===v)),error:null};
     }
     if(table==='family_chat_messages')return {data:JSON.parse(localStorage.getItem('qa-chat')||'[]'),error:null};
     if(table!=='baby_events')return {data:[],error:null};
     if(window.syntheticOffline)return {data:null,error:{code:'network'}};
     const rows=read();
     if(op==='insert'){if(rows.some(x=>x.id===payload.id))return {error:{code:'23505'}};write([...rows,payload]);return {data:payload,error:null};}
     if(op==='update'){const old=rows.find(x=>x.id===filters.id);if(!old)return {error:{code:'PGRST116'}};const saved={...old,...payload};write(rows.map(x=>x.id===saved.id?saved:x));return {data:saved,error:null};}
     if(op==='delete'){write(rows.filter(x=>x.id!==filters.id));return {data:[{id:filters.id}],error:null};}
     const matching=rows.filter(x=>Object.entries(filters).every(([key,value])=>x[key]===value));
     return {data:filters.id?matching[0]:matching,error:null};
    }).then(resolve,reject);}
   };return q;
  }
  const channel={on(){return channel},subscribe(){return channel}};
  window.syntheticClient={auth:{getUser:async()=>({data:{user:{id:'qa-user',email:'synthetic@example.invalid'}}}),onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}},rpc:async()=>({data:[{baby_id:'qa-baby',family_id:'qa-family'}]}),from:query,channel:()=>channel,removeChannel:async()=>{}};
  localStorage.setItem('luca-caregiver','Synthetic caregiver');localStorage.setItem('luca-sound','off');sessionStorage.setItem('hideSync','1');
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
 await expect(page.locator('#buildVersion')).toBeVisible();await expect(page.locator('#buildVersion')).toHaveText('P134');
 await expect(page.locator('#lucaNow')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>window.LUCA_PATCH)).toBe('P134');
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
