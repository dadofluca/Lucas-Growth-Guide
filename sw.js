const CACHE="luca-v12-local-supplies";
self.addEventListener("install",e=>{self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())await caches.delete(k);await self.clients.claim()})())});
self.addEventListener("fetch",e=>{
 if(e.request.mode==="navigate"){e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match("./index.html")));return}
 e.respondWith(fetch(e.request).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request)))
});