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

/** Convert explicit, reviewed event decisions into a dry-run proposal. */
export function previewRecoveryEvents(manifest,decisions=[]){
 if(manifest?.format!=="luca-recovery-manifest-v1"||!Array.isArray(decisions))throw Error("Invalid recovery plan");
 const records=[];const seen=new Set();
 for(const d of decisions){
  if(d.approved!==true)continue;
  const source=manifest.records.find(r=>r.source_id===d.source_id);
  if(!source)throw Error("Unknown emergency entry");
  if(!["bottle","pee","poop","nap","other"].includes(d.event_type))throw Error("Invalid event type");
  if(!Number.isFinite(Date.parse(d.event_time)))throw Error("Invalid event time");
  if(d.event_type==="bottle"&&!(Number(d.amount_oz)>0&&Number(d.amount_oz)<=16))throw Error("Invalid bottle amount");
  const key=source.source_id+":"+String(d.part||1);
  if(seen.has(key))throw Error("Duplicate recovery part");seen.add(key);
  records.push({source_id:source.source_id,part:String(d.part||1),event_type:d.event_type,event_time:new Date(d.event_time).toISOString(),amount_oz:d.event_type==="bottle"?Number(d.amount_oz):null,caregiver:String(d.caregiver||source.caregiver),original_note:source.note});
 }
 return {dryRun:true,requiresAuthenticatedCommit:true,records};
}

/** Prepare insert rows for an already authenticated, family-scoped server handler. */
export function prepareRecoveryRows(preview,{babyId,userId}={}){
 if(preview?.dryRun!==true||!Array.isArray(preview.records)||!babyId||!userId)throw Error("Missing authenticated recovery context");
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(babyId)||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(userId))throw Error("Invalid UUID context");
 return preview.records.map(r=>({baby_id:babyId,created_by:userId,event_type:r.event_type,event_time:r.event_time,amount_oz:r.amount_oz,note:r.original_note,caregivers:r.caregiver?[r.caregiver]:[],details:{emergency_source_id:r.source_id+":"+r.part,emergency_original_source_id:r.source_id,emergency_recovered:true}}));
}

/** Signed-in Supabase client only; RLS must authorize baby membership. */
export async function commitApprovedRecovery(client,preview,{babyId,userId}={}){
 if(!client?.auth?.getUser||!client?.from)throw Error("Authenticated client required");
 const auth=await client.auth.getUser();
 if(auth.error||auth.data?.user?.id!==userId)throw Error("User session mismatch");
 const {data:baby,error:lookupError}=await client.from("babies").select("id,family_id").eq("id",babyId).single();
 if(lookupError||!baby?.family_id)throw Error("Baby unavailable to signed-in user");
 const {data:member,error:memberError}=await client.from("family_members").select("user_id").eq("family_id",baby.family_id).eq("user_id",userId).single();
 if(memberError||!member)throw Error("Family membership required");
 const rows=prepareRecoveryRows(preview,{babyId,userId});
 // Caller must not invoke until the unique emergency-source index is deployed.
 if(rows.length===0)return {inserted:0,alreadyPresent:0,failed:0};
 if(new Set(rows.map(row=>row.details.emergency_source_id)).size!==rows.length)throw Error("Duplicate recovery source keys");
 const results={inserted:0,alreadyPresent:0,failed:0};
 for(const row of rows){
  const key=row.details.emergency_source_id;
  const {data:existing,error:checkError}=await client.from("baby_events").select("id").eq("baby_id",babyId).contains("details",{emergency_source_id:key}).limit(1);
  if(checkError)throw Error("Cannot verify existing recovery events");
  if(existing?.length){results.alreadyPresent++;continue;}
  const {error}=await client.from("baby_events").insert(row);
  if(error){results.failed++;throw Error("Recovery write failed; keep backup and retry only after checking history");}
  results.inserted++;
 }
 return results;
}
