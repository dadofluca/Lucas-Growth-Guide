/* Shared browser/worker rules. Does not read storage, send pushes or write care. */
(function(root){
 'use strict';
 function safeProductURL(value){
  if(!String(value||'').trim())return null;
  try{const u=new URL(String(value).trim()),h=u.hostname.toLowerCase();if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.includes(':')||/^\d+(\.\d+){3}$/.test(h)||!h.includes('.')||u.href.length>2048)return null;return u.href;}catch{return null;}
 }
 function validTimeZone(value){try{new Intl.DateTimeFormat('en',{timeZone:value}).format();return typeof value==='string'&&!!value;}catch{return false;}}
 function quiet(device,now=Date.now()){
  if(!validTimeZone(device.timezone))return true;
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:device.timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(+new Date(now)).map(x=>[x.type,x.value]));
  const toMinute=s=>{const m=String(s||'').match(/^(\d\d):(\d\d)/);return m?+m[1]*60+ +m[2]:NaN;};
  const start=toMinute(device.quiet_start),end=toMinute(device.quiet_end),at=+parts.hour*60+ +parts.minute;
  if(!Number.isFinite(start)||!Number.isFinite(end))return true;
  return start===end?true:start<end?at>=start&&at<end:at>=start||at<end;
 }
 function asleep(entries,now=Date.now(),timeZone){
  now=+new Date(now);const sessions=[...(root.LucaSleep?.resolve(entries,now,timeZone)||new Map()).values()];
  return sessions.some(s=>Number.isFinite(s.start)&&s.start<=now&&((s.complete&&s.end>now)||s.ongoing||!s.complete&&!Number.isFinite(s.end)));
 }
 function feedReminder(entries,device,now=Date.now()){
  now=+new Date(now);if(!device.enabled||!device.feed_enabled||quiet(device,now)||asleep(entries,now,device.timezone))return null;
  // Worker and Today use the same spacing implementation, in the recipient's time zone.
  const rhythm=root.LucaBottleRhythm.estimate(entries,{now,timeZone:device.timezone,sessions:root.LucaSleep.resolve(entries,now,device.timezone)});
  if(!rhythm.last||!Number.isFinite(rhythm.nextAt)||rhythm.nextAt>now||now-rhythm.nextAt>2*3600000)return null;
  return {key:'feed:'+String(rhythm.last.syncId||rhythm.last.id),nextAt:rhythm.nextAt,learned:rhythm.learned};
 }
 function validPushEndpoint(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['push.apple.com','fcm.googleapis.com','push.services.mozilla.com','notify.windows.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h))&&u.pathname.length>1;}catch{return false;}}
 const api={safeProductURL,validTimeZone,quiet,asleep,feedReminder,validPushEndpoint};root.LucaNotificationRules=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
