const CACHE="luca-v67-emergency-backup";
const EMERGENCY="./emergency.html";
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.add(EMERGENCY)).catch(()=>{}))});
self.addEventListener("install",e=>{self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())await caches.delete(k);await self.clients.claim()})())});
self.addEventListener("fetch",e=>{
 if(new URL(e.request.url).pathname.endsWith("/emergency.html")){e.respondWith(fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(EMERGENCY,r.clone()));return r}).catch(()=>caches.match(EMERGENCY).then(r=>r||Response.error())));return;}
 if(e.request.mode==="navigate"){
  e.respondWith((async()=>{try{
   const r=await fetch(e.request,{cache:"no-store"});if(!r.ok)return r;let html=await r.text();
   if(!html.includes("family-pin.js"))html=html.replace("</body>",'<script src="./family-pin.js?v=66"></script></body>');
   if(!html.includes("sync-fix.js"))html=html.replace("</body>",'<script src="./sync-fix.js?v=66"></script></body>');
   return new Response(html,{status:r.status,statusText:r.statusText,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
  }catch(err){return caches.match("./index.html")||Response.error()}})());return;
 }
 e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request)))
});