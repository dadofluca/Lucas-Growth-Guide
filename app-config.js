/* Luca Growth Guide — shared configuration
   Change household defaults here instead of scattering values through UI code. */
window.LucaConfig=Object.freeze({
  patch:"P54",
  caregivers:["Sam","Maddie","Nona","Boppa","Jay","Yolanda","Lindsay"],
  parents:{sam:/^sam(uel)?\\b/i,maddie:/^maddie\\b|^magdal/i},
  bottles:[4,5,6,7,8],
  defaultBottleOz:8,
  schedule:{stepMinutes:15,dayStartMinutes:360,dayEndMinutes:1380},
  theme:{ink:"#304038",muted:"#66736c",navy:"#173c58",paper:"#f8efe2",paper2:"#fffaf2"}
});
