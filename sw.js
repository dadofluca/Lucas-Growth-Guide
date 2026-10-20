importScripts("./agents/notification-rules.js?v=149");
const CACHE="luca-shell-p149";
const EMERGENCY="./emergency.html";
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(async c=>{await c.add(EMERGENCY);await c.addAll(["./agents/notification-rules.js?v=149","./agents/notifications.js?v=149","./agents/supplies.js?v=149","./agents/notifications.css?v=149","./index.html","./care-sync.js?v=149","./sync-fix.js?v=149","./family-pin.js?v=149","./agents/family-chat.js","./agents/family-profiles.js","./agents/avatar-characters.js","./agents/avatar-art.js","./agents/personality.js","./agents/quick-actions.js?v=149","./agents/playfulness.js?v=149","./agents/achievements.js","./agents/achievements-ui.js","./agents/flair-ui.js","./agents/sleep-inference.js?v=149","./agents/sleep-data.js?v=149","./agents/bottle-rhythm.js?v=149","./agents/insights.js?v=149","./agents/personal-updates.js?v=149","./agents/sleep-ui.js?v=149","./agents/family-stars.js?v=149","./agents/caregiver-credit.js?v=149","./agents/caregiver-credit.js","./agents/stars-ui.js?v=149","./agents/ui-polish.css?v=149","./agents/report-widget.js","./agents/family-ideas.js","./agents/family-ideas-model.js","./agents/themes.js","./agents/member-viewer.js"]);}))});
self.addEventListener("install",e=>{self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith("luca-")&&k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET"||new URL(e.request.url).origin!==self.location.origin)return;
 // A practice navigation must never fall through to the real family's cached app.
 if(new URL(e.request.url).pathname.endsWith("/demo.html")){e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>new Response('<!doctype html><title>Practice mode offline</title><body style="background:#e7dfd2;color:#243e35;font:18px system-ui;padding:32px"><h1>Practice mode is offline</h1><p>Reconnect and reopen this practice link. No family data has been opened.</p></body>',{headers:{"Content-Type":"text/html; charset=utf-8"}})));return;}
 if(new URL(e.request.url).pathname.endsWith("/emergency.html")){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(EMERGENCY,copy))}return r}).catch(()=>caches.match(EMERGENCY).then(r=>r||Response.error())));return;}
 if(e.request.mode==="navigate"){
  e.respondWith((async()=>{try{
   const r=await fetch(e.request,{cache:"no-store"});if(!r.ok)return r;let html=await r.text();
   if(!html.includes("family-pin.js"))html=html.replace("</body>",'<script src="./family-pin.js?v=149"></script></body>');
   if(!html.includes("sync-fix.js"))html=html.replace("</body>",'<script src="./sync-fix.js?v=149"></script></body>');
   return new Response(html,{status:r.status,statusText:r.statusText,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
  }catch(err){return (await caches.match("./index.html"))||(await caches.match(EMERGENCY))||Response.error()}})());return;
 }
 const staticAsset=/\.(?:js|css|png|jpe?g|svg|ico|webp|mov|mp3|mp4|woff2?|webmanifest)$/i.test(new URL(e.request.url).pathname);
 if(!staticAsset)return;
 e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request)))
});

// Every push produces a visible notification; no hidden polling or silent push.
self.addEventListener('push',event=>{
 event.waitUntil((async()=>{
  let message={};try{message=event.data?.json()||{};}catch{}
  const data=message.data||{};
  await self.registration.showNotification(String(message.title||'Family update').slice(0,120),{body:String(message.body||'Open the app to see the latest update.').slice(0,240),tag:String(message.tag||'family-update').slice(0,100),renotify:false,data});
  if(data.kind==='chat'&&Number.isInteger(data.badge)&&data.badge>0)try{await self.navigator.setAppBadge?.(Math.min(data.badge,99));}catch{}
 })());
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();event.waitUntil((async()=>{
  const data=event.notification.data||{},base=new URL(self.registration.scope);let url;
  try{url=new URL(data.url||base.href,base);}catch{url=base;}
  const internal=url.origin===base.origin&&url.pathname.startsWith(base.pathname);
  if(!internal){const safe=self.LucaNotificationRules.safeProductURL(url.href);await self.clients.openWindow(safe||base.href);return;}
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){const page=new URL(client.url);if(page.origin!==base.origin||![base.pathname,base.pathname+'index.html'].includes(page.pathname))continue;try{await client.focus();client.postMessage({type:'luca:notification-open',url:url.href});return;}catch{}}
  await self.clients.openWindow(url.href);
 })());
});
