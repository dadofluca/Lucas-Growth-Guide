/** Read-only, sanitized health signals; no secrets or raw request payloads. */
export function inspectHealth(signals,{now=new Date()}={}){
 if(!Array.isArray(signals))throw new TypeError("signals must be an array");
 const findings=[];
 for(const s of signals){
  if(!s || !s.component)continue;
  if(s.status==="error")findings.push({code:"component_error",severity:"high",component:s.component});
  if(s.last_success_at){
   const t=Date.parse(s.last_success_at);
   if(!Number.isFinite(t))findings.push({code:"invalid_health_timestamp",severity:"medium",component:s.component});
   else if(now.getTime()-t>24*60*60*1000)findings.push({code:"stale_component",severity:"medium",component:s.component});
  }
 }
 return {checked:signals.length,findings};
}
