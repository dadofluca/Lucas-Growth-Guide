const CACHE="luca-v43-quick-bottle";
self.addEventListener("install",e=>{self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())await caches.delete(k);await self.clients.claim()})())});
self.addEventListener("fetch",e=>{
 if(e.request.mode==="navigate"){
  e.respondWith((async()=>{try{
   const r=await fetch(e.request,{cache:"no-store"});if(!r.ok)return r;let html=await r.text();
   if(!html.includes("family-pin.js"))html=html.replace("</body>",'<script src="./family-pin.js?v=43"></script></body>');
   if(!html.includes("sync-fix.js"))html=html.replace("</body>",'<script src="./sync-fix.js?v=43"></script></body>');
   return new Response(html,{status:r.status,statusText:r.statusText,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
  }catch(err){return caches.match("./index.html")||Response.error()}})());return;
 }
 e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request)))
});