import webpush from 'npm:web-push@3.6.7';
import '../../../agents/sleep-inference.js';
import '../../../agents/sleep-data.js';
import '../../../agents/bottle-rhythm.js';
import '../../../agents/notification-rules.js';

const rules = (globalThis as any).LucaNotificationRules;
const project = Deno.env.get('SUPABASE_URL')!;
const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Row = Record<string, any>;

// Only this server uses the service credential. Responses never include it or push endpoints.
async function db(table: string, filters: Record<string, string | number> = {}, method = 'GET', body?: unknown) {
 const url = new URL('/rest/v1/' + table, project);
 for (const [key, value] of Object.entries(filters)) url.searchParams.set(key, String(value));
 const response = await fetch(url, {method, headers: {apikey: service, Authorization: 'Bearer ' + service,
  'Content-Type': 'application/json', Prefer: 'return=representation'}, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(12000)});
 if (!response.ok) throw new Error('Notification storage unavailable (' + response.status + ')');
 const text = await response.text(); return text ? JSON.parse(text) : null;
}
async function config() {
 let cfg = (await db('app_notification_config', {id: 'eq.true', limit: 1}))[0];
 if (!cfg) throw new Error('Notification delivery is not configured.');
 if (!cfg.vapid_public) {
  const keys = webpush.generateVAPIDKeys();
  await db('app_notification_config', {id: 'eq.true', vapid_public: 'is.null'}, 'PATCH', {vapid_public: keys.publicKey, vapid_private: keys.privateKey});
  cfg = (await db('app_notification_config', {id: 'eq.true', limit: 1}))[0];
 }
 return cfg;
}
async function member(family: string, user: string) {
 return (await db('family_members', {family_id: 'eq.' + family, user_id: 'eq.' + user, select: 'user_id', limit: 1})).length > 0;
}
const route = (cfg: Row, family: string, view: string, supply?: string) => {
 const url = new URL(cfg.app_url);url.searchParams.set('notify', view);url.searchParams.set('family', family);if (supply) url.searchParams.set('supply', supply);return url.href;
};
const entriesFrom = (rows: Row[]) => rows.map(x => ({id: x.id, babyId: x.baby_id, at: x.event_time, oz: x.amount_oz, notes: x.note || '', tags: x.tags || [], details: x.details || {}}));
async function care(baby: string) {
 const rows: Row[] = [];
 for (let offset = 0; offset < 10000; offset += 500) {
  const page = await db('baby_events', {baby_id: 'eq.' + baby, event_time: 'gte.' + new Date(Date.now() - 8 * 86400000).toISOString(), select: 'id,baby_id,event_time,amount_oz,note,tags,details', order: 'event_time.desc,id.desc', offset, limit: 500});
  rows.push(...page);if (page.length < 500) return entriesFrom(rows);
 }
 throw new Error('Care window exceeds notification processing limit.');
}
async function send(cfg: Row, device: Row, key: string, kind: string, payload: Row) {
 const fresh = (await db('push_devices', {id: 'eq.' + device.id, enabled: 'eq.true', limit: 1}))[0];
 if (!fresh || !await member(fresh.family_id, fresh.user_id) || !rules.validPushEndpoint(fresh.endpoint)) return false;
 if (kind !== 'test' && (!fresh[kind === 'supply' ? 'supplies_enabled' : kind + '_enabled'] || (kind === 'feed' || fresh.quiet_all) && rules.quiet(fresh))) return false;
 // Recheck the latest bottle and sleep records immediately before claiming a feed alert.
 if (kind === 'feed' && rules.feedReminder(await care(fresh.baby_id), fresh)?.key !== key) return false;
 const receipt = await db('rpc/claim_notification_delivery', {}, 'POST', {target_device: fresh.id, target_key: key});
 if (!receipt) return false;
 try {
  const request = webpush.generateRequestDetails({endpoint: fresh.endpoint, keys: {p256dh: fresh.p256dh, auth: fresh.auth}}, JSON.stringify(payload), {
   vapidDetails: {subject: new URL(cfg.app_url).origin, publicKey: cfg.vapid_public, privateKey: cfg.vapid_private},
   TTL: kind === 'feed' ? 120 : 300, urgency: 'normal', contentEncoding: 'aes128gcm'
  });
  const response = await fetch(fresh.endpoint, {method: 'POST', headers: request.headers, body: request.body, redirect: 'error', signal: AbortSignal.timeout(8000)});
  if (!response.ok) {
   if (response.status === 404 || response.status === 410) await db('push_devices', {id: 'eq.' + fresh.id}, 'PATCH', {enabled: false});
   await db('notification_deliveries', {id: 'eq.' + receipt}, 'PATCH', {state: response.status === 429 || response.status >= 500 ? 'retry' : 'failed', lease_until: new Date().toISOString(), next_attempt_at: new Date(Date.now() + 120000).toISOString()});
   return false;
  }
  await db('notification_deliveries', {id: 'eq.' + receipt}, 'PATCH', {state: 'sent'});return true;
 } catch {
  await db('notification_deliveries', {id: 'eq.' + receipt}, 'PATCH', {state: 'retry', lease_until: new Date().toISOString(), next_attempt_at: new Date(Date.now() + 120000).toISOString()});return false;
 }
}

