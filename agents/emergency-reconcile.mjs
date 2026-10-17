/** Pure emergency-log reconciliation: suggest candidates, never silently insert baby events. */
const allowedTypes=new Set(["bottle","pee","poop","nap","other"]);
function normalize(s){return String(s||"").trim().replace(/\s+/g," ").toLowerCase();}
export function proposeEmergencyImports(payload,existing=[]){
 if(!payload||payload.format!=="luca-emergency-log-v1"||!Array.isArray(payload.entries))throw new TypeError("Unsupported emergency export");
 if(payload.entries.length>2000)throw new RangeError("Too many entries");
 const known=new Set(existing.filter(Boolean).map(x=>String(x.source_id||x.id)));
 const seen=new Set();
 const candidates=payload.entries.map((entry,i)=>{
  const id=String(entry?.id||"").trim(),text=String(entry?.text||"").trim(),caregiver=String(entry?.caregiver||"").trim();
  const timestamp=Date.parse(entry?.recorded_at||"");
  const valid=id.length>=8&&id.length<=128&&text.length>0&&text.length<=3000&&caregiver.length<=60&&Number.isFinite(timestamp);
  const duplicate=known.has(id)||seen.has(id);if(id)seen.add(id);
  const type=/\b(bottle|fed|feeding|formula|\d+(?:\.\d+)?\s*oz)\b/i.test(text)?"bottle":/\b(poop|pooped|dirty diaper)\b/i.test(text)?"poop":/\b(pee|wet diaper|peed)\b/i.test(text)?"pee":/\b(nap|slept|sleep)\b/i.test(text)?"nap":"other";
  const amounts=[...text.matchAll(/\b(\d+(?:\.\d+)?)\s*(?:oz|ounces?)\b/gi)].map(x=>Number(x[1]));
  const amount_oz=type==="bottle"&&amounts.length===1&&amounts[0]>0&&amounts[0]<=16?amounts[0]:null;
  const ambiguous=type==="other"||(type==="bottle"&&amount_oz===null)||/\b(and|then|also|plus)\b/i.test(text);
  return {source_id:id,recorded_at:valid?new Date(timestamp).toISOString():null,caregiver,text,event_type:allowedTypes.has(type)?type:"other",amount_oz,status:!valid?"invalid":duplicate?"duplicate":ambiguous?"needs_review":"suggested",reviewRequired:true,automaticImport:false,index:i};
 });
 return {candidates,readyForAutomaticImport:0,needsHumanConfirmation:candidates.filter(x=>x.status==="suggested"||x.status==="needs_review").length,invalidOrDuplicate:candidates.filter(x=>x.status==="invalid"||x.status==="duplicate").length};
}
