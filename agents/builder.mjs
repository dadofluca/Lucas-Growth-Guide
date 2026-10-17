/** Generates a reviewable change proposal; does not modify repositories. */
export function proposeFix(finding){
 if(!finding || typeof finding.code!=="string")throw new TypeError("finding code required");
 const priorities={component_error:"high",possible_duplicate:"medium",sparse_bottle_history:"low"};
 return {title:`Investigate: ${finding.code}`,priority:priorities[finding.code]||"medium",
  requiredChecks:["reproduce issue","add automated regression test","review data/privacy impact","human approval before merge"],
  action:"draft_pr_only",autoDeploy:false};
}
