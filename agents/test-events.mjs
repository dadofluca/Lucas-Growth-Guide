/** Distinct from real care events; no baby_id, family_id, or caregiver data. */
export function makeSyntheticEvent({runId,eventType,amountOz}){
 const allowed=new Set(["bottle","pee","poop","nap","sleep"]);
 if(typeof runId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId))throw new TypeError("valid run UUID required");
 if(!allowed.has(eventType))throw new TypeError("unsupported test event");
 if(eventType==="bottle"&&(!Number.isFinite(amountOz)||amountOz<=0||amountOz>16))throw new RangeError("valid bottle ounces required");
 return {run_id:runId,agent:"watchdog",event_type:eventType,amount_oz:eventType==="bottle"?amountOz:null,status:"created"};
}
export function summarizeTestRun(rows){
 if(!Array.isArray(rows))throw new TypeError("rows must be array");
 return {testEvents:rows.length,verified:rows.filter(x=>x.status==="verified").length,
  failed:rows.filter(x=>x.status==="failed").length,realCareEventsAdded:0};
}
