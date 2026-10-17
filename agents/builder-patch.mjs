/** Safe Builder patch planner. Produces deterministic, reviewed change requests only. */
const allowedFiles=new Set(["agents/README.md","docs/autonomous-agent-operations.md","docs/spark-design-research.md"]);
export function prepareBuilderPatch({finding,files=[]}={}){
 if(!finding||typeof finding.code!=="string"||!/^[a-z][a-z0-9_-]{1,63}$/.test(finding.code))throw new TypeError("Invalid finding code");
 if(!Array.isArray(files)||files.length===0||files.length>3)throw new TypeError("1-3 proposed files required");
 const proposed=files.map(f=>{
  if(!f||!allowedFiles.has(f.path)||typeof f.content!=="string"||f.content.length>12000)throw new TypeError("File is outside Builder's allowlist");
  if(/(sk_|service.role|BEGIN PRIVATE KEY|SUPABASE_SERVICE_ROLE_KEY)/i.test(f.content))throw new Error("Possible secret in proposed patch");
  return {path:f.path,content:f.content};
 });
 return {findingCode:finding.code,files:proposed,branchPrefix:"agent/builder-",requiresTests:true,requiresHumanReview:true,mayAutoMerge:false,mayDeploy:false,mayWriteBabyEvents:false};
}
