/* Device opt-in and settings. Care reminders are delivered by the server, never a page timer. */
(function(root){
 'use strict';
 function mount({host,getContext,toast}){
  const rules=root.LucaNotificationRules;
  host.innerHTML='<section class="card notificationPanel"><h2>A little heads-up</h2><p>Choose what reaches this phone. Each family member controls their own alerts.</p><p id="pushState" role="status" aria-live="polite"></p><div class="notificationActions"><button type="button" id="pushEnable" class="confirm">Enable on this phone</button><button type="button" id="pushDisable" class="tiny" hidden>Turn off on this phone</button><button type="button" id="pushTest" class="tiny" hidden>Test this phone</button></div><form id="pushPreferences"><fieldset><legend>Send me</legend><label class="notificationChoice"><input type="checkbox" id="pushFeeds" checked><span><b>Next bottle</b><small>One estimate-based reminder. Paused during logged sleep and quiet hours.</small></span></label><label class="notificationChoice"><input type="checkbox" id="pushChat" checked><span><b>Family chat</b><small>Grouped messages. Tap a notification to open chat.</small></span></label><label class="notificationChoice"><input type="checkbox" id="pushSupplies" checked><span><b>Supplies running low</b><small>Open the saved product or checkout link. A designated buyer gets their item’s alert.</small></span></label></fieldset><fieldset><legend>Sleep &amp; quiet hours</legend><div class="notificationTimes"><label>Quiet from<input id="pushQuietStart" type="time" value="21:00" required></label><label>Until<input id="pushQuietEnd" type="time" value="06:00" required></label></div><label>Time zone<input id="pushTimezone" type="text" maxlength="79" autocomplete="off" required></label><label class="notificationChoice"><input id="pushQuietAll" type="checkbox"><span>Also pause chat and supply alerts during these hours</span></label><small>Feed alerts always respect these hours and logged naps/night sleep. Matching start and end pauses feeds all day. An unlogged nap cannot be detected.</small></fieldset><fieldset><legend>Lock Screen privacy</legend><label class="notificationChoice"><input id="pushPreviews" type="checkbox"><span>Show sender names and message previews</span></label><small>Off by default. Your iPhone’s Focus and notification settings also apply.</small></fieldset><button id="pushSave" class="confirm" type="submit">Save notification choices</button></form><p class="why">On iPhone: add this app to your Home Screen, open it from its icon, then enable notifications here. You can change permissions in iPhone Settings → Notifications.</p></section>';
  const $=id=>host.querySelector('#'+id),state=$('pushState'),form=$('pushPreferences');
  let device=null,scope='',generation=0,busy=false,knownContext=null;
  const supported=()=>!!(navigator.serviceWorker&&root.PushManager&&root.Notification);
  const key=c=>c.family&&c.user?.id?c.family+':'+c.user.id:'';
  const storageKey=c=>'luca-push-device:'+key(c);
  const status=text=>{state.textContent=text;};
  $('pushTimezone').value=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
  function values(){const timezone=$('pushTimezone').value.trim();if(!rules.validTimeZone(timezone))throw Error('Choose a valid time zone, such as America/New_York.');return {feed_enabled:$('pushFeeds').checked,chat_enabled:$('pushChat').checked,supplies_enabled:$('pushSupplies').checked,previews:$('pushPreviews').checked,quiet_all:$('pushQuietAll').checked,quiet_start:$('pushQuietStart').value,quiet_end:$('pushQuietEnd').value,timezone};}
  function fill(d){for(const [id,field] of [['pushFeeds','feed_enabled'],['pushChat','chat_enabled'],['pushSupplies','supplies_enabled'],['pushPreviews','previews'],['pushQuietAll','quiet_all']])$(id).checked=!!d[field];$('pushQuietStart').value=d.quiet_start?.slice(0,5)||'21:00';$('pushQuietEnd').value=d.quiet_end?.slice(0,5)||'06:00';$('pushTimezone').value=d.timezone||'UTC';}
  function buttons(){const ready=!!key(getContext()),on=!!device?.enabled;$('pushEnable').hidden=on;$('pushEnable').disabled=busy||!ready||(!root.LucaDemo&&!supported());$('pushDisable').hidden=!on;$('pushTest').hidden=!on;for(const id of ['pushSave','pushDisable','pushTest'])$(id).disabled=busy||!ready;}
  async function invoke(action,extra={}){const c=getContext(),{data,error}=await c.client.functions.invoke('push-notifications',{body:{action,family:c.family,...extra}});if(error||data?.error)throw Error(data?.error||'Couldn’t reach notification delivery. Try again when connected.');return data;}
  async function heartbeat(){
   const c=getContext();if(!device?.enabled||key(c)!==scope||busy||root.LucaDemo)return;
   const visible=document.visibilityState==='visible',chat=visible&&document.querySelector('#chatView.active');
   const patch={last_seen_at:new Date().toISOString(),active_view:visible?document.querySelector('.view.active')?.id?.replace(/View$/,'')||'today':null,...(chat?{last_chat_read_at:new Date().toISOString()}:{} )};
   try{await c.client.from('push_devices').update(patch).eq('id',device.id).eq('family_id',c.family).eq('user_id',c.user.id);if(chat)await navigator.clearAppBadge?.();}catch{}
  }
  async function load(){
   const c=getContext(),next=key(c);if(next===scope&&knownContext){void heartbeat();return;}
   const old=scope,rev=++generation;scope=next;knownContext=c;device=null;buttons();
   // An old browser subscription is not transferred to another family/account.
   if(old&&old!==next&&!root.LucaDemo){try{const reg=await navigator.serviceWorker?.getRegistration();await (await reg?.pushManager.getSubscription())?.unsubscribe();await navigator.clearAppBadge?.();}catch{}}
   if(!next){status('Connect Family sync to choose alerts for this phone.');return;}
   if(root.LucaDemo){const saved=JSON.parse(localStorage.getItem(storageKey(c)+':practice')||'null');if(saved){device=saved;fill(saved);}status('Practice settings only. This playground never requests permission or sends notifications.');buttons();return;}
   if(!supported()){status('Open the app from its Home Screen icon to enable iPhone notifications. This browser doesn’t currently offer Web Push.');return;}
   try{
    const id=localStorage.getItem(storageKey(c));
    if(id){const {data,error}=await c.client.from('push_devices').select('*').eq('id',id).eq('family_id',c.family).eq('user_id',c.user.id).maybeSingle();if(error)throw error;if(rev!==generation)return;device=data;if(data)fill(data);}
    if(device?.enabled){const registration=await navigator.serviceWorker.getRegistration(),subscription=await registration?.pushManager.getSubscription();if(rev!==generation)return;if(root.Notification.permission!=='granted'||!subscription){await c.client.from('push_devices').update({enabled:false}).eq('id',device.id).eq('user_id',c.user.id);device={...device,enabled:false};}}
    status(device?.enabled?'Enabled on this phone. Feed reminders pause while sleep is logged.':root.Notification.permission==='denied'?'Notifications are blocked. Allow them in this app’s iPhone notification settings, then return here.':'Ready when you are. Permission is requested only when you tap Enable.');
   }catch{status('Couldn’t load notification settings. Reconnect and reopen this section.');}
   buttons();void heartbeat();
  }
  async function disconnect(){
   const c=getContext(),previous=device;device=null;buttons();
   if(root.LucaDemo){localStorage.removeItem(storageKey(c)+':practice');status('Practice alerts are off.');return;}
   if(previous){try{await c.client.from('push_devices').update({enabled:false,active_view:null}).eq('id',previous.id).eq('family_id',c.family).eq('user_id',c.user.id);}catch{}}
   try{const reg=await navigator.serviceWorker?.getRegistration();await (await reg?.pushManager.getSubscription())?.unsubscribe();await navigator.clearAppBadge?.();}catch{}
   status('Notifications are off on this phone.');
  }
  $('pushEnable').onclick=async()=>{
   if(busy)return;const c=getContext(),rev=generation;if(!key(c))return;let subscription;
   try{
    const preferences=values();
    // Keep the permission request inside the explicit tap, before any network await.
    const permission=root.LucaDemo?'granted':root.Notification.requestPermission();busy=true;buttons();
    if(await permission!=='granted')throw Error('Notifications were not allowed. You can change this in iPhone Settings.');
    if(root.LucaDemo){device={id:'practice-device',enabled:true,...preferences};localStorage.setItem(storageKey(c)+':practice',JSON.stringify(device));status('Practice choices saved. No notification was sent.');return;}
    const cfg=await invoke('config');if(rev!==generation)throw Error('Family changed. Reopen notifications.');
    const registration=await navigator.serviceWorker.ready;
    const padded=cfg.publicKey.replace(/-/g,'+').replace(/_/g,'/'),bytes=Uint8Array.from(atob(padded+'='.repeat((4-padded.length%4)%4)),x=>x.charCodeAt(0));
    subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
    const json=subscription.toJSON();if(!rules.validPushEndpoint(json.endpoint))throw Error('This push provider is not supported yet.');
    const id=localStorage.getItem(storageKey(c))||crypto.randomUUID(),row={id,family_id:c.family,baby_id:c.baby,user_id:c.user.id,endpoint:json.endpoint,p256dh:json.keys.p256dh,auth:json.keys.auth,enabled:true,...preferences};
    if(rev!==generation)throw Error('Family changed. Reopen notifications.');
    const {error}=await c.client.from('push_devices').upsert(row,{onConflict:'id'});if(error)throw Error('Couldn’t register this phone. Your choices are still here; reconnect and retry.');
    if(rev!==generation){await subscription.unsubscribe();return;}
    localStorage.setItem(storageKey(c),id);device=row;status('Enabled on this phone. Tap Test this phone to check delivery.');void heartbeat();
   }catch(error){if(subscription&&!device)try{await subscription.unsubscribe();}catch{}status(error.message||'Couldn’t enable notifications.');}
   finally{busy=false;buttons();}
  };
  form.onsubmit=async event=>{event.preventDefault();if(busy)return;try{const patch=values(),c=getContext();if(!device?.enabled){status('Choices are ready. Tap Enable on this phone to start receiving alerts.');return;}busy=true;buttons();if(root.LucaDemo){device={...device,...patch};localStorage.setItem(storageKey(c)+':practice',JSON.stringify(device));}else{const rev=generation,{error}=await c.client.from('push_devices').update(patch).eq('id',device.id).eq('family_id',c.family).eq('user_id',c.user.id);if(error)throw Error('Couldn’t save. Your choices are still here.');if(rev!==generation)return;device={...device,...patch};}status('Notification choices saved for this phone.');}catch(e){status(e.message);}finally{busy=false;buttons();}};
  $('pushDisable').onclick=()=>void disconnect();
  $('pushTest').onclick=async()=>{if(busy)return;if(root.LucaDemo){status('Example: 🧸 Notifications are connected. Practice mode sends nothing.');return;}busy=true;buttons();try{await invoke('test',{device:device.id});status('Test accepted by the push service. Check this phone’s notification banner or Notification Center.');}catch(e){status(e.message);}finally{busy=false;buttons();}};
  function openNotification(){const params=new URL(location.href).searchParams,view=params.get('notify');if(!view)return;const c=getContext();if(!key(c))return;if(params.get('family')!==c.family){toast('This notification belongs to a different family.');return;}const tab=['chat','supplies','notifications','today'].includes(view)?view:'today';document.querySelector('nav [data-tab="'+tab+'"]')?.click();if(tab==='supplies'&&params.get('supply'))setTimeout(()=>document.querySelector('[data-supply-card="'+CSS.escape(params.get('supply'))+'"]')?.scrollIntoView({block:'center'}),500);const url=new URL(location.href);for(const p of ['notify','family','supply'])url.searchParams.delete(p);history.replaceState(null,'',url);}
  const session=()=>{void load().then(openNotification);};
  root.addEventListener('luca:family-session-ready',session);root.addEventListener('luca:session-changed',session);
  document.addEventListener('visibilitychange',heartbeat);document.addEventListener('click',e=>{if(e.target.closest('[data-tab="chat"]'))setTimeout(heartbeat,0);});
  navigator.serviceWorker?.addEventListener('message',event=>{if(event.data?.type==='luca:notification-open'&&event.data.url){const url=new URL(event.data.url,location.href),base=new URL('.',location.href);if(url.origin===location.origin&&[base.pathname,base.pathname+'index.html'].includes(url.pathname)){history.replaceState(null,'',url);openNotification();}}});
  setInterval(heartbeat,30000);void load();
  return {disconnect,load};
 }
 root.LucaNotifications={mount};
})(window);
