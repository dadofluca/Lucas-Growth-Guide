/** Observational, not medical advice. No invented feedings or targets. */
export function summarizeRoutines(events){
 if(!Array.isArray(events))throw new TypeError("events must be an array");
 const bottles=events.filter(e=>e?.event_type==="bottle"&&Number.isFinite(Number(e.amount_oz))&&Number(e.amount_oz)>0);
 const totalOz=bottles.reduce((n,e)=>n+Number(e.amount_oz),0);
 return {observedBottleCount:bottles.length,observedBottleOz:Math.round(totalOz*100)/100,
   note:"Totals cover supplied records only; missing logs cannot be inferred. No health assessment made."};
}

/** Generate cautious, human-readable observations from supplied records only. */
export function buildDailyInsights(events, {day,timezone="UTC"}={}){
 if(!Array.isArray(events))throw new TypeError("events must be an array");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day||""))throw new TypeError("day must be YYYY-MM-DD");
 const format=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"});
 const daily=events.filter(e=>e?.event_time&&Number.isFinite(Date.parse(e.event_time))&&(()=>{const p=Object.fromEntries(format.formatToParts(new Date(e.event_time)).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`===day})());
 const bottles=daily.filter(e=>e.event_type==="bottle"&&Number(e.amount_oz)>0&&Number.isFinite(Number(e.amount_oz)));
 const oz=Math.round(bottles.reduce((n,e)=>n+Number(e.amount_oz),0)*100)/100;
 const diapers=daily.filter(e=>["poop","pee"].includes(e.event_type)).length;
 const naps=daily.filter(e=>["nap","sleep"].includes(e.event_type)).length;
 return {day,timezone,observed:{bottles:bottles.length,ounces:oz,diaperEvents:diapers,sleepEvents:naps},
  insights:[`There are ${bottles.length} recorded bottle feeds totaling ${oz} oz on ${day}.`,
   `There are ${diapers} recorded diaper events and ${naps} recorded sleep events.`,
   "These are recorded events only. Missing logs are not evidence that care did not happen."],
  clinicalAdvice:false};
}
