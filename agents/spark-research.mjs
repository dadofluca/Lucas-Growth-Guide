/**
 * Spark research brief: a reviewable, non-destructive design discovery agent.
 * Sources are supplied by a separate research runner; this module never invents citations.
 */
export const sparkResearchTopics=Object.freeze([
 {id:"calm-navigation",category:"usability",question:"What makes family-care apps fast and legible one-handed?",examples:["Apple Human Interface Guidelines","Material Design","baby-tracking app reviews"]},
 {id:"microinteractions",category:"motion",question:"Which short confirmation transitions improve clarity without slowing logging?",examples:["motion design case studies","award-winning UI examples"]},
 {id:"sound-feedback",category:"audio",question:"Which quiet, pleasant feedback sounds work on iOS PWA and honor mute preferences?",examples:["iOS Web Audio restrictions","sound design case studies"]},
 {id:"seasonal-style",category:"visual",question:"How do apps refresh seasonal atmosphere without compromising contrast or recognition?",examples:["seasonal UI case studies","accessibility research"]},
 {id:"delight-easter-eggs",category:"play",question:"Which rare unexpected interactions delight without obstructing tasks?",examples:["r/badUIbattles","playful product design critiques"]},
 {id:"family-engagement",category:"research",question:"What do real users like and dislike about family messaging and tracking apps?",examples:["app store reviews","Reddit user discussions"]}
]);
export function sparkResearchBrief({topic,findings=[]}={}){
 const spec=sparkResearchTopics.find(x=>x.id===topic);
 if(!spec)throw Error("Unknown Spark research topic");
 const checked=findings.filter(x=>x&&typeof x.sourceUrl==="string"&&/^https:\/\//.test(x.sourceUrl)&&typeof x.summary==="string"&&x.summary.trim());
 return {topic:spec.id,question:spec.question,sourceCount:checked.length,
  evidence:checked.map(x=>({sourceUrl:x.sourceUrl,summary:x.summary.slice(0,500),date:x.date||null})),
  stage:checked.length?"research-review":"needs-research",
  autoDeploy:false,approvalRequired:true,
  acceptanceCriteria:["visible improvement to care workflow","accessible contrast and reduced-motion","works on iPhone PWA","no false save feedback","easy disable or fallback","regression tests"]};
}