async function dispatch(cfg: Row) {
 let sent = 0, checked = 0;
 // Each page is bounded; no family or recipient is selected from client input.
 for (let offset = 0; offset < 1000; offset += 50) {
  const devices = await db('push_devices', {enabled: 'eq.true', order: 'id', offset, limit: 50});
  for (const device of devices) {
   checked++;
   if (!await member(device.family_id, device.user_id)) {await db('push_devices', {id: 'eq.' + device.id}, 'PATCH', {enabled: false});continue;}
   const baby = (await db('babies', {id: 'eq.' + device.baby_id, family_id: 'eq.' + device.family_id, select: 'name', limit: 1}))[0];
   if (!baby) continue;
   const name = String(baby.name || 'Baby').slice(0, 60), base = {family: device.family_id};
   if (device.feed_enabled && !rules.quiet(device)) {
    const reminder = rules.feedReminder(await care(device.baby_id), device);
    if (reminder && await send(cfg, device, reminder.key, 'feed', {title: '🍼 ' + name + '’s next bottle', body: 'May be ready for a bottle. Tap to check the latest care log.', tag: 'feed-' + device.baby_id, data: {...base,kind: 'feed',url: route(cfg, device.family_id, 'today')}})) sent++;
   }
   if (device.quiet_all && rules.quiet(device)) continue;
   const jobs: Row[] = await db('notification_jobs', {family_id: 'eq.' + device.family_id, happened_at: 'gte.' + new Date(Math.max(+new Date(device.created_at), +new Date(device.settings_at))).toISOString(), expires_at: 'gt.' + new Date().toISOString(), order: 'happened_at.desc', limit: 100});
   if (device.chat_enabled) {
    const chat = jobs.filter(j => j.kind === 'chat' && j.actor_id !== device.user_id && +new Date(j.happened_at) > Math.max(+new Date(device.last_chat_notified_at), +new Date(device.last_chat_read_at)));
    if (chat.length) {
     const open = device.active_view === 'chat' && Date.now() - +new Date(device.last_seen_at || 0) < 75000;
     if (!open) {
      const messages = await db('family_chat_messages', {family_id: 'eq.' + device.family_id, id: 'in.(' + chat.map(j => j.source_id).join(',') + ')', order: 'created_at.desc', limit: 100});
      if (messages.length) {
       const latest = messages[0], profile = device.previews ? (await db('family_profiles', {family_id: 'eq.' + device.family_id, user_id: 'eq.' + latest.sender_id, select: 'display_name', limit: 1}))[0] : null;
       const preview = String(latest.body || (latest.media_type === 'video' ? 'Sent a video' : latest.media_type === 'gif' ? 'Sent a GIF' : 'Sent a photo')).replace(/[\x00-\x1f]/g, ' ').slice(0, 130);
       if (await send(cfg, device, 'chat:' + latest.id, 'chat', {title: device.previews ? String(profile?.display_name || 'Family member') + ' · Family chat' : '💬 Family chat', body: device.previews ? preview : messages.length === 1 ? 'You have a new family message.' : messages.length + ' new family messages.', tag: 'chat-' + device.family_id, data: {...base, kind: 'chat', badge: messages.length, url: route(cfg, device.family_id, 'chat')}})) {
        sent++;await db('push_devices', {id: 'eq.' + device.id}, 'PATCH', {last_chat_notified_at: chat[0].happened_at});
       }
      }
     }
    }
   }
   if (device.supplies_enabled) {
    const supplyJobs = [...new Map(jobs.filter(j => j.kind === 'supply').map(j => [j.source_id, j])).values()];
    for (const job of supplyJobs.slice(0, 4)) {
     const item = (await db('family_supplies', {id: 'eq.' + job.source_id, family_id: 'eq.' + device.family_id, status: 'eq.low', limit: 1}))[0];
     if (!item || !item.low_since || item.buyer_user_id && item.buyer_user_id !== device.user_id) continue;
     const link = rules.safeProductURL(item.product_url);
     if (await send(cfg, device, 'supply:' + item.id + ':' + item.low_since, 'supply', {title: '🛒 ' + String(item.name).slice(0, 60) + ' running low', body: link ? 'Tap to open your saved product. Review the order at the store.' : 'Tap to check supplies or choose a product.', tag: 'supply-' + item.id, data: {...base,kind: 'supply',url: link || route(cfg, device.family_id, 'supplies', item.id)}})) sent++;
    }
   }
  }
  if (devices.length < 50) break;
 }
 return {checked,sent};
}

