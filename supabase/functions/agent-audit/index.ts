// Server-only, authenticated agent audit. Never return private records.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const url=Deno.env.get("SUPABASE_URL")!;
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const headers={"apikey":key,"Authorization":`Bearer ${key}`,"Content-Type":"application/json"};
async function query(table:string,columns:string,limit=1000){
 const r=await fetch(`${url}/rest/v1/${table}?select=${encodeURIComponent(columns)}&limit=${limit}`,{headers});
 if(!r.ok)throw new Error(`database read failed (${r.status})`);
 return await r.json();
}
async function save(table:string,rows:unknown[],upsert=false){
 if(!rows.length)return;
 const endpoint=`${url}/rest/v1/${table}${upsert?"?on_conflict=fingerprint":""}`;
 const r=await fetch(endpoint,{method:"POST",headers:{...headers,"Prefer":upsert?"resolution=ignore-duplicates,return=minimal":"return=minimal"},body:JSON.stringify(rows)});
 if(!r.ok)throw new Error(`database write failed (${r.status})`);
}
function fingerprint(parts:unknown[]){return parts.map(x=>String(x??"")).join(":").slice(0,300);}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return new Response("Method not allowed",{status:405});
 const token=req.headers.get("authorization")?.replace(/^Bearer /i,"");
 // Endpoint requires service-role credentials; never expose them in browser code.
 if(!key||!token||token!==key)return new Response("Unauthorized",{status:401});
 try{
  const [events,reports]=await Promise.all([
   query("baby_events","id,baby_id,event_type,event_time,amount_oz",1000),
   query("agent_user_reports","id,family_id,category,status,created_at",500)
  ]);
  const findings:{agent:string;fingerprint:string;code:string;severity:string;evidence:Record<string,unknown>}[]=[];
  const add=(agent:string,code:string,severity:string,ids:string[],details:Record<string,unknown>={})=>{
   findings.push({agent,code,severity,fingerprint:fingerprint([agent,code,...ids]),evidence:{record_ids:ids,...details}});
  };
  const sorted=events.filter((e:any)=>e.id&&e.event_time&&Number.isFinite(Date.parse(e.event_time))).sort((a:any,b:any)=>Date.parse(a.event_time)-Date.parse(b.event_time));
  for(const e of sorted){
   if(e.event_type==="bottle"&&(e.amount_oz===null||e.amount_oz===undefined||!Number.isFinite(Number(e.amount_oz))||Number(e.amount_oz)<=0||Number(e.amount_oz)>16))add("atlas","bottle_amount_review","medium",[e.id]);
   if(Date.parse(e.event_time)>Date.now()+600000)add("atlas","future_timestamp","medium",[e.id]);
  }
  for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++){
   const a=sorted[i],b=sorted[j];
   if(Date.parse(b.event_time)-Date.parse(a.event_time)>120000)break;
   if(a.id!==b.id&&a.baby_id===b.baby_id&&a.event_type===b.event_type&&(a.event_type!=="bottle"||Number(a.amount_oz)===Number(b.amount_oz)))
    add("atlas","possible_duplicate","medium",[a.id,b.id].sort());
  }
  // Never store report text in agent findings or return it from this endpoint.
  for(const report of reports.filter((r:any)=>r.status==="new"||r.status==="triaged"))
   add("guardian","user_report_pending","medium",[report.id],{category:report.category});
  const runRows=["atlas","guardian"].map(agent=>({agent,status:"completed",finished_at:new Date().toISOString(),summary:{checked_events:events.length,checked_reports:reports.length,findings:findings.filter(f=>f.agent===agent).length}}));
  await save("agent_runs",runRows);
  await save("agent_findings",findings.map(f=>({...f,status:"open",updated_at:new Date().toISOString()})),true);
  return Response.json({ok:true,events_checked:events.length,reports_checked:reports.length,findings:findings.length});
 }catch(e){return Response.json({ok:false,error:"Agent audit failed; inspect server logs"},{status:500});}
});
