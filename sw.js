const CACHE="luca-v54-clean-core-r2";
self.addEventListener("install",e=>{self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())await caches.delete(k);await self.clients.claim()})())});
self.addEventListener("fetch",e=>{
 if(e.request.mode==="navigate"){
  e.respondWith((async()=>{try{
   const r=await fetch(e.request,{cache:"no-store"});if(!r.ok)return r;let html=await r.text();
   if(!html.includes("app-config.js"))html=html.replace("</head>",'<script src="./app-config.js?v=54"></script></head>');
   if(!html.includes("app-core.js"))html=html.replace("</body>",'<script src="./app-core.js?v=54"></script></body>');
   if(!html.includes("intro.js"))html=html.replace("</body>",'<script src="./intro.js?v=54"></script></body>');
   if(!html.includes("family-pin.js"))html=html.replace("</body>",'<script src="./family-pin.js?v=54"></script></body>');
   if(!html.includes("sync-fix.js"))html=html.replace("</body>",'<script src="./sync-fix.js?v=54"></script></body>');
   if(!html.includes("schedule-controller.js"))html=html.replace("</body>",'<script src="./schedule-controller.js?v=54"></script></body>');
   return new Response(html,{status:r.status,statusText:r.statusText,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
  }catch(err){return caches.match("./index.html")||Response.error()}})());return;
 }
 e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request)))
});