/** Read-only coverage inspection. All times must be ISO strings. */
export function inspectCoverage(shifts, { now = new Date() } = {}) {
  if (!Array.isArray(shifts)) throw new TypeError("shifts must be an array");
  const findings = [];
  const rows = shifts.filter(s => s && s.id && s.start_time && s.end_time);
  for (const s of rows) {
    const start=Date.parse(s.start_time),end=Date.parse(s.end_time);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)
      findings.push({code:"invalid_shift",severity:"medium",ids:[s.id]});
  }
  for(let i=0;i<rows.length;i++) for(let j=i+1;j<rows.length;j++){
    const a=rows[i],b=rows[j];
    if(a.caregiver_id!==b.caregiver_id || a.family_id!==b.family_id)continue;
    const as=Date.parse(a.start_time),ae=Date.parse(a.end_time),bs=Date.parse(b.start_time),be=Date.parse(b.end_time);
    if([as,ae,bs,be].every(Number.isFinite)&&Math.max(as,bs)<Math.min(ae,be))
      findings.push({code:"overlapping_caregiver_shifts",severity:"info",ids:[a.id,b.id]});
  }
  return {checked:rows.length,findings};
}
