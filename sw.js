const CACHE="luca-shell-p140";
const EMERGENCY="./emergency.html";
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(async c=>{await c.add(EMERGENCY);await c.addAll(["./index.html","./care-sync.js?v=140","./sync-fix.js?v=140","./family-pin.js?v=140","./agents/family-chat.js","./agents/family-profiles.js","./agents/avatar-characters.js","./agents/avatar-art.js","./agents/personality.js","./agents/quick-actions.js?v=140","./agents/playfulness.js?v=140","./agents/achievements.js","./agents/achievements-ui.js","./agents/flair-ui.js","./agents/sleep-inference.js?v=140","./agents/sleep-data.js?v=140","./agents/bottle-rhythm.js?v=140","./agents/sleep-ui.js?v=140","./agents/ui-polish.css?v=140","./agents/report-widget.js","./agents/family-ideas.js"]);}))});
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
   if(!html.includes("family-pin.js"))html=html.replace("</body>",'<script src="./family-pin.js?v=140"></script></body>');
   if(!html.includes("sync-fix.js"))html=html.replace("</body>",'<script src="./sync-fix.js?v=140"></script></body>');
   return new Response(html,{status:r.status,statusText:r.statusText,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
  }catch(err){return (await caches.match("./index.html"))||(await caches.match(EMERGENCY))||Response.error()}})());return;
 }
 const staticAsset=/\.(?:js|css|png|jpe?g|svg|ico|webp|mov|mp3|mp4|woff2?|webmanifest)$/i.test(new URL(e.request.url).pathname);
 if(!staticAsset)return;
 e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request)))
});
