/** Validate a reviewed emergency backup before any authenticated import. */
export function buildRecoveryManifest(backup){
 if(!backup||backup.format!=="luca-emergency-reviewed-v1"||!Array.isArray(backup.entries)||backup.entries.length>2000)throw Error("Invalid reviewed backup");
 const seen=new Set();
 const records=backup.entries.map(item=>{
  const id=String(item?.id||""),note=String(item?.text||"").trim(),date=Date.parse(item?.recorded_at||"");
  if(item?.reviewed!==true||id.length<8||id.length>128||!note||note.length>3000||!Number.isFinite(date))throw Error("Invalid reviewed entry");
  if(seen.has(id))throw Error("Duplicate recovery source ID");
  seen.add(id);
  return {source_id:id,note,recorded_at:new Date(date).toISOString(),caregiver:String(item.caregiver||"").slice(0,60),needsEventClassification:true,readyToInsert:false};
 });
 return {format:"luca-recovery-manifest-v1",records,requiresAuthentication:true,requiresFamilyScope:true,requiresExplicitCommit:true};
}
