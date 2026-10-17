/**
 * Atlas v1: pure, read-only baby-event integrity checks.
 * No database credentials, mutations, external calls or personal-data logging.
 * Input rows are supplied by an authenticated server-side caller.
 */
export function inspectBabyEvents(events, { now = new Date(), sparseDays = 7 } = {}) {
  if (!Array.isArray(events)) throw new TypeError("events must be an array");
  const findings = [];
  const valid = events.filter(e => e && typeof e === "object" && e.id && e.event_time);
  const sorted = [...valid].sort((a,b) => Date.parse(a.event_time) - Date.parse(b.event_time));
  const add = (code, severity, eventIds, details) => findings.push({code,severity,eventIds,details});
  for (const e of valid) {
    const ts = Date.parse(e.event_time);
    if (!Number.isFinite(ts)) { add("invalid_timestamp","high",[e.id],"Unparseable event time"); continue; }
    if (ts > now.getTime() + 10*60*1000) add("future_event","medium",[e.id],"Event timestamp is more than ten minutes in the future");
    if (e.event_type === "bottle" && (!Number.isFinite(Number(e.amount_oz)) || Number(e.amount_oz) <= 0 || Number(e.amount_oz) > 16))
      add("bottle_amount_review","medium",[e.id],"Bottle amount is missing or outside a conservative review range");
  }
  for (let i=0;i<sorted.length;i++) {
    const a=sorted[i];
    if (!Number.isFinite(Date.parse(a.event_time))) continue;
    for (let j=i+1;j<sorted.length;j++) {
      const b=sorted[j],delta=Date.parse(b.event_time)-Date.parse(a.event_time);
      if (delta>2*60*1000) break;
      if (a.id===b.id || a.baby_id!==b.baby_id || a.event_type!==b.event_type) continue;
      if (a.event_type==="bottle" && Number(a.amount_oz)!==Number(b.amount_oz)) continue;
      add("possible_duplicate","medium",[a.id,b.id],"Similar events within two minutes; manual review required");
    }
  }
  const bottles=valid.filter(e=>e.event_type==="bottle" && Number.isFinite(Date.parse(e.event_time)));
  const daily=new Map();
  for(const b of bottles){
    const day=new Date(b.event_time).toISOString().slice(0,10);
    daily.set(day,(daily.get(day)||0)+1);
  }
  // Sparse days are not missing events: they are uncertainty indicators only.
  const dates=[...daily.keys()].sort().slice(-sparseDays);
  for(const day of dates) if(daily.get(day)<=1) add("sparse_bottle_history","info",[],`Only ${daily.get(day)} bottle record(s) on ${day}; logging may be incomplete`);
  return {checked:valid.length,findings,summary:{total:findings.length,high:findings.filter(f=>f.severity==="high").length,medium:findings.filter(f=>f.severity==="medium").length,info:findings.filter(f=>f.severity==="info").length}};
}
