/** Observational, not medical advice. No invented feedings or targets. */
export function summarizeRoutines(events){
 if(!Array.isArray(events))throw new TypeError("events must be an array");
 const bottles=events.filter(e=>e?.event_type==="bottle"&&Number.isFinite(Number(e.amount_oz))&&Number(e.amount_oz)>0);
 const totalOz=bottles.reduce((n,e)=>n+Number(e.amount_oz),0);
 return {observedBottleCount:bottles.length,observedBottleOz:Math.round(totalOz*100)/100,
   note:"Totals cover supplied records only; missing logs cannot be inferred. No health assessment made."};
}