Deno.serve(async req => {
 let cfg: Row;
 try {cfg = await config();} catch {return new Response(JSON.stringify({error: 'Notification delivery is temporarily unavailable.'}), {status: 503,headers: {'Content-Type':'application/json'}});}
 const origin = req.headers.get('Origin'), allowed = new URL(cfg.app_url).origin;
 const headers = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, 'Access-Control-Allow-Headers': 'authorization,apikey,x-client-info,content-type', 'Access-Control-Allow-Methods':'POST,OPTIONS', 'Vary':'Origin'};
 const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status,headers});
 if (origin && origin !== allowed) return reply({error:'Origin not allowed.'},403);
 if (req.method === 'OPTIONS') return new Response(null,{status:204,headers});
 if (req.method !== 'POST') return reply({error:'Use POST.'},405);
 try {
  const raw = await req.text();if (raw.length > 4096) return reply({error:'Request too large.'},413);
  const body = JSON.parse(raw || '{}');
  if (body.action === 'dispatch') {
   if (req.headers.get('x-notification-worker') !== cfg.dispatch_token) return reply({error:'Worker authentication required.'},401);
   return reply(await dispatch(cfg));
  }
  const token = req.headers.get('Authorization') || '';
  if (!token.startsWith('Bearer ')) return reply({error:'Sign in to your family.'},401);
  const auth = await fetch(new URL('/auth/v1/user', project), {headers:{apikey:service,Authorization:token},signal:AbortSignal.timeout(10000)});
  if (!auth.ok) return reply({error:'Sign in to your family.'},401);
  const user = await auth.json();
  if (!uuid.test(body.family || '') || !await member(body.family,user.id)) return reply({error:'Family access required.'},403);
  if (body.action === 'config') return reply({publicKey:cfg.vapid_public,ready:true});
  if (body.action === 'test' && uuid.test(body.device || '')) {
   const device = (await db('push_devices',{id:'eq.'+body.device,family_id:'eq.'+body.family,user_id:'eq.'+user.id,enabled:'eq.true',limit:1}))[0];
   if (!device) return reply({error:'Enable notifications on this phone first.'},403);
   const sent = await send(cfg,device,'test:'+Math.floor(Date.now()/60000),'test',{title:'🧸 Notifications are connected',body:'This phone can receive family reminders.',tag:'notification-test',data:{family:device.family_id,kind:'test',url:route(cfg,device.family_id,'notifications')}});
   return reply(sent ? {sent:true} : {error:'No new test was accepted. Wait a minute, then retry.'},sent?200:429);
  }
  return reply({error:'Unknown notification action.'},400);
 } catch {return reply({error:'Notification request failed. Please try again.'},500);}
});
