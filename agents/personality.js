const lines={
 dark:{
  feed:["The tiny dictator accepts your offering.","Milk debt paid. Sleep debt remains.","Another round for the house's smallest tyrant."],
  poop:["Crime scene contained. Suspect remains smug.","Hazard pay denied. Again.","A tiny war crime. A heroic cleanup."],
  sleep:["The boss is offline. Nobody breathe.","Ceasefire declared. Proceed quietly."]
 },
 gentle:{
  feed:["Bottle service, with love.","Tiny tank, topped up."],
  poop:["Fresh start. Brave caregiver.","Diaper duty: handled."],
  sleep:["Small snores. Big dreams.","Rest well, little legend."]
 }
};
export function feedbackLine(kind,mode="dark",index=0){
 const choices=lines[mode]?.[kind];
 return choices?.[((index%choices.length)+choices.length)%choices.length]||"";
}
export function mountPersonality(){
 const picker=document.querySelector("#profilePersonality");
 if(!picker)return;
 const read=()=>{try{return localStorage.getItem("luca-personality")||"dark";}catch{return "dark";}};
 picker.value=["dark","gentle","off"].includes(read())?read():"dark";
 const count={};
 window.lucaFeedbackLine=kind=>feedbackLine(kind,read(),count[kind]=(count[kind]??-1)+1);
 const preview=document.querySelector("#personalityPreview");
 const paint=()=>{preview.textContent=feedbackLine("feed",picker.value)||"Clear confirmations, without extra jokes.";};
 picker.addEventListener("change",()=>{try{localStorage.setItem("luca-personality",picker.value);}catch{}paint();});
 paint();
}
