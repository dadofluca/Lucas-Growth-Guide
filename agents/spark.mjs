/** Non-destructive design proposals. Does not modify UI or infer family traits. */
const proposals=[
 {id:"theme_seasons",category:"design",title:"Optional seasonal decorations",effort:"small",
  safeguards:["respect reduced motion","preserve contrast","allow plain theme","no change to care controls"]},
 {id:"caregiver_accents",category:"design",title:"Personal accent colors and greetings",effort:"medium",
  safeguards:["explicit opt-in","do not infer personal traits","shared records remain unchanged"]},
 {id:"micro_feedback",category:"design",title:"Fast and clear save confirmations",effort:"small",
  safeguards:["never imply a save succeeded before backend confirmation","silent mode","accessible status text"]},
 {id:"private_gallery",category:"design",title:"Opt-in family photo gallery",effort:"large",
  safeguards:["private storage","family-scoped RLS","strip GPS metadata","security review before release"]}
];
export function sparkBacklog({includeLarge=false}={}){
 return proposals.filter(p=>includeLarge||p.effort!=="large").map(p=>({...p,safeguards:[...p.safeguards],
  stage:"proposal",autoDeploy:false,approvalRequired:true}));
}
